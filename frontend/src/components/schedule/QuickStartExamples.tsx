/**
 * QUICK START EXAMPLE
 * 
 * This file shows how to use the schedule API functions in your components.
 * Copy and adapt these patterns for your actual implementation.
 */

'use client';

import { useState } from 'react';
import {
  previewTaskConcepts,
  generateScheduleFromTask,
  checkScheduleFeasibility,
  uploadDocument,
  getStudyStats,
} from '@/lib/scheduleApi';

// ============== EXAMPLE 1: Document Upload ==============

export function ExampleDocumentUpload() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await uploadDocument(file);
      setResult(response);
      alert(`Success! Extracted ${response.concepts_extracted} concepts`);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Upload Study Material</h2>
      <input
        type="file"
        accept=".pdf,.docx,.pptx"
        onChange={handleFileUpload}
        disabled={uploading}
        className="block w-full"
      />
      {uploading && <p className="mt-2 text-blue-600">Uploading...</p>}
      {result && (
        <div className="mt-4 p-4 bg-green-50 rounded">
          <p>✅ {result.concepts_extracted} concepts extracted!</p>
        </div>
      )}
    </div>
  );
}

// ============== EXAMPLE 2: Preview Concepts for Task ==============

export function ExampleConceptPreview({ taskId }: { taskId: string }) {
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const data = await previewTaskConcepts(taskId, 15);
      setPreview(data);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Preview Matched Concepts</h2>
      
      <button
        onClick={loadPreview}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? 'Loading...' : 'Preview Concepts'}
      </button>

      {preview && (
        <div className="mt-4 space-y-4">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold">
                {preview.statistics.total_concepts}
              </div>
              <div className="text-sm">Concepts</div>
            </div>
            <div className="p-4 bg-green-50 rounded">
              <div className="text-2xl font-bold">
                {preview.statistics.total_study_hours}h
              </div>
              <div className="text-sm">Study Time</div>
            </div>
            <div className="p-4 bg-purple-50 rounded">
              <div className="text-2xl font-bold">
                {Math.round(preview.statistics.average_similarity * 100)}%
              </div>
              <div className="text-sm">Relevance</div>
            </div>
          </div>

          {/* Concept List */}
          <div className="space-y-2">
            {preview.matched_concepts.map((concept: any) => (
              <div key={concept.id} className="p-3 border rounded">
                <h3 className="font-semibold">{concept.title}</h3>
                <p className="text-sm text-gray-600">{concept.summary}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs px-2 py-1 bg-gray-200 rounded">
                    {concept.difficulty}
                  </span>
                  <span className="text-xs text-gray-500">
                    {concept.estimated_minutes} min
                  </span>
                  <span className="text-xs text-blue-600">
                    {concept.relevance_percentage}% relevant
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============== EXAMPLE 3: Check Feasibility ==============

export function ExampleFeasibilityCheck({ taskId }: { taskId: string }) {
  const [feasibility, setFeasibility] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  const checkFeasibility = async () => {
    setChecking(true);
    try {
      const result = await checkScheduleFeasibility(taskId);
      setFeasibility(result);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Check Schedule Feasibility</h2>
      
      <button
        onClick={checkFeasibility}
        disabled={checking}
        className="px-4 py-2 bg-purple-600 text-white rounded"
      >
        {checking ? 'Checking...' : 'Check Feasibility'}
      </button>

      {feasibility && (
        <div className={`mt-4 p-4 rounded ${
          feasibility.feasible ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <h3 className="font-bold mb-2">
            {feasibility.feasible ? '✅ Feasible' : '❌ Not Feasible'}
          </h3>
          <p className="text-sm">{feasibility.recommendation}</p>
          <div className="mt-2 text-xs">
            <p>Utilization: {feasibility.utilization_percentage}%</p>
            <p>Days Available: {feasibility.days_available}</p>
            <p>Study Time Needed: {feasibility.total_study_minutes} minutes</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============== EXAMPLE 4: Generate Schedule ==============

export function ExampleScheduleGenerator({ taskId }: { taskId: string }) {
  const [generating, setGenerating] = useState(false);
  const [schedule, setSchedule] = useState<any>(null);

  const generateSchedule = async () => {
    setGenerating(true);
    try {
      const result = await generateScheduleFromTask({
        task_id: taskId,
        focus_block_minutes: 50,
        break_minutes: 10,
      });
      setSchedule(result);
      alert('Schedule generated successfully!');
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Generate Study Schedule</h2>
      
      <button
        onClick={generateSchedule}
        disabled={generating}
        className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold"
      >
        {generating ? 'Generating...' : '🚀 Generate Schedule'}
      </button>

      {schedule && (
        <div className="mt-4 space-y-2">
          <div className="p-4 bg-green-50 rounded">
            <h3 className="font-bold">✅ Schedule Created!</h3>
            <p className="text-sm">
              {schedule.matched_concepts} concepts • {schedule.total_days} days • {schedule.total_hours} hours
            </p>
          </div>

          {/* Schedule Blocks */}
          <div className="space-y-1">
            {schedule.schedule_blocks?.slice(0, 10).map((block: any, idx: number) => (
              <div
                key={idx}
                className={`p-2 text-sm rounded ${
                  block.type === 'study' ? 'bg-blue-50' :
                  block.type === 'review' ? 'bg-green-50' :
                  'bg-gray-50'
                }`}
              >
                <strong>{block.title}</strong> • {block.date} {block.start_time}-{block.end_time}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============== EXAMPLE 5: Dashboard Stats ==============

export function ExampleDashboardStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getStudyStats();
      setStats(data);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Study Statistics</h2>
      
      <button
        onClick={loadStats}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white rounded"
      >
        {loading ? 'Loading...' : 'Load Stats'}
      </button>

      {stats && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded">
            <div className="text-2xl font-bold">{stats.concepts.total}</div>
            <div className="text-sm">Total Concepts</div>
          </div>
          
          <div className="p-4 bg-green-50 rounded">
            <div className="text-2xl font-bold">{stats.concepts.total_study_hours}h</div>
            <div className="text-sm">Study Time</div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded">
            <div className="text-2xl font-bold">{stats.schedules.active}</div>
            <div className="text-sm">Active Schedules</div>
          </div>
          
          <div className="p-4 bg-orange-50 rounded">
            <div className="text-2xl font-bold">{stats.materials.total_uploaded}</div>
            <div className="text-sm">Materials</div>
          </div>

          {/* Difficulty Distribution */}
          <div className="col-span-full p-4 bg-gray-50 rounded">
            <h3 className="font-bold mb-2">By Difficulty</h3>
            <div className="flex gap-4">
              <div className="text-sm">
                🟢 Easy: {stats.concepts.by_difficulty.easy}
              </div>
              <div className="text-sm">
                🟡 Medium: {stats.concepts.by_difficulty.medium}
              </div>
              <div className="text-sm">
                🔴 Hard: {stats.concepts.by_difficulty.hard}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============== USAGE IN YOUR PAGES ==============

/*
// In your page.tsx file:

'use client';

import { ExampleScheduleGenerator } from '@/components/examples';

export default function SchedulePage() {
  return (
    <div>
      <ExampleScheduleGenerator taskId="your-task-id" />
    </div>
  );
}

*/
