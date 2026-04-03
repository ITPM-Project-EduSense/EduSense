import { MODULE_COLORS } from "./constants";
import type { Group, GroupInvite, GroupMaterial } from "./types";

export function apiGroupToGroup(g: {
    id: string;
    name: string;
    module: string;
    members: number;
    max_members: number;
    schedule: string;
    tags: string[];
    leader_name?: string;
    leader_email?: string;
    is_joined?: boolean;
    can_edit?: boolean;
    active_meeting?: any;
    meeting_history?: any[];
}): Group {
    return {
        id: g.id,
        name: g.name,
        module: g.module,
        moduleColor: MODULE_COLORS[g.module] ?? "#8A8AAA",
        members: g.members,
        max: g.max_members,
        schedule: g.schedule,
        tags: g.tags,
        leaderName: g.leader_name ?? "",
        leaderEmail: g.leader_email ?? "",
        isJoined: Boolean(g.is_joined),
        canEdit: Boolean(g.can_edit),
        activeMeeting: g.active_meeting ?? null,
        meetingHistory: g.meeting_history ?? [],
    };
}

export function apiInviteToInvite(invite: {
    id: string;
    group_id: string;
    group_name: string;
    group_module: string;
    invited_email: string;
    invited_by_name: string;
    status: "pending" | "accepted" | "declined";
    email_sent?: boolean;
    created_at: string;
    responded_at?: string | null;
}): GroupInvite {
    return {
        id: invite.id,
        groupId: invite.group_id,
        groupName: invite.group_name,
        groupModule: invite.group_module,
        invitedEmail: invite.invited_email,
        invitedByName: invite.invited_by_name,
        status: invite.status,
        emailSent: Boolean(invite.email_sent),
        createdAt: invite.created_at,
        respondedAt: invite.responded_at,
    };
}

export function apiMaterialToMaterial(material: {
    id: string;
    filename: string;
    file_type?: string;
    file_size_bytes?: number;
    uploaded_by_name?: string;
    can_delete?: boolean;
    created_at: string;
}): GroupMaterial {
    return {
        id: material.id,
        filename: material.filename,
        fileType: material.file_type || "FILE",
        fileSizeBytes: material.file_size_bytes || 0,
        uploadedByName: material.uploaded_by_name || "Group Member",
        canDelete: Boolean(material.can_delete),
        createdAt: material.created_at,
    };
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${Math.max(1, bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
