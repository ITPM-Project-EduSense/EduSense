/* ─────────────────────────────────────────────────────────────────────────────
   Burnout Engine
   Deterministic weighted scoring model  —  score: 0–100

   Factors (current week)
   ──────────────────────
   A  Workload Density              30 %
   B  High-Difficulty Clustering    20 %
   C  Late-Night Study Pattern      15 %
   D  Missed Task Pressure          15 %
   E  Subject Concentration         10 %
   F  Low Completion Efficiency     10 %

   Study hours are inferred from difficulty when the API does not supply them:
     easy → 1 h  |  medium → 2.5 h  |  hard → 4 h
───────────────────────────────────────────────────────────────────────────── */

export type BurnoutTask = {
    id:         string;
    subject:    string;
    deadline:   string;    // ISO string
    difficulty: "easy" | "medium" | "hard";
    status:     "pending" | "in_progress" | "completed";
    updated_at: string;    // proxy for last study / completion timestamp
    created_at: string;
};

export type BurnoutLevel = "Low" | "Medium" | "High";

export type SubjectBurnout = {
    subject:              string;
    burnoutScore:         number;    // 0–100
    weeklyTaskCount:      number;
    highDifficultyCount:  number;
    estimatedHours:       number;
    missedCount:          number;
    factors: { A: number; B: number; C: number; D: number; E: number; F: number };
};

export type WeeklyBurnoutPoint = {
    label:      string;       // "Week 1" … "Week 6"
    score:      number;       // 0–100
    level:      BurnoutLevel;
    isCritical: boolean;      // score > 70
    isSpike:    boolean;      // increased > 15 pts vs previous week
};

export type WorkloadPoint = {
    label:      string;
    dateStr:    string;
    score:      number;
    actualHours:number;
    tasksCount: number;
    level:      BurnoutLevel;
    isCurrent:  boolean;
    isSpike:    boolean;
    isCritical: boolean;
};

export type BurnoutResult = {
    score:             number;
    level:             BurnoutLevel;
    trend:             "up" | "down" | "stable";
    isCriticalWeek:    boolean;
    criticalWeekIndex: number;   // index in weeklyTrend (-1 = none)
    aiInsight:         string;
    dominantFactor:    string;
    subjectBreakdowns: SubjectBurnout[];
    weeklyTrend:       WeeklyBurnoutPoint[];
    dailyWorkload:     WorkloadPoint[];
    weeklyWorkload:    WorkloadPoint[];
    monthlyWorkload:   WorkloadPoint[];
    factorBreakdown:   { A: number; B: number; C: number; D: number; E: number; F: number };
};

// ── Constants ─────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000;
const STUDY_HOURS: Record<string, number> = { easy: 1, medium: 2.5, hard: 4 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function mondayOfWeek(date: Date): Date {
    const d = new Date(date);
    const offset = (d.getDay() + 6) % 7; // Mon = 0
    d.setDate(d.getDate() - offset);
    d.setHours(0, 0, 0, 0);
    return d;
}

function endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

function inferHours(task: BurnoutTask): number {
    return STUDY_HOURS[task.difficulty] ?? 1;
}

function classify(score: number): BurnoutLevel {
    if (score >= 71) return "High";
    if (score >= 41) return "Medium";
    return "Low";
}

// ── Factor A — Workload Density  (0–30) ──────────────────────────────────────

function factorA(tasks: BurnoutTask[]): number {
    const totalHours = tasks.reduce((sum, t) => sum + inferHours(t), 0);
    if (totalHours === 0)   return 0;
    if (totalHours >= 20)   return 30;
    if (totalHours >= 10)   return 20;
    return 10;
}

// ── Factor B — High-Difficulty Task Clustering  (0–20) ────────────────────────
// Slides a 3-day window across the deadline range; takes the max hard-task count.

function factorB(tasks: BurnoutTask[], windowStart: Date, windowEnd: Date): number {
    if (!tasks.length) return 0;

    const hardTasks = tasks.filter((t) => t.difficulty === "hard");
    if (!hardTasks.length) return 0;

    const wStart = windowStart.getTime();
    const wEnd   = windowEnd.getTime();
    let maxHard  = 0;

    for (let t = wStart; t <= wEnd; t += MS_PER_DAY) {
        const sliceEnd = t + 3 * MS_PER_DAY;
        const count = hardTasks.filter((task) => {
            const d = new Date(task.deadline).getTime();
            return d >= t && d < sliceEnd;
        }).length;
        if (count > maxHard) maxHard = count;
    }

    if (maxHard >= 3) return 20;
    if (maxHard >= 2) return 12;
    if (maxHard >= 1) return 5;
    return 0;
}

// ── Factor C — Late-Night Study Pattern  (0–15) ───────────────────────────────
// Uses updated_at as proxy for "when the student last worked on this task".

function factorC(tasks: BurnoutTask[], windowStart: Date, windowEnd: Date): number {
    const lateNightDays = new Set<string>();

    for (const task of tasks) {
        const u = new Date(task.updated_at);
        if (u < windowStart || u > windowEnd) continue;
        const h = u.getHours();
        if (h >= 23 || h < 6) {
            // Unique calendar-day key so we count distinct days, not events
            lateNightDays.add(`${u.getFullYear()}-${u.getMonth()}-${u.getDate()}`);
        }
    }

    if (lateNightDays.size >= 3) return 15;
    if (lateNightDays.size >= 1) return 8;
    return 0;
}

// ── Factor D — Missed Task Pressure  (0–15) ───────────────────────────────────

function factorD(tasks: BurnoutTask[], cutoff: Date): number {
    if (!tasks.length) return 0;
    const missed = tasks.filter(
        (t) => t.status !== "completed" && new Date(t.deadline) < cutoff,
    ).length;
    return (missed / tasks.length) * 15;
}

// ── Factor E — Subject Concentration Imbalance  (0–10) ────────────────────────

function factorE(tasks: BurnoutTask[]): { score: number; heaviestSubject: string } {
    if (tasks.length < 2) return { score: 0, heaviestSubject: "" };

    const counts = new Map<string, number>();
    for (const t of tasks) counts.set(t.subject, (counts.get(t.subject) ?? 0) + 1);

    let maxCount = 0;
    let heaviest = "";
    for (const [subj, count] of counts) {
        if (count > maxCount) { maxCount = count; heaviest = subj; }
    }

    return {
        score:           maxCount / tasks.length > 0.5 ? 10 : 0,
        heaviestSubject: heaviest,
    };
}

// ── Factor F — Low Completion Efficiency  (0–10) ─────────────────────────────

function factorF(tasks: BurnoutTask[]): number {
    if (!tasks.length) return 0;
    const completed = tasks.filter((t) => t.status === "completed").length;
    return completed / tasks.length < 0.5 ? 10 : 0;
}

// ── AI Insight Builder ────────────────────────────────────────────────────────

function buildInsight(
    level:        BurnoutLevel,
    f:            { A: number; B: number; C: number; D: number; E: number; F: number },
    heavySubject: string,
    weeklyTrend:  WeeklyBurnoutPoint[],
): string {
    if (level === "Low")
        return "Workload is well-balanced this week. Keep maintaining healthy study habits.";

    const isSpike =
        weeklyTrend.length >= 2 &&
        weeklyTrend[weeklyTrend.length - 1].isSpike;

    if (f.A >= 20 && f.B >= 12)
        return "Stress increased due to high workload concentration with multiple difficult tasks this week.";
    if (f.B >= 20)
        return "Multiple high-difficulty tasks are scheduled close together — consider spreading them out.";
    if (f.C >= 15)
        return "Consecutive late-night study sessions detected. Consider earlier study slots to maintain energy.";
    if (f.A >= 20)
        return "Stress increased due to heavy workload concentration this week.";
    if (f.E >= 10 && heavySubject)
        return `Most workload is concentrated in ${heavySubject}. Distributing tasks across subjects reduces burnout.`;
    if (f.D >= 8)
        return "Missed tasks are accumulating and increasing academic stress. Prioritize pending deadlines.";
    if (f.F >= 10)
        return "Task completion rate is below 50 % this week. Review and reprioritise your task list.";
    if (isSpike)
        return "A stress spike was detected compared to last week. Monitor your workload to prevent escalation.";

    return level === "High"
        ? "High burnout risk detected from multiple overlapping factors. Consider taking a recovery break."
        : "Moderate burnout indicators present. Stay mindful of your workload balance.";
}

// ── Subject-Level Burnout ─────────────────────────────────────────────────────

function calcSubjectBurnout(
    subject:   string,
    allTasks:  BurnoutTask[],
    weekStart: Date,
    weekEnd:   Date,
    now:       Date,
): SubjectBurnout {
    // Only this subject's tasks due this week
    const tasks = allTasks.filter(
        (t) => t.subject === subject && new Date(t.deadline) >= weekStart && new Date(t.deadline) <= weekEnd,
    );

    if (!tasks.length) {
        return {
            subject,
            burnoutScore:        0,
            weeklyTaskCount:     0,
            highDifficultyCount: 0,
            estimatedHours:      0,
            missedCount:         0,
            factors:             { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 },
        };
    }

    const A = factorA(tasks);
    const B = factorB(tasks, weekStart, weekEnd);
    // C uses ALL tasks (not subject-filtered) because late-night activity is cross-subject
    const C = factorC(allTasks, weekStart, weekEnd);
    const D = factorD(tasks, now);
    // E is global (doesn't apply per-subject)
    const F = factorF(tasks);

    const missedCount = tasks.filter(
        (t) => t.status !== "completed" && new Date(t.deadline) < now,
    ).length;

    return {
        subject,
        burnoutScore:        Math.min(100, Math.round(A + B + C + D + F)),
        weeklyTaskCount:     tasks.length,
        highDifficultyCount: tasks.filter((t) => t.difficulty === "hard").length,
        estimatedHours:      tasks.reduce((s, t) => s + inferHours(t), 0),
        missedCount,
        factors:             { A, B, C, D, E: 0, F },
    };
}

// ── Single-Week Burnout (for trend chart) ────────────────────────────────────

function calcWeekScore(weekStart: Date, weekEnd: Date, allTasks: BurnoutTask[], now: Date): number {
    const dueTasks = allTasks.filter((t) => {
        const d = new Date(t.deadline);
        return d >= weekStart && d <= weekEnd;
    });

    if (!dueTasks.length) return 0;

    // For past weeks the cutoff is the week's end; for the current week it's now
    const cutoff = weekEnd < now ? weekEnd : now;

    const A = factorA(dueTasks);
    const B = factorB(dueTasks, weekStart, weekEnd);
    const C = factorC(allTasks, weekStart, weekEnd);
    const D = factorD(dueTasks, cutoff);
    const { score: E } = factorE(dueTasks);
    const F = factorF(dueTasks);

    return Math.min(100, Math.round(A + B + C + D + E + F));
}

// ── Time-Based Workload ───────────────────────────────────────────────────────

function buildWorkloadPoints(
    tasks: BurnoutTask[],
    now: Date,
    period: "day" | "week" | "month",
    pastCount: number,
    futureCount: number
): WorkloadPoint[] {
    const points: Omit<WorkloadPoint, "isSpike" | "level" | "isCritical" | "score">[] = [];
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (period === "day") {
        for (let i = -pastCount; i <= futureCount; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            const dateStr = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
            const label = i === 0 ? "Today" : i === 1 ? "Tmrw" : i === -1 ? "Yest" : d.toLocaleDateString('en-US', { weekday: 'short' });
            points.push({ label, dateStr, actualHours: 0, tasksCount: 0, isCurrent: i === 0});
        }
    } else if (period === "week") {
        const thisMon = mondayOfWeek(today);
        for (let i = -pastCount; i <= futureCount; i++) {
            const d = new Date(thisMon);
            d.setDate(d.getDate() + i * 7);
            const dateStr = `${d.getFullYear()}-W${d.getMonth()}-${d.getDate()}`;
            const label = i === 0 ? "This Wk" : i === 1 ? "Next Wk" : i === -1 ? "Last Wk" : `Wk ${i}`;
            points.push({ label, dateStr, actualHours: 0, tasksCount: 0, isCurrent: i === 0});
        }
    } else if (period === "month") {
        for (let i = -pastCount; i <= futureCount; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const dateStr = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}`;
            const label = i === 0 ? "This Mo" : i === 1 ? "Next Mo" : d.toLocaleDateString('en-US', { month: 'short' });
            points.push({ label, dateStr, actualHours: 0, tasksCount: 0, isCurrent: i === 0});
        }
    }

    // Attribute hours
    for (const task of tasks) {
        if (!task.deadline) continue;
        const d = new Date(task.deadline);
        const hours = inferHours(task);

        if (period === "day") {
            const dToday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const diffDays = Math.round((dToday.getTime() - today.getTime()) / MS_PER_DAY);
            if (diffDays >= -pastCount && diffDays <= futureCount) {
                const idx = diffDays + pastCount;
                if (points[idx]) {
                    points[idx].actualHours += hours;
                    points[idx].tasksCount++;
                }
            }
        } else if (period === "week") {
            const taskMon = mondayOfWeek(d);
            const thisMon = mondayOfWeek(today);
            const diffWeeks = Math.round((taskMon.getTime() - thisMon.getTime()) / (7 * MS_PER_DAY));
            if (diffWeeks >= -pastCount && diffWeeks <= futureCount) {
                const idx = diffWeeks + pastCount;
                if (points[idx]) {
                    points[idx].actualHours += hours;
                    points[idx].tasksCount++;
                }
            }
        } else if (period === "month") {
            const diffMonths = (d.getFullYear() - today.getFullYear()) * 12 + (d.getMonth() - today.getMonth());
            if (diffMonths >= -pastCount && diffMonths <= futureCount) {
                const idx = diffMonths + pastCount;
                if (points[idx]) {
                    points[idx].actualHours += hours;
                    points[idx].tasksCount++;
                }
            }
        }
    }

    // Heuristic max hours for scaling
    const maxExpectedHours = period === "day" ? 8 : period === "week" ? 30 : 120;
    
    return points.map((p, i, arr) => {
        const score = Math.min(100, Math.round((p.actualHours / maxExpectedHours) * 100));
        const level = classify(score);
        const prevScore = i > 0 ? Math.min(100, Math.round((arr[i-1].actualHours / maxExpectedHours) * 100)) : 0;
        return {
            ...p,
            score,
            level,
            isCritical: score >= 70,
            isSpike: i > 0 && (score - prevScore > 20)
        };
    });
}

// ── Main Export ───────────────────────────────────────────────────────────────

export function calculateBurnout(tasks: BurnoutTask[]): BurnoutResult {
    const now         = new Date();
    const thisWeekMon = mondayOfWeek(now);
    const thisWeekSun = endOfDay(new Date(thisWeekMon.getTime() + 6 * MS_PER_DAY));

    // Edge case — no tasks
    if (!tasks.length) {
        const emptyWeeks: WeeklyBurnoutPoint[] = Array.from({ length: 6 }, (_, i) => ({
            label:      `Week ${i + 1}`,
            score:      0,
            level:      "Low" as BurnoutLevel,
            isCritical: false,
            isSpike:    false,
        }));
        return {
            score:             0,
            level:             "Low",
            trend:             "stable",
            isCriticalWeek:    false,
            criticalWeekIndex: -1,
            aiInsight:         "No tasks found. Add tasks to begin burnout analysis.",
            dominantFactor:    "None",
            subjectBreakdowns: [],
            weeklyTrend:       emptyWeeks,
            dailyWorkload:     buildWorkloadPoints([], now, "day", 7, 6),
            weeklyWorkload:    buildWorkloadPoints([], now, "week", 4, 3),
            monthlyWorkload:   buildWorkloadPoints([], now, "month", 3, 3),
            factorBreakdown:   { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 },
        };
    }

    // ── Current-week overall score ────────────────────────────────────────────

    const currWeekTasks = tasks.filter((t) => {
        const d = new Date(t.deadline);
        return d >= thisWeekMon && d <= thisWeekSun;
    });

    const A_c = factorA(currWeekTasks);
    const B_c = factorB(currWeekTasks, thisWeekMon, now);
    const C_c = factorC(tasks, thisWeekMon, now);
    const D_c = factorD(currWeekTasks, now);
    const { score: E_c, heaviestSubject } = factorE(currWeekTasks);
    const F_c = factorF(currWeekTasks);

    const currentScore = Math.min(100, Math.round(A_c + B_c + C_c + D_c + E_c + F_c));
    const currentLevel = classify(currentScore);

    const factorBreakdown = { A: A_c, B: B_c, C: C_c, D: D_c, E: E_c, F: F_c };

    // ── Subject breakdowns ────────────────────────────────────────────────────

    const subjects        = [...new Set(tasks.map((t) => t.subject))];
    const subjectBreakdowns = subjects.map((s) =>
        calcSubjectBurnout(s, tasks, thisWeekMon, thisWeekSun, now),
    );

    // ── 6-week rolling trend ──────────────────────────────────────────────────
    // Week 1 = 5 weeks ago → Week 6 = current week

    const weeklyTrend: WeeklyBurnoutPoint[] = [];

    for (let i = 5; i >= 0; i--) {
        const weekMon = new Date(thisWeekMon.getTime() - i * 7 * MS_PER_DAY);
        const weekSun = endOfDay(new Date(weekMon.getTime() + 6 * MS_PER_DAY));
        const score   = i === 0 ? currentScore : calcWeekScore(weekMon, weekSun, tasks, now);
        const level   = classify(score);

        weeklyTrend.push({
            label:      `Week ${6 - i}`,
            score,
            level,
            isCritical: score > 70,
            isSpike:    false, // set below after full array is built
        });
    }

    // Mark spikes (>15-pt increase vs previous week)
    for (let i = 1; i < weeklyTrend.length; i++) {
        weeklyTrend[i].isSpike = weeklyTrend[i].score - weeklyTrend[i - 1].score > 15;
    }

    // ── Metadata ──────────────────────────────────────────────────────────────

    const prevScore   = weeklyTrend[weeklyTrend.length - 2]?.score ?? currentScore;
    const trend: BurnoutResult["trend"] =
        currentScore > prevScore + 5 ? "up" :
        currentScore < prevScore - 5 ? "down" :
        "stable";

    const isCriticalWeek = currentScore > 70;

    // Last critical week index (for chart highlight)
    let criticalWeekIndex = -1;
    for (let i = weeklyTrend.length - 1; i >= 0; i--) {
        if (weeklyTrend[i].isCritical) { criticalWeekIndex = i; break; }
    }

    // Dominant factor
    const factorEntries: [string, number][] = [
        ["Workload Density",      A_c],
        ["Difficulty Clustering", B_c],
        ["Late-Night Pattern",    C_c],
        ["Missed Tasks",          D_c],
        ["Subject Imbalance",     E_c],
        ["Low Completion Rate",   F_c],
    ];
    const dominantFactor = factorEntries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];

    const aiInsight = buildInsight(currentLevel, factorBreakdown, heaviestSubject, weeklyTrend);

    const dailyWorkload = buildWorkloadPoints(tasks, now, "day", 6, 7);
    const weeklyWorkload = buildWorkloadPoints(tasks, now, "week", 4, 3);
    const monthlyWorkload = buildWorkloadPoints(tasks, now, "month", 3, 3);

    return {
        score:             currentScore,
        level:             currentLevel,
        trend,
        isCriticalWeek,
        criticalWeekIndex,
        aiInsight,
        dominantFactor,
        subjectBreakdowns,
        weeklyTrend,
        dailyWorkload,
        weeklyWorkload,
        monthlyWorkload,
        factorBreakdown,
    };
}
