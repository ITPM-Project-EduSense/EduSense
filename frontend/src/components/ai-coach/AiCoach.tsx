"use client";

import React, { useState, useEffect } from "react";
import { Bot, Upload, MessageSquare, Brain, FileText } from "lucide-react";
import AiCoachChat from "./AiCoachChat";
import PdfSummarizer from "./PdfSummarizer";
import SmartQuiz from "./SmartQuiz";
import { UploadedPdf } from "./types";
import PdfUploaderModal from "./PdfUploaderModal";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

export default function AiCoach() {
  const [activeTab, setActiveTab] = useState<"chat" | "summary" | "quiz">(
    "chat",
  );
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedPdfs, setUploadedPdfs] = useState<UploadedPdf[]>([]);
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);

  const tabs = [
    { id: "chat", label: "AI Coach Chat", icon: MessageSquare },
    { id: "summary", label: "PDF Summarizer", icon: FileText },
    { id: "quiz", label: "Smart Quiz", icon: Brain },
  ];

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE}/chat/documents`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        if (data.documents) {
          setUploadedPdfs(data.documents);
          localStorage.setItem("uploaded_pdfs", JSON.stringify(data.documents));
        }
      }
    } catch (error) {
      console.error("Failed to fetch documents", error);
      const saved = localStorage.getItem("uploaded_pdfs");
      if (saved) setUploadedPdfs(JSON.parse(saved));
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUploadSuccess = (newPdf: UploadedPdf) => {
    fetchDocuments();
    setSelectedPdfId(newPdf.id);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm m-4 mb-8">
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="h-16 border-b border-gray-100 flex items-center px-6 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                EduSense AI Coach
              </h1>
              <p className="text-xs text-indigo-500">
                Your personal academic assistant
              </p>
            </div>
            <div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="ml-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-medium transition-all"
              >
                <Upload size={18} />
                Upload PDF
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex ml-auto bg-gray-100 rounded-3xl p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
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
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "chat" && <AiCoachChat />}
          {activeTab === "summary" && (
            <PdfSummarizer uploadedPdfs={uploadedPdfs} />
          )}
          {activeTab === "quiz" && <SmartQuiz uploadedPdfs={uploadedPdfs} />}
        </div>
        <PdfUploaderModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      </div>
    </div>
  );
}
