"use client";

import { useState } from "react";

const modules = [
    { code: "CS2040", name: "Data Structures", color: "#FF6B35", members: 24 },
    { code: "MA1101", name: "Linear Algebra", color: "#4ECDC4", members: 18 },
    { code: "CS3230", name: "Algorithms", color: "#A78BFA", members: 31 },
    { code: "ST2334", name: "Probability", color: "#F59E0B", members: 15 },
    { code: "CS2103", name: "Software Eng.", color: "#34D399", members: 42 },
    { code: "IS3103", name: "Info Systems", color: "#F472B6", members: 11 },
];

const existingGroups = [
    {
        id: 1,
        name: "Late Night Coders",
        module: "CS2040",
        moduleColor: "#FF6B35",
        members: 5,
        max: 8,
        schedule: "Mon & Wed, 10PM",
        tags: ["Intensive", "Online"],
    },
    {
        id: 2,
        name: "Matrix Explorers",
        module: "MA1101",
        moduleColor: "#4ECDC4",
        members: 3,
        max: 6,
        schedule: "Tue, 3PM @ CLB",
        tags: ["Beginner-friendly"],
    },
    {
        id: 3,
        name: "Algorithm Avengers",
        module: "CS3230",
        moduleColor: "#A78BFA",
        members: 7,
        max: 8,
        schedule: "Fri, 2PM @ COM2",
        tags: ["Competitive", "Exam Prep"],
    },
    {
        id: 4,
        name: "Probability Pals",
        module: "ST2334",
        moduleColor: "#F59E0B",
        members: 4,
        max: 6,
        schedule: "Sun, 1PM @ Online",
        tags: ["Chill", "Weekly"],
    },
];

export default function PeerConnectHome() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [groupName, setGroupName] = useState("");
    const [groupModule, setGroupModule] = useState("");
    const [joinedGroups, setJoinedGroups] = useState<number[]>([]);
    const [activeFilter, setActiveFilter] = useState("All");

    const filteredGroups =
        activeFilter === "All"
            ? existingGroups
            : existingGroups.filter((g) => g.module === activeFilter);

    const handleJoin = (id: number) => {
        setJoinedGroups((prev) =>
            prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
        );
    };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #2E2E38;
          color: #E8E8F0;
          min-height: 100vh;
        }

        .page {
          min-height: 100vh;
          background: #2E2E38;
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
          background: radial-gradient(circle, rgba(255,107,53,0.08) 0%, transparent 70%);
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
          background: radial-gradient(circle, rgba(78,205,196,0.07) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* NAV */
        nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(10,10,15,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
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
        }
        .hero h1 em {
          font-style: normal;
          color: #FF6B35;
        }
        .hero p {
          font-size: 1.05rem;
          color: rgba(232,232,240,0.55);
          max-width: 480px;
          line-height: 1.7;
          font-weight: 300;
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
          color: rgba(232,232,240,0.9);
        }
        .section-title .count {
          background: rgba(255,255,255,0.08);
          border-radius: 100px;
          padding: 0.15rem 0.6rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(232,232,240,0.4);
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
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 1.1rem 1.25rem;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
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
          color: rgba(232,232,240,0.5);
          font-weight: 400;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .module-members {
          margin-top: 0.75rem;
          font-size: 0.75rem;
          color: rgba(232,232,240,0.3);
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
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          color: rgba(232,232,240,0.5);
          font-size: 0.8rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .filter-chip:hover {
          border-color: rgba(255,255,255,0.2);
          color: rgba(232,232,240,0.8);
        }
        .filter-chip.active {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.2);
          color: #E8E8F0;
        }

        .groups-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }
        .group-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 1.4rem;
          transition: all 0.2s ease;
          cursor: default;
        }
        .group-card:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-2px);
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
        }
        .group-schedule {
          font-size: 0.8rem;
          color: rgba(232,232,240,0.4);
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
          background: rgba(255,255,255,0.06);
          border-radius: 100px;
          font-size: 0.72rem;
          color: rgba(232,232,240,0.5);
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
          color: rgba(232,232,240,0.35);
          margin-bottom: 0.35rem;
        }
        .member-bar {
          height: 4px;
          background: rgba(255,255,255,0.08);
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
        .join-btn.default {
          background: rgba(255,255,255,0.08);
          color: #E8E8F0;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .join-btn.default:hover {
          background: rgba(255,255,255,0.13);
        }
        .join-btn.joined {
          background: rgba(52,211,153,0.15);
          color: #34D399;
          border: 1px solid rgba(52,211,153,0.3);
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
          background: #13131A;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 2rem;
          width: 100%;
          max-width: 440px;
          animation: slideUp 0.25s ease;
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
        }
        .modal-close {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: rgba(255,255,255,0.07);
          border: none;
          cursor: pointer;
          color: rgba(232,232,240,0.6);
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .modal-close:hover { background: rgba(255,255,255,0.12); color: #E8E8F0; }
        .form-group { margin-bottom: 1.25rem; }
        .form-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: rgba(232,232,240,0.5);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 0.5rem;
          font-family: 'Syne', sans-serif;
        }
        .form-input, .form-select {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          color: #E8E8F0;
          font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.15s;
        }
        .form-input:focus, .form-select:focus {
          border-color: rgba(255,107,53,0.5);
        }
        .form-select option { background: #13131A; }
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
        .modal-submit:hover {
          background: #ff8555;
          box-shadow: 0 8px 30px rgba(255,107,53,0.3);
        }

        /* DIVIDER */
        .section-divider {
          height: 1px;
          background: rgba(255,255,255,0.05);
          margin: 3rem 0;
        }
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
                            <span className="count">{filteredGroups.length} available</span>
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
                            {filteredGroups.map((group) => {
                                const fillPct = (group.members / group.max) * 100;
                                const isJoined = joinedGroups.includes(group.id);
                                return (
                                    <div key={group.id} className="group-card">
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
                                        <div className="group-tags">
                                            {group.tags.map((t) => (
                                                <span key={t} className="tag">{t}</span>
                                            ))}
                                        </div>
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
                                                onClick={() => handleJoin(group.id)}
                                            >
                                                {isJoined ? "✓ Joined" : "Join"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </main>
            </div>

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
                            <input className="form-input" placeholder="e.g. Saturdays 2PM @ Library" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Max Members</label>
                            <input className="form-input" type="number" placeholder="6" min={2} max={20} />
                        </div>
                        <button
                            className="modal-submit"
                            onClick={() => {
                                if (groupName && groupModule) setShowCreateModal(false);
                            }}
                        >
                            Create Group →
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}