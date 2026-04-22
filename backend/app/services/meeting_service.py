"""
Meeting Service - Handle Zoom and Teams meeting creation/management
Uses placeholder integration for testing (no actual API calls in dev)
"""
import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
from typing_extensions import Literal
import os
import httpx


class MeetingService:
    """Service for managing Zoom and Teams meetings."""
    
    # Configuration from environment
    ZOOM_CLIENT_ID = os.getenv("ZOOM_CLIENT_ID", "test_zoom_id")
    ZOOM_CLIENT_SECRET = os.getenv("ZOOM_CLIENT_SECRET", "test_zoom_secret")
    
    TEAMS_CLIENT_ID = os.getenv("TEAMS_CLIENT_ID", "test_teams_id")
    TEAMS_CLIENT_SECRET = os.getenv("TEAMS_CLIENT_SECRET", "test_teams_secret")
    TEAMS_TENANT_ID = os.getenv("TEAMS_TENANT_ID", "test_tenant_id")
    TEAMS_ORGANIZER_USER_ID = os.getenv("TEAMS_ORGANIZER_USER_ID", "")
    
    USE_PLACEHOLDER = os.getenv("USE_PLACEHOLDER_MEETINGS", "false").lower() == "true"

    @staticmethod
    def parse_iso_datetime(raw: str) -> datetime:
        """Parse ISO datetime that may contain trailing Z."""
        if raw.endswith("Z"):
            raw = raw[:-1] + "+00:00"
        return datetime.fromisoformat(raw)

    @staticmethod
    def validate_manual_meeting_link(platform: Literal["zoom", "teams"], link: str) -> str:
        normalized = (link or "").strip()
        if not normalized.startswith("http"):
            raise ValueError("Please provide a valid meeting URL")

        if platform == "teams":
            if "teams.microsoft.com" not in normalized:
                raise ValueError("Please provide a valid Microsoft Teams meeting URL")
            if "/l/meetup-join/" not in normalized and "/meet/" not in normalized:
                raise ValueError(
                    "This looks like a Team/Channel link, not a meeting invite. Please paste a Teams meeting invite URL containing '/l/meetup-join/' or '/meet/'."
                )

        if platform == "zoom" and "zoom" not in normalized:
            raise ValueError("Please provide a valid Zoom meeting URL")

        return normalized

    @staticmethod
    def get_join_links(platform: Literal["zoom", "teams"], meeting_link: str, meeting_code: Optional[str] = None) -> Dict[str, str]:
        web_link = meeting_link
        if platform == "teams":
            app_link = (
                meeting_link.replace("https://teams.microsoft.com", "msteams://teams.microsoft.com")
                if meeting_link.startswith("https://teams.microsoft.com")
                else meeting_link
            )
            return {"web_link": web_link, "app_link": app_link}

        app_link = (
            f"zoommtg://zoom.us/join?action=join&confno={meeting_code}"
            if meeting_code else meeting_link
        )
        return {"web_link": web_link, "app_link": app_link}

    @staticmethod
    def build_active_meeting(
        *,
        platform: Literal["zoom", "teams"],
        meeting_link: str,
        started_by: str,
        started_by_id: str,
        source: Literal["manual_link", "graph_api"],
        meeting_code: Optional[str] = None,
        meeting_password: Optional[str] = None,
        started_at: Optional[str] = None,
        provider_status: Literal["success", "failed", "expired"] = "success",
        provider_error: Optional[str] = None,
    ) -> Dict[str, Any]:
        started_value = started_at or datetime.utcnow().isoformat()
        meeting = {
            "platform": platform,
            "meeting_link": meeting_link,
            "meeting_code": meeting_code,
            "meeting_password": meeting_password,
            "started_at": started_value,
            "started_by": started_by,
            "started_by_id": started_by_id,
            "is_active": provider_status == "success",
            "join_events": [],
            "source": source,
            "provider_status": provider_status,
            "provider_error": provider_error,
        }
        meeting.update(MeetingService.get_join_links(platform, meeting_link, meeting_code))
        return meeting

    @staticmethod
    def _has_real_teams_config() -> bool:
        required = [
            MeetingService.TEAMS_CLIENT_ID,
            MeetingService.TEAMS_CLIENT_SECRET,
            MeetingService.TEAMS_TENANT_ID,
            MeetingService.TEAMS_ORGANIZER_USER_ID,
        ]
        if not all(required):
            return False
        if "test_teams" in MeetingService.TEAMS_CLIENT_ID:
            return False
        if "test_teams" in MeetingService.TEAMS_CLIENT_SECRET:
            return False
        if "test_tenant" in MeetingService.TEAMS_TENANT_ID:
            return False
        return True

    @staticmethod
    async def _get_graph_access_token() -> str:
        token_url = f"https://login.microsoftonline.com/{MeetingService.TEAMS_TENANT_ID}/oauth2/v2.0/token"
        payload = {
            "client_id": MeetingService.TEAMS_CLIENT_ID,
            "client_secret": MeetingService.TEAMS_CLIENT_SECRET,
            "scope": "https://graph.microsoft.com/.default",
            "grant_type": "client_credentials",
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(token_url, data=payload)
            if response.status_code >= 400:
                raise RuntimeError(f"Graph token request failed ({response.status_code}): {response.text[:240]}")
            token_data = response.json()

        access_token = token_data.get("access_token")
        if not access_token:
            raise RuntimeError("Graph token response missing access_token")
        return access_token
    
    @staticmethod
    async def create_zoom_meeting(
        group_id: str, 
        group_name: str,
        initiator_id: str
    ) -> Dict[str, Any]:
        """
        Create a Zoom meeting for the study group.
        
        Args:
            group_id: The study group ID
            group_name: Name of the study group
            initiator_id: User ID of the person starting the meeting
            
        Returns:
            Dict with meeting_link, meeting_code, platform, and started_at
        """
        if MeetingService.USE_PLACEHOLDER:
            # Placeholder integration - generates realistic looking test links
            meeting_id = str(uuid.uuid4())[:8].upper()
            return {
                "platform": "zoom",
                "meeting_link": f"https://zoom.us/j/{meeting_id}",
                "meeting_code": meeting_id,
                "meeting_password": f"test{uuid.uuid4().hex[:6]}",
                "started_at": datetime.utcnow().isoformat(),
                "initiator_id": initiator_id,
                "group_id": group_id,
            }
        
        # TODO: Implement actual Zoom API integration
        # Steps:
        # 1. Get access token from Zoom OAuth
        # 2. Call: POST https://api.zoom.us/v2/users/{user_id}/meetings
        # 3. Extract join_url and meeting_id from response
        raise NotImplementedError("Production Zoom integration not yet implemented")
    
    @staticmethod
    async def create_teams_meeting(
        group_id: str,
        group_name: str,
        initiator_id: str
    ) -> Dict[str, Any]:
        """
        Create a Teams meeting for the study group.
        
        Args:
            group_id: The study group ID
            group_name: Name of the study group
            initiator_id: User ID of the person starting the meeting
            
        Returns:
            Dict with meeting_link, platform, and started_at
        """
        if MeetingService.USE_PLACEHOLDER:
            # Placeholder integration - generates realistic looking test links
            meeting_id = str(uuid.uuid4())[:12]
            return {
                "platform": "teams",
                "meeting_link": f"https://teams.microsoft.com/l/meetup-join/{meeting_id}",
                "meeting_code": None,  # Teams doesn't use separate codes
                "started_at": datetime.utcnow().isoformat(),
                "initiator_id": initiator_id,
                "group_id": group_id,
            }

        if not MeetingService._has_real_teams_config():
            raise RuntimeError(
                "Teams Graph mode is not configured. Set TEAMS_CLIENT_ID, TEAMS_CLIENT_SECRET, "
                "TEAMS_TENANT_ID, and TEAMS_ORGANIZER_USER_ID. "
                "If you are not using Entra/Graph, use POST /groups/{id}/meetings/start-manual with a real Teams meetup-join link."
            )
        
        access_token = await MeetingService._get_graph_access_token()

        now = datetime.utcnow()
        start_at = now.replace(microsecond=0).isoformat() + "Z"
        end_at = (now + timedelta(hours=1)).replace(microsecond=0).isoformat() + "Z"

        body = {
            "subject": f"EduSense Study Group: {group_name}",
            "startDateTime": start_at,
            "endDateTime": end_at,
        }

        graph_url = f"https://graph.microsoft.com/v1.0/users/{MeetingService.TEAMS_ORGANIZER_USER_ID}/onlineMeetings"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(graph_url, headers=headers, json=body)
            if response.status_code >= 400:
                raise RuntimeError(f"Graph meeting creation failed ({response.status_code}): {response.text[:320]}")
            meeting = response.json()

        join_web_url = meeting.get("joinWebUrl")
        if not join_web_url:
            raise RuntimeError("Graph response did not include joinWebUrl")

        return {
            "platform": "teams",
            "meeting_link": join_web_url,
            "meeting_code": meeting.get("id"),
            "started_at": datetime.utcnow().isoformat(),
            "initiator_id": initiator_id,
            "group_id": group_id,
        }
    
    @staticmethod
    async def validate_group_member(user_id: str, group_member_ids: list) -> bool:
        """
        Validate if a user is a member of the group.
        
        Args:
            user_id: The user ID to check
            group_member_ids: List of group member IDs
            
        Returns:
            True if user is member, False otherwise
        """
        return str(user_id) in [str(m) for m in group_member_ids]
    
    @staticmethod
    def generate_meeting_object(
        platform: Literal["zoom", "teams"],
        meeting_link: str,
        meeting_code: Optional[str] = None,
        meeting_password: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate a meeting object for storage."""
        return MeetingService.build_active_meeting(
            platform=platform,
            meeting_link=meeting_link,
            meeting_code=meeting_code,
            meeting_password=meeting_password,
            started_by="system",
            started_by_id="system",
            source="graph_api",
        )
