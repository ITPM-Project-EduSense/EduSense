'use client';

import { useState, useEffect } from 'react';
import { API_BASE } from '../../constants';
import type { MeetingRecord } from '../../types';

interface MeetingHistoryProps {
    groupId: string;
}

export const MeetingHistory = ({ groupId }: MeetingHistoryProps) => {
    const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setError('');
                setLoading(true);
                const response = await fetch(
                    `${API_BASE}/groups/${groupId}/meetings/history?limit=20`,
                    { credentials: 'include' }
                );

                if (response.ok) {
                    const data = await response.json();
                    setMeetings(data.meetings || []);
                } else if (response.status === 404) {
                    setMeetings([]);
                } else {
                    const err = await response.json().catch(() => ({}));
                    setError(err.detail || 'Failed to fetch meeting history');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch meeting history');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [groupId]);

    if (loading) {
        return (
            <div style={{ fontSize: '0.875rem', color: '#666', textAlign: 'center', padding: '1rem' }}>
                Loading meeting history...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ fontSize: '0.875rem', color: '#ef4444', padding: '0.75rem' }}>
                ⚠️ {error}
            </div>
        );
    }

    if (meetings.length === 0) {
        return (
            <div style={{ fontSize: '0.875rem', color: '#666', textAlign: 'center', padding: '1rem' }}>
                No past meetings in this group.
            </div>
        );
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getPlatformIcon = (platform: string) => {
        if (platform === 'zoom') return '🔵';
        if (platform === 'teams') return '◼️';
        return '📹';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>
                Past Meetings
            </div>
            {meetings.map((meeting, idx) => (
                <div
                    key={`${meeting.platform}-${meeting.started_at}-${idx}`}
                    style={{
                        padding: '0.75rem',
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 600, color: '#1f2937' }}>
                            {getPlatformIcon(meeting.platform)} {meeting.platform.toUpperCase()} Meeting
                        </div>
                        {meeting.duration_minutes && (
                            <div style={{ color: '#666' }}>
                                {meeting.duration_minutes} min
                            </div>
                        )}
                    </div>
                    <div style={{ color: '#666' }}>
                        Started: {formatDate(meeting.started_at)}
                    </div>
                    {meeting.ended_at && (
                        <div style={{ color: '#666' }}>
                            Ended: {formatDate(meeting.ended_at)}
                        </div>
                    )}
                    {(meeting.source || meeting.provider_status || meeting.provider_error) && (
                        <div style={{ color: '#64748b', marginTop: '0.35rem' }}>
                            Source: {meeting.source || 'n/a'} • Status: {meeting.provider_status || 'n/a'}
                            {meeting.provider_error ? ` • Error: ${meeting.provider_error}` : ''}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
