"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { API_BASE } from "./constants";
import { apiInviteToInvite, apiMaterialToMaterial } from "./utils";
import type { Group, GroupInvite, GroupMaterial } from "./types";

export function ActivityGraph() {
    const data = [10, 25, 15, 45, 30, 60, 40, 85, 55, 70, 90, 80];
    const points = data.map((val, i) => `${(i * 40)},${100 - val}`).join(" ");

    return (
        <div className="pc-activity-card">
            <div className="pc-activity-header">
                <div className="pc-section-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    Live Peer Activity
                </div>
                <div className="pc-live-indicator">
                    <span className="pc-live-dot"></span> 12 Groups Active Now
                </div>
            </div>
            <div className="pc-graph-container">
                <svg viewBox="0 0 440 100" className="pc-graph-svg">
                    <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <polyline fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
                    <polygon fill="url(#lineGradient)" points={`0,100 ${points} 440,100`} />
                </svg>
                <div className="pc-graph-labels">
                    <span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>Now</span>
                </div>
            </div>
        </div>
    );
}

export function InviteMemberCard({
    group,
    moduleColor,
}: {
    group: Group;
    moduleColor: string;
}) {
    const [email, setEmail] = useState("");
    const [touched, setTouched] = useState(false);
    const [invites, setInvites] = useState<GroupInvite[]>([]);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [loadingInvites, setLoadingInvites] = useState(true);

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();
    const isValidEmail = EMAIL_REGEX.test(normalizedEmail);
    const showError = touched && email.trim() !== "" && !isValidEmail;
    const alreadyInvited = invites.some(
        (invite) => invite.invitedEmail === normalizedEmail && invite.status === "pending"
    );

    useEffect(() => {
        let cancelled = false;

        const loadInvites = async () => {
            setLoadingInvites(true);
            try {
                const data = await apiFetch(`/groups/${group.id}/invites`);
                if (!cancelled) {
                    setInvites(Array.isArray(data) ? data.map(apiInviteToInvite) : []);
                }
            } catch {
                if (!cancelled) {
                    setInvites([]);
                }
            } finally {
                if (!cancelled) {
                    setLoadingInvites(false);
                }
            }
        };

        void loadInvites();
        return () => {
            cancelled = true;
        };
    }, [group.id]);

    const handleInvite = async () => {
        if (!isValidEmail || alreadyInvited) return;

        setSubmitting(true);
        setSuccessMsg("");
        setErrorMsg("");
        try {
            const data = await apiFetch(`/groups/${group.id}/invites`, {
                method: "POST",
                body: JSON.stringify({ invited_email: normalizedEmail }),
            });
            const createdInvite = apiInviteToInvite(data);
            setInvites((prev) => [createdInvite, ...prev]);
            setSuccessMsg(
                createdInvite.emailSent
                    ? `Invite sent to ${createdInvite.invitedEmail}`
                    : `Invite saved for ${createdInvite.invitedEmail}. Email delivery is not available right now.`
            );
            setEmail("");
            setTouched(false);
            setTimeout(() => setSuccessMsg(""), 3500);
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to send invite");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="pc-invite-card">
            <div className="pc-mat-card-title" style={{ background: moduleColor }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M9.5 6A2.5 2.5 0 1 0 7 3.5 2.5 2.5 0 0 0 9.5 6zM2 11.5a5.5 5.5 0 0 1 7.45-5.14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M11 9.5v3M9.5 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Invite a Member
            </div>

            <div className="pc-invite-input-row">
                <div style={{ flex: 1, position: "relative" }}>
                    <input
                        className="pc-form-input"
                        type="email"
                        placeholder="Enter email address..."
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setTouched(true); setSuccessMsg(""); setErrorMsg(""); }}
                        onKeyDown={(e) => { if (e.key === "Enter") void handleInvite(); }}
                        style={{
                            background: "#F7F7FA",
                            borderColor: showError ? "rgba(239,68,68,0.6)" : alreadyInvited && touched ? "rgba(239,68,68,0.6)" : undefined,
                            paddingRight: "2.4rem",
                        }}
                    />
                    {isValidEmail && !alreadyInvited && (
                        <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#34D399", fontSize: "1rem" }}>âœ“</span>
                    )}
                </div>
                <button
                    className="pc-invite-btn"
                    style={{ background: moduleColor }}
                    disabled={!isValidEmail || alreadyInvited || submitting}
                    onClick={() => void handleInvite()}
                >
                    {submitting ? "Sending..." : "Send Invite"}
                </button>
            </div>

            {showError && <p className="pc-invite-hint pc-invite-error">Please enter a valid email address (e.g. name@domain.com)</p>}
            {alreadyInvited && touched && <p className="pc-invite-hint pc-invite-error">This email already has a pending invite for this group.</p>}
            {errorMsg && <p className="pc-invite-hint pc-invite-error">{errorMsg}</p>}
            {successMsg && <p className="pc-invite-hint pc-invite-success">{successMsg}</p>}

            <div className="pc-invited-list">
                <p className="pc-invited-list-label">Invite status</p>
                {loadingInvites ? (
                    <div className="pc-invite-empty">Loading invites...</div>
                ) : invites.length === 0 ? (
                    <div className="pc-invite-empty">No invites have been sent for this group yet.</div>
                ) : (
                    invites.map((invite) => (
                        <div key={invite.id} className="pc-invite-row">
                            <div className="pc-invite-row-main">
                                <div className="pc-invite-row-email">{invite.invitedEmail}</div>
                                <div className="pc-invite-row-meta">
                                    {invite.emailSent ? "Email sent" : "In-app invite saved"} Â· {invite.groupModule}
                                </div>
                            </div>
                            <span className={`pc-invite-status pc-status-${invite.status}`}>{invite.status}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export function IncomingInvitesCard({
    invites,
    acceptingInviteId,
    decliningInviteId,
    onAccept,
    onDecline,
}: {
    invites: GroupInvite[];
    acceptingInviteId: string | null;
    decliningInviteId: string | null;
    onAccept: (invite: GroupInvite) => void;
    onDecline: (invite: GroupInvite) => void;
}) {
    if (invites.length === 0) return null;

    return (
        <section className="pc-incoming-card">
            <div className="pc-section-title" style={{ marginBottom: "1rem" }}>
                Invitations Waiting for You
                <span className="pc-count">{invites.length}</span>
            </div>
            <div className="pc-incoming-list">
                {invites.map((invite) => {
                    const accepting = acceptingInviteId === invite.id;
                    const declining = decliningInviteId === invite.id;
                    return (
                        <div key={invite.id} className="pc-incoming-item">
                            <div className="pc-incoming-copy">
                                <div className="pc-incoming-title">
                                    Join {invite.groupName}
                                    <span className="pc-incoming-module">{invite.groupModule}</span>
                                </div>
                                <div className="pc-incoming-subtitle">
                                    {invite.invitedByName} invited you to this study group.
                                </div>
                            </div>
                            <div className="pc-incoming-actions">
                                <button className="pc-incoming-btn pc-accept" disabled={accepting || declining} onClick={() => onAccept(invite)}>
                                    {accepting ? "Joining..." : "Join"}
                                </button>
                                <button className="pc-incoming-btn pc-decline" disabled={accepting || declining} onClick={() => onDecline(invite)}>
                                    {declining ? "Declining..." : "Decline"}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export function UploadMaterialCard({
    group,
    moduleColor,
    canUpload,
    onUploaded,
}: {
    group: Group;
    moduleColor: string;
    canUpload: boolean;
    onUploaded: (material: GroupMaterial) => void;
}) {
    const [dragOver, setDragOver] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [uploading, setUploading] = useState(false);
    const ACCEPTED_TYPES: Record<string, string> = {
        "application/pdf": "PDF",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
    };
    const MAX_SIZE_MB = 20;

    const processFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        if (!canUpload) {
            setErrorMsg("Only group members can upload study materials.");
            return;
        }
        setErrorMsg("");
        setSuccessMsg("");
        const errors: string[] = [];
        const validFiles: File[] = [];
        Array.from(files).forEach((file) => {
            const fileType = ACCEPTED_TYPES[file.type];
            if (!fileType) {
                errors.push(`"${file.name}" is not a supported file type. Please upload PDF, DOCX, or PPTX files.`);
                return;
            }
            const sizeMB = file.size / (1024 * 1024);
            if (sizeMB > MAX_SIZE_MB) {
                errors.push(`"${file.name}" exceeds the ${MAX_SIZE_MB} MB limit.`);
                return;
            }
            validFiles.push(file);
        });
        if (errors.length > 0) {
            setErrorMsg(errors[0]);
            return;
        }
        if (validFiles.length > 0) {
            setUploading(true);
            try {
                for (const file of validFiles) {
                    const formData = new FormData();
                    formData.append("file", file);
                    const response = await fetch(`${API_BASE}/groups/${group.id}/materials`, {
                        method: "POST",
                        body: formData,
                        credentials: "include",
                    });
                    const data = await response.json().catch(() => ({}));
                    if (!response.ok) throw new Error(data?.detail || "Failed to upload file");
                    onUploaded(apiMaterialToMaterial(data.material));
                }
                setSuccessMsg(`${validFiles.length === 1 ? `"${validFiles[0].name}" uploaded` : `${validFiles.length} files uploaded`} successfully.`);
                setTimeout(() => setSuccessMsg(""), 3500);
            } catch (err: unknown) {
                setErrorMsg(err instanceof Error ? err.message : "Failed to upload file");
            } finally {
                setUploading(false);
            }
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { void processFiles(e.target.files); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        void processFiles(e.dataTransfer.files);
    };

    return (
        <div className="pc-upload-card">
            <div className="pc-mat-card-title" style={{ background: moduleColor }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M7 9.5V2M4 5l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 10.5v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Upload Study Material
            </div>
            <div
                className={`pc-upload-dropzone ${dragOver ? "pc-upload-dropzone-active" : ""}`}
                style={{ borderColor: dragOver ? moduleColor : undefined, background: dragOver ? `${moduleColor}08` : undefined }}
                onDragOver={(e) => { if (canUpload) { e.preventDefault(); setDragOver(true); } }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => canUpload && !uploading && document.getElementById("pc-file-input")?.click()}
            >
                <div className="pc-upload-dropzone-icon" style={{ color: moduleColor }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                </div>
                <p className="pc-upload-dropzone-text">
                    <span style={{ fontWeight: 700, color: moduleColor }}>{canUpload ? "Click to upload" : "Members only"}</span> {canUpload ? "or drag & drop" : "can upload files here"}
                </p>
                <p className="pc-upload-dropzone-hint">PDF, DOCX, PPTX Â· max {MAX_SIZE_MB} MB per file</p>
                <input
                    id="pc-file-input"
                    type="file"
                    accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    multiple
                    style={{ display: "none" }}
                    disabled={!canUpload || uploading}
                    onChange={handleFileInput}
                    onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
                />
            </div>
            {errorMsg && <p className="pc-invite-hint pc-invite-error" style={{ marginTop: "0.55rem" }}>{errorMsg}</p>}
            {successMsg && <p className="pc-invite-hint pc-invite-success" style={{ marginTop: "0.55rem" }}>{successMsg}</p>}
        </div>
    );
}
