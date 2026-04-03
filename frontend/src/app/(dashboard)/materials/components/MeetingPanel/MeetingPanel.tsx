'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import type { Group, ActiveMeeting } from '../../types';
import { CreateMeetingModal } from './CreateMeetingModal';
import { MeetingHistory } from './MeetingHistory';
import { API_BASE } from '../../constants';

interface MeetingPanelProps {
    group: Group;
    moduleColor: string;
}

interface TelemetrySummary {
    event_count: number;
    by_status: { attempted: number; success: number; failed: number };
    by_method: { app: number; browser: number; copy: number };
    join_success_rate: number;
}

export const MeetingPanel = ({ group, moduleColor }: MeetingPanelProps) => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeMeeting, setActiveMeeting] = useState<ActiveMeeting | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const [showHistory, setShowHistory] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [fetchingUser, setFetchingUser] = useState(true);
    const [joinLoading, setJoinLoading] = useState(false);
    const [joinInfo, setJoinInfo] = useState('');
    const [showTroubleshooter, setShowTroubleshooter] = useState(false);
    const [pollingPaused, setPollingPaused] = useState(false);
    const [backendOffline, setBackendOffline] = useState(false);
    const [telemetrySummary, setTelemetrySummary] = useState<TelemetrySummary | null>(null);

    // Fetch current user info
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await apiFetch('/users/me');
                setCurrentUserId(user.id);
            } catch (err) {
                // Silent fail - user fetch is not critical
            } finally {
                setFetchingUser(false);
            }
        };

        fetchUser();
    }, []);

    // Fetch active meeting
    useEffect(() => {
        if (!group.isJoined || fetchingUser || !currentUserId || pollingPaused) {
            setActiveMeeting(null);
            return;
        }

        const fetchMeeting = async () => {
            try {
                setError('');
                setBackendOffline(false);
                const response = await fetch(
                    `${API_BASE}/groups/${group.id}/meetings/active`,
                    { credentials: 'include' }
                );
                
                if (response.ok) {
                    const data = await response.json();
                    setActiveMeeting(data?.meeting ?? null);
                } else if (response.status === 401) {
                    setPollingPaused(true);
                    setActiveMeeting(null);
                    setError('Your session expired. Please log in again to access meetings.');
                } else if (response.status === 403) {
                    setPollingPaused(true);
                    setActiveMeeting(null);
                    setError('You must join this group to access meetings.');
                } else {
                    const err = await response.json().catch(() => ({}));
                    setError(err.detail || 'Failed to fetch meeting');
                }
            } catch (err) {
                // Pause polling on connection failures to prevent repeated noisy fetch errors.
                setActiveMeeting(null);
                setPollingPaused(true);
                setBackendOffline(true);
                setError('Cannot connect to backend right now. Please check if backend is running, then retry.');
            }
        };

        fetchMeeting();
        const interval = setInterval(fetchMeeting, 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, [group.id, group.isJoined, refreshKey, fetchingUser, currentUserId, pollingPaused]);

    useEffect(() => {
        if (!showHistory || !group.isJoined) return;

        const fetchTelemetrySummary = async () => {
            try {
                const data = await apiFetch(`/groups/${group.id}/meetings/telemetry-summary`);
                setTelemetrySummary(data as TelemetrySummary);
            } catch {
                setTelemetrySummary(null);
            }
        };

        void fetchTelemetrySummary();
    }, [showHistory, group.id, group.isJoined, refreshKey]);

    const handleStartManualMeeting = async (platform: 'zoom' | 'teams', meetingLink: string) => {
        setLoading(true);
        setError('');
        setPollingPaused(false);
        try {
            const response = await fetch(
                `${API_BASE}/groups/${group.id}/meetings/start-manual`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        platform,
                        meeting_link: meetingLink,
                    }),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                setActiveMeeting(data.meeting);
                setShowCreateModal(false);
                setJoinInfo('Meeting created from your Teams invite link.');
            } else {
                setError(data.detail || 'Failed to start meeting from link');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start meeting from link');
        } finally {
            setLoading(false);
        }
    };

    const handleEndMeeting = async () => {
        if (!window.confirm('End the meeting? All members will lose access to the meeting link.')) {
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await fetch(
                `${API_BASE}/groups/${group.id}/meetings/end`,
                {
                    method: 'POST',
                    credentials: 'include',
                }
            );

            if (response.ok) {
                setActiveMeeting(null);
                setRefreshKey((k) => k + 1);
            } else {
                const data = await response.json();
                if (response.status === 403) {
                    setError('Only the member who started the meeting can end it');
                } else {
                    setError(data.detail || 'Failed to end meeting');
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to end meeting');
        } finally {
            setLoading(false);
        }
    };

    // Check if current user started this meeting
    const canEndMeeting = activeMeeting && currentUserId && activeMeeting.started_by_id === currentUserId;

    const getMeetingLinks = (meeting: ActiveMeeting) => {
        if (meeting.web_link || meeting.app_link) {
            return {
                webLink: meeting.web_link || meeting.meeting_link,
                appLink: meeting.app_link || meeting.meeting_link,
            };
        }

        const webLink = meeting.meeting_link;
        if (meeting.platform === 'teams') {
            const appLink = webLink.startsWith('https://teams.microsoft.com')
                ? webLink.replace('https://teams.microsoft.com', 'msteams://teams.microsoft.com')
                : webLink;
            return { webLink, appLink };
        }

        // Zoom native app deep link when meeting code is available.
        const appLink = meeting.meeting_code
            ? `zoommtg://zoom.us/join?action=join&confno=${meeting.meeting_code}`
            : webLink;
        return { webLink, appLink };
    };

    const logJoinTelemetry = async (
        method: 'app' | 'browser' | 'copy',
        status: 'attempted' | 'success' | 'failed',
        detail?: string
    ) => {
        try {
            const clientPlatform = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
            await apiFetch(`/groups/${group.id}/meetings/join-event`, {
                method: 'POST',
                body: JSON.stringify({
                    method,
                    status,
                    client_platform: clientPlatform,
                    detail,
                }),
            });
        } catch {
            // Telemetry should not block user actions.
        }
    };

    const isLikelyTeamsPlaceholderLink = (meeting: ActiveMeeting) => {
        if (meeting.platform !== 'teams') return false;
        if (meeting.source === 'manual_link') return false;
        if (meeting.provider_status === 'success' && meeting.meeting_link.includes('/l/meetup-join/')) return false;
        return !meeting.meeting_link.includes('%40thread.v2') || !meeting.meeting_link.includes('context=');
    };

    const handleJoinMeeting = async (mode: 'app' | 'browser') => {
        if (!activeMeeting?.meeting_link) {
            setError('Meeting link is unavailable right now. Please refresh and try again.');
            return;
        }

        setJoinLoading(true);
        setJoinInfo('');
        setError('');

        try {
            await logJoinTelemetry(mode, 'attempted');
            const access = await apiFetch(`/groups/${group.id}/meetings/validate-access`, { method: 'POST' });
            setPollingPaused(false);
            if (!access?.has_active_meeting) {
                setError('No active meeting found. Ask a member to start one and retry.');
                return;
            }

            const accessMeeting = (access?.meeting || {}) as Partial<ActiveMeeting>;
            const effectiveMeeting: ActiveMeeting = {
                ...activeMeeting,
                ...(accessMeeting as ActiveMeeting),
                app_link: access?.app_link || accessMeeting.app_link || activeMeeting.app_link,
                web_link: access?.web_link || accessMeeting.web_link || activeMeeting.web_link,
            };

            const { webLink, appLink } = getMeetingLinks(effectiveMeeting);
            const targetLink = mode === 'app' ? appLink : webLink;

            if (mode === 'app') {
                await logJoinTelemetry(mode, 'success', 'launched_external_handler');
                window.location.href = targetLink;
                if (activeMeeting.platform === 'teams') {
                    setJoinInfo('If Teams app did not open, use "Join in Browser" below.');
                }
                return;
            }

            window.open(targetLink, '_blank', 'noopener,noreferrer');
            await logJoinTelemetry(mode, 'success');
        } catch (err: unknown) {
            const detail = err instanceof Error ? err.message : 'unknown_error';
            await logJoinTelemetry(mode, 'failed', detail);
            setError(err instanceof Error ? err.message : 'Unable to join meeting. Please try again.');
        } finally {
            setJoinLoading(false);
        }
    };

    const handleCopyMeetingLink = async () => {
        if (!activeMeeting?.meeting_link) return;
        try {
            await navigator.clipboard.writeText(activeMeeting.meeting_link);
            await logJoinTelemetry('copy', 'success');
            setJoinInfo('Meeting link copied. Share it with your group members.');
        } catch {
            await logJoinTelemetry('copy', 'failed', 'clipboard_write_failed');
            setJoinInfo('Copy failed. Please copy the URL from your browser address bar.');
        }
    };

    const getPlatformIcon = (platform: string) => {
        if (platform === 'zoom') return '🔵';
        if (platform === 'teams') return '◼️';
        return '📹';
    };

    return (
        <>
            <div className="pc-mat-card">
                <div className="pc-mat-card-title">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path
                            d="M7 1.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM7 4v3.5l2 2"
                            stroke="currentColor"
                            strokeWidth="1.3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    Video Meeting
                </div>

                {error && (
                    <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.75rem', padding: '0.5rem' }}>
                        ⚠️ {error}
                    </div>
                )}

                {backendOffline && (
                    <button
                        onClick={() => {
                            setBackendOffline(false);
                            setPollingPaused(false);
                            setRefreshKey((k) => k + 1);
                        }}
                        style={{
                            marginBottom: '0.75rem',
                            padding: '0.55rem 0.9rem',
                            background: '#0f172a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        Retry Backend Connection
                    </button>
                )}

                {activeMeeting && activeMeeting.is_active ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* Active Meeting Status */}
                        <div
                            style={{
                                padding: '1rem',
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                borderRadius: '0.5rem',
                            }}
                        >
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#22c55e', marginBottom: '0.5rem' }}>
                                {getPlatformIcon(activeMeeting.platform)} Meeting Active
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                Platform: <strong>{activeMeeting.platform.toUpperCase()}</strong>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                Started by: <strong>{activeMeeting.started_by}</strong>
                            </div>
                            {(activeMeeting.source || activeMeeting.provider_status) && (
                                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                    Source: <strong>{activeMeeting.source || 'n/a'}</strong> • Status: <strong>{activeMeeting.provider_status || 'n/a'}</strong>
                                </div>
                            )}
                            {activeMeeting.provider_error && (
                                <div style={{ fontSize: '0.75rem', color: '#b45309' }}>
                                    Provider note: {activeMeeting.provider_error}
                                </div>
                            )}
                        </div>

                        {isLikelyTeamsPlaceholderLink(activeMeeting) && (
                            <div
                                style={{
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    background: 'rgba(245, 158, 11, 0.08)',
                                    fontSize: '0.75rem',
                                    color: '#92400e',
                                }}
                            >
                                Teams link looks like a demo link. For real-user testing, connect Microsoft Graph meeting creation.
                            </div>
                        )}

                        {/* Join Flow */}
                        {activeMeeting.platform === 'teams' ? (
                            <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: '1fr 1fr' }}>
                                <button
                                    onClick={() => void handleJoinMeeting('app')}
                                    disabled={loading || joinLoading}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        background: '#22c55e',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.875rem',
                                        cursor: loading || joinLoading ? 'not-allowed' : 'pointer',
                                        opacity: loading || joinLoading ? 0.6 : 1,
                                        fontWeight: 600,
                                    }}
                                >
                                    {joinLoading ? 'Opening...' : 'Open Teams App'}
                                </button>
                                <button
                                    onClick={() => void handleJoinMeeting('browser')}
                                    disabled={loading || joinLoading}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        background: '#0ea5e9',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.875rem',
                                        cursor: loading || joinLoading ? 'not-allowed' : 'pointer',
                                        opacity: loading || joinLoading ? 0.6 : 1,
                                        fontWeight: 600,
                                    }}
                                >
                                    Join in Browser
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => void handleJoinMeeting('browser')}
                                disabled={loading || joinLoading}
                                style={{
                                    padding: '0.75rem 1rem',
                                    background: '#22c55e',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    cursor: loading || joinLoading ? 'not-allowed' : 'pointer',
                                    opacity: loading || joinLoading ? 0.6 : 1,
                                    fontWeight: 600,
                                }}
                            >
                                {joinLoading ? 'Opening...' : '↗ Join Meeting'}
                            </button>
                        )}

                        <button
                            onClick={() => void handleCopyMeetingLink()}
                            style={{
                                padding: '0.6rem 1rem',
                                background: 'transparent',
                                color: '#4f46e5',
                                border: '1px solid #c7d2fe',
                                borderRadius: '0.375rem',
                                fontSize: '0.825rem',
                                cursor: 'pointer',
                                fontWeight: 500,
                            }}
                        >
                            Copy Meeting Link
                        </button>

                        <button
                            onClick={() => setShowTroubleshooter(true)}
                            style={{
                                padding: '0.6rem 1rem',
                                background: '#f8fafc',
                                color: '#0f172a',
                                border: '1px solid #cbd5e1',
                                borderRadius: '0.375rem',
                                fontSize: '0.825rem',
                                cursor: 'pointer',
                                fontWeight: 500,
                            }}
                        >
                            Join Troubleshooter
                        </button>

                        {joinInfo && (
                            <div style={{ fontSize: '0.75rem', color: '#475569' }}>{joinInfo}</div>
                        )}

                        {/* End Meeting Button */}
                        <button
                            onClick={handleEndMeeting}
                            disabled={loading || !canEndMeeting}
                            title={!canEndMeeting ? 'Only the member who started the meeting can end it' : ''}
                            style={{
                                padding: '0.75rem 1rem',
                                background: canEndMeeting ? '#ef4444' : '#d1d5db',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                                cursor: canEndMeeting && !loading ? 'pointer' : 'not-allowed',
                                opacity: loading ? 0.6 : 1,
                                fontWeight: 500,
                            }}
                        >
                            {loading ? 'Ending...' : '✕ End Meeting'}
                        </button>

                        {/* View History */}
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            style={{
                                padding: '0.5rem 1rem',
                                background: 'transparent',
                                color: '#3b82f6',
                                border: '1px solid #3b82f6',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                fontWeight: 500,
                            }}
                        >
                            {showHistory ? '▼ Hide' : '▶ Show'} Meeting History
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {group.isJoined ? (
                            <>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    disabled={loading}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        background: '#2563eb',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.875rem',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.6 : 1,
                                        fontWeight: 500,
                                    }}
                                >
                                    + Start Meeting
                                </button>
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: 'transparent',
                                        color: '#3b82f6',
                                        border: '1px solid #3b82f6',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.875rem',
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                    }}
                                >
                                    {showHistory ? '▼ Hide' : '▶ Show'} Meeting History
                                </button>
                            </>
                        ) : (
                            <div style={{ padding: '1rem', textAlign: 'center', color: '#666', fontSize: '0.875rem' }}>
                                Join the group to start or join meetings
                            </div>
                        )}
                    </div>
                )}

                {showHistory && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                        {telemetrySummary && (
                            <div style={{ marginBottom: '0.8rem', fontSize: '0.8rem', color: '#334155', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.45rem', padding: '0.55rem 0.7rem' }}>
                                Reliability: {telemetrySummary.join_success_rate}% success • Attempts: {telemetrySummary.by_status.attempted} • Success: {telemetrySummary.by_status.success} • Failed: {telemetrySummary.by_status.failed}
                            </div>
                        )}
                        <MeetingHistory groupId={group.id} />
                    </div>
                )}
            </div>

            {/* Create Meeting Modal */}
            <CreateMeetingModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onStartManual={handleStartManualMeeting}
                loading={loading}
            />

            <JoinTroubleshooterModal
                isOpen={showTroubleshooter}
                onClose={() => setShowTroubleshooter(false)}
                meeting={activeMeeting}
                onJoinBrowser={() => void handleJoinMeeting('browser')}
                onCopyLink={() => void handleCopyMeetingLink()}
            />
        </>
    );
};

interface JoinTroubleshooterModalProps {
    isOpen: boolean;
    onClose: () => void;
    meeting: ActiveMeeting | null;
    onJoinBrowser: () => void;
    onCopyLink: () => void;
}

const JoinTroubleshooterModal = ({
    isOpen,
    onClose,
    meeting,
    onJoinBrowser,
    onCopyLink,
}: JoinTroubleshooterModalProps) => {
    if (!isOpen) return null;

    const isTeams = meeting?.platform === 'teams';

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.5)',
                zIndex: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '34rem',
                    background: '#fff',
                    borderRadius: '0.75rem',
                    boxShadow: '0 20px 40px rgba(2, 6, 23, 0.25)',
                    padding: '1.25rem',
                }}
                onClick={(event) => event.stopPropagation()}
            >
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                    Join Troubleshooter
                </h3>
                <p style={{ marginTop: '0.5rem', marginBottom: '1rem', fontSize: '0.86rem', color: '#475569', lineHeight: 1.5 }}>
                    Use these steps if the app opens but you do not land in the correct meeting.
                </p>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.8rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Meeting Platform</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{meeting?.platform?.toUpperCase() ?? 'UNKNOWN'}</div>
                </div>

                <div style={{ display: 'grid', gap: '0.55rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#0f172a' }}>1. Keep Teams signed in with the same account used in your group.</div>
                    <div style={{ fontSize: '0.85rem', color: '#0f172a' }}>2. Try Join in Browser first, then switch to app after the meeting page loads.</div>
                    <div style={{ fontSize: '0.85rem', color: '#0f172a' }}>3. If still failing, copy and paste the meeting link directly into Teams or browser.</div>
                    {isTeams && (
                        <div style={{ fontSize: '0.85rem', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.4rem', padding: '0.55rem' }}>
                            Teams requires a real joinWebUrl from Microsoft Graph for reliable external-user testing.
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCopyLink}
                        style={{
                            padding: '0.6rem 0.9rem',
                            borderRadius: '0.4rem',
                            border: '1px solid #cbd5e1',
                            background: '#fff',
                            color: '#0f172a',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                        }}
                    >
                        Copy Link
                    </button>
                    <button
                        onClick={onJoinBrowser}
                        style={{
                            padding: '0.6rem 0.9rem',
                            borderRadius: '0.4rem',
                            border: 'none',
                            background: '#0ea5e9',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                        }}
                    >
                        Join in Browser
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.6rem 0.9rem',
                            borderRadius: '0.4rem',
                            border: '1px solid #e2e8f0',
                            background: '#f8fafc',
                            color: '#334155',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
