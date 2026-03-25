/* ─────────────────────────────────────────────────────────────────────────────
   Deadline Risk Engine
   Deterministic weighted scoring model  —  score: 0–100

   Factors (per upcoming task)
   ───────────────────────────
   A  Deadline Proximity          30 %
   B  Historical Delay Behavior   25 %
   C  Current Workload Pressure   20 %
   D  Task Difficulty Level       15 %
   E  Burnout Influence           10 %

   Subject-aware bonuses (applied after weighted sum)
   ───────────────────────────────────────────────────
   + 5  if subject performance dropped > 10 % this week vs last
   +10  if the last 2 completed/missed tasks of the same subject were missed

   Overall Deadline Risk % = average of the top-3 highest-risk upcoming tasks.
   Using the top-3 prevents low-risk tasks from diluting a genuinely dangerous
   near-deadline spike.
───────────────────────────────────────────────────────────────────────────── */

export type DeadlineTask = {
    id:         string;
    title?:     string;           // shown in tooltip (optional)
    subject:    string;
    deadline:   string;           // ISO string
    difficulty: "easy" | "medium" | "hard";
    status:     "pending" | "in_progress" | "completed";
    updated_at: string;           // proxy for completion timestamp
    created_at: string;
};

export type DeadlineRiskLevel = "Low" | "Moderate" | "High";

export type TaskDeadlineRisk = {
    taskId:        string;
    title:         string;
    subject:       string;
    deadline:      string;
    daysRemaining: number;        // negative = overdue
    riskScore:     number;        // 0–100
    level:         DeadlineRiskLevel;
    factors:       { A: number; B: number; C: number; D: number; E: number };
    bonuses:       number;
};

export type DeadlineRiskResult = {
    probability:     number;         // 0–100  (overall, based on top-3)
    level:           DeadlineRiskLevel;
    explanation:     string;
    tooltip:         string;
    topRiskyTasks:   TaskDeadlineRisk[];
    dominantFactor:  string;
    factorBreakdown: { A: number; B: number; C: number; D: number; E: number };
    upcomingCount:   number;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000;

const TOOLTIP =
    "Calculated using: Deadline Proximity (30 %), Past Delay Behaviour (25 %), " +
    "Workload Pressure (20 %), Task Difficulty (15 %), Burnout Influence (10 %).";

// ── Helpers ───────────────────────────────────────────────────────────────────

function mondayOfWeek(date: Date): Date {
    const d      = new Date(date);
    const offset = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - offset);
    d.setHours(0, 0, 0, 0);
    return d;
}

function daysBetween(later: Date, earlier: Date): number {
    return (later.getTime() - earlier.getTime()) / MS_PER_DAY;
}

function completionRate(tasks: DeadlineTask[]): number {
    if (!tasks.length) return 100;
    return (tasks.filter((t) => t.status === "completed").length / tasks.length) * 100;
}

function classifyLevel(score: number): DeadlineRiskLevel {
    if (score >= 61) return "High";
    if (score >= 31) return "Moderate";
    return "Low";
}

// ── Global: Historical Delay  (reused across all tasks) ──────────────────────

function calcAvgDelay(tasks: DeadlineTask[]): number {
    const late = tasks.filter(
        (t) =>
            t.status === "completed" &&
            new Date(t.updated_at) > new Date(t.deadline),
    );
    if (!late.length) return 0;
    return (
        late.reduce((sum, t) => sum + daysBetween(new Date(t.updated_at), new Date(t.deadline)), 0) /
        late.length
    );
}

// ── Factor A — Deadline Proximity  (0–30) ────────────────────────────────────

function factorA(daysRemaining: number): number {
    if (daysRemaining <= 0) return 30; // already overdue
    if (daysRemaining <= 1) return 30;
    if (daysRemaining <= 3) return 22;
    if (daysRemaining <= 7) return 15;
    return 5;
}

// ── Factor B — Historical Delay Behaviour  (0–25) ────────────────────────────

function factorB(avgDelay: number): number {
    if (avgDelay > 3)  return 25;
    if (avgDelay >= 1) return 15;
    return 5;
}

// ── Factor C — Workload Pressure  (0–20) ────────────────────────────────────
// Counts non-completed tasks due in the same calendar week as this task's deadline.

function factorC(task: DeadlineTask, allTasks: DeadlineTask[]): number {
    const taskDeadline = new Date(task.deadline);
    const weekStart    = mondayOfWeek(taskDeadline);
    const weekEnd      = new Date(weekStart.getTime() + 7 * MS_PER_DAY);

    const sameWeekCount =
        allTasks.filter((t) => {
            if (t.status === "completed" || t.id === task.id) return false;
            const d = new Date(t.deadline);
            return d >= weekStart && d < weekEnd;
        }).length + 1; // +1 for the task itself

    if (sameWeekCount >= 5) return 20;
    if (sameWeekCount >= 3) return 12;
    return 5;
}

// ── Factor D — Task Difficulty  (0–15) ───────────────────────────────────────

function factorD(difficulty: "easy" | "medium" | "hard"): number {
    if (difficulty === "hard")   return 15;
    if (difficulty === "medium") return 8;
    return 3;
}

// ── Factor E — Burnout Influence  (0–10) ────────────────────────────────────

function factorE(burnoutScore: number): number {
    if (burnoutScore > 70) return 10;
    if (burnoutScore >= 40) return 6;
    return 3;
}

// ── Subject-Aware Bonuses  (0–15) ────────────────────────────────────────────

function subjectBonuses(task: DeadlineTask, allTasks: DeadlineTask[], now: Date): number {
    let bonus = 0;

    const subjectTasks = allTasks.filter((t) => t.subject === task.subject);

    // Bonus 1: performance drop this week vs last (+5)
    const thisWeekMon = mondayOfWeek(now);
    const prevWeekMon = new Date(thisWeekMon.getTime() - 7 * MS_PER_DAY);
    const prevWeekEnd = new Date(thisWeekMon.getTime() - 1);

    const thisWeekTasks = subjectTasks.filter((t) => {
        const d = new Date(t.deadline);
        return d >= thisWeekMon && d <= now;
    });
    const prevWeekTasks = subjectTasks.filter((t) => {
        const d = new Date(t.deadline);
        return d >= prevWeekMon && d <= prevWeekEnd;
    });

    const drop = Math.max(0, completionRate(prevWeekTasks) - completionRate(thisWeekTasks));
    if (drop > 10) bonus += 5;

    // Bonus 2: last 2 due tasks of same subject both missed (+10)
    const pastSubjectTasks = subjectTasks
        .filter((t) => new Date(t.deadline) < now && t.id !== task.id)
        .sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());

    const last2 = pastSubjectTasks.slice(0, 2);
    if (last2.length === 2 && last2.every((t) => t.status !== "completed")) {
        bonus += 10;
    }

    return bonus;
}

// ── Per-Task Risk Score ───────────────────────────────────────────────────────

function calcTaskRisk(
    task:         DeadlineTask,
    allTasks:     DeadlineTask[],
    avgDelay:     number,
    burnoutScore: number,
    now:          Date,
): TaskDeadlineRisk {
    const daysRemaining = daysBetween(new Date(task.deadline), now);

    const A = factorA(daysRemaining);
    const B = factorB(avgDelay);
    const C = factorC(task, allTasks);
    const D = factorD(task.difficulty);
    const E = factorE(burnoutScore);

    const bonuses   = subjectBonuses(task, allTasks, now);
    const riskScore = Math.min(100, Math.round(A + B + C + D + E + bonuses));

    return {
        taskId:        task.id,
        title:         task.title ?? task.subject,
        subject:       task.subject,
        deadline:      task.deadline,
        daysRemaining: Math.round(daysRemaining * 10) / 10,
        riskScore,
        level:         classifyLevel(riskScore),
        factors:       { A, B, C, D, E },
        bonuses,
    };
}

// ── Explanation Builder ───────────────────────────────────────────────────────

function buildExplanation(
    probability: number,
    level:       DeadlineRiskLevel,
    f:           { A: number; B: number; C: number; D: number; E: number },
    top3:        TaskDeadlineRisk[],
): string {
    if (probability === 0)
        return "All tasks completed. No upcoming deadlines at risk.";

    if (level === "Low")
        return "Upcoming deadlines are within safe range with manageable workload.";

    const causes: string[] = [];

    if (f.A >= 22) causes.push("short deadline proximity");
    if (f.B >= 15) causes.push("history of late submissions");
    if (f.C >= 12) causes.push("heavy workload this week");
    if (f.D >= 15) causes.push("high difficulty tasks");
    if (f.E >= 6)  causes.push("elevated burnout level");

    const subjectWithBonus = top3.find((t) => t.bonuses > 0);
    if (subjectWithBonus) causes.push(`performance issues in ${subjectWithBonus.subject}`);

    if (!causes.length)
        return level === "High"
            ? "High delay risk from multiple overlapping factors."
            : "Moderate delay risk detected across upcoming tasks.";

    const prefix =
        level === "High"     ? "High risk due to " :
        level === "Moderate" ? "Moderate risk — " :
        "";

    const body = causes.slice(0, 3).join(", ");
    return prefix + body[0].toUpperCase() + body.slice(1) + ".";
}

// ── Main Export ───────────────────────────────────────────────────────────────

export function calculateDeadlineRisk(
    tasks:        DeadlineTask[],
    burnoutScore: number = 0,
): DeadlineRiskResult {
    const now = new Date();

    // Only non-completed tasks matter
    const upcomingTasks = tasks.filter((t) => t.status !== "completed");

    if (!upcomingTasks.length) {
        return {
            probability:     0,
            level:           "Low",
            explanation:     "No upcoming tasks — all deadlines are clear.",
            tooltip:         TOOLTIP,
            topRiskyTasks:   [],
            dominantFactor:  "None",
            factorBreakdown: { A: 0, B: 0, C: 0, D: 0, E: 0 },
            upcomingCount:   0,
        };
    }

    // Historical delay baseline (global, same for every task)
    const avgDelay = calcAvgDelay(tasks);

    // Score every upcoming task
    const taskRisks = upcomingTasks
        .map((t) => calcTaskRisk(t, tasks, avgDelay, burnoutScore, now))
        .sort((a, b) => b.riskScore - a.riskScore);

    // Overall = average of top-3 riskiest tasks
    const top3        = taskRisks.slice(0, 3);
    const probability = Math.min(
        100,
        Math.round(top3.reduce((s, t) => s + t.riskScore, 0) / top3.length),
    );
    const level = classifyLevel(probability);

    // Average factor contributions from top-3 (for explanation & dominant factor)
    const n    = top3.length;
    const avgF = top3.reduce(
        (acc, t) => ({
            A: acc.A + t.factors.A / n,
            B: acc.B + t.factors.B / n,
            C: acc.C + t.factors.C / n,
            D: acc.D + t.factors.D / n,
            E: acc.E + t.factors.E / n,
        }),
        { A: 0, B: 0, C: 0, D: 0, E: 0 },
    );

    // Dominant factor
    const entries: [string, number][] = [
        ["Deadline Proximity", avgF.A],
        ["Delay History",      avgF.B],
        ["Workload Pressure",  avgF.C],
        ["Task Difficulty",    avgF.D],
        ["Burnout",            avgF.E],
    ];
    const dominantFactor = entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];

    return {
        probability,
        level,
        explanation:     buildExplanation(probability, level, avgF, top3),
        tooltip:         TOOLTIP,
        topRiskyTasks:   top3,
        dominantFactor,
        factorBreakdown: avgF,
        upcomingCount:   upcomingTasks.length,
    };
}
