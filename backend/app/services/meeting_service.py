"""
Meeting Service - Handle Zoom and Teams meeting creation/management
Uses placeholder integration for testing (no actual API calls in dev)
"""
import uuid
from datetime import datetime
from typing import Dict, Optional, Any, Literal
import os


class MeetingService:
    """Service for managing Zoom and Teams meetings."""
    
    # Configuration from environment
    ZOOM_CLIENT_ID = os.getenv("ZOOM_CLIENT_ID", "test_zoom_id")
    ZOOM_CLIENT_SECRET = os.getenv("ZOOM_CLIENT_SECRET", "test_zoom_secret")
    
    TEAMS_CLIENT_ID = os.getenv("TEAMS_CLIENT_ID", "test_teams_id")
    TEAMS_CLIENT_SECRET = os.getenv("TEAMS_CLIENT_SECRET", "test_teams_secret")
    TEAMS_TENANT_ID = os.getenv("TEAMS_TENANT_ID", "test_tenant_id")
    
    USE_PLACEHOLDER = os.getenv("USE_PLACEHOLDER_MEETINGS", "true").lower() == "true"
    
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
        
        # TODO: Implement actual Teams API integration
        # Steps:
        # 1. Get access token from Azure AD
        # 2. Call: POST https://graph.microsoft.com/v1.0/me/onlineMeetings
        # 3. Extract joinWebUrl from response
        raise NotImplementedError("Production Teams integration not yet implemented")
    
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
        return {
            "platform": platform,
            "meeting_link": meeting_link,
            "meeting_code": meeting_code,
            "meeting_password": meeting_password,
            "started_at": datetime.utcnow().isoformat(),
            "is_active": True,
        }
