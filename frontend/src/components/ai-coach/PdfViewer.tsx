"use client";

import React, { useState } from "react";
import { FileText, Loader2, AlertCircle } from "lucide-react";
import { UploadedPdf } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

type PdfMaterialResponse = {
  success: boolean;
  material?: {
    id: string;
    filename: string;
    subject: string;
    created_at: string;
    extracted_text: string;
  };
};

interface Props {
  uploadedPdfs: UploadedPdf[];
}

export default function PdfViewer({ uploadedPdfs }: Props) {
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [content, setContent] = useState<PdfMaterialResponse["material"] | null>(null);

  const fetchContent = async (id: string) => {
    setLoading(true);
    setError("");
    setContent(null);

    // Debug: verify selected id in console
    console.debug("[PdfViewer] selectedDocId =", id);

    try {
      const res = await fetch(`${API_BASE}/pdf/materials/${id}`, {
        credentials: "include",
      });
      const text = await res.text();

      // Debug: inspect raw response in console
      console.debug("[PdfViewer] status =", res.status);
      console.debug("[PdfViewer] raw body =", text);

      if (!res.ok) throw new Error(`Server error ${res.status}: ${text}`);
      const data = JSON.parse(text) as PdfMaterialResponse;
      if (!data.success || !data.material) throw new Error("Invalid response");
      setContent(data.material);
    } catch (e: any) {
      setError(e?.message || "Failed to load PDF content.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-auto">
      <div className="text-center mb-10">
        <FileText size={64} className="mx-auto text-indigo-500 mb-4" />
        <h2 className="text-3xl font-bold text-gray-800">PDF Viewer (Debug)</h2>
        <p className="text-gray-500 mt-2">
          Select a PDF and load its extracted text from the backend.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center mb-6 gap-4">
        <select
          value={selectedDocId}
          onChange={(e) => {
            const id = e.target.value;
            setSelectedDocId(id);
            setContent(null);
            setError("");
            if (id) fetchContent(id);
          }}
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
          onClick={() => selectedDocId && fetchContent(selectedDocId)}
          disabled={!selectedDocId || loading}
          className="px-8 py-4 bg-indigo-600 font-semibold shadow-lg text-white rounded-2xl disabled:opacity-50 hover:bg-indigo-700 transition w-full sm:w-auto flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Loading...
            </>
          ) : (
            "Reload Content"
          )}
        </button>
      </div>

      {error && (
        <div className="mt-6 flex items-center justify-center gap-3 text-red-600 bg-red-50 p-6 rounded-2xl">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      )}

      {content && (
        <div className="mt-6 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="font-semibold mb-2">{content.filename}</div>
          <div className="text-sm text-gray-500 mb-4">{content.subject}</div>
          <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 rounded-2xl p-4 border max-h-[520px] overflow-auto">
            {content.extracted_text || "(No extracted text)"}
          </pre>
        </div>
      )}
    </div>
  );
}

