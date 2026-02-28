/**
 * EduSense - Schedule & Material TypeScript Types
 * 
 * Types for the Smart Schedule AI Flow including:
 * - Study schedules with blocks
 * - Timeline plans with milestones
 * - Study materials and concepts
 */

// Study Block Types
export type BlockType = "study" | "break" | "review";

export interface StudyBlock {
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  subject: string;
  concept_title: string;
  concept_id?: string;
  type: BlockType;
  key_points: string[];
}

// Timeline Plan Types
export interface Milestone {
  date: string; // YYYY-MM-DD
  label: string;
  target: string;
  tips: string;
}

export interface TimelinePlan {
  goal_title: string;
  days_remaining: number;
  milestones: Milestone[];
  success_criteria: string[];
}

// Study Schedule
export interface StudySchedule {
  id: string;
  task_id: string;
  subject: string;
  deadline: string; // ISO datetime
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  blocks: StudyBlock[];
  timeline: TimelinePlan;
  created_at: string;
  updated_at: string;
}

// Material Status
export interface MaterialStatus {
  success: boolean;
  subject?: string;
  materials_count: number;
  concepts_count: number;
  last_processed_date?: string;
  ready: boolean;
}

// Concept
export interface Concept {
  id: string;
  title: string;
  summary: string;
  difficulty: "easy" | "medium" | "hard";
  estimated_minutes: number;
  subject: string;
  similarity?: number;
}

// Study Material
export interface StudyMaterial {
  id: string;
  filename: string;
  subject: string;
  summary: string;
  key_points: string[];
  created_at: string;
}

// API Response Types
export interface ScheduleResponse {
  success: boolean;
  message: string;
  schedule: StudySchedule | null;
}

export interface MaterialUploadResponse {
  success: boolean;
  message: string;
  material_id: string;
  filename: string;
  subject: string;
  summary: string;
  key_points_count: number;
  concepts_extracted: number;
  concepts: Array<{
    id: string;
    title: string;
    difficulty: string;
    estimated_minutes: number;
  }>;
}

// Grouped blocks by date for UI display
export interface DaySchedule {
  date: string;
  day_name: string;
  blocks: StudyBlock[];
}
