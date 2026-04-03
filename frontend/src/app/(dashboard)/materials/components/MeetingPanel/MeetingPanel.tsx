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

export const MeetingPanel = ({ group, moduleColor }: MeetingPanelProps) => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeMeeting, setActiveMeeting] = useState<ActiveMeeting | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const [showHistory, setShowHistory] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [fetchingUser, setFetchingUser] = useState(true);

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
        const fetchMeeting = async () => {
            try {
                setError('');
                const response = await fetch(
                    `${API_BASE}/groups/${group.id}/meetings/active`,
                    { credentials: 'include' }
                );
                
                if (response.ok) {
                    const data = await response.json();
                    setActiveMeeting(data.meeting);
                } else if (response.status === 404) {
                    setActiveMeeting(null);
                } else {
                    const err = await response.json().catch(() => ({}));
                    setError(err.detail || 'Failed to fetch meeting');
                }
            } catch (err) {
                // Silent fail - no active meeting is expected
                setActiveMeeting(null);
            }
        };

        fetchMeeting();
        const interval = setInterval(fetchMeeting, 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, [group.id, refreshKey]);

    const handleStartMeeting = async (platform: 'zoom' | 'teams') => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(
                `${API_BASE}/groups/${group.id}/meetings/start?platform=${platform}`,
                {
                    method: 'POST',
                    credentials: 'include',
                }
            );

            const data = await response.json();

            if (response.ok) {
                setActiveMeeting(data.meeting);
                setShowCreateModal(false);
            } else {
                setError(data.detail || 'Failed to start meeting');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start meeting');
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

    const handleJoinMeeting = () => {
        if (activeMeeting?.meeting_link) {
            window.open(activeMeeting.meeting_link, '_blank', 'noopener,noreferrer');
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
                        </div>

                        {/* Join Button */}
                        <button
                            onClick={handleJoinMeeting}
                            disabled={loading}
                            style={{
                                padding: '0.75rem 1rem',
                                background: '#22c55e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.6 : 1,
                                fontWeight: 500,
                            }}
                        >
                            ↗ Join Meeting
                        </button>

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
                        <MeetingHistory groupId={group.id} />
                    </div>
                )}
            </div>

            {/* Create Meeting Modal */}
            <CreateMeetingModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onStart={handleStartMeeting}
                loading={loading}
            />
        </>
    );
};
