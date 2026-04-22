"""
Meeting Routes - API endpoints for managing video meetings in study groups
"""
from typing import List, Optional
from typing_extensions import Literal
from datetime import datetime
import os
from fastapi import APIRouter, HTTPException, Depends, status
from beanie import PydanticObjectId
from pydantic import BaseModel

from app.models.study_group import StudyGroup, MeetingRecord
from app.models.user_model import User
from app.core.security import get_current_user
from app.services.meeting_service import MeetingService

router = APIRouter(prefix="/groups", tags=["Group Meetings"])
MEETING_MAX_ACTIVE_MINUTES = int(os.getenv("MEETING_MAX_ACTIVE_MINUTES", "180"))


class JoinTelemetryPayload(BaseModel):
    method: Literal["app", "browser", "copy"]
    status: Literal["attempted", "success", "failed"] = "attempted"
    client_platform: Optional[str] = None
    detail: Optional[str] = None


class ManualMeetingStartPayload(BaseModel):
    platform: Literal["zoom", "teams", "google"]
    meeting_link: str
    meeting_code: Optional[str] = None
    meeting_password: Optional[str] = None


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


async def archive_active_meeting(
    group: StudyGroup,
    *,
    ended_at: Optional[datetime] = None,
    provider_status: Optional[Literal["success", "failed", "expired"]] = None,
    provider_error: Optional[str] = None,
) -> None:
    """Move active meeting to history and clear active slot."""
    if not group.active_meeting:
        return

    raw_started_at = group.active_meeting.get("started_at")
    if not raw_started_at:
        raw_started_at = datetime.utcnow().isoformat()

    meeting_record = MeetingRecord(
        platform=group.active_meeting["platform"],
        meeting_link=group.active_meeting.get("meeting_link", ""),
        meeting_code=group.active_meeting.get("meeting_code"),
        source=group.active_meeting.get("source"),
        provider_status=provider_status or group.active_meeting.get("provider_status", "success"),
        provider_error=provider_error or group.active_meeting.get("provider_error"),
        started_at=MeetingService.parse_iso_datetime(raw_started_at),
        ended_at=ended_at or datetime.utcnow(),
        join_events=group.active_meeting.get("join_events", []),
    )
    group.meeting_history.append(meeting_record)
    group.active_meeting = None


async def expire_stale_active_meeting_if_needed(group: StudyGroup) -> bool:
    """Expire active meeting when it exceeds the configured active window."""
    active = group.active_meeting
    if not active or not active.get("is_active"):
        return False

    started_at = MeetingService.parse_iso_datetime(active.get("started_at", datetime.utcnow().isoformat()))
    age_minutes = (datetime.utcnow() - started_at.replace(tzinfo=None) if started_at.tzinfo else datetime.utcnow() - started_at).total_seconds() / 60

    if age_minutes <= MEETING_MAX_ACTIVE_MINUTES:
        return False

    await archive_active_meeting(
        group,
        provider_status="expired",
        provider_error=f"Auto-expired after {MEETING_MAX_ACTIVE_MINUTES} minutes",
    )
    await group.save()
    return True


# ─── POST /{group_id}/meetings/start ───
@router.post(
    "/{group_id}/meetings/start",
    status_code=status.HTTP_201_CREATED,
    summary="Start a video meeting (Zoom or Teams)"
)
async def start_meeting(
    group_id: str,
    platform: Literal["zoom", "teams", "google"],
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
        elif platform == "teams":
            meeting_response = await MeetingService.create_teams_meeting(
                group_id=group_id,
                group_name=group.name,
                initiator_id=str(current_user.id)
            )
        else:  # google
            meeting_response = await MeetingService.create_google_meeting(
                group_id=group_id,
                group_name=group.name,
                initiator_id=str(current_user.id)
            )
        
        # Store as active meeting (uniform shape)
        active_meeting = MeetingService.build_active_meeting(
            platform=platform,
            meeting_link=meeting_response["meeting_link"],
            meeting_code=meeting_response.get("meeting_code"),
            meeting_password=meeting_response.get("meeting_password"),
            started_at=meeting_response.get("started_at"),
            started_by=current_user.full_name,
            started_by_id=str(current_user.id),
            source="graph_api",
            provider_status="success",
            provider_error=None,
        )
        
        # Update group
        group.active_meeting = active_meeting
        await group.save()
        
        return {
            "status": "success",
            "message": f"{platform.capitalize()} meeting started",
            "meeting": active_meeting,
        }
    
    except RuntimeError as e:
        message = str(e)
        group.active_meeting = MeetingService.build_active_meeting(
            platform=platform,
            meeting_link="",
            meeting_code=None,
            meeting_password=None,
            started_by=current_user.full_name,
            started_by_id=str(current_user.id),
            source="graph_api",
            provider_status="failed",
            provider_error=message,
        )
        await archive_active_meeting(group, provider_status="failed", provider_error=message)
        await group.save()

        if platform == "teams" and "start-manual" in message:
            raise HTTPException(
                status_code=422,
                detail=message,
            )

        raise HTTPException(
            status_code=502,
            detail=f"Meeting provider error: {message}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create meeting: {str(e)}"
        )


# ─── POST /{group_id}/meetings/start-manual ───
@router.post(
    "/{group_id}/meetings/start-manual",
    status_code=status.HTTP_201_CREATED,
    summary="Start a meeting from an existing platform invite link"
)
async def start_manual_meeting(
    group_id: str,
    payload: ManualMeetingStartPayload,
    current_user: User = Depends(get_current_user),
):
    """
    Start a meeting by using an invite link generated directly in Teams/Zoom.
    This path avoids Graph/OAuth setup and is useful for student projects.
    """
    group = await verify_group_member(group_id, str(current_user.id))

    if group.active_meeting and group.active_meeting.get("is_active"):
        raise HTTPException(status_code=409, detail="A meeting is already active for this group")

    try:
        link = MeetingService.validate_manual_meeting_link(payload.platform, payload.meeting_link)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    active_meeting = MeetingService.build_active_meeting(
        platform=payload.platform,
        meeting_link=link,
        meeting_code=payload.meeting_code,
        meeting_password=payload.meeting_password,
        started_by=current_user.full_name,
        started_by_id=str(current_user.id),
        source="manual_link",
        provider_status="success",
        provider_error=None,
    )

    group.active_meeting = active_meeting
    await group.save()

    return {
        "status": "success",
        "message": "Meeting started from existing invite link",
        "meeting": active_meeting,
    }


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

    expired = await expire_stale_active_meeting_if_needed(group)
    if expired:
        return {
            "status": "inactive",
            "meeting": None,
            "message": "Active meeting auto-expired due to inactivity window",
        }
    
    if not group.active_meeting or not group.active_meeting.get("is_active"):
        return {
            "status": "inactive",
            "meeting": None,
            "message": "No active meeting for this group",
        }
    
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
    
    await archive_active_meeting(group, provider_status=group.active_meeting.get("provider_status", "success"))
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
                "source": m.source,
                "provider_status": m.provider_status,
                "provider_error": m.provider_error,
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

    await expire_stale_active_meeting_if_needed(group)
    
    return {
        "status": "allowed",
        "message": "Access granted",
        "group_id": group_id,
        "group_name": group.name,
        "is_member": True,
        "has_active_meeting": bool(group.active_meeting and group.active_meeting.get("is_active")),
        "meeting": group.active_meeting if group.active_meeting and group.active_meeting.get("is_active") else None,
        "web_link": group.active_meeting.get("web_link") if group.active_meeting and group.active_meeting.get("is_active") else None,
        "app_link": group.active_meeting.get("app_link") if group.active_meeting and group.active_meeting.get("is_active") else None,
    }


# ─── POST /{group_id}/meetings/join-event ───
@router.post(
    "/{group_id}/meetings/join-event",
    summary="Store meeting join telemetry event"
)
async def log_join_event(
    group_id: str,
    payload: JoinTelemetryPayload,
    current_user: User = Depends(get_current_user),
):
    """
    Save a join-attempt telemetry event for reliability analysis.
    - Only group members can log events
    - Requires an active meeting
    """
    group = await verify_group_member(group_id, str(current_user.id))

    if not group.active_meeting or not group.active_meeting.get("is_active"):
        raise HTTPException(status_code=404, detail="No active meeting to log join telemetry")

    event = {
        "user_id": str(current_user.id),
        "user_name": current_user.full_name,
        "method": payload.method,
        "status": payload.status,
        "client_platform": payload.client_platform,
        "detail": payload.detail,
        "occurred_at": datetime.utcnow().isoformat(),
    }

    join_events = list(group.active_meeting.get("join_events") or [])
    join_events.append(event)
    group.active_meeting["join_events"] = join_events
    await group.save()

    return {
        "status": "success",
        "message": "Join telemetry saved",
        "event_count": len(join_events),
    }


# ─── GET /{group_id}/meetings/telemetry-summary ───
@router.get(
    "/{group_id}/meetings/telemetry-summary",
    summary="Get meeting reliability telemetry summary"
)
async def get_meeting_telemetry_summary(
    group_id: str,
    current_user: User = Depends(get_current_user),
):
    """Aggregate join telemetry for active + historical meetings."""
    group = await verify_group_member(group_id, str(current_user.id))

    events = []
    if group.active_meeting and group.active_meeting.get("join_events"):
        events.extend(group.active_meeting.get("join_events", []))

    for record in group.meeting_history:
        events.extend(record.join_events or [])

    total = len(events)
    by_status = {"attempted": 0, "success": 0, "failed": 0}
    by_method = {"app": 0, "browser": 0, "copy": 0}
    failures = []

    for event in events:
        status_key = event.get("status")
        method_key = event.get("method")
        if status_key in by_status:
            by_status[status_key] += 1
        if method_key in by_method:
            by_method[method_key] += 1
        if status_key == "failed":
            failures.append({
                "detail": event.get("detail"),
                "method": event.get("method"),
                "occurred_at": event.get("occurred_at"),
            })

    success_rate = (by_status["success"] / by_status["attempted"] * 100) if by_status["attempted"] else 0.0

    return {
        "status": "success",
        "group_id": group_id,
        "event_count": total,
        "by_status": by_status,
        "by_method": by_method,
        "join_success_rate": round(success_rate, 2),
        "top_failures": failures[-10:],
    }
