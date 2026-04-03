"""
Meeting Routes - API endpoints for managing video meetings in study groups
"""
from typing import List, Literal, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from beanie import PydanticObjectId

from app.models.study_group import StudyGroup, MeetingRecord
from app.models.user_model import User
from app.core.security import get_current_user
from app.services.meeting_service import MeetingService

router = APIRouter(prefix="/groups", tags=["Group Meetings"])


# ─── Helper: Check if user is a group member ───
async def verify_group_member(group_id: str, user_id: str) -> StudyGroup:
    """Verify user is a member of the group."""
    group = await StudyGroup.get(PydanticObjectId(group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if str(user_id) not in group.member_ids:
        raise HTTPException(
            status_code=403,
            detail="Only group members can access meetings"
        )
    
    return group


# ─── POST /{group_id}/meetings/start ───
@router.post(
    "/{group_id}/meetings/start",
    status_code=status.HTTP_201_CREATED,
    summary="Start a video meeting (Zoom or Teams)"
)
async def start_meeting(
    group_id: str,
    platform: Literal["zoom", "teams"],
    current_user: User = Depends(get_current_user),
):
    """
    Start a new video meeting for the group.
    - Any group member can start a meeting
    - Only one active meeting per group at a time
    - Meeting details are stored and accessible to all members
    """
    group = await verify_group_member(group_id, str(current_user.id))
    
    # Check if meeting already active
    if group.active_meeting and group.active_meeting.get("is_active"):
        raise HTTPException(
            status_code=409,
            detail="A meeting is already active for this group"
        )
    
    try:
        # Create meeting via service
        if platform == "zoom":
            meeting_response = await MeetingService.create_zoom_meeting(
                group_id=group_id,
                group_name=group.name,
                initiator_id=str(current_user.id)
            )
        else:  # teams
            meeting_response = await MeetingService.create_teams_meeting(
                group_id=group_id,
                group_name=group.name,
                initiator_id=str(current_user.id)
            )
        
        # Store as active meeting
        active_meeting = {
            "platform": platform,
            "meeting_link": meeting_response["meeting_link"],
            "meeting_code": meeting_response.get("meeting_code"),
            "meeting_password": meeting_response.get("meeting_password"),
            "started_at": meeting_response["started_at"],
            "started_by": current_user.full_name,
            "started_by_id": str(current_user.id),
            "is_active": True,
        }
        
        # Update group
        group.active_meeting = active_meeting
        await group.save()
        
        return {
            "status": "success",
            "message": f"{platform.capitalize()} meeting started",
            "meeting": active_meeting,
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create meeting: {str(e)}"
        )


# ─── GET /{group_id}/meetings/active ───
@router.get(
    "/{group_id}/meetings/active",
    summary="Get active meeting details"
)
async def get_active_meeting(
    group_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Get details of the currently active meeting.
    - Only group members can access
    - Returns meeting link, platform, and who started it
    """
    group = await verify_group_member(group_id, str(current_user.id))
    
    if not group.active_meeting or not group.active_meeting.get("is_active"):
        raise HTTPException(
            status_code=404,
            detail="No active meeting for this group"
        )
    
    return {
        "status": "active",
        "meeting": group.active_meeting,
    }


# ─── POST /{group_id}/meetings/end ───
@router.post(
    "/{group_id}/meetings/end",
    summary="End the active meeting"
)
async def end_meeting(
    group_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    End the currently active meeting.
    - Only the member who started the meeting can end it
    - Meeting is moved to history with end timestamp
    """
    group = await verify_group_member(group_id, str(current_user.id))
    
    if not group.active_meeting or not group.active_meeting.get("is_active"):
        raise HTTPException(
            status_code=404,
            detail="No active meeting to end"
        )
    
    # Check if current user is the one who started the meeting
    if group.active_meeting.get("started_by_id") != str(current_user.id):
        raise HTTPException(
            status_code=403,
            detail="Only the member who started the meeting can end it"
        )
    
    # Create history record
    meeting_record = MeetingRecord(
        platform=group.active_meeting["platform"],
        meeting_link=group.active_meeting["meeting_link"],
        meeting_code=group.active_meeting.get("meeting_code"),
        started_at=datetime.fromisoformat(group.active_meeting["started_at"]),
        ended_at=datetime.utcnow(),
    )
    
    # Add to history
    group.meeting_history.append(meeting_record)
    
    # Clear active meeting
    group.active_meeting = None
    await group.save()
    
    return {
        "status": "success",
        "message": "Meeting ended and saved to history",
        "ended_at": datetime.utcnow().isoformat(),
    }


# ─── GET /{group_id}/meetings/history ───
@router.get(
    "/{group_id}/meetings/history",
    response_model=dict,
    summary="Get meeting history"
)
async def get_meeting_history(
    group_id: str,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
):
    """
    Get past meeting records for the group.
    - Only group members can access
    - Shows when meetings were held, on which platform, and duration
    - Limited to most recent meetings (default 10)
    """
    group = await verify_group_member(group_id, str(current_user.id))
    
    # Get most recent meetings
    history = group.meeting_history[-limit:][::-1]  # Reverse for newest first
    
    return {
        "status": "success",
        "total": len(group.meeting_history),
        "returned": len(history),
        "meetings": [
            {
                "platform": m.platform,
                "started_at": m.started_at.isoformat(),
                "ended_at": m.ended_at.isoformat() if m.ended_at else None,
                "duration_minutes": round((m.ended_at - m.started_at).seconds / 60)
                    if m.ended_at else None,
            }
            for m in history
        ]
    }


# ─── POST /{group_id}/meetings/validate-access ───
@router.post(
    "/{group_id}/meetings/validate-access",
    summary="Validate if user can join a meeting"
)
async def validate_meeting_access(
    group_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Check if the current user is a group member and can join the meeting.
    - Used by frontend to prevent non-members from accessing meeting links
    - Returns group info and active meeting details
    """
    group = await StudyGroup.get(PydanticObjectId(group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    is_member = str(current_user.id) in group.member_ids
    
    if not is_member:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this group. Access to this meeting is restricted to group members only.",
        )
    
    return {
        "status": "allowed",
        "message": "Access granted",
        "group_id": group_id,
        "group_name": group.name,
        "is_member": True,
        "has_active_meeting": bool(group.active_meeting and group.active_meeting.get("is_active")),
    }
