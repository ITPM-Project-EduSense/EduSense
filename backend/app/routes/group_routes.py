import re
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status, Depends
from beanie import PydanticObjectId

from app.models.study_group import StudyGroup, StudyGroupCreate, StudyGroupResponse
from app.models.study_group_invite import (
    StudyGroupInvite,
    StudyGroupInviteCreate,
    StudyGroupInviteResponse,
)
from app.models.user_model import User
from app.core.security import get_current_user
from app.core.config import settings
from app.services.email_service import EmailService

router = APIRouter(prefix="/groups", tags=["Groups"])


def group_to_response(group: StudyGroup, current_user: Optional[User] = None) -> StudyGroupResponse:
    current_user_id = str(current_user.id) if current_user else None
    return StudyGroupResponse(
        id=str(group.id),
        name=group.name,
        module=group.module,
        schedule=group.schedule,
        max_members=group.max_members,
        tags=group.tags,
        created_by=group.created_by,
        members=len(group.member_ids),
        is_joined=current_user_id in group.member_ids if current_user_id else False,
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
        member_ids=[str(current_user.id)],
    )
    await group.insert()
    return group_to_response(group, current_user)


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
    response_model=StudyGroupInviteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Invite a member to a study group",
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
    invited_email = str(payload.invited_email).strip().lower()

    if current_user_id not in group.member_ids:
        raise HTTPException(status_code=403, detail="Only group members can send invites")

    if invited_email == current_user.email:
        raise HTTPException(status_code=400, detail="You are already part of this group")

    existing_user = await User.find_one(User.email == invited_email)
    if existing_user and str(existing_user.id) in group.member_ids:
        raise HTTPException(status_code=400, detail="This user is already a member of the group")

    existing_pending_invite = await StudyGroupInvite.find_one(
        StudyGroupInvite.group_id == group_id,
        StudyGroupInvite.invited_email == invited_email,
        StudyGroupInvite.status == "pending",
    )
    if existing_pending_invite:
        raise HTTPException(status_code=400, detail="A pending invite already exists for this email")

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
    return invite_to_response(invite)


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
