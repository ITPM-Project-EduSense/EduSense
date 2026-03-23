"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

// ── Hardcoded session links & materials per group (UI demo) ──
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
}

function apiGroupToGroup(g: {
    id: string;
    name: string;
    module: string;
    members: number;
    max_members: number;
    schedule: string;
    tags: string[];
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
    };
}

export default function PeerConnectHome() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    // Form state
    const [groupName, setGroupName] = useState("");
    const [groupModule, setGroupModule] = useState("");
    const [groupSchedule, setGroupSchedule] = useState("");
    const [groupMax, setGroupMax] = useState("6");
    const [groupTags, setGroupTags] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    const [joinedGroups, setJoinedGroups] = useState<Set<string>>(
        () => new Set<string>(JSON.parse(localStorage.getItem("joinedGroups") ?? "[]"))
    );
    useEffect(() => { localStorage.setItem("joinedGroups", JSON.stringify([...joinedGroups])); }, [joinedGroups]);
    const [joiningId, setJoiningId] = useState<string | null>(null);

    // Drawer state
    const [drawerGroup, setDrawerGroup] = useState<Group | null>(null);

    // ── Fetch groups on mount ──
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

    // ── Create group ──
    const handleCreate = async () => {
        if (!groupName.trim() || !groupModule || !groupSchedule.trim()) return;
        setCreating(true);
        setCreateError("");
        try {
            const tags = groupTags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
            const data = await apiFetch("/groups/", {
                method: "POST",
                body: JSON.stringify({
                    name: groupName.trim(),
                    module: groupModule,
                    schedule: groupSchedule.trim(),
                    max_members: parseInt(groupMax) || 6,
                    tags,
                }),
            });
            const newGroup = apiGroupToGroup(data);
            setGroups((prev) => [newGroup, ...prev]);
            setJoinedGroups((prev) => new Set(prev).add(newGroup.id));
            setShowCreateModal(false);
            setGroupName("");
            setGroupModule("");
            setGroupSchedule("");
            setGroupMax("6");
            setGroupTags("");
        } catch (err: unknown) {
            setCreateError(err instanceof Error ? err.message : "Failed to create group");
        } finally {
            setCreating(false);
        }
    };

    // ── Join / Leave group ──
    const handleJoin = async (groupId: string) => {
        const isJoined = joinedGroups.has(groupId);
        setJoinedGroups((prev) => { const n = new Set(prev); isJoined ? n.delete(groupId) : n.add(groupId); return n; });
        setJoiningId(groupId);
        try {
            const data = await apiFetch(`/groups/${groupId}/${isJoined ? "leave" : "join"}`, { method: "POST" });
            const updated = apiGroupToGroup(data);
            setGroups((prev) => prev.map((g) => (g.id === groupId ? updated : g)));
            setDrawerGroup((prev) => prev?.id === groupId ? updated : prev);
        } catch {
            // keep optimistic UI state even if API call fails
        } finally {
            setJoiningId(null);
        }
    };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #D4D7DE;
          color: #1A1A2E;
          min-height: 100vh;
        }

        .page {
          min-height: 100vh;
          background: #D4D7DE;
          position: relative;
          overflow-x: hidden;
        }

        /* Ambient background blobs */
        .page::before {
          content: '';
          position: fixed;
          top: -20%;
          left: -10%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(255,107,53,0.07) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .page::after {
          content: '';
          position: fixed;
          bottom: -20%;
          right: -10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(78,205,196,0.06) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* NAV */
        nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0,0,0,0.08);
          padding: 0 2rem;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-logo {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.3rem;
          letter-spacing: -0.02em;
          color: #1A1A2E;
        }
        .nav-logo span { color: #FF6B35; }
        .nav-actions { display: flex; gap: 0.75rem; align-items: center; }
        .nav-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF6B35, #A78BFA);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          color: #fff;
          cursor: pointer;
        }

        /* MAIN */
        main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem 2rem 6rem;
          position: relative;
          z-index: 1;
        }

        /* HERO */
        .hero {
          margin-bottom: 4rem;
        }
        .hero-label {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255,107,53,0.12);
          border: 1px solid rgba(255,107,53,0.25);
          border-radius: 100px;
          padding: 0.35rem 1rem;
          font-size: 0.8rem;
          font-weight: 500;
          color: #FF6B35;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }
        .hero-label::before {
          content: '';
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #FF6B35;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
        .hero h1 {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(2.2rem, 5vw, 3.8rem);
          line-height: 1.05;
          letter-spacing: -0.03em;
          margin-bottom: 1rem;
          color: #1A1A2E;
        }
        .hero h1 em {
          font-style: normal;
          color: #FF6B35;
        }
        .hero p {
          font-size: 1.05rem;
          color: #5A5A72;
          max-width: 480px;
          line-height: 1.7;
          font-weight: 400;
        }

        /* CREATE BUTTON */
        .create-btn {
          margin-top: 2rem;
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          background: #FF6B35;
          color: #0A0A0F;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 0.85rem 2rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.01em;
        }
        .create-btn:hover {
          background: #ff8555;
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(255,107,53,0.35);
        }
        .create-btn svg { flex-shrink: 0; }

        /* SECTION TITLE */
        .section-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.15rem;
          letter-spacing: -0.01em;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #1A1A2E;
        }
        .section-title .count {
          background: rgba(0,0,0,0.07);
          border-radius: 100px;
          padding: 0.15rem 0.6rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6B6B8A;
          font-family: 'DM Sans', sans-serif;
        }

        /* MODULES GRID */
        .modules-section { margin-bottom: 3.5rem; }
        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 0.75rem;
        }
        .module-card {
          background: #FFFFFF;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 14px;
          padding: 1.1rem 1.25rem;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .module-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--card-color);
          opacity: 0;
          transition: opacity 0.2s ease;
          border-radius: 14px;
        }
        .module-card:hover::before,
        .module-card.active::before { opacity: 0.08; }
        .module-card.active {
          border-color: var(--card-color);
        }
        .module-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--card-color);
          margin-bottom: 0.75rem;
        }
        .module-code {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--card-color);
          margin-bottom: 0.25rem;
        }
        .module-name {
          font-size: 0.8rem;
          color: #5A5A72;
          font-weight: 400;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .module-members {
          margin-top: 0.75rem;
          font-size: 0.75rem;
          color: #8A8AAA;
        }

        /* GROUPS SECTION */
        .groups-section { }

        .filter-bar {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .filter-chip {
          padding: 0.4rem 1rem;
          border-radius: 100px;
          border: 1px solid rgba(0,0,0,0.12);
          background: #FFFFFF;
          color: #6B6B8A;
          font-size: 0.8rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .filter-chip:hover {
          border-color: rgba(0,0,0,0.22);
          color: #1A1A2E;
        }
        .filter-chip.active {
          background: #1A1A2E;
          border-color: #1A1A2E;
          color: #FFFFFF;
        }

        .groups-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }
        .group-card {
          background: #FFFFFF;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 16px;
          padding: 1.4rem;
          transition: all 0.2s ease;
          cursor: default;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .group-card:hover {
          background: #FFFFFF;
          border-color: rgba(0,0,0,0.15);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.09);
        }
        .group-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .group-module-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.3rem 0.7rem;
          border-radius: 100px;
          font-size: 0.72rem;
          font-weight: 600;
          font-family: 'Syne', sans-serif;
          letter-spacing: 0.03em;
        }
        .group-name {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          margin-bottom: 0.5rem;
          letter-spacing: -0.01em;
          color: #1A1A2E;
        }
        .group-schedule {
          font-size: 0.8rem;
          color: #7A7A96;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .group-tags {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
          margin-bottom: 1.25rem;
        }
        .tag {
          padding: 0.2rem 0.65rem;
          background: rgba(0,0,0,0.06);
          border-radius: 100px;
          font-size: 0.72rem;
          color: #5A5A72;
          font-weight: 500;
        }
        .group-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .member-bar-wrap {
          flex: 1;
          margin-right: 1rem;
        }
        .member-bar-label {
          font-size: 0.72rem;
          color: #8A8AAA;
          margin-bottom: 0.35rem;
        }
        .member-bar {
          height: 4px;
          background: rgba(0,0,0,0.1);
          border-radius: 100px;
          overflow: hidden;
        }
        .member-bar-fill {
          height: 100%;
          border-radius: 100px;
          transition: width 0.4s ease;
        }
        .join-btn {
          padding: 0.5rem 1.25rem;
          border-radius: 9px;
          border: none;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .join-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .join-btn.default {
          background: rgba(0,0,0,0.06);
          color: #1A1A2E;
          border: 1px solid rgba(0,0,0,0.1);
        }
        .join-btn.default:hover:not(:disabled) {
          background: rgba(0,0,0,0.11);
        }
        .join-btn.joined {
          background: rgba(52,211,153,0.15);
          color: #34D399;
          border: 1px solid rgba(52,211,153,0.3);
        }

        /* Empty state */
        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 4rem 2rem;
          color: #8A8AAA;
          font-size: 0.95rem;
        }

        /* MODAL */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal {
          background: #FFFFFF;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 20px;
          padding: 2rem;
          width: 100%;
          max-width: 440px;
          animation: slideUp 0.25s ease;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.75rem;
        }
        .modal-title {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.3rem;
          letter-spacing: -0.02em;
          color: #1A1A2E;
        }
        .modal-close {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: rgba(0,0,0,0.06);
          border: none;
          cursor: pointer;
          color: #6B6B8A;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .modal-close:hover { background: rgba(0,0,0,0.11); color: #1A1A2E; }
        .form-group { margin-bottom: 1.25rem; }
        .form-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: #6B6B8A;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 0.5rem;
          font-family: 'Syne', sans-serif;
        }
        .form-input, .form-select {
          width: 100%;
          background: #F5F5F8;
          border: 1px solid rgba(0,0,0,0.12);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          color: #1A1A2E;
          font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.15s;
        }
        .form-input:focus, .form-select:focus {
          border-color: rgba(255,107,53,0.6);
        }
        .form-select option { background: #FFFFFF; color: #1A1A2E; }
        .form-hint {
          margin-top: 0.35rem;
          font-size: 0.75rem;
          color: #9A9AB0;
        }
        .form-error {
          margin-top: 0.75rem;
          padding: 0.6rem 0.9rem;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 8px;
          color: #EF4444;
          font-size: 0.82rem;
        }
        .modal-submit {
          width: 100%;
          padding: 0.85rem;
          background: #FF6B35;
          color: #0A0A0F;
          border: none;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.5rem;
        }
        .modal-submit:hover:not(:disabled) {
          background: #ff8555;
          box-shadow: 0 8px 30px rgba(255,107,53,0.3);
        }
        .modal-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        /* DIVIDER */
        .section-divider {
          height: 1px;
          background: rgba(0,0,0,0.08);
          margin: 3rem 0;
        }

        /* GROUP CARD — clickable hint */
        .group-card { cursor: pointer; }

        /* DRAWER OVERLAY */
        .drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(4px);
          z-index: 150;
          animation: fadeIn 0.2s ease;
        }

        /* DRAWER PANEL */
        .drawer {
          position: fixed;
          top: 0;
          right: 0;
          height: 100%;
          width: 420px;
          max-width: 95vw;
          background: #FFFFFF;
          border-left: 1px solid rgba(0,0,0,0.09);
          box-shadow: -16px 0 60px rgba(0,0,0,0.12);
          z-index: 151;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.28s cubic-bezier(0.32,0,0.2,1);
          overflow: hidden;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }

        /* DRAWER HEADER */
        .drawer-header {
          padding: 1.5rem 1.5rem 1.25rem;
          border-bottom: 1px solid rgba(0,0,0,0.07);
          flex-shrink: 0;
        }
        .drawer-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        .drawer-close {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: rgba(0,0,0,0.06);
          border: none;
          cursor: pointer;
          color: #6B6B8A;
          font-size: 1.2rem;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .drawer-close:hover { background: rgba(0,0,0,0.11); color: #1A1A2E; }
        .drawer-group-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.25rem;
          letter-spacing: -0.02em;
          color: #1A1A2E;
          flex: 1;
          margin-right: 0.75rem;
        }
        .drawer-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .drawer-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.28rem 0.7rem;
          border-radius: 100px;
          font-size: 0.72rem;
          font-weight: 600;
          font-family: 'Syne', sans-serif;
          letter-spacing: 0.03em;
        }
        .drawer-schedule {
          font-size: 0.82rem;
          color: #7A7A96;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        /* DRAWER BODY */
        .drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        /* DRAWER SECTION */
        .drawer-section-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #9A9AB0;
          margin-bottom: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .drawer-section-title svg { opacity: 0.7; }

        /* SESSION LINK ITEMS */
        .session-list {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .session-item {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.85rem 1rem;
          background: #F7F7FA;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.15s ease;
          cursor: pointer;
        }
        .session-item:hover {
          background: #F0F0F5;
          border-color: rgba(0,0,0,0.13);
          transform: translateX(2px);
        }
        .session-platform-dot {
          width: 34px; height: 34px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          font-size: 0.65rem;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: #fff;
        }
        .session-label {
          flex: 1;
          font-size: 0.87rem;
          font-weight: 500;
          color: #1A1A2E;
          font-family: 'DM Sans', sans-serif;
        }
        .session-arrow {
          color: #B0B0C8;
          font-size: 1rem;
        }

        /* MATERIAL ITEMS */
        .material-list {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .material-item {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.85rem 1rem;
          background: #F7F7FA;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .material-item:hover {
          background: #F0F0F5;
          border-color: rgba(0,0,0,0.13);
          transform: translateX(2px);
        }
        .material-type-badge {
          width: 34px; height: 34px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          font-size: 0.6rem;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          letter-spacing: 0.02em;
          color: #fff;
        }
        .material-info { flex: 1; min-width: 0; }
        .material-title {
          font-size: 0.87rem;
          font-weight: 500;
          color: #1A1A2E;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: 'DM Sans', sans-serif;
        }
        .material-size {
          font-size: 0.73rem;
          color: #9A9AB0;
          margin-top: 0.15rem;
        }
        .material-dl {
          color: #B0B0C8;
          font-size: 1rem;
        }

        /* DRAWER FOOTER */
        .drawer-footer {
          padding: 1.25rem 1.5rem;
          border-top: 1px solid rgba(0,0,0,0.07);
          flex-shrink: 0;
          background: #FFFFFF;
        }
        .drawer-join-btn {
          width: 100%;
          padding: 0.9rem;
          border-radius: 12px;
          border: none;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .drawer-join-btn.not-joined {
          background: #FF6B35;
          color: #0A0A0F;
        }
        .drawer-join-btn.not-joined:hover:not(:disabled) {
          background: #ff8555;
          box-shadow: 0 8px 30px rgba(255,107,53,0.3);
        }
        .drawer-join-btn.is-joined {
          background: rgba(52,211,153,0.12);
          color: #34D399;
          border: 1px solid rgba(52,211,153,0.3);
        }
        .drawer-join-btn.is-joined:hover:not(:disabled) {
          background: rgba(52,211,153,0.2);
        }
        .drawer-join-btn.is-full {
          background: rgba(0,0,0,0.06);
          color: #9A9AB0;
          cursor: not-allowed;
        }
        .drawer-join-btn:disabled { opacity: 0.65; cursor: not-allowed; }
      `}</style>

            <div className="page">
                {/* NAV */}
                <nav>
                    <div className="nav-logo">Peer<span>Connect</span></div>
                    <div className="nav-actions">
                        <div className="nav-avatar">YO</div>
                    </div>
                </nav>

                <main>
                    {/* HERO */}
                    <div className="hero">
                        <div className="hero-label">Study Together</div>
                        <h1>Find your <em>academic</em><br />study circle.</h1>
                        <p>Join or create study groups tailored to your modules. Learn better, together.</p>
                        <button className="create-btn" onClick={() => setShowCreateModal(true)}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                            Create a Study Group
                        </button>
                    </div>

                    {/* SEARCH */}
                    <div style={{ marginBottom: "2rem", position: "relative" }}>
                        <input
                            style={{ width: "100%", background: "#fff", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12, padding: "0.7rem 1rem 0.7rem 2.6rem", fontSize: "0.9rem", fontFamily: "'DM Sans',sans-serif", outline: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                            placeholder="Search groups by name, module or tag…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <svg style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#9A9AB0" }} width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </div>

                    {/* MODULES */}
                    <div className="modules-section">
                        <div className="section-title">
                            Browse by Module
                            <span className="count">{modules.length} modules</span>
                        </div>
                        <div className="modules-grid">
                            {modules.map((mod) => (
                                <div
                                    key={mod.code}
                                    className={`module-card ${selectedModule === mod.code ? "active" : ""}`}
                                    style={{ ["--card-color" as string]: mod.color }}
                                    onClick={() =>
                                        setSelectedModule(selectedModule === mod.code ? null : mod.code)
                                    }
                                >
                                    <div className="module-dot" />
                                    <div className="module-code">{mod.code}</div>
                                    <div className="module-name">{mod.name}</div>
                                    <div className="module-members">{mod.members} in groups</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="section-divider" />

                    {/* GROUPS */}
                    <div className="groups-section">
                        <div className="section-title">
                            Open Groups
                            <span className="count">
                                {loadingGroups ? "…" : `${filteredGroups.length} available`}
                            </span>
                        </div>

                        {/* Filters */}
                        <div className="filter-bar">
                            <button
                                className={`filter-chip ${activeFilter === "All" ? "active" : ""}`}
                                onClick={() => setActiveFilter("All")}
                            >All</button>
                            {modules.map((mod) => (
                                <button
                                    key={mod.code}
                                    className={`filter-chip ${activeFilter === mod.code ? "active" : ""}`}
                                    onClick={() =>
                                        setActiveFilter(activeFilter === mod.code ? "All" : mod.code)
                                    }
                                >{mod.code}</button>
                            ))}
                        </div>

                        <div className="groups-grid">
                            {loadingGroups ? (
                                <div className="empty-state">Loading groups…</div>
                            ) : filteredGroups.length === 0 ? (
                                <div className="empty-state">
                                    No groups yet.{" "}
                                    <span
                                        style={{ color: "#FF6B35", cursor: "pointer" }}
                                        onClick={() => setShowCreateModal(true)}
                                    >
                                        Create the first one!
                                    </span>
                                </div>
                            ) : (
                                filteredGroups.map((group) => {
                                    const fillPct = (group.members / group.max) * 100;
                                    const isJoined = joinedGroups.has(group.id);
                                    const isFull = group.members >= group.max;
                                    const isLoading = joiningId === group.id;
                                    return (
                                        <div key={group.id} className="group-card" onClick={() => setDrawerGroup(group)}>
                                            <div className="group-card-top">
                                                <div
                                                    className="group-module-badge"
                                                    style={{
                                                        background: `${group.moduleColor}18`,
                                                        color: group.moduleColor,
                                                        border: `1px solid ${group.moduleColor}35`,
                                                    }}
                                                >
                                                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: group.moduleColor, display: "inline-block" }} />
                                                    {group.module}
                                                </div>
                                            </div>
                                            <div className="group-name">{group.name}</div>
                                            <div className="group-schedule">
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
                                                    <path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                                </svg>
                                                {group.schedule}
                                            </div>
                                            {group.tags.length > 0 && (
                                                <div className="group-tags">
                                                    {group.tags.map((t) => (
                                                        <span key={t} className="tag">{t}</span>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="group-footer">
                                                <div className="member-bar-wrap">
                                                    <div className="member-bar-label">
                                                        {group.members}/{group.max} members
                                                    </div>
                                                    <div className="member-bar">
                                                        <div
                                                            className="member-bar-fill"
                                                            style={{
                                                                width: `${fillPct}%`,
                                                                background: group.moduleColor,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    className={`join-btn ${isJoined ? "joined" : "default"}`}
                                                    disabled={isLoading || (!isJoined && isFull)}
                                                    onClick={(e) => { e.stopPropagation(); handleJoin(group.id); }}
                                                >
                                                    {isLoading
                                                        ? "…"
                                                        : isJoined
                                                        ? "✓ Joined"
                                                        : isFull
                                                        ? "Full"
                                                        : "Join"}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* GROUP DETAIL DRAWER */}
            {drawerGroup && (() => {
                const sessions = MOCK_SESSIONS[drawerGroup.module] ?? MOCK_SESSIONS.default;
                const materials = MOCK_MATERIALS[drawerGroup.module] ?? MOCK_MATERIALS.default;
                return (
                    <>
                        <div className="drawer-overlay" onClick={() => setDrawerGroup(null)} />
                        <div className="drawer">
                            {/* Header */}
                            <div className="drawer-header">
                                <div className="drawer-header-top">
                                    <div className="drawer-group-name">{drawerGroup.name}</div>
                                    <button className="drawer-close" onClick={() => setDrawerGroup(null)}>×</button>
                                </div>
                                <div className="drawer-meta">
                                    <div
                                        className="drawer-badge"
                                        style={{
                                            background: `${drawerGroup.moduleColor}18`,
                                            color: drawerGroup.moduleColor,
                                            border: `1px solid ${drawerGroup.moduleColor}35`,
                                        }}
                                    >
                                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: drawerGroup.moduleColor, display: "inline-block" }} />
                                        {drawerGroup.module}
                                    </div>
                                    <div className="drawer-schedule">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
                                            <path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                        </svg>
                                        {drawerGroup.schedule}
                                    </div>
                                    <div style={{ fontSize: "0.78rem", color: "#9A9AB0" }}>
                                        {drawerGroup.members}/{drawerGroup.max} members
                                    </div>
                                </div>
                                {drawerGroup.tags.length > 0 && (
                                    <div className="group-tags" style={{ marginTop: "0.75rem" }}>
                                        {drawerGroup.tags.map((t) => (
                                            <span key={t} className="tag">{t}</span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Body */}
                            <div className="drawer-body" style={{ paddingBottom: "0.5rem" }}>
                                {/* Session Links */}
                                <div>
                                    <div className="drawer-section-title">
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                            <path d="M7 1.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM7 4v3.5l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Session Links
                                    </div>
                                    <div className="session-list">
                                        {sessions.map((s, i) => (
                                            <a key={i} className="session-item" href={s.url} target="_blank" rel="noreferrer">
                                                <div
                                                    className="session-platform-dot"
                                                    style={{ background: PLATFORM_COLORS[s.platform] ?? "#8A8AAA" }}
                                                >
                                                    {s.platform.slice(0, 2).toUpperCase()}
                                                </div>
                                                <span className="session-label">{s.label}</span>
                                                <span className="session-arrow">↗</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>

                                {/* Study Materials */}
                                <div>
                                    <div className="drawer-section-title">
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                            <rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                                            <path d="M4.5 5h5M4.5 7.5h5M4.5 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                        </svg>
                                        Study Materials
                                    </div>
                                    <div className="material-list">
                                        {materials.map((m, i) => (
                                            <div key={i} className="material-item">
                                                <div
                                                    className="material-type-badge"
                                                    style={{ background: FILE_TYPE_COLORS[m.type] ?? "#8A8AAA" }}
                                                >
                                                    {m.type}
                                                </div>
                                                <div className="material-info">
                                                    <div className="material-title">{m.title}</div>
                                                    <div className="material-size">{m.size}</div>
                                                </div>
                                                <span className="material-dl">↓</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Sticky Join/Leave footer */}
                            {(() => {
                                const isJoined = joinedGroups.has(drawerGroup.id);
                                const isFull = drawerGroup.members >= drawerGroup.max && !isJoined;
                                const isLoading = joiningId === drawerGroup.id;
                                return (
                                    <div className="drawer-footer">
                                        <button
                                            className={`drawer-join-btn ${isFull ? "is-full" : isJoined ? "is-joined" : "not-joined"}`}
                                            disabled={isLoading || isFull}
                                            onClick={() => handleJoin(drawerGroup.id)}
                                        >
                                            {isLoading ? (
                                                "…"
                                            ) : isJoined ? (
                                                <>✓ Joined — Leave group</>
                                            ) : isFull ? (
                                                "Group is full"
                                            ) : (
                                                <>
                                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                        <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                    </svg>
                                                    Join this group
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>
                    </>
                );
            })()}

            {/* CREATE MODAL */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <div className="modal-title">New Study Group</div>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Group Name</label>
                            <input
                                className="form-input"
                                placeholder="e.g. Weekend Warriors"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Module</label>
                            <select
                                className="form-select"
                                value={groupModule}
                                onChange={(e) => setGroupModule(e.target.value)}
                            >
                                <option value="">Select a module…</option>
                                {modules.map((m) => (
                                    <option key={m.code} value={m.code}>{m.code} — {m.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Meeting Schedule</label>
                            <input
                                className="form-input"
                                placeholder="e.g. Saturdays 2PM @ Library"
                                value={groupSchedule}
                                onChange={(e) => setGroupSchedule(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Max Members</label>
                            <input
                                className="form-input"
                                type="number"
                                placeholder="6"
                                min={2}
                                max={20}
                                value={groupMax}
                                onChange={(e) => setGroupMax(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Tags</label>
                            <input
                                className="form-input"
                                placeholder="e.g. Beginner-friendly, Online, Exam Prep"
                                value={groupTags}
                                onChange={(e) => setGroupTags(e.target.value)}
                            />
                            <div className="form-hint">Separate tags with commas</div>
                        </div>

                        {createError && <div className="form-error">{createError}</div>}

                        <button
                            className="modal-submit"
                            disabled={creating || !groupName.trim() || !groupModule || !groupSchedule.trim()}
                            onClick={handleCreate}
                        >
                            {creating ? "Creating…" : "Create Group →"}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
