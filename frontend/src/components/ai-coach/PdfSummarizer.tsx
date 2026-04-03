"use client";
import React, { useState } from "react";
import { FileText, Loader2, CheckCircle, AlertCircle, Download } from "lucide-react";
import { UploadedPdf } from "./types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

interface Props {
  uploadedPdfs: UploadedPdf[];
  onRefreshDocuments?: () => void;
}

export default function PdfSummarizer({ uploadedPdfs, onRefreshDocuments }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const handleDocChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDocId(e.target.value);
    setResult(null);
    setError("");
    setSuccessMessage("");
  };

  // Single Button - Calls summary-full endpoint
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
        setSuccessMessage(`Summary generated successfully for "${data.filename}"!`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadMarkdown = (md: string, filename: string) => {
    const safeName = (filename || "summary").replace(/[\\/:*?"<>|]+/g, "_");
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}_full_summary.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <FileText size={64} className="mx-auto text-indigo-500 mb-4" />
        <h2 className="text-3xl font-bold text-gray-800">AI PDF Summarizer</h2>
        <p className="text-gray-500 mt-2">
          Select a PDF and generate a rich, student-friendly summary with key points and difficult terms
        </p>
      </div>

      {/* Document Selector + Button */}
      <div className="flex flex-col sm:flex-row items-center justify-center mb-10 gap-4">
        <select
          value={selectedDocId}
          onChange={handleDocChange}
          className="p-4 border border-gray-300 rounded-2xl w-full max-w-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">-- Select an uploaded PDF --</option>
          {uploadedPdfs.length === 0 && <option disabled>No documents uploaded yet</option>}
          {uploadedPdfs.map((pdf) => (
            <option key={pdf.id} value={pdf.id}>
              {pdf.filename}
            </option>
          ))}
        </select>

        <button
          onClick={handleGenerateSummary}
          disabled={!selectedDocId || loading}
          className="px-8 py-4 bg-indigo-600 font-semibold text-white rounded-2xl disabled:opacity-50 hover:bg-indigo-700 transition flex items-center justify-center gap-2 min-w-[220px]"
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

      {/* Messages */}
      {error && (
        <div className="mb-8 flex items-center justify-center gap-3 text-red-600 bg-red-50 p-6 rounded-2xl">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-8 flex items-center justify-center gap-3 text-emerald-600 bg-emerald-50 p-6 rounded-2xl">
          <CheckCircle size={24} />
          <p>{successMessage}</p>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && !result && (
        <div className="mt-10 flex flex-col items-center">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
          <p className="mt-4 text-gray-600">Generating rich AI summary with key points and difficult terms...</p>
        </div>
      )}

      {/* Results */}
      {result && result.success && (
        <div className="mt-8 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <CheckCircle className="text-emerald-500" size={32} />
            <h3 className="text-2xl font-semibold text-gray-900">
              Summary for: {result.filename}
            </h3>
          </div>

          <div className="space-y-12">
            {/* Quick Insights / Key Takeaways */}
            {result.summary?.length > 0 && (
              <div className="p-8 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl border border-indigo-100">
                <h4 className="flex items-center gap-3 text-xl font-bold text-indigo-900 mb-6">
                  <FileText size={24} /> Key Takeaways
                </h4>
                <ul className="space-y-4">
                  {result.summary.map((point: string, i: number) => (
                    <li key={i} className="flex gap-4 bg-white/70 p-5 rounded-2xl">
                      <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-gray-700 leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key Concepts */}
            {result.concepts?.length > 0 && (
              <div>
                <h4 className="font-bold text-2xl text-gray-900 mb-6 flex items-center gap-3">
                  <CheckCircle size={28} className="text-emerald-500" /> Essential Concepts
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {result.concepts.map((concept: any, i: number) => (
                    <div
                      key={i}
                      className="p-6 bg-white rounded-2xl border-2 border-gray-100 hover:border-indigo-300 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="font-semibold text-lg text-gray-900">{concept.title}</h5>
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-bold ${
                            concept.difficulty?.toLowerCase() === "hard"
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {concept.difficulty || "Medium"}
                        </span>
                      </div>
                      <p className="text-gray-600 italic">"{concept.summary}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Difficult Terms - Improved */}
            {result.difficult_terms?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-4">⚠️ Difficult Terms & Explanations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.difficult_terms.map((item: any, i: number) => {
                    const term = typeof item === "string" ? item : item.term || item;
                    const explanation = typeof item === "object" ? item.explanation : "";
                    return (
                      <div key={i} className="bg-amber-50 border border-amber-200 p-5 rounded-2xl">
                        <div className="font-medium text-amber-800">• {term}</div>
                        {explanation && (
                          <p className="text-amber-700 text-sm mt-2 leading-relaxed">{explanation}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Full Detailed Summary */}
            {result.detailed_summary && (
              <div className="pt-10 border-t border-dashed border-gray-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h4 className="text-2xl font-bold text-gray-900">📖 Full Detailed Analysis</h4>
                  <button
                    onClick={() => downloadMarkdown(result.detailed_summary, result.filename)}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl transition-all shadow-md"
                  >
                    <Download size={20} />
                    Download as Markdown
                  </button>
                </div>

                <div className="prose prose-lg prose-indigo max-w-none bg-zinc-50 p-10 rounded-3xl border border-gray-200">
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