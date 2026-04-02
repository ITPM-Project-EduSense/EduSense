"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

const MOCK_SESSIONS: Record<string, { label: string; url: string; platform: string }[]> = {
    default: [
        { label: "Weekly Zoom Call", url: "#", platform: "Zoom" },
        { label: "Discord Study Voice", url: "#", platform: "Discord" },
    ],
    CS2040: [
        { label: "Monday Review — Zoom", url: "#", platform: "Zoom" },
        { label: "Problem-Set Discord VC", url: "#", platform: "Discord" },
        { label: "Friday Deep Dive — Google Meet", url: "#", platform: "Meet" },
    ],
    MA1101: [
        { label: "Tuesday Matrix Session — Zoom", url: "#", platform: "Zoom" },
        { label: "Office Hours — Google Meet", url: "#", platform: "Meet" },
    ],
    CS3230: [
        { label: "Algo Sprint — Discord", url: "#", platform: "Discord" },
        { label: "Mock Contest — Zoom", url: "#", platform: "Zoom" },
    ],
    ST2334: [
        { label: "Sunday Probability Clinic — Zoom", url: "#", platform: "Zoom" },
    ],
    CS2103: [
        { label: "Sprint Planning — Teams", url: "#", platform: "Teams" },
        { label: "Code Review VC — Discord", url: "#", platform: "Discord" },
    ],
    IS3103: [
        { label: "Case Study Session — Google Meet", url: "#", platform: "Meet" },
    ],
};

const MOCK_MATERIALS: Record<string, { title: string; type: string; size: string }[]> = {
    default: [
        { title: "Group Notes.pdf", type: "PDF", size: "1.2 MB" },
        { title: "Practice Problems.docx", type: "DOCX", size: "340 KB" },
    ],
    CS2040: [
        { title: "Week 3 — Trees & Heaps.pdf", type: "PDF", size: "2.1 MB" },
        { title: "Cheat Sheet — Sorting.pdf", type: "PDF", size: "480 KB" },
        { title: "LeetCode List.docx", type: "DOCX", size: "120 KB" },
    ],
    MA1101: [
        { title: "Linear Algebra Summary.pdf", type: "PDF", size: "1.8 MB" },
        { title: "Eigenvectors Practice.pdf", type: "PDF", size: "560 KB" },
    ],
    CS3230: [
        { title: "DP Patterns.pdf", type: "PDF", size: "900 KB" },
        { title: "Graph Algorithms Notes.pdf", type: "PDF", size: "1.4 MB" },
        { title: "Past Year Solutions.pptx", type: "PPTX", size: "3.2 MB" },
    ],
    ST2334: [
        { title: "Probability Formula.pdf", type: "PDF", size: "640 KB" },
        { title: "Tutorial Solutions Week 5.pdf", type: "PDF", size: "770 KB" },
    ],
    CS2103: [
        { title: "AB3 UML Diagrams.pptx", type: "PPTX", size: "2.6 MB" },
        { title: "Git Workflow Guide.pdf", type: "PDF", size: "310 KB" },
    ],
    IS3103: [
        { title: "IS Strategy Framework.pdf", type: "PDF", size: "1.1 MB" },
        { title: "Case Study — DBS Bank.docx", type: "DOCX", size: "450 KB" },
    ],
};

const PLATFORM_COLORS: Record<string, string> = {
    Zoom: "#2D8CFF",
    Discord: "#5865F2",
    Meet: "#34A853",
    Teams: "#464EB8",
};

const FILE_TYPE_COLORS: Record<string, string> = {
    PDF: "#EF4444",
    DOCX: "#3B82F6",
    PPTX: "#F59E0B",
};

const MODULE_COLORS: Record<string, string> = {
    CS2040: "#FF6B35",
    MA1101: "#4ECDC4",
    CS3230: "#A78BFA",
    ST2334: "#F59E0B",
    CS2103: "#34D399",
    IS3103: "#F472B6",
};

const modules = [
    { code: "CS2040", name: "Data Structures", color: "#FF6B35", members: 24 },
    { code: "MA1101", name: "Linear Algebra", color: "#4ECDC4", members: 18 },
    { code: "CS3230", name: "Algorithms", color: "#A78BFA", members: 31 },
    { code: "ST2334", name: "Probability", color: "#F59E0B", members: 15 },
    { code: "CS2103", name: "Software Eng.", color: "#34D399", members: 42 },
    { code: "IS3103", name: "Info Systems", color: "#F472B6", members: 11 },
];

interface Group {
    id: string;
    name: string;
    module: string;
    moduleColor: string;
    members: number;
    max: number;
    schedule: string;
    tags: string[];
    isJoined: boolean;
}

function apiGroupToGroup(g: {
    id: string;
    name: string;
    module: string;
    members: number;
    max_members: number;
    schedule: string;
    tags: string[];
    is_joined?: boolean;
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
        isJoined: Boolean(g.is_joined),
    };
}

// --- NEW COMPONENT FOR ACTIVE STATUS GRAPH ---
function ActivityGraph() {
    const data = [10, 25, 15, 45, 30, 60, 40, 85, 55, 70, 90, 80]; // Mock points
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

// ── NEW: Invite Member Component ──
function InviteMemberCard({ moduleColor }: { moduleColor: string }) {
    const [email, setEmail] = useState("");
    const [touched, setTouched] = useState(false);
    const [invitedList, setInvitedList] = useState<string[]>([]);
    const [successMsg, setSuccessMsg] = useState("");

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = EMAIL_REGEX.test(email.trim());
    const showError = touched && email.trim() !== "" && !isValidEmail;
    const alreadyInvited = invitedList.includes(email.trim().toLowerCase());

    const handleInvite = () => {
        if (!isValidEmail || alreadyInvited) return;
        setInvitedList((prev) => [...prev, email.trim().toLowerCase()]);
        setSuccessMsg(`Invite sent to ${email.trim()}`);
        setEmail("");
        setTouched(false);
        setTimeout(() => setSuccessMsg(""), 3000);
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
                        onChange={(e) => { setEmail(e.target.value); setTouched(true); setSuccessMsg(""); }}
                        onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }}
                        style={{
                            background: "#F7F7FA",
                            borderColor: showError ? "rgba(239,68,68,0.6)" : alreadyInvited && touched ? "rgba(239,68,68,0.6)" : undefined,
                            paddingRight: "2.4rem",
                        }}
                    />
                    {isValidEmail && !alreadyInvited && (
                        <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#34D399", fontSize: "1rem" }}>✓</span>
                    )}
                </div>
                <button
                    className="pc-invite-btn"
                    style={{ background: moduleColor }}
                    disabled={!isValidEmail || alreadyInvited}
                    onClick={handleInvite}
                >
                    Send Invite
                </button>
            </div>

            {showError && (
                <p className="pc-invite-hint pc-invite-error">Please enter a valid email address (e.g. name@domain.com)</p>
            )}
            {alreadyInvited && touched && (
                <p className="pc-invite-hint pc-invite-error">This email has already been invited.</p>
            )}
            {successMsg && (
                <p className="pc-invite-hint pc-invite-success">{successMsg}</p>
            )}

            {invitedList.length > 0 && (
                <div className="pc-invited-list">
                    <p className="pc-invited-list-label">Pending invites</p>
                    {invitedList.map((e) => (
                        <div key={e} className="pc-invited-chip">
                            <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            {e}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── NEW: Upload Study Material Component ──
interface UploadedFile {
    name: string;
    size: string;
    type: string;
}

function UploadMaterialCard({ moduleColor }: { moduleColor: string }) {
    const [dragOver, setDragOver] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const ACCEPTED_TYPES: Record<string, string> = {
        "application/pdf": "PDF",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
    };

    const MAX_SIZE_MB = 20;

    const formatSize = (bytes: number): string => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const processFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setErrorMsg("");
        setSuccessMsg("");
        const newFiles: UploadedFile[] = [];
        const errors: string[] = [];

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
            const alreadyExists = uploadedFiles.some((f) => f.name === file.name);
            if (alreadyExists) {
                errors.push(`"${file.name}" has already been uploaded.`);
                return;
            }
            newFiles.push({ name: file.name, size: formatSize(file.size), type: fileType });
        });

        if (errors.length > 0) {
            setErrorMsg(errors[0]);
            return;
        }
        if (newFiles.length > 0) {
            setUploadedFiles((prev) => [...prev, ...newFiles]);
            setSuccessMsg(`${newFiles.length === 1 ? `"${newFiles[0].name}" uploaded` : `${newFiles.length} files uploaded`} successfully.`);
            setTimeout(() => setSuccessMsg(""), 3500);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => processFiles(e.target.files);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        processFiles(e.dataTransfer.files);
    };

    const handleRemove = (fileName: string) => {
        setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName));
    };

    const FILE_BADGE_COLORS: Record<string, string> = { PDF: "#EF4444", DOCX: "#3B82F6", PPTX: "#F59E0B" };

    return (
        <div className="pc-upload-card">
            <div className="pc-mat-card-title" style={{ background: moduleColor }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M7 9.5V2M4 5l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 10.5v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Upload Study Material
            </div>

            {/* Drop zone */}
            <div
                className={`pc-upload-dropzone ${dragOver ? "pc-upload-dropzone-active" : ""}`}
                style={{ borderColor: dragOver ? moduleColor : undefined, background: dragOver ? `${moduleColor}08` : undefined }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("pc-file-input")?.click()}
            >
                <div className="pc-upload-dropzone-icon" style={{ color: moduleColor }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                </div>
                <p className="pc-upload-dropzone-text">
                    <span style={{ fontWeight: 700, color: moduleColor }}>Click to upload</span> or drag & drop
                </p>
                <p className="pc-upload-dropzone-hint">PDF, DOCX, PPTX · max {MAX_SIZE_MB} MB per file</p>
                <input
                    id="pc-file-input"
                    type="file"
                    accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleFileInput}
                    onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
                />
            </div>

            {/* Feedback messages */}
            {errorMsg && <p className="pc-invite-hint pc-invite-error" style={{ marginTop: "0.55rem" }}>{errorMsg}</p>}
            {successMsg && <p className="pc-invite-hint pc-invite-success" style={{ marginTop: "0.55rem" }}>{successMsg}</p>}

            {/* Uploaded files list */}
            {uploadedFiles.length > 0 && (
                <div className="pc-upload-file-list">
                    <p className="pc-invited-list-label">Uploaded files</p>
                    {uploadedFiles.map((f) => (
                        <div key={f.name} className="pc-upload-file-row">
                            <div className="pc-material-type-badge" style={{ background: FILE_BADGE_COLORS[f.type] ?? "#8A8AAA", width: 32, height: 32, fontSize: "0.52rem" }}>{f.type}</div>
                            <div className="pc-material-info">
                                <div className="pc-material-title">{f.name}</div>
                                <div className="pc-material-size">{f.size}</div>
                            </div>
                            <button
                                className="pc-upload-remove-btn"
                                onClick={() => handleRemove(f.name)}
                                title="Remove file"
                            >
                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PeerConnectHome() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    const [groupName, setGroupName] = useState("");
    const [groupModule, setGroupModule] = useState("");
    const [groupSchedule, setGroupSchedule] = useState("");
    const [groupMax, setGroupMax] = useState("6");
    const [groupTags, setGroupTags] = useState("");
    // ── NEW: group leader name state ──
    const [groupLeader, setGroupLeader] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    // ── NEW: derived flag — all required fields filled ──
    const isFormValid =
        groupName.trim() !== "" &&
        groupModule !== "" &&
        groupSchedule.trim() !== "" &&
        groupLeader.trim() !== "";

    const [joiningId, setJoiningId] = useState<string | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await apiFetch("/groups/");
                setGroups(data.map(apiGroupToGroup));
            } catch {
                // silently fall back to empty list
            } finally {
                setLoadingGroups(false);
            }
        })();
    }, []);

    const filteredGroups = groups.filter((g) => {
        const q = searchQuery.toLowerCase();
        return (activeFilter === "All" || g.module === activeFilter) &&
            (!q || g.name.toLowerCase().includes(q) || g.module.toLowerCase().includes(q) || g.tags.some(t => t.toLowerCase().includes(q)));
    });

    const handleCreate = async () => {
        if (!groupName.trim() || !groupModule || !groupSchedule.trim()) {
            setCreateError("Please fill in all required fields.");
            return;
        }
        const maxVal = parseInt(groupMax);
        if (isNaN(maxVal) || maxVal < 2 || maxVal > 10) {
            setCreateError("Max members must be between 2 and 10.");
            return;
        }
        setCreating(true);
        setCreateError("");
        try {
            const tags = groupTags.split(",").map((t) => t.trim()).filter(Boolean);
            const data = await apiFetch("/groups/", {
                method: "POST",
                body: JSON.stringify({
                    name: groupName.trim(),
                    module: groupModule,
                    schedule: groupSchedule.trim(),
                    max_members: maxVal,
                    tags,
                }),
            });
            const newGroup = apiGroupToGroup(data);
            setGroups((prev) => [newGroup, ...prev]);
            setSelectedGroup(newGroup);
            setShowCreateModal(false);
            setGroupName(""); setGroupModule(""); setGroupSchedule(""); setGroupMax("6"); setGroupTags("");
            // ── NEW: reset leader field on success ──
            setGroupLeader("");
        } catch (err: unknown) {
            setCreateError(err instanceof Error ? err.message : "Failed to create group");
        } finally {
            setCreating(false);
        }
    };

    const handleJoin = async (groupId: string) => {
        const currentGroup = groups.find((g) => g.id === groupId) ?? (selectedGroup?.id === groupId ? selectedGroup : null);
        if (!currentGroup) return;

        const isJoined = currentGroup.isJoined;
        setJoiningId(groupId);
        try {
            const data = await apiFetch(`/groups/${groupId}/${isJoined ? "leave" : "join"}`, { method: "POST" });
            const updated = apiGroupToGroup(data);
            setGroups((prev) => prev.map((g) => (g.id === groupId ? updated : g)));
            setSelectedGroup((prev) => prev?.id === groupId ? updated : prev);
        } catch {
            // keep previous UI state on failure
        } finally {
            setJoiningId(null);
        }
    };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .pc-wrap {
          width: 100%;
          background: #FFFFFF;
        }

        .pc-main {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2.5rem 2rem 6rem;
        }

        .pc-hero { margin-bottom: 2.5rem; }
        .pc-hero-label {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(37,99,235,0.10);
          border: 1px solid rgba(37,99,235,0.22);
          border-radius: 100px;
          padding: 0.3rem 0.9rem;
          font-size: 0.73rem;
          font-weight: 600;
          color: #2563EB;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 1.25rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .pc-hero-label::before {
          content: '';
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #2563EB;
          animation: pc-pulse 2s ease-in-out infinite;
        }
        @keyframes pc-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
        .pc-wrap h1 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 800;
          font-size: clamp(1.8rem, 4vw, 3rem);
          line-height: 1.1;
          letter-spacing: -0.025em;
          margin-bottom: 0.9rem;
          color: #1E40AF;
        }
        .pc-wrap h1 em {
          font-style: normal;
          color: #ffffff;
          background: #2563EB;
          padding: 0 0.25em;
          border-radius: 6px;
        }
        .pc-hero p {
          font-size: 0.95rem;
          color: #5A5A72;
          max-width: 440px;
          line-height: 1.7;
          font-weight: 400;
          font-family: 'DM Sans', sans-serif;
        }

        .pc-create-btn {
          margin-top: 1.75rem;
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          background: #2563EB;
          color: #ffffff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 0.88rem;
          padding: 0.75rem 1.75rem;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .pc-create-btn:hover {
          background: #1D4ED8;
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(37,99,235,0.3);
        }

        /* --- GRAPH STYLES --- */
        .pc-activity-card {
            background: #d2dff7;
            border-radius: 18px;
            padding: 1.5rem;
            margin-bottom: 3rem;
            border: 1px solid rgba(96, 125, 173, 0.28);
            box-shadow: 0 6px 22px rgba(15,23,42,0.08);
        }
        .pc-activity-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        .pc-live-indicator {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 0.75rem;
            font-weight: 700;
            color: #166534;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(255,255,255,0.45);
            border: 1px solid rgba(22,101,52,0.12);
            padding: 0.4rem 0.8rem;
            border-radius: 100px;
        }
        .pc-live-dot {
            width: 6px; height: 6px;
            background: #34A853;
            border-radius: 50%;
            animation: pc-pulse 1.5s infinite;
        }
        .pc-graph-container { width: 100%; position: relative; }
        .pc-graph-svg { width: 100%; height: 80px; filter: drop-shadow(0 4px 4px rgba(37, 99, 237, 0.1)); }
        .pc-graph-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 0.75rem;
            font-size: 0.65rem;
            color: #475569;
            font-family: 'DM Sans', sans-serif;
            padding: 0 5px;
        }

        .pc-section-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: -0.01em;
          margin-bottom: 0;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          color: #1E3A8A;
        }
        /* (Remaining styles unchanged below) */
        .pc-count {
          background: rgba(255,255,255,0.42);
          border: 1px solid rgba(96, 125, 173, 0.18);
          border-radius: 100px;
          padding: 0.12rem 0.55rem;
          font-size: 0.7rem;
          font-weight: 600;
          color: #334155;
          font-family: 'DM Sans', sans-serif;
        }

        .pc-modules-section { margin-bottom: 3rem; }
        .pc-modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
          gap: 0.7rem;
        }
        .pc-module-card {
          background: #FFFFFF;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 13px;
          padding: 1rem 1.15rem;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .pc-module-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--card-color);
          opacity: 0;
          transition: opacity 0.2s ease;
          border-radius: 13px;
        }
        .pc-module-card:hover::before,
        .pc-module-card.pc-active::before { opacity: 0.08; }
        .pc-module-card.pc-active { border-color: var(--card-color); }
        .pc-module-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--card-color);
          margin-bottom: 0.65rem;
        }
        .pc-module-code {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 0.82rem;
          color: var(--card-color);
          margin-bottom: 0.2rem;
        }
        .pc-module-name {
          font-size: 0.75rem;
          color: #5A5A72;
          font-weight: 400;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: 'DM Sans', sans-serif;
        }
        .pc-module-members {
          margin-top: 0.65rem;
          font-size: 0.7rem;
          color: #8A8AAA;
          font-family: 'DM Sans', sans-serif;
        }

        .pc-section-divider { height: 1px; background: rgba(0,0,0,0.08); margin: 2.5rem 0; }

        .pc-filter-bar { display: flex; gap: 0.45rem; margin-bottom: 1.35rem; flex-wrap: wrap; }
        .pc-filter-chip {
          padding: 0.35rem 0.9rem;
          border-radius: 100px;
          border: 1px solid rgba(148,163,184,0.24);
          background: #FFFFFF;
          color: #475569;
          font-size: 0.75rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .pc-filter-chip:hover { border-color: rgba(59,130,246,0.28); background: #F8FAFC; color: #1E293B; }
        .pc-filter-chip.pc-active { background: #EFF6FF; border-color: rgba(59,130,246,0.30); color: #2563EB; }

        .pc-groups-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 0.9rem;
        }
        .pc-group-card {
          background: #d2dff7;
          border: 1px solid rgba(96, 125, 173, 0.28);
          border-radius: 15px;
          padding: 1.25rem;
          transition: all 0.2s ease;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(15,23,42,0.07);
        }
        .pc-group-card:hover { border-color: rgba(96, 125, 173, 0.42); transform: translateY(-2px); box-shadow: 0 12px 24px rgba(15,23,42,0.10); }
        .pc-group-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.85rem; }
        .pc-group-module-badge {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.25rem 0.65rem; border-radius: 100px;
          font-size: 0.68rem; font-weight: 600;
          font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: 0.03em;
        }
        .pc-group-name { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.92rem; margin-bottom: 0.4rem; letter-spacing: -0.01em; color: #1E3A8A; }
        .pc-group-schedule { font-size: 0.76rem; color: #334155; margin-bottom: 0.85rem; display: flex; align-items: center; gap: 0.4rem; font-family: 'DM Sans', sans-serif; }
        .pc-group-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 1.1rem; }
        .pc-tag { padding: 0.18rem 0.6rem; background: rgba(255,255,255,0.52); border: 1px solid rgba(96, 125, 173, 0.18); border-radius: 100px; font-size: 0.68rem; color: #334155; font-weight: 500; font-family: 'DM Sans', sans-serif; }
        .pc-group-footer { display: flex; align-items: center; justify-content: space-between; }
        .pc-member-bar-wrap { flex: 1; margin-right: 1rem; }
        .pc-member-bar-label { font-size: 0.68rem; color: #475569; margin-bottom: 0.3rem; font-family: 'DM Sans', sans-serif; }
        .pc-member-bar { height: 3px; background: rgba(255,255,255,0.65); border-radius: 100px; overflow: hidden; }
        .pc-member-bar-fill { height: 100%; border-radius: 100px; transition: width 0.4s ease; }
        .pc-join-btn { padding: 0.45rem 1.1rem; border-radius: 8px; border: none; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.75rem; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }
        .pc-join-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .pc-join-btn.pc-default { background: #FFFFFF; color: #334155; border: 1px solid rgba(148,163,184,0.24); }
        .pc-join-btn.pc-default:hover:not(:disabled) { background: #F8FAFC; border-color: rgba(59,130,246,0.22); color: #1E293B; }
        .pc-join-btn.pc-joined { background: #ECFDF5; color: #059669; border: 1px solid rgba(16,185,129,0.24); }

        .pc-empty-state { grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; color: #334155; font-size: 0.9rem; font-family: 'DM Sans', sans-serif; }

        .pc-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          z-index: 200;
          display: flex; align-items: center; justify-content: center;
          padding: 1.5rem;
          animation: pc-fadeIn 0.2s ease;
        }
        @keyframes pc-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .pc-modal {
          background: #FFFFFF; border: 1px solid rgba(148,163,184,0.22); border-radius: 18px;
          padding: 1.75rem; width: 100%; max-width: 420px;
          animation: pc-slideUp 0.25s ease; box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }
        @keyframes pc-slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .pc-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .pc-modal-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 1.15rem; letter-spacing: -0.02em; color: #1E40AF; }
        .pc-modal-close { width: 30px; height: 30px; border-radius: 7px; background: rgba(0,0,0,0.06); border: none; cursor: pointer; color: #6B6B8A; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .pc-modal-close:hover { background: rgba(0,0,0,0.11); color: #1A1A2E; }
        .pc-form-group { margin-bottom: 1.1rem; }
        .pc-form-label { display: block; font-size: 0.72rem; font-weight: 600; color: #6B6B8A; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.4rem; font-family: 'Plus Jakarta Sans', sans-serif; }
        .pc-form-input, .pc-form-select { width: 100%; background: #F8FAFC; border: 1px solid rgba(148,163,184,0.24); border-radius: 9px; padding: 0.65rem 0.9rem; color: #1A1A2E; font-size: 0.85rem; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.15s, box-shadow 0.15s, background-color 0.15s; }
        .pc-form-input:focus, .pc-form-select:focus { border-color: rgba(59,130,246,0.45); background: #FFFFFF; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .pc-form-select option { background: #FFFFFF; color: #1A1A2E; }
        .pc-form-hint { margin-top: 0.3rem; font-size: 0.72rem; color: #9A9AB0; font-family: 'DM Sans', sans-serif; }
        .pc-form-error { margin-top: 0.65rem; padding: 0.55rem 0.85rem; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); border-radius: 7px; color: #EF4444; font-size: 0.78rem; font-family: 'DM Sans', sans-serif; }
        .pc-modal-submit { width: 100%; padding: 0.78rem; background: #2563EB; color: #ffffff; border: none; border-radius: 10px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: all 0.2s ease; margin-top: 0.4rem; box-shadow: 0 8px 20px rgba(37,99,235,0.18); }
        .pc-modal-submit:hover:not(:disabled) { background: #1D4ED8; box-shadow: 0 10px 24px rgba(37,99,235,0.22); }
        .pc-modal-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        /* DETAIL VIEW */
        .pc-back-btn { display: inline-flex; align-items: center; gap: 0.45rem; background: rgba(255,255,255,0.48); border: 1px solid rgba(96, 125, 173, 0.24); border-radius: 9px; padding: 0.48rem 1rem; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; font-size: 0.8rem; color: #334155; cursor: pointer; transition: all 0.15s ease; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(15,23,42,0.06); }
        .pc-back-btn:hover { background: rgba(255,255,255,0.72); color: #1E293B; border-color: rgba(96, 125, 173, 0.32); }

        .pc-mat-group-hero { background: #d2dff7; border: 1px solid rgba(96, 125, 173, 0.28); border-radius: 18px; padding: 1.75rem 2rem; margin-bottom: 2rem; box-shadow: 0 6px 22px rgba(15,23,42,0.08); display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap; }
        .pc-mat-group-hero-left { flex: 1; min-width: 0; }
        .pc-mat-group-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 1.5rem; letter-spacing: -0.025em; color: #1E3A8A; margin-bottom: 0.65rem; }
        .pc-mat-group-meta { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; margin-bottom: 0.85rem; }
        .pc-mat-module-badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.7rem; border-radius: 100px; font-size: 0.7rem; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: 0.03em; }
        .pc-mat-schedule { font-size: 0.8rem; color: #334155; display: flex; align-items: center; gap: 0.4rem; font-family: 'DM Sans', sans-serif; }
        .pc-mat-members-text { font-size: 0.77rem; color: #475569; font-family: 'DM Sans', sans-serif; }
        .pc-mat-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .pc-mat-join-btn { padding: 0.65rem 1.5rem; border-radius: 10px; border: none; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; display: flex; align-items: center; gap: 0.5rem; align-self: flex-start; }
        .pc-mat-join-btn.pc-not-joined { background: #2563EB; color: #ffffff; box-shadow: 0 8px 20px rgba(37,99,235,0.18); }
        .pc-mat-join-btn.pc-not-joined:hover:not(:disabled) { background: #1D4ED8; box-shadow: 0 10px 24px rgba(37,99,235,0.22); }
        .pc-mat-join-btn.pc-is-joined { background: #ECFDF5; color: #059669; border: 1px solid rgba(16,185,129,0.24); }
        .pc-mat-join-btn.pc-is-joined:hover:not(:disabled) { background: #D1FAE5; }
        .pc-mat-join-btn.pc-is-full { background: #F8FAFC; color: #94A3B8; border: 1px solid rgba(148,163,184,0.18); cursor: not-allowed; }
        .pc-mat-join-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .pc-mat-content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.35rem; }
        @media (max-width: 640px) { .pc-mat-content-grid { grid-template-columns: 1fr; } }
        .pc-mat-card { background: #d2dff7; border: 1px solid rgba(96, 125, 173, 0.28); border-radius: 16px; padding: 1.35rem; box-shadow: 0 4px 14px rgba(15,23,42,0.07); }
        .pc-mat-card-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: #ffffff; background: #2563EB; display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.28rem 0.75rem; border-radius: 100px; margin-bottom: 1rem; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12); }
        .pc-session-list { display: flex; flex-direction: column; gap: 0.55rem; }
        .pc-session-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0.9rem; background: rgba(255,255,255,0.5); border: 1px solid rgba(96, 125, 173, 0.20); border-radius: 11px; text-decoration: none; transition: all 0.15s ease; cursor: pointer; }
        .pc-session-item:hover { background: rgba(255,255,255,0.72); border-color: rgba(96, 125, 173, 0.30); transform: translateX(2px); }
        .pc-session-platform-dot { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.6rem; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; color: #fff; }
        .pc-session-label { flex: 1; font-size: 0.82rem; font-weight: 500; color: #1E293B; font-family: 'DM Sans', sans-serif; }
        .pc-session-arrow { color: #475569; font-size: 0.95rem; }
        .pc-material-list { display: flex; flex-direction: column; gap: 0.55rem; }
        .pc-material-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0.9rem; background: rgba(255,255,255,0.5); border: 1px solid rgba(96, 125, 173, 0.20); border-radius: 11px; cursor: pointer; transition: all 0.15s ease; }
        .pc-material-item:hover { background: rgba(255,255,255,0.72); border-color: rgba(96, 125, 173, 0.30); transform: translateX(2px); }
        .pc-material-type-badge { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.56rem; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; color: #fff; }
        .pc-material-info { flex: 1; min-width: 0; }
        .pc-material-title { font-size: 0.82rem; font-weight: 500; color: #1E293B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'DM Sans', sans-serif; }
        .pc-material-size { font-size: 0.7rem; color: #475569; margin-top: 0.12rem; font-family: 'DM Sans', sans-serif; }
        .pc-material-dl { color: #475569; font-size: 0.95rem; }

        /* ── NEW: Invite card styles ── */
        .pc-invite-card { background: #d2dff7; border: 1px solid rgba(96, 125, 173, 0.28); border-radius: 16px; padding: 1.35rem; box-shadow: 0 4px 14px rgba(15,23,42,0.07); margin-top: 1.35rem; }
        .pc-invite-input-row { display: flex; gap: 0.65rem; align-items: flex-start; }
        .pc-invite-btn { padding: 0.65rem 1.15rem; border-radius: 9px; border: none; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.78rem; color: #ffffff; cursor: pointer; white-space: nowrap; transition: all 0.15s ease; opacity: 1; flex-shrink: 0; box-shadow: 0 8px 20px rgba(15,23,42,0.10); }
        .pc-invite-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .pc-invite-btn:not(:disabled):hover { filter: brightness(1.04); transform: translateY(-1px); box-shadow: 0 10px 24px rgba(15,23,42,0.14); }
        .pc-invite-hint { font-size: 0.72rem; font-family: 'DM Sans', sans-serif; margin-top: 0.45rem; }
        .pc-invite-error { color: #EF4444; }
        .pc-invite-success { color: #34A853; }
        .pc-invited-list { margin-top: 1rem; border-top: 1px solid rgba(96, 125, 173, 0.20); padding-top: 0.9rem; display: flex; flex-direction: column; gap: 0.4rem; }
        .pc-invited-list-label { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #475569; font-family: 'Plus Jakarta Sans', sans-serif; margin-bottom: 0.35rem; }
        .pc-invited-chip { display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.78rem; font-family: 'DM Sans', sans-serif; color: #059669; background: #ECFDF5; border: 1px solid rgba(16,185,129,0.20); border-radius: 100px; padding: 0.28rem 0.75rem; width: fit-content; }

        /* ── NEW: Upload card styles ── */
        .pc-upload-card { background: #d2dff7; border: 1px solid rgba(96, 125, 173, 0.28); border-radius: 16px; padding: 1.35rem; box-shadow: 0 4px 14px rgba(15,23,42,0.07); margin-top: 1.35rem; }
        .pc-upload-dropzone { border: 2px dashed rgba(96, 125, 173, 0.28); border-radius: 12px; padding: 2rem 1rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s ease; user-select: none; background: rgba(255,255,255,0.5); }
        .pc-upload-dropzone:hover { border-color: rgba(96, 125, 173, 0.40); background: rgba(255,255,255,0.72); }
        .pc-upload-dropzone-active { border-style: solid !important; }
        .pc-upload-dropzone-icon { margin-bottom: 0.25rem; opacity: 0.85; }
        .pc-upload-dropzone-text { font-size: 0.85rem; font-family: 'DM Sans', sans-serif; color: #334155; margin: 0; text-align: center; }
        .pc-upload-dropzone-hint { font-size: 0.72rem; color: #475569; font-family: 'DM Sans', sans-serif; margin: 0; text-align: center; }
        .pc-upload-file-list { margin-top: 1rem; border-top: 1px solid rgba(96, 125, 173, 0.20); padding-top: 0.9rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .pc-upload-file-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 0.85rem; background: rgba(255,255,255,0.5); border: 1px solid rgba(96, 125, 173, 0.20); border-radius: 11px; }
        .pc-upload-remove-btn { width: 26px; height: 26px; border-radius: 7px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.18); color: #EF4444; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: all 0.15s ease; }
        .pc-upload-remove-btn:hover { background: rgba(239,68,68,0.16); border-color: rgba(239,68,68,0.35); }
      `}</style>

            {/* ── DETAIL VIEW ── */}
            {selectedGroup ? (() => {
                const sessions = MOCK_SESSIONS[selectedGroup.module] ?? MOCK_SESSIONS.default;
                const materials = MOCK_MATERIALS[selectedGroup.module] ?? MOCK_MATERIALS.default;
                const isJoined = selectedGroup.isJoined;
                const isFull = selectedGroup.members >= selectedGroup.max && !isJoined;
                const isLoading = joiningId === selectedGroup.id;
                return (
                    <div className="pc-wrap">
                        <div className="pc-main">
                            <button className="pc-back-btn" onClick={() => setSelectedGroup(null)}>
                                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                                    <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Back to Groups
                            </button>
                            <div className="pc-mat-group-hero">
                                <div className="pc-mat-group-hero-left">
                                    <div className="pc-mat-group-title">{selectedGroup.name}</div>
                                    <div className="pc-mat-group-meta">
                                        <div className="pc-mat-module-badge" style={{ background: `${selectedGroup.moduleColor}18`, color: selectedGroup.moduleColor, border: `1px solid ${selectedGroup.moduleColor}35` }}>
                                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: selectedGroup.moduleColor, display: "inline-block" }} />
                                            {selectedGroup.module}
                                        </div>
                                        <div className="pc-mat-schedule">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" /><path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                                            {selectedGroup.schedule}
                                        </div>
                                        <div className="pc-mat-members-text">{selectedGroup.members}/{selectedGroup.max} members</div>
                                    </div>
                                    {selectedGroup.tags.length > 0 && (
                                        <div className="pc-mat-tags">{selectedGroup.tags.map((t) => <span key={t} className="pc-tag">{t}</span>)}</div>
                                    )}
                                </div>
                                <button
                                    className={`pc-mat-join-btn ${isFull ? "pc-is-full" : isJoined ? "pc-is-joined" : "pc-not-joined"}`}
                                    disabled={isLoading || isFull}
                                    onClick={() => handleJoin(selectedGroup.id)}
                                >
                                    {isLoading ? "…" : isJoined ? "✓ Joined — Leave" : isFull ? "Group is full" : (<><svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>Join group</>)}
                                </button>
                            </div>
                            <div className="pc-mat-content-grid">
                                <div className="pc-mat-card">
                                    <div className="pc-mat-card-title">
                                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM7 4v3.5l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        Session Links
                                    </div>
                                    <div className="pc-session-list">
                                        {sessions.map((s, i) => (
                                            <a key={i} className="pc-session-item" href={s.url} target="_blank" rel="noreferrer">
                                                <div className="pc-session-platform-dot" style={{ background: PLATFORM_COLORS[s.platform] ?? "#8A8AAA" }}>{s.platform.slice(0, 2).toUpperCase()}</div>
                                                <span className="pc-session-label">{s.label}</span>
                                                <span className="pc-session-arrow">↗</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                                <div className="pc-mat-card">
                                    <div className="pc-mat-card-title">
                                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4.5 5h5M4.5 7.5h5M4.5 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                                        Study Materials
                                    </div>
                                    <div className="pc-material-list">
                                        {materials.map((m, i) => (
                                            <div key={i} className="pc-material-item">
                                                <div className="pc-material-type-badge" style={{ background: FILE_TYPE_COLORS[m.type] ?? "#8A8AAA" }}>{m.type}</div>
                                                <div className="pc-material-info">
                                                    <div className="pc-material-title">{m.title}</div>
                                                    <div className="pc-material-size">{m.size}</div>
                                                </div>
                                                <span className="pc-material-dl">↓</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* ── NEW: Invite Member card, below the two existing cards ── */}
                            <InviteMemberCard moduleColor={selectedGroup.moduleColor} />
                            {/* ── NEW: Upload Study Material card, below the invite card ── */}
                            <UploadMaterialCard moduleColor={selectedGroup.moduleColor} />
                        </div>
                    </div>
                );
            })() : (
                <div className="pc-wrap">
                    <div className="pc-main">
                        <header className="pc-hero">
                            <div className="pc-hero-label">Community Hub</div>
                            <h1>Peer <em>Connect</em></h1>
                            <p>Find your tribe, share resources, and conquer your modules with peer-led study groups.</p>
                            <button className="pc-create-btn" onClick={() => setShowCreateModal(true)}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                                Create New Group
                            </button>
                        </header>

                        {/* --- NEW ACTIVITY GRAPH SECTION --- */}
                        <ActivityGraph />

                        <section className="pc-modules-section">
                            <div className="pc-section-title">
                                Targeted Modules
                                <span className="pc-count">{modules.length}</span>
                            </div>
                            <div className="pc-modules-grid">
                                {modules.map((m) => (
                                    <div
                                        key={m.code}
                                        className={`pc-module-card ${activeFilter === m.code ? "pc-active" : ""}`}
                                        style={{ "--card-color": m.color } as any}
                                        onClick={() => setActiveFilter(activeFilter === m.code ? "All" : m.code)}
                                    >
                                        <div className="pc-module-dot" />
                                        <div className="pc-module-code">{m.code}</div>
                                        <div className="pc-module-name">{m.name}</div>
                                        <div className="pc-module-members">{m.members} students</div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="pc-section-divider" />

                        <section className="pc-groups-section">
                            <div className="pc-section-title" style={{ marginBottom: "1.5rem" }}>
                                Discover Peer Groups
                                <span className="pc-count">{filteredGroups.length}</span>
                            </div>

                            <div style={{ marginBottom: "2rem" }}>
                                <div className="pc-filter-bar">
                                    {["All", ...modules.map(m => m.code)].map((f) => (
                                        <button key={f} className={`pc-filter-chip ${activeFilter === f ? "pc-active" : ""}`} onClick={() => setActiveFilter(f)}>
                                            {f}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type="text"
                                        className="pc-form-input"
                                        placeholder="Search by group name, module, or tags..."
                                        style={{ background: "#FFFFFF", paddingLeft: "2.5rem" }}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <svg style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "#8A8AAA" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                                </div>
                            </div>

                            <div className="pc-groups-grid">
                                {loadingGroups ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="pc-group-card" style={{ opacity: 0.6, pointerEvents: "none" }}>
                                            <div style={{ height: 20, width: "60%", background: "#eee", borderRadius: 4, marginBottom: 12 }} />
                                            <div style={{ height: 14, width: "80%", background: "#f5f5f5", borderRadius: 4, marginBottom: 20 }} />
                                            <div style={{ height: 32, background: "#fafafa", borderRadius: 8 }} />
                                        </div>
                                    ))
                                ) : filteredGroups.length > 0 ? (
                                    filteredGroups.map((g) => {
                                        const isJoined = g.isJoined;
                                        const isFull = g.members >= g.max && !isJoined;
                                        const isLoading = joiningId === g.id;
                                        return (
                                            <div key={g.id} className="pc-group-card" onClick={() => setSelectedGroup(g)}>
                                                <div className="pc-group-card-top">
                                                    <div className="pc-group-module-badge" style={{ background: `${g.moduleColor}15`, color: g.moduleColor }}>
                                                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: g.moduleColor }} />
                                                        {g.module}
                                                    </div>
                                                </div>
                                                <div className="pc-group-name">{g.name}</div>
                                                <div className="pc-group-schedule">
                                                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" /><path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                                                    {g.schedule}
                                                </div>
                                                <div className="pc-group-tags">
                                                    {g.tags.map(t => <span key={t} className="pc-tag">{t}</span>)}
                                                </div>
                                                <div className="pc-group-footer">
                                                    <div className="pc-member-bar-wrap">
                                                        <div className="pc-member-bar-label">{g.members}/{g.max} members</div>
                                                        <div className="pc-member-bar">
                                                            <div className="pc-member-bar-fill" style={{ width: `${(g.members / g.max) * 100}%`, background: g.moduleColor }} />
                                                        </div>
                                                    </div>
                                                    <button
                                                        className={`pc-join-btn ${isJoined ? "pc-joined" : "pc-default"}`}
                                                        disabled={isLoading || isFull}
                                                        onClick={(e) => { e.stopPropagation(); handleJoin(g.id); }}
                                                    >
                                                        {isLoading ? "…" : isJoined ? "✓ Joined" : isFull ? "Full" : "Join"}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="pc-empty-state">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: "1rem", opacity: 0.5 }}><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
                                        <p>No groups found matching your criteria.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            )}

            {/* ── CREATE MODAL ── */}
            {showCreateModal && (
                <div className="pc-modal-overlay" onClick={() => !creating && setShowCreateModal(false)}>
                    <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="pc-modal-header">
                            <div className="pc-modal-title">Create Study Group</div>
                            <button className="pc-modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <div className="pc-form-group">
                            <label className="pc-form-label">Group Name</label>
                            <input className="pc-form-input" placeholder="e.g. Midterm Grind Team" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
                        </div>
                        {/* ── NEW: Group Leader Name field ── */}
                        <div className="pc-form-group">
                            <label className="pc-form-label">Group Leader Name</label>
                            <input className="pc-form-input" placeholder="e.g. Jane Doe" value={groupLeader} onChange={(e) => setGroupLeader(e.target.value)} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="pc-form-group">
                                <label className="pc-form-label">Module</label>
                                <select className="pc-form-select" value={groupModule} onChange={(e) => setGroupModule(e.target.value)}>
                                    <option value="">Select...</option>
                                    {modules.map(m => <option key={m.code} value={m.code}>{m.code}</option>)}
                                </select>
                            </div>
                            <div className="pc-form-group">
                                <label className="pc-form-label">Max Members</label>
                                <input type="number" className="pc-form-input" min="2" max="10" value={groupMax} onChange={(e) => setGroupMax(e.target.value)} />
                            </div>
                        </div>
                        <div className="pc-form-group">
                            <label className="pc-form-label">Schedule</label>
                            <input className="pc-form-input" placeholder="e.g. Mon & Wed, 8pm" value={groupSchedule} onChange={(e) => setGroupSchedule(e.target.value)} />
                        </div>
                        <div className="pc-form-group">
                            <label className="pc-form-label">Tags (comma separated)</label>
                            <input className="pc-form-input" placeholder="e.g. NoobsWelcome, FastPaced" value={groupTags} onChange={(e) => setGroupTags(e.target.value)} />
                        </div>
                        {createError && <div className="pc-form-error">{createError}</div>}
                        {/* ── CHANGED: disabled unless isFormValid (or creating) ── */}
                        <button className="pc-modal-submit" disabled={creating || !isFormValid} onClick={handleCreate}>
                            {creating ? "Creating..." : "Launch Group"}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
