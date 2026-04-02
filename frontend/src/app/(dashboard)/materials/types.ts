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
