/**
 * GPA Prediction Engine
 * Handles weighted calculations for subject performance and grade projections.
 * 
 * Standard Weightage:
 * - Assignments: 25% (CA)
 * - Midterm Exam: 25% (CA)
 * - Final Exam: 50% (Future)
 */

export interface AssignmentMark {
    taskId: string;
    taskTitle: string;
    marks: number; // 0-100 or -1 for "not yet graded"
    isCompleted: boolean;
}

export interface SubjectMarks {
    midterm: number; // 0-100
    assignments: AssignmentMark[]; // Individual assignment marks
    midtermLocked?: boolean; // Whether midterm score is finalized
    credits?: number; // Credit hours for this subject (default 3)
}

export interface GpaPredictionResult {
    subject: string;
    currentCaPct: number; // 0-100 (weighted relative to current progress)
    overallPct: number; // 0-100 (current total contribution)
    estimatedGrade: string;
    gpaValue: number; // 0.0-4.0 (GPA value of estimated grade)
    requiredFinal: number | null; // % needed in final to reach target
    targetGrade: string;
    risk: boolean;
    confidence: number;
    guideline: string;
    completionRate: number; // % of assignments with marks
    completedAssignments: number;
    totalAssignments: number;
    hasMissingData: boolean;
    credits: number; // Credit hours
}

export interface WeightedGpaResult {
    predictedGpa: number; // 0.0-4.0
    totalCredits: number;
    subjectCount: number;
    hasValidData: boolean;
    message: string;
}

const GRADE_SCALE = [
    { grade: "A", min: 85 },
    { grade: "B", min: 70 },
    { grade: "C", min: 55 },
    { grade: "D", min: 40 },
    { grade: "F", min: 0 },
];

const GRADE_TO_GPA: Record<string, number> = {
    "A": 4.0,
    "A-": 3.7,
    "B+": 3.3,
    "B": 3.0,
    "B-": 2.7,
    "C+": 2.3,
    "C": 2.0,
    "C-": 1.7,
    "D+": 1.3,
    "D": 1.0,
    "D-": 0.7,
    "F": 0.0,
};

const WEIGHTS = {
    assignments: 0.25,
    midterm: 0.25,
    final: 0.50,
};

function gradeToGpa(grade: string): number {
    return GRADE_TO_GPA[grade] ?? 0.0;
}

export function calculateSubjectGpa(
    subject: string,
    marks: SubjectMarks,
    targetGrade: string = "A"
): GpaPredictionResult {
    // ── Process Assignments (Defensive: handle both old and new formats) ──
    const assignmentsArray = Array.isArray(marks.assignments) ? marks.assignments : [];
    const completedAssignments = assignmentsArray.filter(a => a.isCompleted && a.marks >= 0).length;
    const totalAssignments = assignmentsArray.length;
    const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;
    
    let assignmentScore = 0;
    if (completedAssignments > 0) {
        const validMarks = assignmentsArray
            .filter(a => a.isCompleted && a.marks >= 0)
            .reduce((sum, a) => sum + a.marks, 0);
        assignmentScore = validMarks / completedAssignments;
    }

    const hasMissingData = completionRate < 100 || marks.midterm === 0;

    // Current contribution to overall 100% (only from complete/graded items)
    const assignmentContrib = assignmentScore * WEIGHTS.assignments;
    const midtermContrib = marks.midterm * WEIGHTS.midterm;
    const currentTotalContrib = assignmentContrib + midtermContrib;

    // Current CA Percentage (out of the 50% completed so far)
    const currentCaPct = marks.midterm > 0 || completedAssignments > 0 
        ? (currentTotalContrib / (WEIGHTS.assignments + WEIGHTS.midterm))
        : 0;

    // Determine estimated grade based on current trend
    const trendPct = currentCaPct;
    const estimatedGrade = GRADE_SCALE.find(g => trendPct >= g.min)?.grade || "F";

    // Calculate required final exam score for target grade
    const targetMin = GRADE_SCALE.find(g => g.grade === targetGrade)?.min || 85;
    const remainingNeeded = targetMin - currentTotalContrib;
    const requiredFinal = Math.max(0, Math.min(100, Math.round((remainingNeeded / WEIGHTS.final) * 10) / 10));

    // Risk assessment
    const risk = currentCaPct < 60 || hasMissingData;

    // Confidence based on how much data we have
    let confidence = 40;
    if (marks.midterm > 0) confidence += 25;
    if (completedAssignments > 0) confidence += 20;
    if (completionRate === 100) confidence += 15;

    // Guidelines
    let guideline = "";
    if (hasMissingData) {
        const missing = totalAssignments - completedAssignments;
        if (missing > 0) {
            guideline = `Complete ${missing} more assignment${missing > 1 ? 's' : ''} to refine prediction.`;
        } else if (marks.midterm === 0) {
            guideline = "Awaiting midterm exam score. Current prediction is preliminary.";
        } else {
            guideline = "Data incomplete. Add missing assignments or exam scores.";
        }
    } else if (requiredFinal > 95) {
        guideline = `Targeting ${targetGrade} is highly ambitious. Focus on maximizing final exam prep.`;
    } else if (requiredFinal > 40) {
        guideline = `You need ${requiredFinal}% in the final exam to achieve an ${targetGrade}.`;
    } else {
        guideline = `On track for ${targetGrade}. Current performance indicates a solid base.`;
    }

    // Calculate GPA value from estimated grade
    const gpaValue = gradeToGpa(estimatedGrade);
    const credits = marks.credits ?? 3; // Default 3 credits if not specified

    return {
        subject,
        currentCaPct: Math.round(currentCaPct),
        overallPct: Math.round(currentTotalContrib),
        estimatedGrade,
        gpaValue,
        requiredFinal: remainingNeeded > 50 ? null : requiredFinal,
        targetGrade,
        risk,
        confidence,
        guideline,
        completionRate,
        completedAssignments,
        totalAssignments,
        hasMissingData,
        credits
    };
}

/**
 * Calculates weighted GPA across multiple subjects
 */
export function calculateWeightedGpa(
    predictions: GpaPredictionResult[],
    marksMap: Record<string, SubjectMarks>
): WeightedGpaResult {
    // Filter for subjects with sufficient data
    const validPredictions = predictions.filter(p => {
        const marks = marksMap[p.subject];
        if (!marks) return false;
        // Include if has midterm or at least 50% of assignments completed
        return marks.midterm > 0 || p.completionRate >= 50;
    });

    if (validPredictions.length === 0) {
        return {
            predictedGpa: 0,
            totalCredits: 0,
            subjectCount: 0,
            hasValidData: false,
            message: "Add marks and credits to calculate predicted GPA"
        };
    }

    let totalGpaPoints = 0;
    let totalCredits = 0;

    validPredictions.forEach(pred => {
        const gpaPoints = pred.gpaValue * pred.credits;
        totalGpaPoints += gpaPoints;
        totalCredits += pred.credits;
    });

    const predictedGpa = totalCredits > 0 ? Math.round((totalGpaPoints / totalCredits) * 100) / 100 : 0;

    return {
        predictedGpa,
        totalCredits,
        subjectCount: validPredictions.length,
        hasValidData: totalCredits > 0,
        message: `Your current predicted GPA is ${predictedGpa.toFixed(2)}`
    };
}

/**
 * Calculates aggregate CA for multiple subjects
 */
export function calculateOverallCa(results: GpaPredictionResult[]): number {
    if (!results.length) return 0;
    const sum = results.reduce((acc, r) => acc + r.currentCaPct, 0);
    return Math.round(sum / results.length);
}
