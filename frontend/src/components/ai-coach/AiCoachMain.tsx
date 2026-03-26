"use client";

import React, { useState, useEffect } from "react";
import { Bot, Upload, MessageSquare, FileText, Brain } from "lucide-react";
import PdfUploaderModal from "./PdfUploaderModal";
import AiCoachChat from "./AiCoachChat";
import PdfSummarizer from "./PdfSummarizer";
import SmartQuiz from "./SmartQuiz";
import { UploadedPdf } from "./types";

export default function AiCoachMain() {
  const [activeTab, setActiveTab] = useState<"chat" | "summary" | "quiz">(
    "chat",
  );
  const [uploadedPdfs, setUploadedPdfs] = useState<UploadedPdf[]>([]);
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const selectedPdf = uploadedPdfs.find((p) => p.id === selectedPdfId) || null;

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("uploaded_pdfs");
    if (saved) setUploadedPdfs(JSON.parse(saved));
  }, []);

  const handleUploadSuccess = (newPdf: UploadedPdf) => {
    const updated = [newPdf, ...uploadedPdfs];
    setUploadedPdfs(updated);
    localStorage.setItem("uploaded_pdfs", JSON.stringify(updated));
    setSelectedPdfId(newPdf.id);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm m-4 mb-8 font-sans">
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="h-16 border-b border-gray-100 flex items-center px-6 bg-white/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                EduSense AI Coach
              </h1>
              <p className="text-xs text-indigo-500">
                Powered by your uploaded materials
              </p>
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="ml-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-medium transition-all"
          >
            <Upload size={18} />
            Upload PDF
          </button>
        </header>

        {/* Tabs */}
        <div className="flex border-b bg-white">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-5 flex items-center justify-center gap-2 font-medium border-b-4 transition-all ${activeTab === "chat" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-600"}`}
          >
            <MessageSquare size={20} /> AI Coach Chat
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex-1 py-5 flex items-center justify-center gap-2 font-medium border-b-4 transition-all ${activeTab === "summary" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-600"}`}
          >
            <FileText size={20} /> PDF Summarizer
          </button>
          <button
            onClick={() => setActiveTab("quiz")}
            className={`flex-1 py-5 flex items-center justify-center gap-2 font-medium border-b-4 transition-all ${activeTab === "quiz" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-600"}`}
          >
            <Brain size={20} /> Smart Quiz
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-8">
          {activeTab === "chat" && <AiCoachChat selectedPdf={selectedPdf} />}
          {activeTab === "summary" && (
            <PdfSummarizer selectedPdf={selectedPdf} />
          )}
          {activeTab === "quiz" && <SmartQuiz selectedPdf={selectedPdf} />}
        </div>
      </div>

      {/* Upload Modal */}
      <PdfUploaderModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
