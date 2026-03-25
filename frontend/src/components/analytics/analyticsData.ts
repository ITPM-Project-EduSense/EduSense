/* ─── Centralized Dummy Data for Analytics Dashboard ─── */

// ── KPI Data ──
export const kpiData = {
  academicRisk: {
    status: "Warning" as const,
    explanation: "2 subjects trending below target threshold this semester.",
    trend: "+5%",
  },
  deadlineRisk: {
    probability: 78,
    subtitle: "Based on workload & past completion rate",
  },
  gpaPrediction: {
    value: 3.45,
    max: 4.0,
    trend: "+0.12",
    direction: "up" as const,
  },
  burnoutIndex: {
    level: "High" as const,
    trend: "up" as const,
    isCriticalWeek: true,
  },
};

// ── Subject Performance ──
export type SubjectScore = {
  name: string;
  score: number;
  change: string;
  changeType: "up" | "down" | "neutral";
  color: string;
};

export const subjectScores: SubjectScore[] = [
  { name: "Mathematics", score: 82, change: "+2%", changeType: "up", color: "#6366F1" },
  { name: "Biology", score: 58, change: "-5%", changeType: "down", color: "#F59E0B" },
  { name: "History", score: 74, change: "+1%", changeType: "up", color: "#10B981" },
  { name: "Computer Science", score: 91, change: "+4%", changeType: "up", color: "#3B82F6" },
];

// ── Weekly Trends ──
export const weekLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const taskCompletionTrend = [3, 5, 4, 7, 6, 2, 5];
export const missedDeadlinesTrend = [0, 1, 0, 2, 1, 0, 0];
export const studyHoursTrend = [4, 5, 3, 6, 5, 7, 4];
export const productivityTrend = [60, 72, 55, 85, 78, 90, 68];

// ── Burnout / Stress ──
export const stressLabels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"];
export const stressTrend = [30, 42, 55, 48, 82, 70];
export const criticalWeekIndex = 4; // Week 5

// ── GPA Subject Prediction ──
export type GpaPrediction = {
  subject: string;
  grade: string;
  risk: boolean;
  icon: string;
};

export const gpaPredictions: GpaPrediction[] = [
  { subject: "Mathematics", grade: "A-", risk: false, icon: "📐" },
  { subject: "Biology", grade: "C+", risk: true, icon: "🧬" },
  { subject: "History", grade: "B+", risk: false, icon: "📜" },
  { subject: "Computer Science", grade: "A", risk: false, icon: "💻" },
];

// ── AI Recommendations ──
export type AiRecommendation = {
  icon: string;
  title: string;
  explanation: string;
  priority: "High" | "Medium" | "Suggestion";
};

export const aiRecommendations: AiRecommendation[] = [
  {
    icon: "📅",
    title: "Shift Biology study to Tuesday evening",
    explanation: "Your retention rate is 23% higher during evening sessions.",
    priority: "High",
  },
  {
    icon: "⚡",
    title: "Limit high-difficulty tasks to 3/day",
    explanation: "Avoid scheduling more than 3 high-difficulty tasks in one day.",
    priority: "High",
  },
  {
    icon: "🌙",
    title: "Peak performance window detected",
    explanation: "You perform better between 7–9 PM based on past 4 weeks.",
    priority: "Medium",
  },
  {
    icon: "📚",
    title: "Redistribute History workload",
    explanation: "Spreading chapters across 3 days improves comprehension by 18%.",
    priority: "Suggestion",
  },
  {
    icon: "🧘",
    title: "Schedule a recovery break Thursday",
    explanation: "Burnout indicators suggest a mid-week cooldown is needed.",
    priority: "Medium",
  },
];

// ── Real-Time Alerts ──
export type Alert = {
  type: "danger" | "warning" | "info";
  message: string;
  time: string;
};

export const alerts: Alert[] = [
  { type: "danger", message: "3 high-difficulty tasks scheduled for tomorrow", time: "2 min ago" },
  { type: "warning", message: "Sleep time decreased for 2 consecutive days", time: "15 min ago" },
  { type: "info", message: "Workload spike detected for next Wednesday", time: "1 hr ago" },
  { type: "danger", message: "Biology assignment deadline in 18 hours", time: "1 hr ago" },
  { type: "warning", message: "Study consistency dropped below 60% this week", time: "3 hrs ago" },
  { type: "info", message: "New study pattern insight available", time: "5 hrs ago" },
  { type: "info", message: "Weekly performance report ready to view", time: "6 hrs ago" },
];
