"use client";

import { useState } from "react";
import { MessageCircle, FileText, Brain } from "lucide-react";

import Ai from "@/components/ai-coach/AiChat";
import PdfSummarizer from "@/components/ai-coach/PdfSummarizer";
import SmartQuiz from "@/components/ai-coach/SmartQuiz";
import PdfUploaderModal from "@/components/ai-coach/PdfUploaderModal";

export default function AiPage() {
  const [activeTab, setActiveTab] = useState("chat");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedPdfs, setUploadedPdfs] = useState<any[]>([]);

  const handleUploadSuccess = (pdf: any) => {
    setUploadedPdfs((prev) => [...prev, pdf]);
  };

  const tabs = [
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "summary", label: "Summary", icon: FileText },
    { id: "quiz", label: "Quiz", icon: Brain },
  ];

  return (
    <div className="p-6">

      {/* 🔥 Styled Tabs */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">AI Coach</h1>

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
      </div>

      {/* 🔹 Modal */}
      <PdfUploaderModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}