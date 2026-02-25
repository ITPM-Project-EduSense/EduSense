# 🚀 Frontend Implementation - Quick Reference

## Overview

Your backend now has a complete document intelligence + schedule generation system. Here's how to connect your frontend.

---

## 📦 What You Have (Backend)

### ✅ Document Upload & Processing
- `POST /api/documents/upload` - Upload PDF/DOCX/PPTX
- AI extracts concepts automatically
- Generates embeddings for each concept

### ✅ Concept Management  
- `GET /api/study-schedules/concepts/preview?task_id=xxx` - Preview matched concepts
- `GET /api/study-schedules/concepts/all` - Get all user concepts
- `GET /api/study-schedules/stats` - Dashboard statistics

### ✅ Schedule Generation
- `POST /api/study-schedules/generate-from-concepts` - Generate intelligent schedule
- `POST /api/study-schedules/validate-feasibility` - Check if deadline is realistic

### ✅ Smart Features
- Semantic concept matching using embeddings
- Deterministic rule-based scheduling
- Difficulty-based prioritization  
- Break management (3 focus blocks → long break)

---

## 🎯 What You Need to Build (Frontend)

### 1. **Document Upload Page** (`/documents`)
Users upload study materials here.

**Key Features:**
- File upload input (PDF, DOCX, PPTX)
- Show extracted concepts after upload
- List of previously uploaded materials

### 2. **AI Schedule Generator Page** (`/schedule-ai`)
Main AI panel for schedule generation.

**Flow:**
```
Select Task → Preview Concepts → Generate Schedule → View Result
```

**Required Components:**
- Task selector dropdown
- Concept preview with stats
- Feasibility checker
- Schedule generator form
- Schedule timeline view

### 3. **Dashboard Enhancements**
Add statistics widgets to existing dashboard.

**Widgets:**
- Total concepts available
- Total study hours
- Active schedules count
- Material upload count

---

## 💻 Implementation Steps

### Step 1: Add API Service

Already created for you: `frontend/src/lib/scheduleApi.ts`

Key functions:
```typescript
// Upload document
await uploadDocument(file);

// Preview concepts for a task
await previewTaskConcepts(taskId);

// Generate schedule
await generateScheduleFromTask({
  task_id: taskId,
  focus_block_minutes: 50,
  break_minutes: 10
});

// Check feasibility
await checkScheduleFeasibility(taskId);

// Get stats
await getStudyStats();
```

### Step 2: Create Components

**Option A: Use Example Components**
Copy from `QuickStartExamples.tsx` - they're ready to use!

**Option B: Create Custom (Recommended Structure)**

```
components/
├── schedule/
│   ├── ConceptPreviewCard.tsx    ← Shows matched concepts
│   ├── ScheduleGeneratorForm.tsx ← Settings + Generate button
│   ├── ScheduleTimeline.tsx      ← Display generated blocks
│   └── FeasibilityBadge.tsx      ← Shows if schedule is feasible
└── documents/
    ├── DocumentUploadZone.tsx    ← Drag & drop upload
    └── MaterialList.tsx          ← List uploaded materials
```

### Step 3: Create Pages

**A. Document Upload Page**

Create: `app/(dashboard)/documents/page.tsx`

```typescript
'use client';

import { uploadDocument } from '@/lib/scheduleApi';
import { useState } from 'react';

export default function DocumentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadDocument(file);
      alert(`Success! ${result.concepts_extracted} concepts extracted`);
      setFile(null);
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
    setUploading(false);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Upload Study Materials</h1>
      
      <div className="max-w-2xl">
        <input
          type="file"
          accept=".pdf,.docx,.pptx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full mb-4"
        />
        
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-6 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
        >
          {uploading ? 'Uploading...' : 'Upload & Process'}
        </button>
      </div>
    </div>
  );
}
```

**B. AI Schedule Generator Page**

Create: `app/(dashboard)/schedule-ai/page.tsx`

```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  previewTaskConcepts, 
  generateScheduleFromTask 
} from '@/lib/scheduleApi';

export default function ScheduleAIPage() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get('taskId');
  
  const [step, setStep] = useState<'preview' | 'generate'>('preview');
  const [preview, setPreview] = useState<any>(null);
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load preview on mount
  useEffect(() => {
    if (taskId) loadPreview();
  }, [taskId]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const data = await previewTaskConcepts(taskId!);
      setPreview(data);
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateScheduleFromTask({
        task_id: taskId!,
        focus_block_minutes: 50,
        break_minutes: 10
      });
      setSchedule(result);
      alert('Schedule generated!');
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  if (!taskId) {
    return <div className="p-6">Please select a task first.</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AI Schedule Generator</h1>

      {/* Step 1: Preview */}
      {step === 'preview' && preview && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold">{preview.statistics.total_concepts}</div>
              <div className="text-sm">Matched Concepts</div>
            </div>
            <div className="p-4 bg-green-50 rounded">
              <div className="text-2xl font-bold">{preview.statistics.total_study_hours}h</div>
              <div className="text-sm">Study Time</div>
            </div>
            <div className="p-4 bg-purple-50 rounded">
              <div className="text-2xl font-bold">
                {Math.round(preview.statistics.average_similarity * 100)}%
              </div>
              <div className="text-sm">Relevance</div>
            </div>
          </div>

          <button
            onClick={() => setStep('generate')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold"
          >
            Continue to Generate →
          </button>
        </div>
      )}

      {/* Step 2: Generate */}
      {step === 'generate' && (
        <div className="space-y-4">
          <button onClick={() => setStep('preview')} className="text-blue-600 text-sm">
            ← Back to preview
          </button>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold disabled:bg-gray-300"
          >
            {loading ? 'Generating...' : '🚀 Generate Schedule'}
          </button>

          {schedule && (
            <div className="p-4 bg-green-50 rounded">
              <h3 className="font-bold">✅ Schedule Generated!</h3>
              <p className="text-sm">
                {schedule.total_days} days • {schedule.total_hours} hours • 
                {schedule.matched_concepts} concepts
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Step 4: Add Navigation

**In your task list, add a button:**

```typescript
<button
  onClick={() => router.push(`/schedule-ai?taskId=${task.id}`)}
  className="px-4 py-2 bg-purple-600 text-white rounded"
>
  🤖 Generate AI Schedule
</button>
```

**In your sidebar navigation:**

```typescript
<NavLink href="/documents" icon="📄">
  Study Materials
</NavLink>
<NavLink href="/schedule-ai" icon="🤖">
  AI Schedule Generator
</NavLink>
```

---

## 🎨 UI/UX Best Practices

### Loading States
```typescript
{loading && <div className="animate-pulse">Loading...</div>}
```

### Error Handling
```typescript
try {
  await uploadDocument(file);
} catch (error: any) {
  // Show user-friendly error
  setError(error.message);
}
```

### Success Feedback
```typescript
{success && (
  <div className="bg-green-50 text-green-700 p-4 rounded">
    ✅ Success! {message}
  </div>
)}
```

### Empty States
```typescript
{concepts.length === 0 && (
  <div className="text-center py-12 text-gray-500">
    <p>No study materials uploaded yet.</p>
    <button className="mt-4 text-blue-600">Upload your first document</button>
  </div>
)}
```

---

## 🧪 Testing Flow

### 1. Test Document Upload
1. Go to `/documents`
2. Upload a PDF file
3. Wait for concepts to be extracted
4. Verify concepts appear in the result

### 2. Test Schedule Generation
1. Create a task in your task list
2. Click "Generate AI Schedule" button
3. Review matched concepts in preview
4. Click "Generate Schedule"
5. Verify schedule appears with blocks

### 3. Test Feasibility Check
1. Create a task with tight deadline (2 days)
2. Check feasibility
3. Should warn if not enough time

---

## 📊 Example Data Flow

```
User Action                Backend Response              Frontend Display
-----------                ----------------              ----------------
Upload PDF        →        Extract text                  "Processing..."
                           Extract concepts (AI)         Show concepts list
                           Generate embeddings           Show statistics

Select Task       →        Match concepts                Preview with scores
                           (semantic similarity)         Statistics dashboard

Generate          →        Rule-based scheduling         Timeline view
Schedule                   (no AI, deterministic)        Block-by-block

Check             →        Calculate utilization         Feasibility badge
Feasibility                Return recommendation         Warning if tight
```

---

## 🎯 Quick Win Checklist

- [ ] Copy `scheduleApi.ts` to your project
- [ ] Create `/documents` page with upload
- [ ] Create `/schedule-ai` page with basic flow
- [ ] Add "Generate AI Schedule" button to tasks
- [ ] Test upload → preview → generate flow
- [ ] Add loading states
- [ ] Add error handling
- [ ] Style with Tailwind CSS
- [ ] Test on real data

---

## 🆘 Common Issues

### Issue: "Not authenticated"
**Solution:** Make sure `credentials: 'include'` is in all fetch calls

### Issue: "Task not found"
**Solution:** Verify taskId is correct and exists in database

### Issue: "No concepts found"
**Solution:** User needs to upload study materials first

### Issue: CORS errors
**Solution:** Check backend CORS settings allow localhost:3000

---

## 📚 Resources

- **Full Implementation Guide:** `FRONTEND_IMPLEMENTATION_GUIDE.md`
- **API Service:** `frontend/src/lib/scheduleApi.ts`
- **Example Components:** `frontend/src/components/schedule/QuickStartExamples.tsx`
- **Backend API Docs:** `http://localhost:8000/docs` (when running)

---

## 🚀 Next Steps

1. **Start Simple:** Build upload page first
2. **Test Backend:** Use Postman/Thunder Client to verify endpoints work
3. **Build Preview:** Show matched concepts before generating
4. **Add Generation:** Implement the schedule generator
5. **Polish UI:** Add animations, better styling, empty states
6. **Add Features:** Availability settings, custom time blocks, etc.

---

**Need Help?** Check the example components in `QuickStartExamples.tsx` - they're copy-paste ready!
