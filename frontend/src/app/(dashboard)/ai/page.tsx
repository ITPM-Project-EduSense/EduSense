"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { MessageCircle, FileText, Brain, Sparkles } from "lucide-react";

import Ai from "@/components/ai-coach/AiChat";
import PdfSummarizer from "@/components/ai-coach/PdfSummarizer";
import SmartQuiz from "@/components/ai-coach/SmartQuiz";
import PdfUploaderModal from "@/components/ai-coach/PdfUploaderModal";
import PdfViewer from "@/components/ai-coach/PdfViewer";
import { UploadedPdf } from "@/components/ai-coach/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

export default function AiPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("chat");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedPdfs, setUploadedPdfs] = useState<UploadedPdf[]>([]);
  const subject = searchParams.get("subject");
  const taskId = searchParams.get("task_id");

  // Fetch existing materials on mount so Summary/Quiz are populated after reload
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await fetch(`${API_BASE}/pdf/materials`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.materials)) {
          const pdfs: UploadedPdf[] = data.materials.map((m: { id: string; filename: string; subject?: string; created_at: string }) => ({
            id: m.id,
            filename: m.filename,
            subject: m.subject || "General",
            uploadedAt: m.created_at,
          }));
          setUploadedPdfs(pdfs);
        }
      } catch {
        // Silently ignore fetch errors on mount
      }
    };
    fetchMaterials();
  }, []);

  const handleUploadSuccess = (pdf: UploadedPdf) => {
    setUploadedPdfs((prev) => [...prev, pdf]);
  };

  const tabs = [
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "summary", label: "Summary", icon: FileText },
    { id: "quiz", label: "Quiz", icon: Brain },
    { id: "pdf", label: "PDF", icon: FileText },
  ];

  return (
    <div className="p-6">
      {(subject || taskId) && (
        <div className="mb-5 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-blue-50 p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              <Sparkles size={13} />
              Productivity Flow
            </span>
            {subject && (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                Module: {subject}
              </span>
            )}
            {taskId && (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                Task linked
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Use the coach to break this task down, stay focused, and get help that matches your current module.
          </p>
        </div>
      )}

      {/* 🔥 Styled Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div className="mt-4 flex justify-end">
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition"
        >
          Upload PDF
        </button>
      </div>

        <div className="flex ml-auto bg-gray-100 rounded-3xl p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-3xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white shadow text-indigo-600"
                    : "text-gray-600 hover:bg-white/70"
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 🔹 Content Card */}
      <div className="bg-white rounded-2xl shadow p-4 min-h-[400px]">
        {activeTab === "chat" && <Ai />}
        {activeTab === "summary" && (
          <PdfSummarizer uploadedPdfs={uploadedPdfs} />
        )}
        {activeTab === "quiz" && (
          <SmartQuiz uploadedPdfs={uploadedPdfs} />
        )}
        {activeTab === "pdf" && (
          <PdfViewer uploadedPdfs={uploadedPdfs} />
        )}
      </div>

      {/* 🔹 Upload Button */}
      {/* <div className="mt-4 flex justify-end">
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition"
        >
          Upload PDF
        </button>
      </div> */}

      {/* 🔹 Modal */}
      <PdfUploaderModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
