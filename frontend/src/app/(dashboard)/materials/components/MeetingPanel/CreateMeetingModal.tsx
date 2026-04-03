'use client';

import { useState } from 'react';

interface CreateMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (platform: 'zoom' | 'teams') => Promise<void>;
    loading: boolean;
}

export const CreateMeetingModal = ({
    isOpen,
    onClose,
    onStart,
    loading,
}: CreateMeetingModalProps) => {
    const [selectedPlatform, setSelectedPlatform] = useState<'zoom' | 'teams' | null>(null);

    const handleStart = async () => {
        if (selectedPlatform) {
            await onStart(selectedPlatform);
            setSelectedPlatform(null);
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
                            onClick={() => setSelectedPlatform('zoom')}
                            style={{
                                padding: '1rem',
                                border: selectedPlatform === 'zoom' ? '2px solid #2563eb' : '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                background:
                                    selectedPlatform === 'zoom' ? 'rgba(37, 99, 235, 0.05)' : 'white',
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
                                <div style={{ fontWeight: 600, color: '#1f2937' }}>Zoom Meeting</div>
                                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                    Start a Zoom video conference
                                </div>
                            </div>
                        </button>

                        {/* Teams Option */}
                        <button
                            onClick={() => setSelectedPlatform('teams')}
                            style={{
                                padding: '1rem',
                                border: selectedPlatform === 'teams' ? '2px solid #2563eb' : '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                background:
                                    selectedPlatform === 'teams' ? 'rgba(37, 99, 235, 0.05)' : 'white',
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
                                    background: '#464EB8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                }}
                            >
                                T
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: 600, color: '#1f2937' }}>Teams Meeting</div>
                                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                    Start a Microsoft Teams meeting
                                </div>
                            </div>
                        </button>
                    </div>

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
                            disabled={!selectedPlatform || loading}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: selectedPlatform && !loading ? '#2563eb' : '#9ca3af',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor:
                                    selectedPlatform && !loading ? 'pointer' : 'not-allowed',
                                opacity: !selectedPlatform || loading ? 0.6 : 1,
                                fontWeight: 500,
                                fontSize: '0.875rem',
                            }}
                        >
                            {loading ? 'Starting...' : 'Start Meeting'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
