"use client";
import React, { useEffect, useState } from "react";
import {
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import { UploadedPdf } from "./types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { API_BASE } from "@/lib/api";
const SUMMARY_STATE_KEY = "edu_ai_summary_state_v1";

interface SummaryResult {
  success?: boolean;
  filename?: string;
  summary?: string[];
  concepts?: Array<{ title?: string; summary?: string; difficulty?: string }>;
  difficult_terms?: Array<string | { term?: string; explanation?: string }>;
  detailed_summary?: string;
  [key: string]: unknown;
}

interface PersistedSummaryState {
  selectedDocId: string;
  result: SummaryResult | null;
  error: string;
  successMessage: string;
}

interface Props {
  uploadedPdfs: UploadedPdf[];
  onRefreshDocuments?: () => void;
}

export default function PdfSummarizer({
  uploadedPdfs,
  onRefreshDocuments,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SUMMARY_STATE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedSummaryState;
      setSelectedDocId(parsed.selectedDocId || "");
      setResult(parsed.result || null);
      setError(parsed.error || "");
      setSuccessMessage(parsed.successMessage || "");
    } catch {
      // Ignore invalid persisted state.
    }
  }, []);

  // Persist state only after a document is selected.
  useEffect(() => {
    if (!selectedDocId) return;
    const payload: PersistedSummaryState = {
      selectedDocId,
      result,
      error,
      successMessage,
    };
    localStorage.setItem(SUMMARY_STATE_KEY, JSON.stringify(payload));
  }, [selectedDocId, result, error, successMessage]);

  // Clear stale state if the selected document no longer exists.
  useEffect(() => {
    if (!selectedDocId) return;
    if (uploadedPdfs.length === 0) return;

    const exists = uploadedPdfs.some((pdf) => pdf.id === selectedDocId);
    if (!exists) {
      setSelectedDocId("");
      setResult(null);
      setError("");
      setSuccessMessage("");
      localStorage.removeItem(SUMMARY_STATE_KEY);
    }
  }, [selectedDocId, uploadedPdfs]);

  const handleDocChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDocId(e.target.value);
    setResult(null);
    setError("");
    setSuccessMessage("");
  };

  const handleGenerateSummary = async () => {
    if (!selectedDocId) {
      alert("Please select a document first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/pdf/summary-full/${selectedDocId}`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(`Server error ${res.status}: ${errorText}`);
      }

      const data = await res.json();

      if (data.success === false) {
        setError(data.detail || "Failed to generate summary");
      } else {
        setResult(data);
        setSuccessMessage(
          `Summary generated successfully for "${data.filename}"!`,
        );
      }
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to generate summary. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const downloadMarkdown = (md: string, filename: string) => {
    const safeName = (filename || "summary").replace(/[\\/:*?"<>|]+/g, "_");
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeName}_full_summary.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-10 text-center">
        <FileText size={64} className="mx-auto mb-4 text-indigo-500" />
        <h2 className="text-3xl font-bold text-gray-800">AI PDF Summarizer</h2>
        <p className="mt-2 text-gray-500">
          Select a PDF and generate a rich, student-friendly summary with key
          points and difficult terms
        </p>
      </div>

      <div className="mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <select
          value={selectedDocId}
          onChange={handleDocChange}
          className="w-full max-w-sm rounded-2xl border border-gray-300 p-4 outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">-- Select an uploaded PDF --</option>
          {uploadedPdfs.length === 0 && (
            <option disabled>No documents uploaded yet</option>
          )}
          {uploadedPdfs.map((pdf) => (
            <option key={pdf.id} value={pdf.id}>
              {pdf.filename}
            </option>
          ))}
        </select>

        <button
          onClick={handleGenerateSummary}
          disabled={!selectedDocId || loading}
          className="flex min-w-[220px] items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Generating AI Summary...
            </>
          ) : (
            <>
              <FileText size={20} />
              Generate Summary
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-8 flex items-center justify-center gap-3 rounded-2xl bg-red-50 p-6 text-red-600">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-8 flex items-center justify-center gap-3 rounded-2xl bg-emerald-50 p-6 text-emerald-600">
          <CheckCircle size={24} />
          <p>{successMessage}</p>
        </div>
      )}

      {loading && !result && (
        <div className="mt-10 flex flex-col items-center">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
          <p className="mt-4 text-gray-600">
            Generating rich AI summary with key points and difficult terms...
          </p>
        </div>
      )}

      {result && result.success && (
        <div className="mt-8 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center gap-3">
            <CheckCircle className="text-emerald-500" size={32} />
            <h3 className="text-2xl font-semibold text-gray-900">
              Summary for: {result.filename}
            </h3>
          </div>

          <div className="space-y-12">
            {Array.isArray(result.summary) && result.summary.length > 0 && (
              <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-8">
                <h4 className="mb-6 flex items-center gap-3 text-xl font-bold text-indigo-900">
                  <FileText size={24} /> Key Takeaways
                </h4>
                <ul className="space-y-4">
                  {result.summary.map((point: string, i: number) => (
                    <li key={i} className="flex gap-4 rounded-2xl bg-white/70 p-5">
                      <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed text-gray-700">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(result.concepts) && result.concepts.length > 0 && (
              <div>
                <h4 className="mb-6 flex items-center gap-3 text-2xl font-bold text-gray-900">
                  <CheckCircle size={28} className="text-emerald-500" />
                  Essential Concepts
                </h4>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {result.concepts.map((concept, i: number) => (
                    <div
                      key={i}
                      className="group rounded-2xl border-2 border-gray-100 bg-white p-6 transition-all hover:border-indigo-300"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <h5 className="text-lg font-semibold text-gray-900">
                          {concept.title}
                        </h5>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            concept.difficulty?.toLowerCase() === "hard"
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {concept.difficulty || "Medium"}
                        </span>
                      </div>
                      <p className="italic text-gray-600">
                        &ldquo;{concept.summary}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(result.difficult_terms) &&
              result.difficult_terms.length > 0 && (
                <div>
                  <h4 className="mb-4 font-semibold text-gray-700">
                    Difficult Terms & Explanations
                  </h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {result.difficult_terms.map((item, i: number) => {
                      const term =
                        typeof item === "string"
                          ? item
                          : item.term || "Unknown term";
                      const explanation =
                        typeof item === "object" ? item.explanation : "";

                      return (
                        <div
                          key={i}
                          className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
                        >
                          <div className="font-medium text-amber-800">
                            {term}
                          </div>
                          {explanation && (
                            <p className="mt-2 text-sm leading-relaxed text-amber-700">
                              {explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {result.detailed_summary && (
              <div className="border-t border-dashed border-gray-300 pt-10">
                <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <h4 className="text-2xl font-bold text-gray-900">
                    Full Detailed Analysis
                  </h4>
                  <button
                    onClick={() =>
                      downloadMarkdown(
                        result.detailed_summary || "",
                        result.filename || "summary",
                      )
                    }
                    className="flex items-center gap-2 rounded-2xl bg-gray-900 px-6 py-3 text-white shadow-md transition-all hover:bg-black"
                  >
                    <Download size={20} />
                    Download as Markdown
                  </button>
                </div>

                <div className="prose prose-lg prose-indigo max-w-none rounded-3xl border border-gray-200 bg-zinc-50 p-10">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result.detailed_summary}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
