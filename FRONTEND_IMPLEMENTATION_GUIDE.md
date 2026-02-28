# Frontend Implementation Guide
## EduSense Schedule Generation AI Panel

This guide shows how to implement the frontend for the document intelligence and schedule generation system.

---

## 📁 File Structure

```
frontend/src/
├── lib/
│   ├── api.ts (existing)
│   └── scheduleApi.ts (new - API functions)
├── components/
│   ├── schedule/
│   │   ├── ConceptPreview.tsx (new)
│   │   ├── FeasibilityCheck.tsx (new)
│   │   ├── ConceptLibrary.tsx (new)
│   │   ├── ScheduleGenerator.tsx (new)
│   │   └── StudyStats.tsx (new)
│   └── documents/
│       └── DocumentUpload.tsx (new)
└── app/
    └── (dashboard)/
        ├── schedule-ai/
        │   └── page.tsx (new - AI Panel)
        └── documents/
            └── page.tsx (new - Upload page)
```

---

## 🔌 Step 1: Create API Service Functions

Create `frontend/src/lib/scheduleApi.ts`:

```typescript
import { apiFetch } from './api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api';

// ==================== DOCUMENT UPLOAD ====================

export interface UploadDocumentResponse {
  success: boolean;
  message: string;
  material_id: string;
  filename: string;
  concepts_extracted: number;
  concepts: Array<{
    id: string;
    title: string;
    summary: string;
    difficulty: 'easy' | 'medium' | 'hard';
    estimated_minutes: number;
    created_at: string;
  }>;
}

export async function uploadDocument(file: File): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
    credentials: 'include', // Important for auth
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Upload failed');
  }

  return response.json();
}

// ==================== CONCEPT PREVIEW ====================

export interface ConceptWithScore {
  id: string;
  title: string;
  summary: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_minutes: number;
  material_id: string;
  similarity_score: number;
  relevance_percentage: number;
  created_at: string;
}

export interface ConceptPreviewResponse {
  success: boolean;
  task_id: string;
  task_title: string;
  task_subject: string;
  task_deadline: string;
  matched_concepts: ConceptWithScore[];
  statistics: {
    total_concepts: number;
    total_study_minutes: number;
    total_study_hours: number;
    difficulty_distribution: {
      easy: number;
      medium: number;
      hard: number;
    };
    average_similarity: number;
  };
}

export async function previewTaskConcepts(
  taskId: string,
  topK: number = 15
): Promise<ConceptPreviewResponse> {
  return apiFetch(`/study-schedules/concepts/preview?task_id=${taskId}&top_k=${topK}`);
}

// ==================== GENERATE SCHEDULE ====================

export interface GenerateScheduleRequest {
  task_id: string;
  availability?: Record<string, Array<{ start: string; end: string }>>;
  focus_block_minutes?: number;
  break_minutes?: number;
}

export interface ScheduleBlock {
  date: string;
  start_time: string;
  end_time: string;
  title: string;
  type: 'study' | 'review' | 'break';
  duration_minutes: number;
  concept_id?: string;
  difficulty?: string;
}

export interface GenerateScheduleResponse {
  success: boolean;
  message: string;
  schedule_id: string;
  task_id: string;
  matched_concepts: number;
  total_days: number;
  total_hours: number;
  schedule: any; // Full schedule object
  schedule_blocks: ScheduleBlock[];
}

export async function generateScheduleFromTask(
  request: GenerateScheduleRequest
): Promise<GenerateScheduleResponse> {
  const formData = new FormData();
  formData.append('task_id', request.task_id);
  
  if (request.availability) {
    formData.append('availability', JSON.stringify(request.availability));
  }
  
  if (request.focus_block_minutes) {
    formData.append('focus_block_minutes', request.focus_block_minutes.toString());
  }
  
  if (request.break_minutes) {
    formData.append('break_minutes', request.break_minutes.toString());
  }

  const response = await fetch(`${API_BASE}/study-schedules/generate-from-concepts`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Schedule generation failed');
  }

  return response.json();
}

// ==================== FEASIBILITY CHECK ====================

export interface FeasibilityResponse {
  success: boolean;
  task_id: string;
  task_title: string;
  matched_concepts: number;
  feasible: boolean;
  total_study_minutes: number;
  available_minutes: number;
  utilization_percentage: number;
  days_available: number;
  concepts_count: number;
  recommendation: string;
}

export async function checkFeasibility(
  taskId: string,
  availability?: Record<string, Array<{ start: string; end: string }>>
): Promise<FeasibilityResponse> {
  const formData = new FormData();
  formData.append('task_id', taskId);
  
  if (availability) {
    formData.append('availability', JSON.stringify(availability));
  }

  const response = await fetch(`${API_BASE}/study-schedules/validate-feasibility`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Feasibility check failed');
  }

  return response.json();
}

// ==================== GET ALL CONCEPTS ====================

export interface ConceptLibraryResponse {
  success: boolean;
  concepts: Array<{
    id: string;
    title: string;
    summary: string;
    difficulty: 'easy' | 'medium' | 'hard';
    estimated_minutes: number;
    material_id: string;
    created_at: string;
  }>;
  statistics: {
    total_concepts: number;
    total_study_minutes: number;
    total_study_hours: number;
    difficulty_distribution: {
      easy: number;
      medium: number;
      hard: number;
    };
  };
}

export async function getAllConcepts(
  difficulty?: 'easy' | 'medium' | 'hard',
  limit: number = 50
): Promise<ConceptLibraryResponse> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (difficulty) {
    params.append('difficulty', difficulty);
  }
  
  return apiFetch(`/study-schedules/concepts/all?${params.toString()}`);
}

// ==================== STUDY STATS ====================

export interface StudyStatsResponse {
  success: boolean;
  concepts: {
    total: number;
    by_difficulty: {
      easy: number;
      medium: number;
      hard: number;
    };
    total_study_minutes: number;
    total_study_hours: number;
    average_per_concept: number;
  };
  schedules: {
    total: number;
    active: number;
    completed: number;
  };
  materials: {
    total_uploaded: number;
  };
}

export async function getStudyStats(): Promise<StudyStatsResponse> {
  return apiFetch('/study-schedules/stats');
}

// ==================== RECOMMENDATIONS ====================

export async function getRecommendations(
  difficulty?: 'easy' | 'medium' | 'hard',
  maxMinutes?: number,
  limit: number = 20
): Promise<ConceptLibraryResponse> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (difficulty) params.append('difficulty', difficulty);
  if (maxMinutes) params.append('max_minutes', maxMinutes.toString());
  
  return apiFetch(`/study-schedules/recommendations?${params.toString()}`);
}
```

---

## 🎨 Step 2: Create Components

### A. Document Upload Component

Create `frontend/src/components/documents/DocumentUpload.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { uploadDocument } from '@/lib/scheduleApi';

export default function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const response = await uploadDocument(file);
      setResult(response);
      setFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Upload Study Material</h2>
      
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium">
          Select File (PDF, DOCX, or PPTX)
        </label>
        <input
          type="file"
          accept=".pdf,.docx,.pptx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm border rounded-lg p-2"
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300"
      >
        {uploading ? 'Uploading...' : 'Upload & Extract Concepts'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h3 className="font-bold text-green-800 mb-2">✅ Success!</h3>
          <p className="text-sm text-green-700">
            Extracted {result.concepts_extracted} concepts from {result.filename}
          </p>
          
          <div className="mt-4 space-y-2">
            {result.concepts.slice(0, 5).map((concept: any) => (
              <div key={concept.id} className="p-2 bg-white rounded border">
                <h4 className="font-semibold text-sm">{concept.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{concept.summary}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    concept.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                    concept.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {concept.difficulty}
                  </span>
                  <span className="text-xs text-gray-500">
                    {concept.estimated_minutes} min
                  </span>
                </div>
              </div>
            ))}
            {result.concepts.length > 5 && (
              <p className="text-xs text-gray-500">
                + {result.concepts.length - 5} more concepts
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### B. Concept Preview Component

Create `frontend/src/components/schedule/ConceptPreview.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { previewTaskConcepts, ConceptPreviewResponse } from '@/lib/scheduleApi';

interface ConceptPreviewProps {
  taskId: string;
  onContinue?: (preview: ConceptPreviewResponse) => void;
}

export default function ConceptPreview({ taskId, onContinue }: ConceptPreviewProps) {
  const [preview, setPreview] = useState<ConceptPreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreview();
  }, [taskId]);

  const loadPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await previewTaskConcepts(taskId);
      setPreview(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading concept preview...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg">
        {error}
      </div>
    );
  }

  if (!preview) return null;

  const { matched_concepts, statistics } = preview;

  return (
    <div className="space-y-6">
      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {statistics.total_concepts}
          </div>
          <div className="text-sm text-gray-600">Matched Concepts</div>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {statistics.total_study_hours}h
          </div>
          <div className="text-sm text-gray-600">Estimated Time</div>
        </div>
        
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(statistics.average_similarity * 100)}%
          </div>
          <div className="text-sm text-gray-600">Avg Relevance</div>
        </div>
        
        <div className="p-4 bg-orange-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">Difficulty</div>
          <div className="flex gap-1">
            <span className="px-2 py-1 bg-green-200 text-xs rounded">
              {statistics.difficulty_distribution.easy}
            </span>
            <span className="px-2 py-1 bg-yellow-200 text-xs rounded">
              {statistics.difficulty_distribution.medium}
            </span>
            <span className="px-2 py-1 bg-red-200 text-xs rounded">
              {statistics.difficulty_distribution.hard}
            </span>
          </div>
        </div>
      </div>

      {/* Concept List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Matched Study Concepts</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {matched_concepts.map((concept) => (
            <div key={concept.id} className="p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{concept.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{concept.summary}</p>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-sm font-bold text-blue-600">
                    {concept.relevance_percentage}%
                  </div>
                  <div className="text-xs text-gray-500">relevance</div>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  concept.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                  concept.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {concept.difficulty}
                </span>
                <span className="text-xs text-gray-500">
                  {concept.estimated_minutes} minutes
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {onContinue && (
        <button
          onClick={() => onContinue(preview)}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          Continue to Generate Schedule →
        </button>
      )}
    </div>
  );
}
```

### C. Schedule Generator Component

Create `frontend/src/components/schedule/ScheduleGenerator.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { generateScheduleFromTask, GenerateScheduleResponse } from '@/lib/scheduleApi';

interface ScheduleGeneratorProps {
  taskId: string;
  onSuccess?: (schedule: GenerateScheduleResponse) => void;
}

export default function ScheduleGenerator({ taskId, onSuccess }: ScheduleGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerateScheduleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Settings
  const [focusMinutes, setFocusMinutes] = useState(50);
  const [breakMinutes, setBreakMinutes] = useState(10);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await generateScheduleFromTask({
        task_id: taskId,
        focus_block_minutes: focusMinutes,
        break_minutes: breakMinutes,
      });
      
      setResult(response);
      if (onSuccess) onSuccess(response);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Schedule Settings</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Focus Block Duration (minutes)
            </label>
            <input
              type="number"
              value={focusMinutes}
              onChange={(e) => setFocusMinutes(Number(e.target.value))}
              min={25}
              max={90}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Break Duration (minutes)
            </label>
            <input
              type="number"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
              min={5}
              max={30}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="mt-4 w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300"
        >
          {generating ? 'Generating Schedule...' : '🚀 Generate Study Schedule'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-green-600">
              ✅ Schedule Generated!
            </h3>
            <div className="text-sm text-gray-600">
              {result.total_days} days • {result.total_hours} hours
            </div>
          </div>

          {/* Schedule Blocks */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {result.schedule_blocks.map((block, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border-l-4 ${
                  block.type === 'study' ? 'border-blue-500 bg-blue-50' :
                  block.type === 'review' ? 'border-green-500 bg-green-50' :
                  'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-sm">{block.title}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {block.date} • {block.start_time} - {block.end_time}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-gray-500">
                    {block.duration_minutes} min
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Matched Concepts:</strong> {result.matched_concepts}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Schedule ID: {result.schedule_id}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 📄 Step 3: Create Pages

### Main AI Panel Page

Create `frontend/src/app/(dashboard)/schedule-ai/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ConceptPreview from '@/components/schedule/ConceptPreview';
import ScheduleGenerator from '@/components/schedule/ScheduleGenerator';

export default function ScheduleAIPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const taskId = searchParams.get('taskId');

  const [step, setStep] = useState<'preview' | 'generate'>('preview');

  if (!taskId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-yellow-800">
            Please select a task first from the task list.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI Study Schedule Generator</h1>
        <p className="text-gray-600 mt-2">
          Generate an intelligent study schedule using semantic concept matching
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex gap-4 mb-8">
        <div className={`flex-1 p-4 rounded-lg ${
          step === 'preview' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'
        }`}>
          <div className="font-semibold">Step 1: Preview Concepts</div>
          <div className="text-sm text-gray-600">Review matched study material</div>
        </div>
        
        <div className={`flex-1 p-4 rounded-lg ${
          step === 'generate' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'
        }`}>
          <div className="font-semibold">Step 2: Generate Schedule</div>
          <div className="text-sm text-gray-600">Create your study plan</div>
        </div>
      </div>

      {/* Content */}
      {step === 'preview' && (
        <ConceptPreview
          taskId={taskId}
          onContinue={() => setStep('generate')}
        />
      )}

      {step === 'generate' && (
        <>
          <button
            onClick={() => setStep('preview')}
            className="mb-4 text-sm text-blue-600 hover:underline"
          >
            ← Back to preview
          </button>
          <ScheduleGenerator
            taskId={taskId}
            onSuccess={(schedule) => {
              // Redirect to schedule view
              router.push(`/dashboard?tab=schedules`);
            }}
          />
        </>
      )}
    </div>
  );
}
```

### Document Upload Page

Create `frontend/src/app/(dashboard)/documents/page.tsx`:

```typescript
'use client';

import DocumentUpload from '@/components/documents/DocumentUpload';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function DocumentsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const data = await apiFetch('/documents/materials');
      setMaterials(data.materials || []);
    } catch (err) {
      console.error('Failed to load materials:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Study Materials</h1>
      
      {/* Upload Section */}
      <DocumentUpload />

      {/* Materials List */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Your Uploaded Materials</h2>
        
        {loading ? (
          <p>Loading...</p>
        ) : materials.length === 0 ? (
          <p className="text-gray-600">No materials uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((material) => (
              <div key={material.id} className="p-4 border rounded-lg bg-white">
                <h3 className="font-semibold">{material.filename}</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Uploaded: {new Date(material.created_at).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {material.text_length} characters extracted
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🔄 Step 4: Integration Flow

### Add buttons to existing task list:

In your task list component, add a button for each task:

```typescript
<button
  onClick={() => router.push(`/schedule-ai?taskId=${task.id}`)}
  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm"
>
  🤖 Generate AI Schedule
</button>
```

---

## 🎯 Step 5: Usage Flow

1. **User uploads document** → `/documents`
   - Document is processed
   - Concepts are extracted with AI
   - Embeddings are generated

2. **User selects a task** → Task list
   - Clicks "Generate AI Schedule"
   - Redirected to `/schedule-ai?taskId=xxx`

3. **Step 1: Preview** → ConceptPreview component
   - Shows matched concepts
   - Displays statistics
   - User reviews relevance

4. **Step 2: Generate** → ScheduleGenerator component
   - User adjusts settings
   - Clicks "Generate Schedule"
   - Schedule is created deterministically
   - Redirected to schedule view

---

## 🎨 Optional: Enhanced Features

### Add Statistics Dashboard:

```typescript
import { getStudyStats } from '@/lib/scheduleApi';

// In your dashboard page
const [stats, setStats] = useState(null);

useEffect(() => {
  getStudyStats().then(setStats);
}, []);

// Display stats
<div className="grid grid-cols-4 gap-4">
  <StatCard 
    label="Total Concepts"
    value={stats?.concepts.total}
    icon="📚"
  />
  <StatCard 
    label="Study Hours"
    value={stats?.concepts.total_study_hours}
    icon="⏱️"
  />
  <StatCard 
    label="Active Schedules"
    value={stats?.schedules.active}
    icon="📅"
  />
  <StatCard 
    label="Materials"
    value={stats?.materials.total_uploaded}
    icon="📄"
  />
</div>
```

---

## ✅ Checklist

- [ ] Add `scheduleApi.ts` with all API functions
- [ ] Create `DocumentUpload` component
- [ ] Create `ConceptPreview` component
- [ ] Create `ScheduleGenerator` component
- [ ] Create `/documents` page for uploads
- [ ] Create `/schedule-ai` page for generation
- [ ] Add "Generate AI Schedule" button to task cards
- [ ] Test full flow: Upload → Match → Generate
- [ ] Add loading states and error handling
- [ ] Style components with Tailwind CSS

---

## 🚀 Quick Start Commands

```bash
# Make sure backend is running
cd backend
uvicorn app.main:app --reload

# Run frontend
cd frontend
npm run dev
```

Navigate to:
- Upload: `http://localhost:3000/documents`
- Generate: `http://localhost:3000/schedule-ai?taskId=YOUR_TASK_ID`

---

This implementation provides a complete, production-ready AI schedule generation system!
