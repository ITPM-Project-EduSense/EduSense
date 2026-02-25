"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Upload,
  Loader2,
  Target,
  Sparkles,
  Coffee,
  FileText,
  X,
} from "lucide-react";
import type {
  StudySchedule,
  MaterialStatus,
  DaySchedule,
  StudyBlock,
  MaterialUploadResponse,
} from "@/types/schedule";

export default function PlannerPage() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId");

  console.log("🎯 Planner Page Loaded");
  console.log("Search params:", Object.fromEntries(searchParams.entries()));
  console.log("Task ID from URL:", taskId);

  // State
  const [schedule, setSchedule] = useState<StudySchedule | null>(null);
  const [materialStatus, setMaterialStatus] = useState<MaterialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSubject, setUploadSubject] = useState("");
  const [uploading, setUploading] = useState(false);

  // File input handler with better debugging
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    console.log("File selected:", file?.name, "Size:", file?.size);
    setUploadFile(file);
  };

  // Modal handlers
  const openUploadModal = () => {
    console.log("🔓 Opening upload modal");
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    console.log("🔒 Closing upload modal");
    setShowUploadModal(false);
  };

  // Monitor modal state
  useEffect(() => {
    console.log("📋 Modal state changed:", showUploadModal);
  }, [showUploadModal]);

  // Fetch schedule and material status
  const fetchScheduleData = useCallback(async () => {
    console.log("📊 Fetching schedule for taskId:", taskId);
    
    if (!taskId) {
      console.error("❌ No task ID provided in URL!");
      setError("No task ID provided. Please go back and create a task first.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log("🚀 Fetching schedule...");

      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        // Fetch schedule with timeout
        const scheduleData = await apiFetch(`/schedule/auto?task_id=${taskId}`);
        clearTimeout(timeoutId);
        console.log("✅ Schedule response:", scheduleData);

        if (!scheduleData.success) {
          console.warn("⚠️ Schedule generation not successful:", scheduleData.message);
          setError(scheduleData.message || "Failed to generate schedule");
          setLoading(false);
          return;
        }

        if (!scheduleData.schedule) {
          console.warn("⚠️ No schedule data returned");
          setError("Failed to create schedule. Please try again.");
          setLoading(false);
          return;
        }

        setSchedule(scheduleData.schedule);
        
        // Log if using default template
        if (scheduleData.using_default_template) {
          console.info("ℹ️ Using default schedule template - no materials found");
        } else {
          console.info("✅ Using schedule generated from study materials");
        }

        // Fetch material status
        if (scheduleData.schedule?.subject) {
          try {
            const statusData = await apiFetch(
              `/documents/status?subject=${encodeURIComponent(
                scheduleData.schedule.subject
              )}`
            );
            console.log("✅ Material status:", statusData);
            setMaterialStatus(statusData);
          } catch (err) {
            console.warn("⚠️ Error fetching material status:", err);
            // Continue even if status fetch fails
          }
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          console.error("❌ Request timeout");
          setError("Request timed out. Please try again.");
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      console.error("❌ Error fetching schedule:", err);
      setError(err.message || "Failed to load schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  // Handle file upload
  const handleUpload = async () => {
    console.group("🚀 Upload Initiated");
    console.log("Button clicked at:", new Date().toISOString());
    console.log("uploadFile:", uploadFile);
    console.log("uploadSubject:", uploadSubject);
    console.log("uploading state:", uploading);
    console.groupEnd();
    
    if (!uploadFile || !uploadSubject) {
      console.warn("❌ Validation failed - Missing file or subject");
      alert("❌ Please select a file and enter a subject");
      return;
    }

    try {
      setUploading(true);
      console.log("📤 Starting upload...");

      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("subject", uploadSubject);

      const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
      const uploadUrl = `${apiBase}/documents/upload`;
      console.log("📍 Upload URL:", uploadUrl);
      console.log("📦 FormData entries:", {
        file: uploadFile.name,
        size: uploadFile.size,
        type: uploadFile.type,
        subject: uploadSubject
      });

      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      console.log("✉️ Response received");
      console.log("Status:", res.status, res.statusText);
      console.log("OK:", res.ok);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("❌ Error response data:", errorData);
        throw new Error(errorData.detail || `Upload failed with status ${res.status}`);
      }

      const data: MaterialUploadResponse = await res.json();
      console.log("✅ Upload response:", data);

      // Close modal and refresh
      closeUploadModal();
      setUploadFile(null);
      setUploadSubject("");
      await fetchScheduleData();

      alert(
        `✅ ${data.filename} uploaded! Extracted ${data.concepts_extracted} concepts.`
      );
      console.log("🎉 Upload complete!");
    } catch (err: any) {
      console.error("❌ Upload error:", err);
      alert(`❌ Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Group blocks by date
  const groupBlocksByDate = (blocks: StudyBlock[]): DaySchedule[] => {
    const grouped: { [date: string]: StudyBlock[] } = {};

    blocks.forEach((block) => {
      if (!grouped[block.date]) {
        grouped[block.date] = [];
      }
      grouped[block.date].push(block);
    });

    return Object.entries(grouped).map(([date, blocks]) => ({
      date,
      day_name: new Date(date + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long",
      }),
      blocks,
    }));
  };

  useEffect(() => {
    console.log("🔄 useEffect triggered - taskId:", taskId);
    if (taskId) {
      console.log("✅ taskId exists, calling fetchScheduleData");
      fetchScheduleData();
    } else {
      console.warn("⚠️ No taskId, skipping fetchScheduleData");
    }
  }, [taskId, fetchScheduleData]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Generating your study plan...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !schedule) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            {error || "Study Materials Needed"}
          </h2>
          <p className="text-gray-600 mb-6 text-center text-sm leading-relaxed">
            {error === "No task ID provided. Please go back and create a task first." ? (
              <>
                It looks like you navigated here directly. Go back to the Dashboard and create a new task to get started.
              </>
            ) : (
              <>
                To create a personalized study schedule, please upload study materials (PDFs, notes, textbooks) for this subject.
              </>
            )}
          </p>
          
          <div className="bg-indigo-50 rounded-lg p-4 mb-6 border border-indigo-200">
            <p className="text-sm text-indigo-900 font-semibold mb-2">📋 What you can upload:</p>
            <ul className="text-xs text-indigo-800 space-y-1 ml-2">
              <li>✅ Lecture slides & notes</li>
              <li>✅ Textbook chapters (PDF)</li>
              <li>✅ Research papers</li>
              <li>✅ Study guides</li>
            </ul>
          </div>

          {taskId && (
            <button
              onClick={openUploadModal}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload Materials Now
            </button>
          )}
          
          {!taskId && (
            <a
              href="/dashboard"
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 text-center"
            >
              ← Back to Dashboard
            </a>
          )}
        </div>
      </div>
    );
  }

  const daySchedules = groupBlocksByDate(schedule.blocks);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {schedule.timeline.goal_title}
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {schedule.subject} • Due{" "}
                {new Date(schedule.deadline).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={openUploadModal}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Materials
            </button>
          </div>
        </div>

        {/* Material Ready Status */}
        {materialStatus && (
          <div
            className={`rounded-2xl shadow-lg p-6 border ${
              materialStatus.ready
                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
            }`}
          >
            <div className="flex items-center gap-3">
              {materialStatus.ready ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-600" />
              )}
              <div>
                <h3 className="font-semibold text-lg">
                  {materialStatus.ready
                    ? "✨ Materials Ready"
                    : "⚠️ Upload More Materials"}
                </h3>
                <p className="text-sm text-gray-600">
                  {materialStatus.materials_count} documents •{" "}
                  {materialStatus.concepts_count} concepts
                  {materialStatus.last_processed_date &&
                    ` • Last updated ${new Date(
                      materialStatus.last_processed_date
                    ).toLocaleDateString()}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Plan */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-indigo-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600" />
            Goal Timeline
          </h2>
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-semibold text-gray-700">Progress</span>
              <span className="text-indigo-600 font-bold">
                {schedule.timeline.days_remaining} days remaining
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all"
                style={{ width: "10%" }}
              />
            </div>
          </div>

          {/* Milestones */}
          <div className="space-y-4">
            {schedule.timeline.milestones.map((milestone, idx) => (
              <div
                key={idx}
                className="flex gap-4 items-start p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-gray-900">
                      {milestone.label}
                    </h4>
                    <span className="text-sm text-gray-600">{milestone.date}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{milestone.target}</p>
                  <p className="text-xs text-indigo-600 italic">{milestone.tips}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Success Criteria */}
          <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Success Criteria
            </h4>
            <ul className="space-y-1">
              {schedule.timeline.success_criteria.map((criteria, idx) => (
                <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  {criteria}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Schedule by Day */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Your Study Schedule
          </h2>

          {daySchedules.map((day) => (
            <div
              key={day.date}
              className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{day.day_name}</h3>
                  <p className="text-sm text-gray-600">{day.date}</p>
                </div>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                  {day.blocks.length} blocks
                </span>
              </div>

              <div className="space-y-3">
                {day.blocks.map((block, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border-l-4 ${
                      block.type === "study"
                        ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-500"
                        : block.type === "break"
                        ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-500"
                        : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-500"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {block.type === "study" && (
                          <BookOpen className="w-5 h-5 text-indigo-600" />
                        )}
                        {block.type === "break" && (
                          <Coffee className="w-5 h-5 text-green-600" />
                        )}
                        {block.type === "review" && (
                          <Sparkles className="w-5 h-5 text-amber-600" />
                        )}
                        <div>
                          <h4 className="font-bold text-gray-900">
                            {block.concept_title}
                          </h4>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {block.start_time} - {block.end_time}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          block.type === "study"
                            ? "bg-indigo-200 text-indigo-800"
                            : block.type === "break"
                            ? "bg-green-200 text-green-800"
                            : "bg-amber-200 text-amber-800"
                        }`}
                      >
                        {block.type.toUpperCase()}
                      </span>
                    </div>

                    {block.key_points.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {block.key_points.map((point, pidx) => (
                          <p
                            key={pidx}
                            className="text-sm text-gray-700 flex items-start gap-2"
                          >
                            <span className="text-indigo-600 mt-0.5">•</span>
                            {point}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Upload Study Materials
              </h3>
              <button
                onClick={closeUploadModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-900">
                💡 <strong>Tip:</strong> Upload your lecture notes, textbooks, or study guides to generate a personalized schedule.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject (e.g., Data Structures, Chemistry)
                </label>
                <input
                  type="text"
                  value={uploadSubject}
                  onChange={(e) => {
                    console.log("Subject changed:", e.target.value);
                    setUploadSubject(e.target.value);
                  }}
                  placeholder="Enter subject name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select File
                </label>
                <div className="space-y-2">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <label htmlFor="file-upload" className="block cursor-pointer">
                      <input
                        id="file-upload"
                        type="file"
                        accept=".pdf,.docx,.pptx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <p className="text-sm text-gray-600">
                        {uploadFile ? (
                          <span className="text-indigo-600 font-semibold">✅ {uploadFile.name}</span>
                        ) : (
                          <>
                            <span className="font-semibold text-indigo-600 block">Click to browse</span>
                            <span className="text-xs text-gray-500">or drag and drop</span>
                          </>
                        )}
                      </p>
                    </label>
                  </div>
                  {uploadFile && (
                    <button
                      type="button"
                      onClick={() => {
                        console.log("Clearing file");
                        setUploadFile(null);
                      }}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      ✕ Change file
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  console.log("Upload button clicked", { uploadFile, uploadSubject, uploading });
                  handleUpload();
                }}
                disabled={uploading || !uploadFile || !uploadSubject}
                className={`w-full px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  uploading || !uploadFile || !uploadSubject
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg cursor-pointer"
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading & Processing...
                  </>
                ) : !uploadFile ? (
                  <>
                    <Upload className="w-5 h-5" />
                    Select a file first
                  </>
                ) : !uploadSubject ? (
                  <>
                    <Upload className="w-5 h-5" />
                    Enter subject first
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload Material
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}