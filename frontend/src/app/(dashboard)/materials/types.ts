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
    web_link?: string | null;
    app_link?: string | null;
    meeting_code?: string | null;
    meeting_password?: string | null;
    started_at: string;
    started_by: string;
    started_by_id: string;
    is_active: boolean;
    source?: "manual_link" | "graph_api";
    provider_status?: "success" | "failed" | "expired";
    provider_error?: string | null;
    join_events?: Array<Record<string, unknown>>;
}

export interface MeetingRecord {
    platform: "zoom" | "teams";
    source?: "manual_link" | "graph_api" | null;
    provider_status?: "success" | "failed" | "expired" | null;
    provider_error?: string | null;
    started_at: string;
    ended_at?: string | null;
    duration_minutes?: number | null;
    join_events?: Array<Record<string, unknown>>;
}
