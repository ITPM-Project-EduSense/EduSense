"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { ActivityGraph, IncomingInvitesCard, InviteMemberCard, UploadMaterialCard } from "./components";
import { MeetingPanel } from "./components/MeetingPanel";
import { API_BASE, FILE_TYPE_COLORS, PLATFORM_COLORS, modules } from "./constants";
import type { Group, GroupInvite, GroupMaterial } from "./types";
import { apiGroupToGroup, apiInviteToInvite, apiMaterialToMaterial, formatFileSize } from "./utils";

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
    const [groupLeaderEmail, setGroupLeaderEmail] = useState("");
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    // ── NEW: derived flag — all required fields filled ──
    const leaderEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(groupLeaderEmail.trim().toLowerCase());
    const isFormValid =
        groupName.trim() !== "" &&
        groupModule !== "" &&
        groupSchedule.trim() !== "" &&
        groupLeader.trim() !== "" &&
        leaderEmailValid;

    const [incomingInvites, setIncomingInvites] = useState<GroupInvite[]>([]);
    const [acceptingInviteId, setAcceptingInviteId] = useState<string | null>(null);
    const [decliningInviteId, setDecliningInviteId] = useState<string | null>(null);
    const [inviteActionError, setInviteActionError] = useState("");
    const [joiningId, setJoiningId] = useState<string | null>(null);
    const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
    const [groupMaterials, setGroupMaterials] = useState<Record<string, GroupMaterial[]>>({});
    const [loadingGroupMaterialsId, setLoadingGroupMaterialsId] = useState<string | null>(null);
    const [groupMaterialsCanUpload, setGroupMaterialsCanUpload] = useState<Record<string, boolean>>({});
    const [materialActionError, setMaterialActionError] = useState("");
    const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    const loadGroups = async () => {
        const data = await apiFetch("/groups/");
        setGroups(data.map(apiGroupToGroup));
    };

    const loadIncomingInvites = async () => {
        const data = await apiFetch("/groups/invites/me");
        setIncomingInvites(Array.isArray(data) ? data.map(apiInviteToInvite) : []);
    };

    const loadGroupMaterials = async (groupId: string) => {
        setLoadingGroupMaterialsId(groupId);
        try {
            setMaterialActionError("");
            const data = await apiFetch(`/groups/${groupId}/materials`);
            setGroupMaterials((prev) => ({
                ...prev,
                [groupId]: Array.isArray(data.materials) ? data.materials.map(apiMaterialToMaterial) : [],
            }));
            setGroupMaterialsCanUpload((prev) => ({
                ...prev,
                [groupId]: Boolean(data.can_upload),
            }));
        } finally {
            setLoadingGroupMaterialsId((prev) => (prev === groupId ? null : prev));
        }
    };

    const openGroupMaterial = (groupId: string, materialId: string) => {
        setMaterialActionError("");
        window.open(`${API_BASE}/groups/${groupId}/materials/${materialId}/view`, "_blank", "noopener,noreferrer");
    };

    const downloadGroupMaterial = async (groupId: string, material: GroupMaterial) => {
        setMaterialActionError("");
        try {
            const response = await fetch(`${API_BASE}/groups/${groupId}/materials/${material.id}/download`, {
                credentials: "include",
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data?.detail || "Failed to download file");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = material.filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error: unknown) {
            setMaterialActionError(error instanceof Error ? error.message : "Failed to download file");
        }
    };

    const deleteGroupMaterial = async (groupId: string, material: GroupMaterial) => {
        if (!window.confirm(`Remove "${material.filename}"?`)) return;
        setMaterialActionError("");
        setDeletingMaterialId(material.id);
        try {
            await apiFetch(`/groups/${groupId}/materials/${material.id}`, { method: "DELETE" });
            setGroupMaterials((prev) => ({
                ...prev,
                [groupId]: (prev[groupId] ?? []).filter((item) => item.id !== material.id),
            }));
        } catch (error: unknown) {
            setMaterialActionError(error instanceof Error ? error.message : "Failed to remove file");
        } finally {
            setDeletingMaterialId((prev) => (prev === material.id ? null : prev));
        }
    };

    const resetGroupForm = () => {
        setGroupName("");
        setGroupModule("");
        setGroupSchedule("");
        setGroupMax("6");
        setGroupTags("");
        setGroupLeader("");
        setGroupLeaderEmail("");
        setEditingGroupId(null);
        setCreateError("");
    };

    const openCreateModal = () => {
        resetGroupForm();
        setShowCreateModal(true);
    };

    const openEditModal = (group: Group) => {
        setEditingGroupId(group.id);
        setGroupName(group.name);
        setGroupModule(group.module);
        setGroupSchedule(group.schedule);
        setGroupMax(String(group.max));
        setGroupTags(group.tags.join(", "));
        setGroupLeader(group.leaderName);
        setGroupLeaderEmail(group.leaderEmail);
        setCreateError("");
        setShowCreateModal(true);
    };

    useEffect(() => {
        (async () => {
            try {
                await Promise.all([loadGroups(), loadIncomingInvites()]);
            } catch {
                // silently fall back to empty list
            } finally {
                setLoadingGroups(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (!selectedGroup) return;
        void loadGroupMaterials(selectedGroup.id);
    }, [selectedGroup?.id]);

    const filteredGroups = groups.filter((g) => {
        const q = searchQuery.toLowerCase();
        return (activeFilter === "All" || g.module === activeFilter) &&
            (!q || g.name.toLowerCase().includes(q) || g.module.toLowerCase().includes(q) || g.tags.some(t => t.toLowerCase().includes(q)));
    });

    const handleCreate = async () => {
        if (!groupName.trim() || !groupModule || !groupSchedule.trim() || !groupLeader.trim() || !leaderEmailValid) {
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
            const data = await apiFetch(editingGroupId ? `/groups/${editingGroupId}` : "/groups/", {
                method: editingGroupId ? "PUT" : "POST",
                body: JSON.stringify({
                    name: groupName.trim(),
                    module: groupModule,
                    schedule: groupSchedule.trim(),
                    max_members: maxVal,
                    tags,
                    leader_name: groupLeader.trim(),
                    leader_email: groupLeaderEmail.trim().toLowerCase(),
                }),
            });
            const newGroup = apiGroupToGroup(data);
            setGroups((prev) => editingGroupId ? prev.map((group) => (group.id === newGroup.id ? newGroup : group)) : [newGroup, ...prev]);
            setSelectedGroup((prev) => prev?.id === newGroup.id || !prev ? newGroup : prev);
            setShowCreateModal(false);
            resetGroupForm();
            // ── NEW: reset leader field on success ──
        } catch (err: unknown) {
            setCreateError(err instanceof Error ? err.message : `Failed to ${editingGroupId ? "update" : "create"} group`);
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

    const handleAcceptInvite = async (invite: GroupInvite) => {
        setAcceptingInviteId(invite.id);
        setInviteActionError("");
        try {
            const data = await apiFetch(`/groups/invites/${invite.id}/accept`, { method: "POST" });
            const joinedGroup = apiGroupToGroup(data);
            setGroups((prev) => {
                const exists = prev.some((group) => group.id === joinedGroup.id);
                return exists
                    ? prev.map((group) => (group.id === joinedGroup.id ? joinedGroup : group))
                    : [joinedGroup, ...prev];
            });
            setSelectedGroup(joinedGroup);
            setIncomingInvites((prev) => prev.filter((currentInvite) => currentInvite.id !== invite.id));
        } catch (err: unknown) {
            setInviteActionError(err instanceof Error ? err.message : "Failed to accept invite");
        } finally {
            setAcceptingInviteId(null);
        }
    };

    const handleDeclineInvite = async (invite: GroupInvite) => {
        setDecliningInviteId(invite.id);
        setInviteActionError("");
        try {
            await apiFetch(`/groups/invites/${invite.id}/decline`, { method: "POST" });
            setIncomingInvites((prev) => prev.filter((currentInvite) => currentInvite.id !== invite.id));
        } catch (err: unknown) {
            setInviteActionError(err instanceof Error ? err.message : "Failed to decline invite");
        } finally {
            setDecliningInviteId(null);
        }
    };

    const handleDeleteGroup = async (group: Group) => {
        const confirmed = window.confirm(`Delete "${group.name}" for all members? This cannot be undone.`);
        if (!confirmed) return;

        setDeletingGroupId(group.id);
        try {
            await apiFetch(`/groups/${group.id}`, { method: "DELETE" });
            setGroups((prev) => prev.filter((currentGroup) => currentGroup.id !== group.id));
            setIncomingInvites((prev) => prev.filter((invite) => invite.groupId !== group.id));
            if (selectedGroup?.id === group.id) {
                setSelectedGroup(null);
            }
            setGroupMaterials((prev) => {
                const next = { ...prev };
                delete next[group.id];
                return next;
            });
        } catch (err: unknown) {
            setCreateError(err instanceof Error ? err.message : "Failed to delete group");
        } finally {
            setDeletingGroupId(null);
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
        .pc-danger-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; background: #FEF2F2; color: #DC2626; border: 1px solid rgba(239,68,68,0.22); border-radius: 9px; padding: 0.48rem 1rem; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.78rem; cursor: pointer; transition: all 0.15s ease; }
        .pc-danger-btn:hover:not(:disabled) { background: #FEE2E2; border-color: rgba(239,68,68,0.32); }
        .pc-danger-btn:disabled { opacity: 0.6; cursor: not-allowed; }

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
        .pc-material-list-scroll { max-height: 320px; overflow-y: auto; padding-right: 0.2rem; }
        .pc-material-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0.9rem; background: rgba(255,255,255,0.5); border: 1px solid rgba(96, 125, 173, 0.20); border-radius: 11px; cursor: pointer; transition: all 0.15s ease; }
        .pc-material-item:hover { background: rgba(255,255,255,0.72); border-color: rgba(96, 125, 173, 0.30); transform: translateX(2px); }
        .pc-material-type-badge { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.56rem; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; color: #fff; }
        .pc-material-info { flex: 1; min-width: 0; }
        .pc-material-title { font-size: 0.82rem; font-weight: 500; color: #1E293B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'DM Sans', sans-serif; }
        .pc-material-size { font-size: 0.7rem; color: #475569; margin-top: 0.12rem; font-family: 'DM Sans', sans-serif; }
        .pc-material-actions { display: flex; gap: 0.45rem; flex-shrink: 0; }
        .pc-material-action { border: 1px solid rgba(96, 125, 173, 0.22); background: rgba(255,255,255,0.9); color: #334155; border-radius: 9px; padding: 0.42rem 0.7rem; font-size: 0.72rem; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer; }
        .pc-material-action:hover { background: #ffffff; border-color: rgba(96, 125, 173, 0.35); }

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
        .pc-invite-empty { font-size: 0.78rem; color: #475569; font-family: 'DM Sans', sans-serif; background: rgba(255,255,255,0.45); border: 1px dashed rgba(96, 125, 173, 0.26); border-radius: 11px; padding: 0.85rem 1rem; }
        .pc-invite-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; background: rgba(255,255,255,0.5); border: 1px solid rgba(96, 125, 173, 0.18); border-radius: 11px; padding: 0.75rem 0.9rem; }
        .pc-invite-row-main { min-width: 0; }
        .pc-invite-row-email { font-size: 0.84rem; font-weight: 600; color: #1E293B; font-family: 'DM Sans', sans-serif; word-break: break-word; }
        .pc-invite-row-meta { font-size: 0.72rem; color: #64748B; font-family: 'DM Sans', sans-serif; margin-top: 0.2rem; }
        .pc-invite-status { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 0.28rem 0.7rem; text-transform: capitalize; font-size: 0.68rem; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif; }
        .pc-status-pending { color: #92400E; background: #FEF3C7; border: 1px solid rgba(245,158,11,0.28); }
        .pc-status-accepted { color: #065F46; background: #D1FAE5; border: 1px solid rgba(16,185,129,0.24); }
        .pc-status-declined { color: #991B1B; background: #FEE2E2; border: 1px solid rgba(239,68,68,0.24); }
        .pc-incoming-card { background: #ECF3FF; border: 1px solid rgba(37,99,235,0.2); border-radius: 18px; padding: 1.35rem; box-shadow: 0 8px 22px rgba(37,99,235,0.08); margin-bottom: 1.8rem; }
        .pc-incoming-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .pc-incoming-item { display: flex; justify-content: space-between; align-items: center; gap: 1rem; background: rgba(255,255,255,0.72); border: 1px solid rgba(96,125,173,0.18); border-radius: 14px; padding: 1rem; }
        .pc-incoming-copy { min-width: 0; }
        .pc-incoming-title { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; font-size: 0.95rem; font-weight: 700; color: #1E3A8A; font-family: 'Plus Jakarta Sans', sans-serif; }
        .pc-incoming-module { display: inline-flex; align-items: center; justify-content: center; padding: 0.2rem 0.55rem; border-radius: 999px; background: rgba(37,99,235,0.12); color: #2563EB; font-size: 0.68rem; letter-spacing: 0.04em; text-transform: uppercase; }
        .pc-incoming-subtitle { margin-top: 0.28rem; font-size: 0.8rem; color: #475569; font-family: 'DM Sans', sans-serif; }
        .pc-incoming-actions { display: flex; gap: 0.55rem; flex-shrink: 0; }
        .pc-incoming-btn { border: none; border-radius: 10px; padding: 0.62rem 1rem; font-size: 0.78rem; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer; transition: all 0.15s ease; }
        .pc-incoming-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .pc-incoming-btn.pc-accept { background: #2563EB; color: #fff; box-shadow: 0 8px 20px rgba(37,99,235,0.18); }
        .pc-incoming-btn.pc-accept:hover:not(:disabled) { background: #1D4ED8; }
        .pc-incoming-btn.pc-decline { background: #fff; color: #475569; border: 1px solid rgba(148,163,184,0.28); }
        .pc-incoming-btn.pc-decline:hover:not(:disabled) { background: #F8FAFC; }
        @media (max-width: 640px) {
          .pc-incoming-item { flex-direction: column; align-items: stretch; }
          .pc-incoming-actions { width: 100%; }
          .pc-incoming-btn { flex: 1; }
        }
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
                const materials = groupMaterials[selectedGroup.id] ?? [];
                const canUploadMaterials = groupMaterialsCanUpload[selectedGroup.id] ?? selectedGroup.isJoined;
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
                                {selectedGroup.canEdit && (
                                    <>
                                        <button className="pc-back-btn" style={{ marginBottom: 0 }} onClick={() => openEditModal(selectedGroup)}>
                                            Edit Group
                                        </button>
                                        <button
                                            className="pc-danger-btn"
                                            disabled={deletingGroupId === selectedGroup.id}
                                            onClick={() => void handleDeleteGroup(selectedGroup)}
                                        >
                                            {deletingGroupId === selectedGroup.id ? "Deleting..." : "Delete Group"}
                                        </button>
                                    </>
                                )}
                            </div>
                            <div className="pc-mat-content-grid">
                                <MeetingPanel group={selectedGroup} moduleColor={selectedGroup.moduleColor} />
                                <div className="pc-mat-card">
                                    <div className="pc-mat-card-title">
                                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4.5 5h5M4.5 7.5h5M4.5 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                                        Study Materials
                                    </div>
                                    <div className="pc-material-list pc-material-list-scroll">
                                        {loadingGroupMaterialsId === selectedGroup.id ? (
                                            <div className="pc-invite-empty">Loading group materials...</div>
                                        ) : materials.length === 0 ? (
                                            <div className="pc-invite-empty">No study materials uploaded for this group yet.</div>
                                        ) : materials.map((m) => (
                                            <div key={m.id} className="pc-material-item">
                                                <div className="pc-material-type-badge" style={{ background: FILE_TYPE_COLORS[m.fileType] ?? "#8A8AAA" }}>{m.fileType}</div>
                                                <div className="pc-material-info">
                                                    <div className="pc-material-title">{m.filename}</div>
                                                    <div className="pc-material-size">{formatFileSize(m.fileSizeBytes)} · by {m.uploadedByName}</div>
                                                </div>
                                                <div className="pc-material-actions">
                                                    <button className="pc-material-action" type="button" onClick={() => openGroupMaterial(selectedGroup.id, m.id)}>
                                                        Open
                                                    </button>
                                                    <button className="pc-material-action" type="button" onClick={() => void downloadGroupMaterial(selectedGroup.id, m)}>
                                                        Download
                                                    </button>
                                                    {m.canDelete && (
                                                        <button
                                                            className="pc-material-action"
                                                            type="button"
                                                            disabled={deletingMaterialId === m.id}
                                                            onClick={() => void deleteGroupMaterial(selectedGroup.id, m)}
                                                        >
                                                            {deletingMaterialId === m.id ? "Removing..." : "Remove"}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* ── NEW: Invite Member card, below the two existing cards ── */}
                            <InviteMemberCard group={selectedGroup} moduleColor={selectedGroup.moduleColor} />
                            {/* ── NEW: Upload Study Material card, below the invite card ── */}
                            <UploadMaterialCard
                                group={selectedGroup}
                                moduleColor={selectedGroup.moduleColor}
                                canUpload={canUploadMaterials}
                                onUploaded={(material) => {
                                    setGroupMaterials((prev) => ({
                                        ...prev,
                                        [selectedGroup.id]: [material, ...(prev[selectedGroup.id] ?? [])],
                                    }));
                                }}
                            />
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
                            <button className="pc-create-btn" onClick={openCreateModal}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                                Create New Group
                            </button>
                        </header>

                        {/* --- NEW ACTIVITY GRAPH SECTION --- */}
                        <ActivityGraph activeGroupsCount={loadingGroups ? 0 : groups.length} />
                        <IncomingInvitesCard
                            invites={incomingInvites}
                            acceptingInviteId={acceptingInviteId}
                            decliningInviteId={decliningInviteId}
                            onAccept={(invite) => void handleAcceptInvite(invite)}
                            onDecline={(invite) => void handleDeclineInvite(invite)}
                        />
                        {inviteActionError && <div className="pc-form-error" style={{ marginBottom: "1.5rem" }}>{inviteActionError}</div>}

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
                <div className="pc-modal-overlay" onClick={() => !creating && (setShowCreateModal(false), resetGroupForm())}>
                    <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="pc-modal-header">
                            <div className="pc-modal-title">{editingGroupId ? "Edit Study Group" : "Create Study Group"}</div>
                            <button className="pc-modal-close" onClick={() => { setShowCreateModal(false); resetGroupForm(); }}>×</button>
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
                        <div className="pc-form-group">
                            <label className="pc-form-label">Group Leader Email</label>
                            <input className="pc-form-input" type="email" placeholder="e.g. leader@example.com" value={groupLeaderEmail} onChange={(e) => setGroupLeaderEmail(e.target.value)} />
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
                            {creating ? (editingGroupId ? "Saving..." : "Creating...") : (editingGroupId ? "Save Changes" : "Launch Group")}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
