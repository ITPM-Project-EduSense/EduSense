'use client';

import { useState } from 'react';

interface CreateMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartManual: (platform: 'zoom' | 'teams', meetingLink: string) => Promise<void>;
    loading: boolean;
}

export const CreateMeetingModal = ({
    isOpen,
    onClose,
    onStartManual,
    loading,
}: CreateMeetingModalProps) => {
    const [selectedPlatform, setSelectedPlatform] = useState<'zoom_manual' | 'teams_manual' | null>(null);
    const [manualLink, setManualLink] = useState('');

    const trimmedLink = manualLink.trim();
    const manualLinkError = (() => {
        if (!selectedPlatform || !trimmedLink) return "";

        if (!/^https?:\/\//i.test(trimmedLink)) {
            return "Please enter a valid URL starting with http:// or https://.";
        }

        if (selectedPlatform === 'teams_manual') {
            if (!trimmedLink.includes('teams.microsoft.com')) {
                return "Please paste a Microsoft Teams link.";
            }
            if (!trimmedLink.includes('/l/meetup-join/') && !trimmedLink.includes('/meet/')) {
                return "This looks like a Team/Channel link. Please paste a Teams meeting invite link containing '/l/meetup-join/' or '/meet/'.";
            }
        }

        if (selectedPlatform === 'zoom_manual') {
            if (!trimmedLink.toLowerCase().includes('zoom')) {
                return "Please paste a Zoom meeting invite link.";
            }
        }

        return "";
    })();

    const handleStart = async () => {
        if (selectedPlatform === 'teams_manual' || selectedPlatform === 'zoom_manual') {
            const link = trimmedLink;
            if (!link || manualLinkError) return;
            await onStartManual(selectedPlatform === 'teams_manual' ? 'teams' : 'zoom', link);
            setSelectedPlatform(null);
            setManualLink('');
            return;
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Modal Overlay */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                }}
                onClick={onClose}
            >
                {/* Modal Content */}
                <div
                    style={{
                        background: 'white',
                        borderRadius: '0.75rem',
                        padding: '2rem',
                        width: '90%',
                        maxWidth: '28rem',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        Start a Meeting
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem' }}>
                        Choose a platform to start a video meeting for your group.
                    </p>

                    {/* Platform Selection */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                        {/* Zoom Option */}
                        <button
                            onClick={() => setSelectedPlatform('zoom_manual')}
                            style={{
                                padding: '1rem',
                                border: selectedPlatform === 'zoom_manual' ? '2px solid #2563eb' : '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                background:
                                    selectedPlatform === 'zoom_manual' ? 'rgba(37, 99, 235, 0.05)' : 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                transition: 'all 0.2s',
                            }}
                        >
                            <div
                                style={{
                                    width: '2.5rem',
                                    height: '2.5rem',
                                    borderRadius: '0.5rem',
                                    background: '#2D8CFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                }}
                            >
                                Z
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: 600, color: '#1f2937' }}>Use Existing Zoom Link</div>
                                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                    Paste a Zoom invite URL created by a group member.
                                </div>
                            </div>
                        </button>

                        {/* Teams Option */}
                        <button
                            onClick={() => setSelectedPlatform('teams_manual')}
                            style={{
                                padding: '1rem',
                                border: selectedPlatform === 'teams_manual' ? '2px solid #2563eb' : '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                background:
                                    selectedPlatform === 'teams_manual' ? 'rgba(37, 99, 235, 0.05)' : 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                transition: 'all 0.2s',
                            }}
                        >
                            <div
                                style={{
                                    width: '2.5rem',
                                    height: '2.5rem',
                                    borderRadius: '0.5rem',
                                    background: '#0f172a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                }}
                            >
                                🔗
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: 600, color: '#1f2937' }}>Use Existing Teams Link</div>
                                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                    No Entra setup needed. Paste a Teams invite URL.
                                </div>
                            </div>
                        </button>
                    </div>

                    {(selectedPlatform === 'teams_manual' || selectedPlatform === 'zoom_manual') && (
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#475569', marginBottom: '0.35rem' }}>
                                {selectedPlatform === 'teams_manual' ? 'Teams Meeting Link' : 'Zoom Meeting Link'}
                            </label>
                            <input
                                type="url"
                                value={manualLink}
                                onChange={(event) => setManualLink(event.target.value)}
                                placeholder={selectedPlatform === 'teams_manual'
                                    ? 'https://teams.microsoft.com/l/meetup-join/...'
                                    : 'https://zoom.us/j/...'}
                                style={{
                                    width: '100%',
                                    border: manualLinkError ? '1px solid #ef4444' : '1px solid #cbd5e1',
                                    borderRadius: '0.4rem',
                                    padding: '0.65rem 0.75rem',
                                    fontSize: '0.85rem',
                                }}
                            />
                            {manualLinkError && (
                                <p style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: '#b91c1c' }}>
                                    {manualLinkError}
                                </p>
                            )}
                            <p style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: '#64748b' }}>
                                Only group members can add and share this session link.
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button
                            onClick={onClose}
                            disabled={loading}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: '#f3f4f6',
                                color: '#374151',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.6 : 1,
                                fontWeight: 500,
                                fontSize: '0.875rem',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleStart}
                            disabled={
                                !selectedPlatform ||
                                loading ||
                                ((selectedPlatform === 'teams_manual' || selectedPlatform === 'zoom_manual') && (trimmedLink === '' || manualLinkError !== ''))
                            }
                            style={{
                                padding: '0.75rem 1.5rem',
                                background:
                                    selectedPlatform && !loading && ((selectedPlatform !== 'teams_manual' && selectedPlatform !== 'zoom_manual') || (trimmedLink && !manualLinkError))
                                        ? '#2563eb'
                                        : '#9ca3af',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor:
                                    selectedPlatform && !loading && ((selectedPlatform !== 'teams_manual' && selectedPlatform !== 'zoom_manual') || (trimmedLink && !manualLinkError))
                                        ? 'pointer'
                                        : 'not-allowed',
                                opacity:
                                    !selectedPlatform ||
                                    loading ||
                                    ((selectedPlatform === 'teams_manual' || selectedPlatform === 'zoom_manual') && (trimmedLink === '' || manualLinkError !== ''))
                                        ? 0.6
                                        : 1,
                                fontWeight: 500,
                                fontSize: '0.875rem',
                            }}
                        >
                            {loading ? 'Starting...' : 'Use Link & Start'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
