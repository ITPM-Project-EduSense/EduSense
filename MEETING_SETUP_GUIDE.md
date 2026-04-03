# Video Meeting Integration - Setup Guide

## Overview
The EduSense platform now supports video meetings through Zoom and Teams for study groups. Members can start/schedule meetings, and only group members can access the meeting links.

## Current Setup: Placeholder Integration (Testing Mode)

For development and testing, the system uses **placeholder meeting links** that simulate real Zoom/Teams meetings.

### Backend Configuration

Add these environment variables to your `.env` file:

```env
# ─── MEETING SERVICE CONFIGURATION ───

# Use placeholder integration (for testing/development)
# Set to 'false' to use actual Zoom/Teams APIs
USE_PLACEHOLDER_MEETINGS=true

# Zoom Credentials (required only if USE_PLACEHOLDER_MEETINGS=false)
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret

# Microsoft Teams Credentials (required only if USE_PLACEHOLDER_MEETINGS=false)
TEAMS_CLIENT_ID=your_teams_client_id
TEAMS_CLIENT_SECRET=your_teams_client_secret
TEAMS_TENANT_ID=your_teams_tenant_id
```

## How It Works (Current - Placeholder Mode)

### 1. Start a Meeting
- Any group member can start a Zoom or Teams meeting
- The system generates a realistic test meeting link
- Meeting details are stored and visible to all group members
- Example link: `https://zoom.us/j/AB12CD34`

### 2. Join a Meeting
- Only group members can access the meeting link
- Non-members see an error: "You are not a member of this group"
- Members click the link to join

### 3. End a Meeting
- Any group member can end the meeting
- Meeting is marked as inactive and saved to history
- Members can see past meetings with duration

### 4. Meeting History
- View all past meetings for a group
- Shows platform (Zoom/Teams), start time, end time, and duration

## API Endpoints

### Start a Meeting
```
POST /api/groups/{group_id}/meetings/start

Query Parameter:
  platform: "zoom" | "teams"

Response:
{
  "status": "success",
  "message": "Zoom meeting started",
  "meeting": {
    "platform": "zoom",
    "meeting_link": "https://zoom.us/j/123456789",
    "started_at": "2026-04-03T10:30:00",
    "started_by": "John Doe"
  }
}
```

### Get Active Meeting
```
GET /api/groups/{group_id}/meetings/active

Response:
{
  "status": "active",
  "meeting": {
    "platform": "zoom",
    "meeting_link": "https://zoom.us/j/123456789",
    "started_by": "John Doe"
  }
}

Error (if no active meeting):
{
  "detail": "No active meeting for this group"
}
```

### End a Meeting
```
POST /api/groups/{group_id}/meetings/end

Response:
{
  "status": "success",
  "message": "Meeting ended and saved to history",
  "ended_at": "2026-04-03T11:30:00"
}
```

### Get Meeting History
```
GET /api/groups/{group_id}/meetings/history?limit=10

Response:
{
  "status": "success",
  "total": 5,
  "returned": 5,
  "meetings": [
    {
      "platform": "zoom",
      "started_at": "2026-04-03T10:30:00",
      "ended_at": "2026-04-03T11:30:00",
      "duration_minutes": 60
    }
  ]
}
```

### Validate Meeting Access
```
POST /api/groups/{group_id}/meetings/validate-access

Response (if member):
{
  "status": "allowed",
  "message": "Access granted",
  "group_id": "group-id",
  "group_name": "CS2040 Study Group",
  "is_member": true,
  "has_active_meeting": true
}

Response (if non-member):
{
  "detail": "You are not a member of this group..."
}
```

## Frontend Implementation

The frontend includes a new `MeetingPanel` component that displays:

1. **Active Meeting Display**
   - Current meeting platform (Zoom/Teams)
   - "Join Meeting" button (opens link in new tab)
   - "End Meeting" button (for any member)
   - Shows who started the meeting

2. **Start Meeting Options**
   - Buttons to start Zoom meeting
   - Buttons to start Teams meeting
   - Shows loading state while creating

3. **Meeting History**
   - List of past meetings
   - Platform, date, duration for each

## Future: Production Integration with Real APIs

To enable real Zoom/Teams meetings:

### Step 1: Get Zoom Credentials

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us/develop)
2. Create a new OAuth App
3. Set these values from your app:
   - `ZOOM_CLIENT_ID` = Client ID
   - `ZOOM_CLIENT_SECRET` = Client Secret
4. In `meeting_service.py`, uncomment the actual Zoom API code
5. Set `USE_PLACEHOLDER_MEETINGS=false` in `.env`

### Step 2: Get Teams Credentials

1. Go to [Azure Portal](https://portal.azure.com)
2. Register your application in Azure AD
3. Create a client secret
4. Set these values:
   - `TEAMS_CLIENT_ID` = Application ID
   - `TEAMS_CLIENT_SECRET` = Client Secret
   - `TEAMS_TENANT_ID` = Directory ID
5. In `meeting_service.py`, uncomment the actual Teams API code
6. Set `USE_PLACEHOLDER_MEETINGS=false` in `.env`

### Step 3: Update meeting_service.py

Replace the placeholder implementations with actual API calls (see TODOs in the file).

## Testing the Feature Locally

### Test Scenario 1: Start and Join Meeting
```
1. Create a study group
2. Add members to the group
3. Login as a member
4. On group detail page, click "Start Zoom Meeting"
5. Meeting link appears
6. Click "Join Meeting" to open the link
7. Link format: https://zoom.us/j/{test-id}
```

### Test Scenario 2: Non-Member Cannot Join
```
1. Get a meeting link from an active meeting
2. Login as a non-member user
3. Try to access: POST /api/groups/{group_id}/meetings/validate-access
4. Should get 403 error
```

### Test Scenario 3: View Meeting History
```
1. End a meeting
2. Click "View Meeting History"
3. Completed meeting appears with duration
```

## File Structure

```
backend/
├── app/
│   ├── models/
│   │   └── study_group.py          (Updated with meeting fields)
│   ├── routes/
│   │   ├── meeting_routes.py       (NEW - Meeting endpoints)
│   │   └── group_routes.py         (Existing)
│   ├── services/
│   │   └── meeting_service.py      (NEW - Meeting logic)
│   └── main.py                     (Updated to include meeting router)

frontend/
├── src/
│   └── app/
│       └── (dashboard)/
│           └── materials/
│               ├── components/
│               │   └── MeetingPanel/         (NEW folder)
│               │       ├── MeetingPanel.tsx
│               │       ├── CreateMeetingModal.tsx
│               │       └── MeetingHistory.tsx
│               ├── types.ts                  (Updated)
│               ├── constants.ts              (Updated - removed MOCK_SESSIONS)
│               └── page.tsx                  (Updated)
```

## Troubleshooting

### "No active meeting" error
- Check if a meeting was actually started
- Try refreshing the page

### "You are not a member" error
- Verify you're logged in as a group member
- Join the group first if you haven't already

### Meeting link doesn't work
- In placeholder mode, links don't actually work (expected behavior)
- They're meant for testing the UI
- In production with real APIs, links will be functional

## Questions & Support

For issues or questions:
1. Check the API response errors - they're descriptive
2. Review the console logs for details
3. Verify environment variables are set correctly
