"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { API_BASE } from "./constants";
import { apiInviteToInvite, apiMaterialToMaterial } from "./utils";
import type { Group, GroupInvite, GroupMaterial } from "./types";

export function ActivityGraph({ activeGroupsCount }: { activeGroupsCount: number }) {
    const data = [10, 25, 15, 45, 30, 60, 40, 85, 55, 70, 90, 80];
    const points = data.map((val, i) => `${(i * 40)},${100 - val}`).join(" ");

    return (
        <div className="pc-activity-card">
            <div className="pc-activity-header">
                <div className="pc-section-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                    Live Peer Activity
                </div>
                <div className="pc-live-indicator">
                    <span className="pc-live-dot"></span> {activeGroupsCount} Groups Active Now
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
    const [statusFilter, setStatusFilter] = useState("none");
    const [roster, setRoster] = useState<{ full_name: string; email: string }[]>([]);
    const [loadingRoster, setLoadingRoster] = useState(false);

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailsList = email.split(/[,\s;]+/).map(e => e.trim()).filter(e => e !== "");
    const isValidEmail = emailsList.length > 0 && emailsList.every(e => EMAIL_REGEX.test(e));
    const showError = touched && email.trim() !== "" && !isValidEmail;

    const alreadyInvitedEmails = emailsList.filter(e =>
        invites.some(invite => invite.invitedEmail.toLowerCase() === e.toLowerCase() && invite.status === "pending")
    );
    const hasAlreadyInvited = alreadyInvitedEmails.length > 0;

    useEffect(() => {
        let cancelled = false;

        const loadInvites = async () => {
            if (!group.isJoined) {
                setInvites([]);
                setLoadingInvites(false);
                return;
            }
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

    useEffect(() => {
        if (statusFilter !== "roster" || !group.isJoined) return;

        const loadRoster = async () => {
            setLoadingRoster(true);
            try {
                const data = await apiFetch(`/groups/${group.id}/members`);
                setRoster(Array.isArray(data) ? data : []);
            } catch {
                setRoster([]);
            } finally {
                setLoadingRoster(false);
            }
        };
        void loadRoster();
    }, [statusFilter, group.id, group.isJoined]);

    const handleInvite = async () => {
        if (!isValidEmail || hasAlreadyInvited) return;

        setSubmitting(true);
        setSuccessMsg("");
        setErrorMsg("");
        try {
            const data = await apiFetch(`/groups/${group.id}/invites`, {
                method: "POST",
                body: JSON.stringify({ invited_emails: emailsList }),
            });
            const createdInvites = Array.isArray(data) ? data.map(apiInviteToInvite) : [];
            setInvites((prev) => [...createdInvites, ...prev]);

            if (createdInvites.length > 1) {
                setSuccessMsg(`${createdInvites.length} invites sent successfully.`);
            } else if (createdInvites.length === 1) {
                const invite = createdInvites[0];
                setSuccessMsg(
                    invite.emailSent
                        ? `Invite sent to ${invite.invitedEmail}`
                        : `Invite saved for ${invite.invitedEmail}. Email delivery is not available right now.`
                );
            }

            setEmail("");
            setTouched(false);
            setTimeout(() => setSuccessMsg(""), 3500);
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to send invites");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="pc-invite-card">
            <div className="pc-mat-card-title" style={{ background: moduleColor }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M9.5 6A2.5 2.5 0 1 0 7 3.5 2.5 2.5 0 0 0 9.5 6zM2 11.5a5.5 5.5 0 0 1 7.45-5.14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M11 9.5v3M9.5 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                Invite a Member
            </div>

            <div className="pc-invite-input-row">
                <div style={{ flex: 1, position: "relative" }}>
                    <input
                        className="pc-form-input"
                        type="text"
                        placeholder="Enter email addresses (separated by comma)..."
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setTouched(true); setSuccessMsg(""); setErrorMsg(""); }}
                        onKeyDown={(e) => { if (e.key === "Enter") void handleInvite(); }}
                        style={{
                            background: "#F7F7FA",
                            borderColor: showError ? "rgba(239,68,68,0.6)" : hasAlreadyInvited && touched ? "rgba(239,68,68,0.6)" : undefined,
                            paddingRight: "2.4rem",
                        }}
                    />
                    {isValidEmail && !hasAlreadyInvited && (
                        <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#34D399", fontSize: "1rem" }}>✓</span>
                    )}
                </div>
                <button
                    className="pc-invite-btn"
                    style={{ background: moduleColor }}
                    disabled={!isValidEmail || hasAlreadyInvited || submitting}
                    onClick={() => void handleInvite()}
                >
                    {submitting ? "Sending..." : "Send Invites"}
                </button>
            </div>

            {showError && <p className="pc-invite-hint pc-invite-error">Please enter valid email addresses (e.g. name@domain.com)</p>}
            {hasAlreadyInvited && touched && (
                <p className="pc-invite-hint pc-invite-error">
                    {alreadyInvitedEmails.length === 1
                        ? `${alreadyInvitedEmails[0]} already has a pending invite.`
                        : "Some emails already have pending invites."}
                </p>
            )}
            {errorMsg && <p className="pc-invite-hint pc-invite-error">{errorMsg}</p>}
            {successMsg && <p className="pc-invite-hint pc-invite-success">{successMsg}</p>}

            <div className="pc-invited-list">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <p className="pc-invited-list-label" style={{ marginBottom: 0 }}>View Info</p>
                    <select
                        className="pc-status-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            padding: "0.25rem 0.5rem",
                            fontSize: "0.85rem",
                            borderRadius: "0.375rem",
                            border: "1px solid #E5E7EB",
                            background: "#FFF",
                            color: "#374151",
                            outline: "none",
                            cursor: "pointer"
                        }}
                    >
                        <option value="none">Select status...</option>
                        <option value="roster">Group Roster</option>
                        <option value="all">All Invites</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="declined">Declined</option>
                    </select>
                </div>

                {statusFilter === "none" ? (
                    <div className="pc-invite-empty">Select a filter above to view roaster or invitations.</div>
                ) : statusFilter === "roster" ? (
                    loadingRoster ? (
                        <div className="pc-invite-empty">Loading roster...</div>
                    ) : roster.length === 0 ? (
                        <div className="pc-invite-empty">No members found.</div>
                    ) : (
                        roster.map((member, idx) => (
                            <div key={idx} className="pc-invite-row">
                                <div className="pc-invite-row-main">
                                    <div className="pc-invite-row-email">{member.full_name}</div>
                                    <div className="pc-invite-row-meta">{member.email}</div>
                                </div>
                                <span className="pc-invite-status pc-status-accepted">Active</span>
                            </div>
                        ))
                    )
                ) : loadingInvites ? (
                    <div className="pc-invite-empty">Loading invites...</div>
                ) : (
                    (() => {
                        const filtered = invites.filter(i => statusFilter === "all" || i.status === statusFilter);
                        if (filtered.length === 0) {
                            return (
                                <div className="pc-invite-empty">
                                    {statusFilter === "all"
                                        ? "No invites have been sent for this group yet."
                                        : `No ${statusFilter} invites found.`}
                                </div>
                            );
                        }
                        return filtered.map((invite) => (
                            <div key={invite.id} className="pc-invite-row">
                                <div className="pc-invite-row-main">
                                    <div className="pc-invite-row-email">{invite.invitedEmail}</div>
                                    <div className="pc-invite-row-meta">
                                        {invite.emailSent ? "Email sent" : "In-app invite saved"} · {invite.groupModule}
                                    </div>
                                </div>
                                <span className={`pc-invite-status pc-status-${invite.status}`}>{invite.status}</span>
                            </div>
                        ));
                    })()
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
                    <path d="M7 9.5V2M4 5l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 10.5v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
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
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                </div>
                <p className="pc-upload-dropzone-text">
                    <span style={{ fontWeight: 700, color: moduleColor }}>{canUpload ? "Click to upload" : "Members only"}</span> {canUpload ? "or drag & drop" : "can upload files here"}
                </p>
                <p className="pc-upload-dropzone-hint">PDF, DOCX, PPTX · max {MAX_SIZE_MB} MB per file</p>
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

export function ActiveMeetingsCard({ groups }: { groups: Group[] }) {
    const joinedActive = groups.filter(g => g.isJoined && g.activeMeeting);

    if (joinedActive.length === 0) return null;

    return (
        <div className="eds-fade-up" style={{ 
            marginTop: "1.5rem",
            marginBottom: "2rem",
            borderRadius: "1.5rem",
            overflow: "hidden",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            background: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 10px 30px -5px rgba(139, 92, 246, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.5)"
        }}>
            <div style={{ 
                padding: "1.25rem 1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(90deg, rgba(139, 92, 246, 0.05) 0%, transparent 100%)",
                borderBottom: "1px solid rgba(139, 92, 246, 0.1)"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ position: "relative", display: "flex" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22C55E", position: "relative", zIndex: 2 }} />
                        <div style={{ 
                            width: "8px", height: "8px", borderRadius: "50%", background: "#22C55E", 
                            position: "absolute", zIndex: 1, animation: "pc-pulse 2s infinite" 
                        }} />
                        <style>{`
                            @keyframes pc-pulse {
                                0% { transform: scale(1); opacity: 0.8; }
                                100% { transform: scale(3.5); opacity: 0; }
                            }
                        `}</style>
                    </div>
                    <h2 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#5B21B6", letterSpacing: "0.02em", margin: 0 }}>
                        LIVE STUDY SESSIONS
                    </h2>
                </div>
                <div style={{ 
                    fontSize: "0.75rem", fontWeight: 700, color: "#6D28D9", 
                    background: "rgba(139, 92, 246, 0.12)", padding: "0.25rem 0.6rem", 
                    borderRadius: "1rem", letterSpacing: "0.05em" 
                }}>
                    {joinedActive.length} {joinedActive.length === 1 ? "SESSION" : "SESSIONS"}
                </div>
            </div>

            <div style={{ padding: "0.75rem" }}>
                {joinedActive.map((g) => {
                    const meeting = g.activeMeeting!;
                    const startedTime = new Date(meeting.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                        <div key={g.id} style={{ 
                            padding: "1rem",
                            margin: "0.5rem",
                            borderRadius: "1.25rem",
                            background: "white",
                            border: "1px solid rgba(0,0,0,0.03)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "1rem",
                            transition: "all 0.2s ease",
                            boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05)"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: 0 }}>
                                <div style={{ 
                                    width: "48px", height: "48px", borderRadius: "1rem", 
                                    background: `rgba(139, 92, 246, 0.08)`, border: `1px solid rgba(139, 92, 246, 0.15)`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "1.2rem", flexShrink: 0
                                }}>
                                    {meeting.platform === "zoom" ? "📹" : meeting.platform === "google" ? "Ⓜ️" : "👥"}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1E293B", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        {g.name}
                                        <span style={{ 
                                            fontSize: "0.65rem", fontWeight: 800, padding: "2px 6px", 
                                            borderRadius: "4px", background: `rgba(139, 92, 246, 0.1)`, 
                                            color: "#7C3AED", border: `1px solid rgba(139, 92, 246, 0.2)` 
                                        }}>
                                            {g.module}
                                        </span>
                                    </h3>
                                    <p style={{ fontSize: "0.8rem", color: "#64748B", margin: "0.25rem 0 0 0", fontWeight: 500 }}>
                                        Started at <span style={{ color: "#334155", fontWeight: 600 }}>{startedTime}</span> by <span style={{ color: "#334155", fontWeight: 600 }}>{meeting.started_by}</span>
                                    </p>
                                </div>
                            </div>
                            
                            <a 
                                href={meeting.meeting_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ 
                                    textDecoration: "none",
                                    background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                                    color: "white",
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                    padding: "0.75rem 1.25rem",
                                    borderRadius: "1rem",
                                    boxShadow: "0 4px 12px -2px rgba(139, 92, 246, 0.4)",
                                    transition: "all 0.2s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    whiteSpace: "nowrap"
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px -4px rgba(139, 92, 246, 0.5)"; }}
                                onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 12px -2px rgba(139, 92, 246, 0.4)"; }}
                            >
                                Join Session
                                <ArrowRight size={14} />
                            </a>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
