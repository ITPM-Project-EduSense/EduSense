# GPA Prediction Feature Enhancement - Complete Guide

## Overview
The GPA Prediction system has been significantly enhanced to provide task-level integration, completion-based marking, and intelligent partial performance predictions.

---

## Key Features Implemented

### 1. **Assignment-Level Marks Input**
- Users can now enter marks for **individual assignments** instead of overall averages
- Each completed task is listed separately under its subject
- Real-time mark entry with validation (0-100 scale)

**Files Updated:**
- `src/lib/gpaEngine.ts` - New `AssignmentMark` interface
- `src/components/analytics/GpaMarksModal.tsx` - Enhanced modal UI

### 2. **Task Integration & Automatic Population**
When users open the "Input Marks" modal for a subject:
- ✅ **Completed tasks** are automatically displayed in a dedicated section
- ⏳ **Incomplete tasks** are listed separately with "Not Completed" status
- Tasks are fetched from the Tasks API and filtered by subject

**Logic:**
```typescript
completedTasks = tasks.filter(t => t.subject === subject && t.status === "completed")
incompleteTasks = tasks.filter(t => t.subject === subject && t.status !== "completed")
```

### 3. **Completion-Based Prediction Logic**
- **Only completed + graded tasks** contribute to GPA calculations
- Incomplete tasks are **excluded** from final grade calculations
- Missing marks (represented as -1) are ignored in averages

**Calculation:**
```
assignmentScore = (sum of completed task marks) / (count of completed + graded)
assignmentContribution = assignmentScore × 0.25 (25% weight)
```

### 4. **Partial Performance Analysis**
When tasks are incomplete or marks are missing:
- **Completion Rate** is displayed (e.g., "3/5 assignments graded - 60% complete")
- System shows **what's remaining** with clear indicators
- Provides **condition-based guidance**:
  - "Complete X more assignments to refine prediction"
  - "Awaiting midterm exam score. Current prediction is preliminary"

### 5. **Prediction Result Enhancements**
The GPA prediction now includes:

```typescript
interface GpaPredictionResult {
    currentCaPct: number;          // Current CA score (0-100)
    estimatedGrade: string;        // Based on available data
    completionRate: number;        // % of assignments with marks
    completedAssignments: number;  // Count of graded assignments
    totalAssignments: number;      // Total tasks for subject
    hasMissingData: boolean;       // True if incomplete
    guideline: string;             // Contextual guidance
}
```

### 6. **User-Friendly Guidance Messages**
The system displays helpful context-aware messages:

| Scenario | Message |
|----------|---------|
| Incomplete assignments | "Complete 3 more assignments to refine prediction" |
| Missing midterm | "Awaiting midterm exam score. Current prediction is preliminary" |
| High target grade | "Targeting A is highly ambitious. Focus on final exam prep" |
| On track | "On track for B. Current performance indicates solid base" |

---

## Data Structures

### New Types (src/lib/gpaEngine.ts)

```typescript
// Individual assignment mark tracking
export interface AssignmentMark {
    taskId: string;           // Links to task ID
    taskTitle: string;        // Display name
    marks: number;            // 0-100, or -1 for "not graded"
    isCompleted: boolean;     // Task completion status
}

// Updated marks storage by subject
export interface SubjectMarks {
    midterm: number;          // 0-100
    assignments: AssignmentMark[];  // Array of individual marks
    midtermLocked?: boolean;  // Optional finalization flag
}
```

---

## Component Updates

### GpaMarksModal (src/components/analytics/GpaMarksModal.tsx)

**New Props:**
```typescript
tasks: Task[];              // All tasks from API
subject: string;            // Subject being edited
currentMarks: SubjectMarks;  // Current marks for subject
```

**Features:**
- ✅ Displays completed tasks in a dedicated green section
- ⏳ Shows incomplete tasks in an amber warning box
- 🔢 Individual input fields for each completed task
- 📊 Overall completion rate indicator
- 💡 Contextual guidance about missing assignments

### GpaSubjectPrediction (src/components/analytics/GpaSubjectPrediction.tsx)

**New Features:**
- Initializes assignment structures from task API on load
- Updates localStorage with new SubjectMarks format
- Displays completion status inline with predictions
- Shows missing data warnings with amber indicators
- Passes tasks to modal for assignment listing

**New Display:**
```
Completion Status Section (shown if hasMissingData = true):
┌─────────────────────────────────────┐
│ ⏱️ 3/5 assignments graded · 60% complete
│ Complete 2 more assignments to refine prediction
└─────────────────────────────────────┘
```

---

## Calculation Logic

### Assignment Score Computation

```typescript
// Filter for valid completed entries
validAssignments = assignments.filter(a => a.isCompleted && a.marks >= 0)

// Calculate average (ignores -1 "not graded" entries)
avgAssignmentScore = sum(marks) / count(validAssignments)

// Weight contribution
assignmentContrib = avgAssignmentScore × 0.25
```

### Current CA Percentage

```typescript
// Only includes components with data
if (completedAssignments > 0 || midterm > 0):
    currentCaPct = (assignmentContrib + midtermContrib) / 0.50
else:
    currentCaPct = 0  // No data available
```

### Risk & Confidence Assessment

- **Risk:** Marked as true if CA < 60% OR if missing data
- **Confidence:**
  - Base: 40%
  - +25% if midterm entered
  - +20% if assignments have marks
  - +15% if 100% completion

---

## User Workflow

### Completing the GPA Prediction Flow

1. **View Dashboard**
   - Analytics page shows subjects with current predictions
   - Amber indicator appears if data is incomplete

2. **Open Input Marks Modal**
   - Click "Input Marks" button on any subject
   - Modal loads all tasks for that subject

3. **Enter Completion Data**
   - All completed tasks are pre-selected (green section)
   - Incomplete tasks shown in warning (amber section)
   - Enter marks (0-100) for each completed task

4. **View Updated Prediction**
   - System updates CA score once marks are saved
   - Completion rate and guidance text update
   - Partial performance shown based on available data

---

## Storage Format

### localStorage Key
```
"edusense_gpa_marks"

Example JSON:
{
  "Mathematics": {
    "midterm": 85,
    "assignments": [
      {
        "taskId": "task_1",
        "taskTitle": "Assignment 1: Calculus",
        "marks": 92,
        "isCompleted": true
      },
      {
        "taskId": "task_2",
        "taskTitle": "Assignment 2: Algebra",
        "marks": -1,
        "isCompleted": false
      }
    ],
    "midtermLocked": true
  }
}
```

---

## API Integration

### Task Fetching
```typescript
const taskData = await apiFetch("/tasks");
// Expected Task structure:
interface Task {
    id: string;
    subject: string;
    title: string;
    status: "pending" | "in_progress" | "completed";
    completedAt?: string;
}
```

---

## Validation Rules

✅ **Marks Input:**
- Range: 0-100 (enforced by input type)
- Missing marks recorded as -1
- Only graded (≥ 0) marks count in averages

✅ **Task Completion:**
- Only status === "completed" tasks can receive marks
- Incomplete tasks automatically excluded from calculations
- User cannot enter marks for incomplete tasks (field disabled)

✅ **Grade Calculations:**
- No division by zero (checks array length)
- Handles empty subject lists gracefully
- Partial data results in proportional CA calculation

---

## Testing Checklist

- [ ] Create 3+ tasks in Tasks section
- [ ] Mark some as completed, leave others pending
- [ ] Open GPA modal for the subject
- [ ] Verify completed tasks appear in green
- [ ] Verify incomplete tasks appear in amber
- [ ] Enter marks for completed tasks (0-100)
- [ ] Click "Update Prediction"
- [ ] Verify localStorage contains new structure
- [ ] Check dashboard shows completion rate
- [ ] Verify missing data warnings display correctly
- [ ] Test with no tasks, partial completion, full completion

---

## Technical Specifications

### Files Modified
1. **src/lib/gpaEngine.ts** (165 lines)
   - New interfaces: AssignmentMark, updated SubjectMarks, GpaPredictionResult
   - Enhanced calculateSubjectGpa() with completion logic
   - Added completion rate, risk, and guidance computations

2. **src/components/analytics/GpaMarksModal.tsx** (230 lines)
   - New props: tasks, currentMarks (SubjectMarks)
   - Completed tasks section with individual mark inputs
   - Incomplete tasks warning with visual indicators
   - Task-based form structure

3. **src/components/analytics/GpaSubjectPrediction.tsx** (330 lines)
   - Task type enhanced with title field
   - initializeMarksFromTasks() helper function
   - LocalStorage sync with new SubjectMarks format
   - Completion status display in prediction rows
   - hasMissingData indicator and warnings

### Dependencies
- React Hooks: useState, useEffect, useMemo ✓
- Framer Motion: motion, AnimatePresence ✓
- Lucide Icons: Clock (new), AlertTriangle, CheckCircle2, etc. ✓

### Browser Compatibility
- LocalStorage API ✓
- Modern CSS Flexbox/Grid ✓
- Number input type ✓

---

## Future Enhancement Ideas

1. **Sync with Backend**
   - POST marks to `/marks` endpoint
   - Real-time updates across devices

2. **Historical Tracking**
   - View past semestral predictions
   - Compare performance trends

3. **AI-Powered Recommendations**
   - "Focus on assignment 3 - highest impact on grade"
   - Study schedule optimization

4. **Notification System**
   - Remind users to complete pending assignments
   - Alert when predictions drop below target

5. **Export/Reporting**
   - Generate PDF prediction reports
   - Email progress summaries

---

## Support & Troubleshooting

### Issue: Incomplete tasks not showing
**Solution:** Ensure tasks have status !== "completed" and subject matches

### Issue: Marks not saving
**Solution:** Check browser console for localStorage errors, verify browser storage is enabled

### Issue: Predictions stuck at 0%
**Solution:** Ensure at least one assignment is marked as completed before entering marks

---

**Last Updated:** April 3, 2026
**Version:** 2.0 - Assignment-Level Integration
