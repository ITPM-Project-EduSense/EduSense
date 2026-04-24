import { apiFetch } from './api';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.includes("railway.app") &&
  process.env.NEXT_PUBLIC_API_BASE.startsWith("http://")
    ? process.env.NEXT_PUBLIC_API_BASE.replace("http://", "https://")
    : process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api';

// ==================== TYPE DEFINITIONS ====================

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

export interface StudySession {
  day: number;
  date: string;
  day_name: string;
  topics: string[];
  duration_hours: number;
  focus_level: 'low' | 'medium' | 'high';
  tips: string;
}

// ==================== DOCUMENT UPLOAD ====================

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Upload failed');
  }

  return response.json();
}

export async function getUserMaterials(limit: number = 50) {
  return apiFetch(`/documents/materials?limit=${limit}`);
}

export interface UserMaterialListItem {
  id: string;
  filename: string;
  created_at: string;
  text_length: number;
}

export async function getMaterialById(materialId: string) {
  return apiFetch(`/documents/materials/${materialId}`);
}

// ==================== CONCEPT PREVIEW ====================

export async function previewTaskConcepts(taskId: string, topK: number = 15) {
  return apiFetch(`/study-schedules/concepts/preview?task_id=${taskId}&top_k=${topK}`);
}

// ==================== GENERATE SCHEDULE ====================

export interface GenerateScheduleRequest {
  task_id: string;
  availability?: Record<string, Array<{ start: string; end: string }>>;
  focus_block_minutes?: number;
  break_minutes?: number;
}

export async function generateScheduleFromTask(request: GenerateScheduleRequest) {
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

export async function checkScheduleFeasibility(
  taskId: string,
  availability?: Record<string, Array<{ start: string; end: string }>>
) {
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

export async function getAllConcepts(difficulty?: 'easy' | 'medium' | 'hard', limit: number = 50) {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (difficulty) {
    params.append('difficulty', difficulty);
  }
  
  return apiFetch(`/study-schedules/concepts/all?${params.toString()}`);
}

// ==================== STUDY STATS ====================

export async function getStudyStats() {
  return apiFetch('/study-schedules/stats');
}

// ==================== RECOMMENDATIONS ====================

export async function getRecommendations(
  difficulty?: 'easy' | 'medium' | 'hard',
  maxMinutes?: number,
  limit: number = 20
) {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (difficulty) params.append('difficulty', difficulty);
  if (maxMinutes) params.append('max_minutes', maxMinutes.toString());
  
  return apiFetch(`/study-schedules/recommendations?${params.toString()}`);
}

// ==================== SCHEDULE MANAGEMENT ====================

export async function getAllSchedules() {
  return apiFetch('/study-schedules/');
}

export async function getScheduleById(scheduleId: string) {
  return apiFetch(`/study-schedules/${scheduleId}`);
}

export async function deleteSchedule(scheduleId: string) {
  const response = await fetch(`${API_BASE}/study-schedules/${scheduleId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete schedule');
  }

  return response.json();
}


// ==============================================================================
// SMART STUDY PLANNER (Main Flow)
// ==============================================================================
// 
// This is the MAIN function for generating AI-powered study schedules.
// 
// FLOW:
// ─────
//   1. Student selects a task
//   2. Student uploads study materials (PDF/DOCX/PPTX) - optional
//   3. AI analyzes documents and creates personalized schedule
//   4. Returns day-by-day study sessions with tips
//
// USAGE:
// ──────
//   const result = await generateSmartSchedule(taskId, files);
//   // result.sessions = [{day: 1, date: "2026-03-06", topics: [...], ...}]
//   // result.ai_tips = ["Study tip 1", "Study tip 2", ...]
//   // result.document_summaries = [{filename: "...", summary: "..."}, ...]
//
// ==============================================================================

export interface SmartScheduleResponse {
  success: boolean;
  schedule_id: string;
  task_id: string;
  subject: string;
  title: string;
  deadline: string;
  start_date: string;
  end_date: string;
  extracted_topics: string[];
  ai_summary: string;
  ai_tips: string[];
  document_summaries: Array<{
    filename: string;
    summary: string;
    key_points: string[];
    topics: string[];
  }>;
  sessions: StudySession[];
  original_filenames: string[];
}

export async function generateSmartSchedule(
  taskId: string, 
  files: File[] = []
): Promise<SmartScheduleResponse> {
  /**
   * Generate an AI-powered study schedule using Groq (Llama 3.3).
   * 
   * @param taskId - The task ID to generate schedule for
   * @param files - Optional array of study material files (PDF/DOCX/PPTX)
   * @returns Complete schedule with sessions, tips, and document summaries
   */
  const formData = new FormData();
  formData.append('task_id', taskId);
  
  // Add each file to the form data
  files.forEach((file) => formData.append('files', file));

  const response = await fetch(`${API_BASE}/schedule/generate-smart`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate smart schedule');
  }

  return response.json();
}

/**
 * Get an existing smart schedule for a task.
 * Returns 404 if no schedule has been generated yet.
 */
export async function getSmartScheduleByTask(taskId: string): Promise<SmartScheduleResponse> {
  return apiFetch(`/schedule/by-task/${taskId}`);
}

// ==============================================================================
// TASK-CONTEXT SMART SCHEDULING FLOW (NEW)
// ==============================================================================

export interface TaskResourcePayload {
  file_name: string;
  file_type: string;
  content_length: number;
}

export interface TaskResourceResponse {
  id: string;
  task_id: string;
  file_name: string;
  file_type: string;
  content_length: number;
  created_at: string;
}

export interface GeneratedPlanSession {
  id: string;
  session_type: "reading" | "revision" | "research" | "implementation" | "review" | "practice";
  duration_minutes: number;
  scheduled_day: string;
}

export interface GeneratedPlanResponse {
  plan_id: string;
  task_id: string;
  total_hours: number;
  created_at: string;
  sessions: GeneratedPlanSession[];
}

export async function attachTaskResource(taskId: string, payload: TaskResourcePayload) {
  return apiFetch(`/tasks/${taskId}/resources`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function generateTaskPlan(taskId: string): Promise<GeneratedPlanResponse> {
  return apiFetch(`/tasks/${taskId}/generate-plan`, {
    method: "POST",
  });
}

export async function regenerateTaskPlan(
  taskId: string,
  maxMinutesPerDay: number = 240
): Promise<GeneratedPlanResponse> {
  return apiFetch(`/tasks/${taskId}/regenerate-plan`, {
    method: "POST",
    body: JSON.stringify({ max_minutes_per_day: maxMinutesPerDay }),
  });
}

export async function getTaskPlan(taskId: string): Promise<GeneratedPlanResponse> {
  return apiFetch(`/tasks/${taskId}/plan`);
}

export async function getTaskResources(taskId: string): Promise<TaskResourceResponse[]> {
  return apiFetch(`/tasks/${taskId}/resources`);
}
