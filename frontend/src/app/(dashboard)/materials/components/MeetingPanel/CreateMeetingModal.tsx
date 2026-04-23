'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';

interface CreateMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartManual: (platform: 'zoom' | 'teams' | 'google', meetingLink: string) => Promise<void>;
    loading: boolean;
}

export const CreateMeetingModal = ({
    isOpen,
    onClose,
    onStartManual,
    loading,
}: CreateMeetingModalProps) => {
    const [selectedPlatform, setSelectedPlatform] = useState<'zoom_manual' | 'teams_manual' | 'google_manual' | null>(null);
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

        if (selectedPlatform === 'google_manual') {
            if (!trimmedLink.toLowerCase().includes('meet.google.com')) {
                return "Please paste a Google Meet invite link (meet.google.com/xxx-xxxx-xxx).";
            }
        }

        return "";
    })();

    const handleStart = async () => {
        if (selectedPlatform === 'teams_manual' || selectedPlatform === 'zoom_manual' || selectedPlatform === 'google_manual') {
            const link = trimmedLink;
            if (!link || manualLinkError) return;
            
            let platform: 'zoom' | 'teams' | 'google' = 'google';
            if (selectedPlatform === 'teams_manual') platform = 'teams';
            else if (selectedPlatform === 'zoom_manual') platform = 'zoom';
            
            await onStartManual(platform, link);
            setSelectedPlatform(null);
            setManualLink('');
            return;
        }
    };

    if (!isOpen) return null;

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[220] overflow-y-auto bg-slate-900/55 backdrop-blur-sm"
            onClick={onClose}
        >
            <div className="flex min-h-full items-start justify-center p-4 md:p-6">
                <div
                    className="my-4 w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl md:max-h-[calc(100vh-3rem)]"
                    onClick={(e) => e.stopPropagation()}
                >
                <div className="p-5 md:p-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">Start a Meeting</h2>
                            <p className="mt-2 text-lg leading-snug text-slate-600">
                                Choose a platform to start a video meeting for your group.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Close modal"
                        >
                            ×
                        </button>
                    </div>

                    <div className="mt-8 space-y-4">
                        <button
                            type="button"
                            onClick={() => setSelectedPlatform('zoom_manual')}
                            className={`w-full rounded-2xl border p-5 text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-blue-200 ${
                                selectedPlatform === 'zoom_manual'
                                    ? 'border-blue-500 bg-blue-50 shadow-[0_0_0_1px_rgba(59,130,246,0.2)] ring-1 ring-blue-200'
                                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-3xl font-extrabold text-white">
                                    Z
                                </div>
                                <div>
                                    <p className="text-sm font-extrabold text-slate-800">Use Existing Zoom Link</p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Paste a Zoom invite URL created by a group member.
                                    </p>
                                </div>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedPlatform('teams_manual')}
                            className={`w-full rounded-2xl border p-5 text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-blue-200 ${
                                selectedPlatform === 'teams_manual'
                                    ? 'border-blue-500 bg-blue-50 shadow-[0_0_0_1px_rgba(59,130,246,0.2)] ring-1 ring-blue-200'
                                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-2xl font-bold text-white">
                                    🔗
                                </div>
                                <div>
                                    <p className="text-sm font-extrabold text-slate-800">Use Existing Teams Link</p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        No Entra setup needed. Paste a Teams invite URL.
                                    </p>
                                </div>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedPlatform('google_manual')}
                            className={`w-full rounded-2xl border p-5 text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-blue-200 ${
                                selectedPlatform === 'google_manual'
                                    ? 'border-blue-500 bg-blue-50 shadow-[0_0_0_1px_rgba(59,130,246,0.2)] ring-1 ring-blue-200'
                                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-3xl font-extrabold text-white">
                                    G
                                </div>
                                <div>
                                    <p className="text-sm font-extrabold text-slate-800">Use Existing Google Meet Link</p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Paste a Google Meet invite URL (meet.google.com).
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>

                    {(selectedPlatform === 'teams_manual' || selectedPlatform === 'zoom_manual' || selectedPlatform === 'google_manual') && (
                        <div className="mt-6">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {selectedPlatform === 'teams_manual'
                                    ? 'Teams Meeting Link'
                                    : selectedPlatform === 'zoom_manual'
                                        ? 'Zoom Meeting Link'
                                        : 'Google Meet Link'}
                            </label>
                            <input
                                type="url"
                                value={manualLink}
                                onChange={(event) => setManualLink(event.target.value)}
                                placeholder={selectedPlatform === 'teams_manual'
                                    ? 'https://teams.microsoft.com/l/meetup-join/...'
                                    : selectedPlatform === 'zoom_manual'
                                        ? 'https://zoom.us/j/...'
                                        : 'https://meet.google.com/xxx-xxxx-xxx'}
                                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all ${
                                    manualLinkError
                                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                                        : 'border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                                }`}
                            />
                            {manualLinkError && (
                                <p className="mt-2 text-xs text-rose-700">{manualLinkError}</p>
                            )}
                            <p className="mt-2 text-xs text-slate-500">
                                Only group members can add and share this session link.
                            </p>
                        </div>
                    )}

                    <div className="mt-7 flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleStart}
                            disabled={
                                !selectedPlatform ||
                                loading ||
                                ((selectedPlatform === 'teams_manual' || selectedPlatform === 'zoom_manual' || selectedPlatform === 'google_manual') && (trimmedLink === '' || manualLinkError !== ''))
                            }
                            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                            {loading ? 'Starting...' : 'Use Link & Start'}
                        </button>
                    </div>
                </div>
            </div>
            </div>
        </div>
        ,
        document.body
    );
};
