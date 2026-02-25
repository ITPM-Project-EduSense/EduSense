import { apiFetch } from './api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api';

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
  focus_level: string;
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
