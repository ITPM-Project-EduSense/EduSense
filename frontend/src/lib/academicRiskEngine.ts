/* ─────────────────────────────────────────────────────────────────────────────
   Academic Risk Engine
   Deterministic weighted scoring model  —  score: 0–100

   Factors
   -------
   A  Missed Deadline Ratio        25 %
   B  Upcoming Workload Density    20 %
   C  Subject Performance Drop     20 %
   D  Task Completion Delay        20 %
   E  Burnout Index                15 %

   Subject scores are calculated individually, then averaged for the overall
   score.  Intelligent overrides are applied last.
───────────────────────────────────────────────────────────────────────────── */

export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskDifficulty = "easy" | "medium" | "hard";
export type BurnoutLevel = "Low" | "Medium" | "High";
export type RiskLevel = "Safe" | "Warning" | "Critical";

export type RiskTask = {
    id: string;
    subject: string;
    deadline: string;   // ISO string
    difficulty: TaskDifficulty;
    status: TaskStatus;
    updated_at: string;   // used as completion_date proxy
    created_at: string;
};

export type SubjectRiskBreakdown = {
    subject: string;
    riskScore: number;   // 0–100
    missedCount: number;
    upcomingCount: number;
    completedCount: number;
    overdueCount: number;
    perfDrop: number;   // percentage drop, 0–100
    avgDelayDays: number;
    factors: { A: number; B: number; C: number; D: number; E: number };
};

export type AcademicRiskResult = {
    score: number;   // 0–100
    level: RiskLevel;
    explanation: string;
    tooltip: string;
    dominantFactor: string;
    factorBreakdown: { A: number; B: number; C: number; D: number; E: number };
    subjectBreakdowns: SubjectRiskBreakdown[];
};

// ── Constants ─────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000;

const TOOLTIP =
    "Calculated using: Missed Deadlines (25 %), Upcoming Workload (20 %), " +
    "Performance Trend (20 %), Delay Consistency (20 %), Burnout Level (15 %).";

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysBetween(later: Date, earlier: Date): number {
    return (later.getTime() - earlier.getTime()) / MS_PER_DAY;
}

function mondayOfWeek(date: Date): Date {
    const d = new Date(date);
    // getDay() → 0=Sun … 6=Sat; shift so Mon=0
    const offset = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - offset);
    d.setHours(0, 0, 0, 0);
    return d;
}

function completionRate(tasks: RiskTask[]): number {
    if (!tasks.length) return 100; // no tasks = no drag
    return (tasks.filter((t) => t.status === "completed").length / tasks.length) * 100;
}

function isMissed(t: RiskTask, now: Date): boolean {
    return t.status !== "completed" && new Date(t.deadline) < now;
}

// ── Factor A — Missed Deadline Ratio  (0–25) ──────────────────────────────────

function factorA(tasks: RiskTask[], now: Date): number {
    if (!tasks.length) return 0;
    const missed = tasks.filter((t) => isMissed(t, now)).length;
    return (missed / tasks.length) * 25;
}

// ── Factor B — Upcoming Workload Density  (0–20) ──────────────────────────────

function factorB(tasks: RiskTask[], now: Date): number {
    const cutoff = new Date(now.getTime() + 7 * MS_PER_DAY);
    const upcoming = tasks.filter(
        (t) =>
            t.status !== "completed" &&
            new Date(t.deadline) >= now &&
            new Date(t.deadline) <= cutoff,
    );

    if (!upcoming.length) return 0;

    // Base score by count
    let base: number;
    if (upcoming.length >= 5) base = 20;
    else if (upcoming.length >= 3) base = 12;
    else base = 5;

    // Hard tasks add pressure (+2 each, capped at max)
    const hardBonus = upcoming.filter((t) => t.difficulty === "hard").length * 2;
    return Math.min(20, base + hardBonus);
}

// ── Factor C — Subject Performance Drop  (0–20) ───────────────────────────────

function subjectPerfDrop(
    tasks: RiskTask[],
    now: Date,
): { score: number; drop: number } {
    const thisWeekMon = mondayOfWeek(now);
    const prevWeekMon = new Date(thisWeekMon.getTime() - 7 * MS_PER_DAY);
    const prevWeekEnd = new Date(thisWeekMon.getTime() - 1);

    const thisWeekTasks = tasks.filter((t) => {
        const d = new Date(t.deadline);
        return d >= thisWeekMon && d <= now;
    });
    const prevWeekTasks = tasks.filter((t) => {
        const d = new Date(t.deadline);
        return d >= prevWeekMon && d <= prevWeekEnd;
    });

    const drop = Math.max(0, completionRate(prevWeekTasks) - completionRate(thisWeekTasks));
    return { score: Math.min(20, (drop / 100) * 20), drop };
}


// ── Factor D — Task Completion Delay  (0–20) ──────────────────────────────────

function factorD(tasks: RiskTask[]): { score: number; avgDelayDays: number } {
    const lateTasks = tasks.filter(
        (t) =>
            t.status === "completed" &&
            new Date(t.updated_at) > new Date(t.deadline),
    );
    if (!lateTasks.length) return { score: 0, avgDelayDays: 0 };

    const avg =
        lateTasks.reduce(
            (sum, t) => sum + daysBetween(new Date(t.updated_at), new Date(t.deadline)),
            0,
        ) / lateTasks.length;

    let score: number;
    if (avg > 5) score = 20;
    else if (avg > 2) score = 15;
    else if (avg > 1) score = 10;
    else score = 5;

    return { score, avgDelayDays: avg };
}

// ── Factor E — Burnout Index  (0–15) ─────────────────────────────────────────

function factorE(burnout: BurnoutLevel): number {
    return burnout === "High" ? 15 : burnout === "Medium" ? 10 : 5;
}

// ── Subject-Level Risk ────────────────────────────────────────────────────────

function calcSubjectRisk(
    subject: string,
    allTasks: RiskTask[],
    now: Date,
    burnout: BurnoutLevel,
): SubjectRiskBreakdown {
    const tasks = allTasks.filter((t) => t.subject === subject);

    // No active tasks → zero risk.  Factors D & E are predictive indicators
    // that only apply when there is ongoing work; past delay history and
    // burnout level cannot create risk when the workload is fully cleared.
    const hasActiveTasks = tasks.some((t) => t.status !== "completed");
    if (!hasActiveTasks) {
        return {
            subject,
            riskScore: 0,
            missedCount: 0,
            upcomingCount: 0,
            completedCount: tasks.filter(t => t.status === "completed").length,
            overdueCount: 0,
            perfDrop: 0,
            avgDelayDays: 0,
            factors: { A: 0, B: 0, C: 0, D: 0, E: 0 },
        };
    }

    const A = factorA(tasks, now);
    const B = factorB(tasks, now);
    const cR = subjectPerfDrop(tasks, now);
    const dR = factorD(tasks);
    const E = factorE(burnout);

    const cutoff = new Date(now.getTime() + 7 * MS_PER_DAY);
    const missed = tasks.filter((t) => isMissed(t, now)).length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const upcoming = tasks.filter(
        (t) =>
            t.status !== "completed" &&
            new Date(t.deadline) >= now &&
            new Date(t.deadline) <= cutoff,
    ).length;

    return {
        subject,
        riskScore: Math.min(100, Math.round(A + B + cR.score + dR.score + E)),
        missedCount: missed,
        upcomingCount: upcoming,
        completedCount: completed,
        overdueCount: missed, // missed is functionally overdue
        perfDrop: cR.drop,
        avgDelayDays: dR.avgDelayDays,
        factors: { A, B, C: cR.score, D: dR.score, E },
    };
}

// ── AI Explanation Builder ────────────────────────────────────────────────────

function buildExplanation(
    score: number,
    level: RiskLevel,
    breakdowns: SubjectRiskBreakdown[],
    f: { A: number; B: number; C: number; D: number; E: number },
): string {
    if (score < 10)
        return "All subjects on track with no significant risk indicators.";

    const causes: string[] = [];

    const highRiskSubjects = breakdowns.filter((s) => s.riskScore >= 61).map((s) => s.subject);
    if (highRiskSubjects.length)
        causes.push(`high risk in ${highRiskSubjects.join(" & ")}`);

    if (f.A >= 15) causes.push("high missed deadline ratio");
    else if (f.A >= 8) causes.push("missed deadlines detected");

    if (f.B >= 16) causes.push("heavy upcoming workload");
    else if (f.B >= 12) causes.push("moderate workload pressure this week");

    const droppingSubjects = breakdowns.filter((s) => s.perfDrop > 10).map((s) => s.subject);
    if (droppingSubjects.length)
        causes.push(`performance drop in ${droppingSubjects.join(" & ")}`);

    if (f.D >= 15) causes.push("consistent late submissions");
    if (f.E === 15) causes.push("high burnout");

    if (!causes.length)
        return level === "Safe"
            ? "Risk is within acceptable range."
            : "Multiple overlapping workload factors detected.";

    const prefix =
        level === "Critical" ? "Critical — " :
            level === "Warning" ? "Risk elevated due to " :
                "";

    const body = causes.slice(0, 3).join(", ");
    return prefix + body[0].toUpperCase() + body.slice(1) + ".";
}

// ── Main Export ───────────────────────────────────────────────────────────────

export function calculateAcademicRisk(
    tasks: RiskTask[],
    burnout: BurnoutLevel = "Low",
): AcademicRiskResult {
    const now = new Date();

    // Edge case — no tasks
    if (!tasks.length) {
        return {
            score: 0,
            level: "Safe",
            explanation: "No tasks found. Add tasks to begin risk analysis.",
            tooltip: TOOLTIP,
            dominantFactor: "None",
            factorBreakdown: { A: 0, B: 0, C: 0, D: 0, E: 0 },
            subjectBreakdowns: [],
        };
    }

    const subjects = [...new Set(tasks.map((t) => t.subject))];
    const breakdowns = subjects.map((s) => calcSubjectRisk(s, tasks, now, burnout));

    // Overall score = unweighted average of subject scores
    let overall =
        breakdowns.reduce((sum, s) => sum + s.riskScore, 0) / breakdowns.length;

    // Average factor contributions (for explanation + dominant factor)
    const n = breakdowns.length;
    const avgF = breakdowns.reduce(
        (acc, s) => ({
            A: acc.A + s.factors.A / n,
            B: acc.B + s.factors.B / n,
            C: acc.C + s.factors.C / n,
            D: acc.D + s.factors.D / n,
            E: acc.E + s.factors.E / n,
        }),
        { A: 0, B: 0, C: 0, D: 0, E: 0 },
    );

    // ── Intelligent Overrides ──────────────────────────────────────────────

    // 1. >2 missed deadlines in a single subject → +10
    if (breakdowns.some((s) => s.missedCount > 2))
        overall = Math.min(100, overall + 10);

    // 2. Clean slate (no misses, no drop) → cap at 29 regardless of burnout.
    //    Burnout alone cannot push an otherwise clean record into Warning.
    const totalMissed = tasks.filter((t) => isMissed(t, now)).length;
    const noDrop = breakdowns.every((s) => s.perfDrop <= 5);
    if (totalMissed === 0 && noDrop)
        overall = Math.min(overall, 29);

    // 3. Any subject risk >= 61 (Critical) → overall must be at least Warning (≥ 31)
    if (breakdowns.some((s) => s.riskScore >= 61) && overall < 31)
        overall = 31;

    overall = Math.round(Math.min(100, Math.max(0, overall)));

    const level: RiskLevel =
        overall >= 61 ? "Critical" :
            overall >= 31 ? "Warning" :
                "Safe";

    // Dominant factor = highest average contribution
    const factorEntries: [string, number][] = [
        ["Missed Deadlines", avgF.A],
        ["Workload Density", avgF.B],
        ["Performance Drop", avgF.C],
        ["Delay Consistency", avgF.D],
        ["Burnout Level", avgF.E],
    ];
    const dominantFactor = factorEntries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];

    return {
        score: overall,
        level,
        explanation: buildExplanation(overall, level, breakdowns, avgF),
        tooltip: TOOLTIP,
        dominantFactor,
        factorBreakdown: avgF,
        subjectBreakdowns: breakdowns,
    };
}
