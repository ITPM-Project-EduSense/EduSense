import re
from pathlib import Path
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status, Depends, UploadFile, File
from fastapi.responses import FileResponse
from beanie import PydanticObjectId

from app.models.study_group import StudyGroup, StudyGroupCreate, StudyGroupResponse, StudyGroupUpdate
from app.models.study_group_invite import (
    StudyGroupInvite,
    StudyGroupInviteCreate,
    StudyGroupInviteResponse,
)
from app.models.user_model import User
from app.core.security import get_current_user
from app.core.config import settings
from app.services.email_service import EmailService
from app.services.document_service import process_uploaded_document, get_group_materials
from app.models.study_material import StudyMaterial

router = APIRouter(prefix="/groups", tags=["Groups"])


def group_to_response(group: StudyGroup, current_user: Optional[User] = None) -> StudyGroupResponse:
    current_user_id = str(current_user.id) if current_user else None
    current_user_email = str(current_user.email).strip().lower() if current_user else None
    leader_email = str(group.leader_email).strip().lower() if group.leader_email else ""
    leader_name = group.leader_name or "Group Leader"
    return StudyGroupResponse(
        id=str(group.id),
        name=group.name,
        module=group.module,
        schedule=group.schedule,
        max_members=group.max_members,
        tags=group.tags,
        created_by=group.created_by,
        leader_name=leader_name,
        leader_email=leader_email,
        members=len(group.member_ids),
        is_joined=current_user_id in group.member_ids if current_user_id else False,
        can_edit=current_user_email == leader_email if current_user_email and leader_email else False,
        created_at=group.created_at,
    )


def invite_to_response(invite: StudyGroupInvite) -> StudyGroupInviteResponse:
    return StudyGroupInviteResponse(
        id=str(invite.id),
        group_id=invite.group_id,
        group_name=invite.group_name,
        group_module=invite.group_module,
        invited_email=str(invite.invited_email),
        invited_by_user_id=invite.invited_by_user_id,
        invited_by_name=invite.invited_by_name,
        status=invite.status,
        email_sent=invite.email_sent,
        created_at=invite.created_at,
        responded_at=invite.responded_at,
    )


def material_to_response(material: StudyMaterial, current_user: Optional[User] = None) -> dict:
    current_user_id = str(current_user.id) if current_user else None
    return {
        "id": str(material.id),
        "filename": material.filename,
        "file_type": material.file_type or "",
        "file_size_bytes": material.file_size_bytes,
        "uploaded_by_name": material.uploaded_by_name or "Group Member",
        "can_delete": current_user_id == material.user_id if current_user_id else False,
        "created_at": material.created_at.isoformat(),
    }


async def get_group_material_or_404(group_id: str, material_id: str) -> StudyMaterial:
    material = await StudyMaterial.get(PydanticObjectId(material_id))
    if not material or material.group_id != group_id:
        raise HTTPException(status_code=404, detail="Material not found")
    return material


# ─── POST /groups/ ─── Create a new study group ───
@router.post(
    "/",
    response_model=StudyGroupResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new study group",
)
async def create_group(
    data: StudyGroupCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a study group. The creator is automatically added as the first member."""
    group = StudyGroup(
        name=data.name,
        module=data.module,
        schedule=data.schedule,
        max_members=data.max_members,
        tags=data.tags,
        created_by=str(current_user.id),
        leader_name=data.leader_name,
        leader_email=data.leader_email,
        member_ids=[str(current_user.id)],
    )
    await group.insert()
    return group_to_response(group, current_user)


@router.put(
    "/{group_id}",
    response_model=StudyGroupResponse,
    summary="Update a study group",
)
async def update_group(
    group_id: str,
    data: StudyGroupUpdate,
    current_user: User = Depends(get_current_user),
):
    group = await StudyGroup.get(PydanticObjectId(group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if not group.leader_email or str(current_user.email).strip().lower() != str(group.leader_email).strip().lower():
        raise HTTPException(status_code=403, detail="Only the group leader can edit this group")

    if data.max_members < len(group.member_ids):
        raise HTTPException(status_code=400, detail="Max members cannot be lower than the current member count")

    group.name = data.name
    group.module = data.module
    group.schedule = data.schedule
    group.max_members = data.max_members
    group.tags = data.tags
    group.leader_name = data.leader_name
    group.leader_email = data.leader_email
    await group.save()
    return group_to_response(group, current_user)


@router.delete(
    "/{group_id}",
    summary="Delete a study group",
)
async def delete_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
):
    group = await StudyGroup.get(PydanticObjectId(group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if not group.leader_email or str(current_user.email).strip().lower() != str(group.leader_email).strip().lower():
        raise HTTPException(status_code=403, detail="Only the group leader can delete this group")

    await StudyGroupInvite.find(StudyGroupInvite.group_id == group_id).delete()
    await group.delete()
    return {"message": "Group deleted successfully", "group_id": group_id}


# ─── GET /groups/ ─── List all study groups ───
@router.get(
    "/",
    response_model=List[StudyGroupResponse],
    summary="List all study groups",
)
async def list_groups(
    current_user: User = Depends(get_current_user),
):
    """Return all study groups sorted newest-first."""
    groups = await StudyGroup.find_all().to_list()
    groups.sort(key=lambda g: g.created_at, reverse=True)
    return [group_to_response(g, current_user) for g in groups]


# ─── GET /groups/search?q= ─── Search groups by name / module / tag ───
@router.get(
    "/search",
    response_model=List[StudyGroupResponse],
    summary="Search study groups",
)
async def search_groups(
    q: Optional[str] = Query(default="", max_length=100),
    current_user: User = Depends(get_current_user),
):
    """Case-insensitive search across group name, module code, and tags."""
    if not q or not q.strip():
        groups = await StudyGroup.find_all().to_list()
        groups.sort(key=lambda g: g.created_at, reverse=True)
        return [group_to_response(g, current_user) for g in groups]

    pattern = re.compile(re.escape(q.strip()), re.IGNORECASE)
    groups = await StudyGroup.find_all().to_list()
    results = [
        g for g in groups
        if pattern.search(g.name) or pattern.search(g.module) or any(pattern.search(t) for t in g.tags)
    ]
    results.sort(key=lambda g: g.created_at, reverse=True)
    return [group_to_response(g, current_user) for g in results]


# ─── POST /groups/{group_id}/join ─── Join a group ───
@router.post(
    "/{group_id}/join",
    response_model=StudyGroupResponse,
    summary="Join a study group",
)
async def join_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
):
    group = await StudyGroup.get(PydanticObjectId(group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    uid = str(current_user.id)
    if uid in group.member_ids:
        raise HTTPException(status_code=400, detail="Already a member")

    if len(group.member_ids) >= group.max_members:
        raise HTTPException(status_code=400, detail="Group is full")

    group.member_ids.append(uid)
    await group.set({"member_ids": group.member_ids})
    return group_to_response(group, current_user)


# ─── POST /groups/{group_id}/leave ─── Leave a group ───
@router.post(
    "/{group_id}/leave",
    response_model=StudyGroupResponse,
    summary="Leave a study group",
)
async def leave_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
):
    group = await StudyGroup.get(PydanticObjectId(group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    uid = str(current_user.id)
    if uid not in group.member_ids:
        raise HTTPException(status_code=400, detail="Not a member of this group")

    group.member_ids = [m for m in group.member_ids if m != uid]
    await group.set({"member_ids": group.member_ids})
    return group_to_response(group, current_user)


@router.post(
    "/{group_id}/invites",
    response_model=List[StudyGroupInviteResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Invite members to a study group",
)
async def create_group_invite(
    group_id: str,
    payload: StudyGroupInviteCreate,
    current_user: User = Depends(get_current_user),
):
    group = await StudyGroup.get(PydanticObjectId(group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    current_user_id = str(current_user.id)
    if current_user_id not in group.member_ids:
        raise HTTPException(status_code=403, detail="Only group members can send invites")

    created_invites = []
    
    for email_item in payload.invited_emails:
        invited_email = str(email_item).strip().lower()
        if not invited_email:
            continue

        if invited_email == current_user.email:
            raise HTTPException(status_code=400, detail=f"You are already part of this group: {invited_email}")

        existing_user = await User.find_one(User.email == invited_email)
        if existing_user and str(existing_user.id) in group.member_ids:
            raise HTTPException(status_code=400, detail=f"User {invited_email} is already a member of the group")

        existing_pending_invite = await StudyGroupInvite.find_one(
            StudyGroupInvite.group_id == group_id,
            StudyGroupInvite.invited_email == invited_email,
            StudyGroupInvite.status == "pending",
        )
        if existing_pending_invite:
            raise HTTPException(status_code=400, detail=f"A pending invite already exists for {invited_email}")

        invite = StudyGroupInvite(
            group_id=group_id,
            group_name=group.name,
            group_module=group.module,
            invited_email=invited_email,
            invited_by_user_id=current_user_id,
            invited_by_name=current_user.full_name,
        )
        invite.email_sent = await EmailService.send_group_invite_email(
            email=invited_email,
            group_name=group.name,
            module=group.module,
            inviter_name=current_user.full_name,
            join_url=f"{settings.FRONTEND_URL}/materials",
        )
        await invite.insert()
        created_invites.append(invite_to_response(invite))
        
    return created_invites


@router.get(
    "/{group_id}/members",
    response_model=List[dict],
    summary="List members of a study group",
)
async def list_group_members(
    group_id: str,
    current_user: User = Depends(get_current_user),
):
    group = await StudyGroup.get(PydanticObjectId(group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if str(current_user.id) not in group.member_ids:
        raise HTTPException(status_code=403, detail="Only group members can view the member list")

    # Fetch all user documents for the member IDs
    member_ids = [PydanticObjectId(uid) for uid in group.member_ids]
    users = await User.find({"_id": {"$in": member_ids}}).to_list()
    
    return [
        {"full_name": user.full_name, "email": str(user.email)} 
        for user in users
    ]


@router.get(
    "/{group_id}/invites",
    response_model=List[StudyGroupInviteResponse],
    summary="List invites for a study group",
)
async def list_group_invites(
    group_id: str,
    current_user: User = Depends(get_current_user),
):
    group = await StudyGroup.get(PydanticObjectId(group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if str(current_user.id) not in group.member_ids:
        raise HTTPException(status_code=403, detail="Only group members can view invites")

    invites = await StudyGroupInvite.find(StudyGroupInvite.group_id == group_id).to_list()
    invites.sort(key=lambda invite: invite.created_at, reverse=True)
    return [invite_to_response(invite) for invite in invites]


@router.get(
    "/invites/me",
    response_model=List[StudyGroupInviteResponse],
    summary="List study group invites for the current user",
)
async def list_my_group_invites(
    current_user: User = Depends(get_current_user),
):
    invites = await StudyGroupInvite.find(
        StudyGroupInvite.invited_email == current_user.email,
        StudyGroupInvite.status == "pending",
    ).to_list()
    invites.sort(key=lambda invite: invite.created_at, reverse=True)
    return [invite_to_response(invite) for invite in invites]


@router.post(
    "/invites/{invite_id}/accept",
    response_model=StudyGroupResponse,
    summary="Accept a study group invite",
)
async def accept_group_invite(
    invite_id: str,
    current_user: User = Depends(get_current_user),
):
    invite = await StudyGroupInvite.get(PydanticObjectId(invite_id))
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")

    if invite.status != "pending":
        raise HTTPException(status_code=400, detail="This invite is no longer pending")

    if str(invite.invited_email) != current_user.email:
        raise HTTPException(status_code=403, detail="This invite is not addressed to you")

    group = await StudyGroup.get(PydanticObjectId(invite.group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    current_user_id = str(current_user.id)
    if current_user_id not in group.member_ids:
        if len(group.member_ids) >= group.max_members:
            raise HTTPException(status_code=400, detail="Group is full")
        group.member_ids.append(current_user_id)
        await group.set({"member_ids": group.member_ids})

    invite.status = "accepted"
    invite.responded_at = datetime.utcnow()
    await invite.save()
    return group_to_response(group, current_user)


@router.post(
    "/invites/{invite_id}/decline",
    response_model=StudyGroupInviteResponse,
    summary="Decline a study group invite",
)
async def decline_group_invite(
    invite_id: str,
    current_user: User = Depends(get_current_user),
):
    invite = await StudyGroupInvite.get(PydanticObjectId(invite_id))
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")

    if str(invite.invited_email) != current_user.email:
        raise HTTPException(status_code=403, detail="This invite is not addressed to you")

    if invite.status != "pending":
        raise HTTPException(status_code=400, detail="This invite is no longer pending")

    invite.status = "declined"
    invite.responded_at = datetime.utcnow()
    await invite.save()
    return invite_to_response(invite)


@router.get(
    "/{group_id}/materials",
    summary="List materials for a study group",
)
async def list_group_materials(
    group_id: str,
    current_user: User = Depends(get_current_user),
):
    group = await StudyGroup.get(PydanticObjectId(group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if str(current_user.id) not in group.member_ids:
        raise HTTPException(status_code=403, detail="Only group members can view study materials")

    materials = await get_group_materials(group_id=group_id)
    return {
        "success": True,
        "can_upload": True,  # Already verified membership above
        "materials": [material_to_response(material, current_user) for material in materials],
    }


@router.post(
    "/{group_id}/materials",
    status_code=status.HTTP_201_CREATED,
    summary="Upload study material to a study group",
)
async def upload_group_material(
    group_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    group = await StudyGroup.get(PydanticObjectId(group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if str(current_user.id) not in group.member_ids:
        raise HTTPException(status_code=403, detail="Only group members can upload study materials")

    file_ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else ""
    if file_ext not in {"pdf", "docx", "pptx"}:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and PPTX files are allowed")

    material_id = await process_uploaded_document(
        file=file,
        user_id=str(current_user.id),
        subject=group.module,
        group_id=group_id,
        uploaded_by_name=current_user.full_name,
    )
    material = await StudyMaterial.get(PydanticObjectId(material_id))
    if not material:
        raise HTTPException(status_code=404, detail="Uploaded material not found")

    return {
        "success": True,
        "material": material_to_response(material, current_user),
    }


@router.delete(
    "/{group_id}/materials/{material_id}",
    summary="Delete a study material from a study group",
)
async def delete_group_material(
    group_id: str,
    material_id: str,
    current_user: User = Depends(get_current_user),
):
    group = await StudyGroup.get(PydanticObjectId(group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    material = await get_group_material_or_404(group_id, material_id)
    if material.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Only the uploader can remove this material")

    if material.file_path:
        file_path = Path(material.file_path)
        if file_path.is_file():
            file_path.unlink()

    await material.delete()
    return {"success": True, "material_id": material_id}


@router.get(
    "/{group_id}/materials/{material_id}/view",
    summary="Open a study material from a study group",
)
async def view_group_material(
    group_id: str,
    material_id: str,
    current_user: User = Depends(get_current_user),
):
    group = await StudyGroup.get(PydanticObjectId(group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if str(current_user.id) not in group.member_ids:
        raise HTTPException(status_code=403, detail="Only group members can view study materials")

    material = await get_group_material_or_404(group_id, material_id)
    if not material.file_path or not Path(material.file_path).is_file():
        raise HTTPException(status_code=404, detail="Original file is not available for this material")

    return FileResponse(
        path=material.file_path,
        filename=material.filename,
        media_type=material.content_type or "application/octet-stream",
        content_disposition_type="inline",
    )


@router.get(
    "/{group_id}/materials/{material_id}/download",
    summary="Download a study material from a study group",
)
async def download_group_material(
    group_id: str,
    material_id: str,
    current_user: User = Depends(get_current_user),
):
    group = await StudyGroup.get(PydanticObjectId(group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if str(current_user.id) not in group.member_ids:
        raise HTTPException(status_code=403, detail="Only group members can download study materials")

    material = await get_group_material_or_404(group_id, material_id)
    if not material.file_path or not Path(material.file_path).is_file():
        raise HTTPException(status_code=404, detail="Original file is not available for this material")

    return FileResponse(
        path=material.file_path,
        filename=material.filename,
        media_type=material.content_type or "application/octet-stream",
        content_disposition_type="attachment",
    )
