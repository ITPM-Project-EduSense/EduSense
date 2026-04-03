export interface Group {
    id: string;
    name: string;
    module: string;
    moduleColor: string;
    members: number;
    max: number;
    schedule: string;
    tags: string[];
    leaderName: string;
    leaderEmail: string;
    isJoined: boolean;
    canEdit: boolean;
    activeMeeting?: ActiveMeeting | null;
    meetingHistory?: MeetingRecord[];
}

export interface GroupInvite {
    id: string;
    groupId: string;
    groupName: string;
    groupModule: string;
    invitedEmail: string;
    invitedByName: string;
    status: "pending" | "accepted" | "declined";
    emailSent: boolean;
    createdAt: string;
    respondedAt?: string | null;
}

export interface GroupMaterial {
    id: string;
    filename: string;
    fileType: string;
    fileSizeBytes: number;
    uploadedByName: string;
    canDelete: boolean;
    createdAt: string;
}

// ── NEW: Meeting Types ──
export interface ActiveMeeting {
    platform: "zoom" | "teams";
    meeting_link: string;
    meeting_code?: string | null;
    meeting_password?: string | null;
    started_at: string;
    started_by: string;
    started_by_id: string;
    is_active: boolean;
}

export interface MeetingRecord {
    platform: "zoom" | "teams";
    started_at: string;
    ended_at?: string | null;
    duration_minutes?: number | null;
}
