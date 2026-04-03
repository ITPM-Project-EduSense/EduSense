export const MOCK_SESSIONS: Record<string, { label: string; url: string; platform: string }[]> = {
    default: [
        { label: "Weekly Zoom Call", url: "#", platform: "Zoom" },
        { label: "Discord Study Voice", url: "#", platform: "Discord" },
    ],
    CS2040: [
        { label: "Monday Review â€” Zoom", url: "#", platform: "Zoom" },
        { label: "Problem-Set Discord VC", url: "#", platform: "Discord" },
        { label: "Friday Deep Dive â€” Google Meet", url: "#", platform: "Meet" },
    ],
    MA1101: [
        { label: "Tuesday Matrix Session â€” Zoom", url: "#", platform: "Zoom" },
        { label: "Office Hours â€” Google Meet", url: "#", platform: "Meet" },
    ],
    CS3230: [
        { label: "Algo Sprint â€” Discord", url: "#", platform: "Discord" },
        { label: "Mock Contest â€” Zoom", url: "#", platform: "Zoom" },
    ],
    ST2334: [
        { label: "Sunday Probability Clinic â€” Zoom", url: "#", platform: "Zoom" },
    ],
    CS2103: [
        { label: "Sprint Planning â€” Teams", url: "#", platform: "Teams" },
        { label: "Code Review VC â€” Discord", url: "#", platform: "Discord" },
    ],
    IS3103: [
        { label: "Case Study Session â€” Google Meet", url: "#", platform: "Meet" },
    ],
};
// ── MOCK_SESSIONS REMOVED ──
// Video meetings are now managed dynamically via MeetingPanel component
// See meeting_routes.py for API endpoints
export const PLATFORM_COLORS: Record<string, string> = {
    Zoom: "#2D8CFF",
    Discord: "#5865F2",
    Meet: "#34A853",
    Teams: "#464EB8",
};

export const FILE_TYPE_COLORS: Record<string, string> = {
    PDF: "#EF4444",
    DOCX: "#3B82F6",
    PPTX: "#F59E0B",
};

export const MODULE_COLORS: Record<string, string> = {
    CS2040: "#FF6B35",
    MA1101: "#4ECDC4",
    CS3230: "#A78BFA",
    ST2334: "#F59E0B",
    CS2103: "#34D399",
    IS3103: "#F472B6",
};

export const modules = [
    { code: "CS2040", name: "Data Structures", color: "#FF6B35", members: 24 },
    { code: "MA1101", name: "Linear Algebra", color: "#4ECDC4", members: 18 },
    { code: "CS3230", name: "Algorithms", color: "#A78BFA", members: 31 },
    { code: "ST2334", name: "Probability", color: "#F59E0B", members: 15 },
    { code: "CS2103", name: "Software Eng.", color: "#34D399", members: 42 },
    { code: "IS3103", name: "Info Systems", color: "#F472B6", members: 11 },
];

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
