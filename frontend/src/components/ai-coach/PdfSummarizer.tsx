"use client";
import React, { useState, useEffect } from "react";
import { FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { UploadedPdf } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

interface Props {
  uploadedPdfs: UploadedPdf[];
  onRefreshDocuments?: () => void; // Optional: to refresh list after upload
}

export default function PdfSummarizer({ uploadedPdfs, onRefreshDocuments }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Auto-clear result when document changes
  const handleDocChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDocId(e.target.value);
    setResult(null);
    setError("");
  };

  const handleFetchSummary = async () => {
    if (!selectedDocId) {
      alert("Please select a document first.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/chat/summary/${selectedDocId}`, {
        method: "GET",
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
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-auto">
      <div className="text-center mb-10">
        <FileText size={64} className="mx-auto text-indigo-500 mb-4" />
        <h2 className="text-3xl font-bold text-gray-800">PDF Summarizer + Key Concepts</h2>
        <p className="text-gray-500 mt-2">Select an uploaded PDF to view its summary & concepts</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center mb-10 gap-4">
        <select
          value={selectedDocId}
          onChange={handleDocChange}
          className="p-4 border border-gray-300 rounded-2xl w-full max-w-sm focus:ring-2 focus:ring-indigo-500 outline-none"
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
          onClick={handleFetchSummary}
          disabled={!selectedDocId || loading}
          className="px-8 py-4 bg-indigo-600 font-semibold shadow-lg text-white rounded-2xl disabled:opacity-50 hover:bg-indigo-700 transition w-full sm:w-auto flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Loading...
            </>
          ) : (
            "Get Summary & Concepts"
          )}
        </button>
      </div>

      {loading && (
        <div className="mt-10 flex flex-col items-center">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
          <p className="mt-4 text-gray-600">Generating summary and extracting concepts...</p>
        </div>
      )}

      {error && (
        <div className="mt-10 flex items-center justify-center gap-3 text-red-600 bg-red-50 p-6 rounded-2xl">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      )}

      {result && result.success && (
        <div className="mt-10 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="text-emerald-500" size={28} />
            <h3 className="text-xl font-semibold">Summary for: {result.filename || "Document"}</h3>
          </div>

          <div className="space-y-8">
            {/* Summary */}
            {result.summary?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">📋 Summary</h4>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  {result.summary.map((point: string, i: number) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key Concepts */}
            {result.concepts?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">🔑 Key Concepts</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.concepts.map((concept: any, i: number) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-2xl border">
                      <div className="font-medium">{concept.title}</div>
                      {concept.difficulty && (
                        <div className="text-xs uppercase tracking-widest text-gray-500 mt-1">
                          {concept.difficulty}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Difficult Terms */}
            {result.difficult_terms?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">⚠️ Difficult Terms</h4>
                <div className="flex flex-wrap gap-2">
                  {result.difficult_terms.map((term: string, i: number) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}