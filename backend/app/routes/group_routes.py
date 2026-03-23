import re
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status, Depends
from beanie import PydanticObjectId

from app.models.study_group import StudyGroup, StudyGroupCreate, StudyGroupResponse
from app.models.user_model import User
from app.core.security import get_current_user

router = APIRouter(prefix="/groups", tags=["Groups"])


def group_to_response(group: StudyGroup) -> StudyGroupResponse:
    return StudyGroupResponse(
        id=str(group.id),
        name=group.name,
        module=group.module,
        schedule=group.schedule,
        max_members=group.max_members,
        tags=group.tags,
        created_by=group.created_by,
        members=len(group.member_ids),
        created_at=group.created_at,
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
    return group_to_response(group)


# ─── GET /groups/ ─── List all study groups ───
@router.get(
    "/",
    response_model=List[StudyGroupResponse],
    summary="List all study groups",
)
async def list_groups():
    """Return all study groups sorted newest-first."""
    groups = await StudyGroup.find_all().to_list()
    groups.sort(key=lambda g: g.created_at, reverse=True)
    return [group_to_response(g) for g in groups]


# ─── GET /groups/search?q= ─── Search groups by name / module / tag ───
@router.get(
    "/search",
    response_model=List[StudyGroupResponse],
    summary="Search study groups",
)
async def search_groups(q: Optional[str] = Query(default="", max_length=100)):
    """Case-insensitive search across group name, module code, and tags."""
    if not q or not q.strip():
        groups = await StudyGroup.find_all().to_list()
        groups.sort(key=lambda g: g.created_at, reverse=True)
        return [group_to_response(g) for g in groups]

    pattern = re.compile(re.escape(q.strip()), re.IGNORECASE)
    groups = await StudyGroup.find_all().to_list()
    results = [
        g for g in groups
        if pattern.search(g.name) or pattern.search(g.module) or any(pattern.search(t) for t in g.tags)
    ]
    results.sort(key=lambda g: g.created_at, reverse=True)
    return [group_to_response(g) for g in results]


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
    return group_to_response(group)


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
    return group_to_response(group)
