"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bot,
  Brain,
  ChevronRight,
  FileText,
  FolderOpen,
  MessageCircle,
  Sparkles,
  Upload,
} from "lucide-react";

import Ai from "@/components/ai-coach/AiChat";
import PdfSummarizer from "@/components/ai-coach/PdfSummarizer";
import SmartQuiz from "@/components/ai-coach/SmartQuiz";
import PdfUploaderModal from "@/components/ai-coach/PdfUploaderModal";
import PdfViewer from "@/components/ai-coach/PdfViewer";
import { UploadedPdf } from "@/components/ai-coach/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

const tabs = [
  {
    id: "chat",
    label: "AI Chat",
    icon: MessageCircle,
    description: "Ask, revise, and break down difficult topics.",
  },
  {
    id: "summary",
    label: "Summary",
    icon: FileText,
    description: "Turn long lecture notes into clear study takeaways.",
  },
  {
    id: "quiz",
    label: "Quiz",
    icon: Brain,
    description: "Generate practice questions from uploaded material.",
  },
  {
    id: "pdf",
    label: "Library",
    icon: FolderOpen,
    description: "Review extracted content from connected documents.",
  },
] as const;

export default function AiPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("chat");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedPdfs, setUploadedPdfs] = useState<UploadedPdf[]>([]);
  const subject = searchParams.get("subject");
  const taskId = searchParams.get("task_id");

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await fetch(`${API_BASE}/pdf/materials`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.materials)) {
          const pdfs: UploadedPdf[] = data.materials.map(
            (m: {
              id: string;
              filename: string;
              subject?: string;
              created_at: string;
            }) => ({
              id: m.id,
              filename: m.filename,
              subject: m.subject || "General",
              uploadedAt: m.created_at,
            }),
          );
          setUploadedPdfs(pdfs);
        }
      } catch {
        // Ignore initial fetch failures so the page remains usable.
      }
    };

    fetchMaterials();
  }, []);

  const handleUploadSuccess = (pdf: UploadedPdf) => {
    setUploadedPdfs((prev) => [pdf, ...prev]);
  };

  const activeTabConfig = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div className="eds-page-shell min-h-screen font-[family-name:var(--font-poppins)] p-4 md:p-5">
      <div className="mx-auto flex max-w-5xl flex-col gap-3">
        <section className="relative overflow-hidden rounded-[24px] border border-white/70 bg-white/78 p-4 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_28%),radial-gradient(circle_at_82%_22%,_rgba(14,165,233,0.14),_transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.5),rgba(248,250,252,0.2))]" />
          <div className="pointer-events-none absolute -right-16 top-8 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-indigo-300/20 blur-3xl" />

          <div className="relative flex flex-col items-center text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-cyan-50/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-700">
                  <Sparkles size={13} />
                  AI Study Studio
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3 py-1 text-[11px] font-semibold text-slate-600">
                  Professional learning workspace
                </span>
              </div>

              <div className="mt-3 max-w-3xl">
                <h1 className="mx-auto max-w-2xl text-[1.45rem] font-extrabold leading-tight tracking-tight text-slate-900 md:text-[1.7rem]">
                  Focused AI assistance for your study workflow
                </h1>
                <p className="mx-auto mt-2 max-w-2xl text-[13px] leading-6 text-slate-600">
                  Chat with your coach, generate polished summaries, create quiz
                  practice, and review material from one clean workspace.
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_32px_-18px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-900"
                >
                  <Upload size={16} />
                  Upload Study Material
                </button>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-4 py-2.5 text-sm text-slate-600">
                  <Bot size={16} className="text-indigo-600" />
                  <span className="font-medium text-slate-700">
                    {activeTabConfig.label}
                  </span>
                  <ChevronRight size={16} className="text-slate-400" />
                  <span>{activeTabConfig.description}</span>
                </div>
              </div>

              {(subject || taskId) && (
                <div className="mt-3 w-full max-w-2xl rounded-[20px] border border-indigo-100/90 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-3 shadow-sm">
                  <div className="flex flex-wrap items-center justify-center gap-2">
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
                  <p className="mt-2 text-[13px] text-slate-600">
                    Use the assistant to break this task down, stay focused, and
                    get study help that matches your current module context.
                  </p>
                </div>
              )}
          </div>
        </section>

        <section className="rounded-[20px] border border-white/70 bg-white/82 p-2 shadow-[0_20px_60px_-38px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-[16px] border px-3 py-2.5 text-left transition-all duration-300 ${
                      isActive
                        ? "border-cyan-200 bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(236,254,255,0.96))] shadow-[0_10px_28px_-24px_rgba(6,182,212,0.55)]"
                        : "border-slate-200 bg-white/75 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-[14px] ${
                          isActive
                            ? "bg-slate-950 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon size={16} />
                      </span>
                      <div>
                        <p
                          className={`text-[14px] font-bold ${
                            isActive ? "text-slate-900" : "text-slate-700"
                          }`}
                        >
                          {tab.label}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-500">
                          {tab.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[24px] border border-[#dbe4ff] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,250,255,0.88))] p-2 shadow-[0_20px_60px_-40px_rgba(30,41,59,0.12)] md:p-2.5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-50/80 to-transparent" />
          <div className="pointer-events-none absolute -top-8 right-8 h-28 w-28 rounded-full bg-cyan-200/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-10 h-24 w-24 rounded-full bg-indigo-200/30 blur-3xl" />

          <div className="relative min-h-[720px] rounded-[20px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(248,250,252,0.78))]">
            {activeTab === "chat" && <Ai />}
            {activeTab === "summary" && (
              <PdfSummarizer uploadedPdfs={uploadedPdfs} />
            )}
            {activeTab === "quiz" && <SmartQuiz uploadedPdfs={uploadedPdfs} />}
            {activeTab === "pdf" && <PdfViewer uploadedPdfs={uploadedPdfs} />}
          </div>
        </section>
      </div>

      <PdfUploaderModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
