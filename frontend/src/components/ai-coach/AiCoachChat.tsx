"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Paperclip, Bot, User, Loader2, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

export default function AiCoachChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sessions
  useEffect(() => {
    const stored = localStorage.getItem("edu_coach_sessions");
    if (stored) {
      const parsed = JSON.parse(stored);
      setSessions(parsed);
      setCurrentSessionId(parsed[0]?.id || null);
    } else {
      createNewSession();
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("edu_coach_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, loading, uploading]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Study Session",
      messages: [],
      updatedAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentSessionId) return;

    const userMessageText = inputValue.trim();
    setInputValue("");
    setLoading(true);

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: userMessageText,
      timestamp: Date.now(),
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              messages: [...s.messages, newMessage],
              title: s.messages.length === 0 ? userMessageText.slice(0, 30) + "..." : s.title,
              updatedAt: Date.now(),
            }
          : s
      )
    );

    try {
      const studentLevel = localStorage.getItem("edu_student_level") || "Intermediate";

      const res = await fetch(`${API_BASE}/chat/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: userMessageText,
          subject: null,
          student_level: studentLevel,
        }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();
      const replyText = data.reply || "Sorry, I couldn't generate a response.";

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  { id: Date.now().toString(), sender: "ai", text: replyText, timestamp: Date.now() },
                ],
              }
            : s
        )
      );
    } catch (error: any) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  {
                    id: Date.now().toString(),
                    sender: "ai",
                    text: `⚠️ Error: ${error.message}`,
                    timestamp: Date.now(),
                  },
                ],
              }
            : s
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentSessionId) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("subject", `Study Material: ${file.name.replace(/\.[^/.]+$/, "")}`);

    try {
      const res = await fetch(`${API_BASE}/chat/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();

      let responseMsg = `✅ **${file.name}** uploaded successfully!\n\n`;
      if (data.summary?.length) {
        responseMsg += `**Summary:**\n${data.summary.map((s: string) => `• ${s}`).join("\n")}\n\n`;
      }
      if (data.concepts?.length) {
        responseMsg += `**Key Concepts:**\n${data.concepts
          .map((c: any) => `• ${c.title} (${c.difficulty})`)
          .join("\n")}\n\n`;
      }

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  { id: Date.now().toString(), sender: "ai", text: responseMsg, timestamp: Date.now() },
                ],
              }
            : s
        )
      );
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {!currentSession || currentSession.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <FileText size={64} className="text-indigo-300 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-700">Welcome to AI Coach</h2>
            <p className="text-gray-500 max-w-md mt-3">
              Upload your lecture PDFs and start asking questions. I will guide you step by step.
            </p>
          </div>
        ) : (
          currentSession.messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.sender === "user" ? "justify-end" : ""}`}
            >
              <div className={`flex gap-4 max-w-3xl ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${msg.sender === "ai" ? "bg-indigo-100 text-indigo-600" : "bg-gray-800 text-white"}`}>
                  {msg.sender === "ai" ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className={`p-5 rounded-3xl text-[15.2px] leading-relaxed ${msg.sender === "user" ? "bg-gray-800 text-white" : "bg-white border border-gray-200 shadow-sm"}`}>
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))
        )}

        {(uploading || loading) && (
          <div className="flex gap-4 max-w-3xl">
            <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <Bot size={20} />
            </div>
            <div className="p-5 bg-white border border-gray-200 rounded-3xl flex items-center gap-3">
              <Loader2 className="animate-spin" size={20} />
              <span>{uploading ? "Processing document..." : "Thinking..."}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-100 p-6 bg-white">
        <div className="max-w-4xl mx-auto flex gap-3 bg-gray-50 border border-gray-200 rounded-3xl p-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-4 text-gray-400 hover:text-indigo-600 rounded-2xl hover:bg-white transition-colors"
          >
            <Paperclip size={22} />
          </button>

          <input
            type="file"
            accept=".pdf,.docx,.pptx"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
            placeholder="Ask anything about your study material..."
            className="flex-1 bg-transparent outline-none py-4 px-2 resize-y min-h-[52px] max-h-40"
            rows={1}
          />

          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || loading || uploading}
            className={`p-4 rounded-2xl transition-all ${inputValue.trim() ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-200 text-gray-400"}`}
          >
            <Send size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}