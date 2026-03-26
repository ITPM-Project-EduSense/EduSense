"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, Paperclip, Send, PanelRightClose, 
  PanelRightOpen, FileText, Loader2, Bot, User, PlusCircle, Trash2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Interface for standard chat messages
 */
interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: number;
}

/**
 * Interface to store distinct chat sessions
 */
interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

export default function AICoachPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("edu_coach_sessions");
    if (stored) {
      try {
        const parsed: ChatSession[] = JSON.parse(stored);
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
        } else {
          createNewSession();
        }
      } catch (e) {
        createNewSession();
      }
    } else {
      createNewSession();
    }
  }, []);

  // Save to LocalStorage whenever sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("edu_coach_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  // Scroll to bottom when messages change
  const currentSession = sessions.find((s) => s.id === currentSessionId);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages, uploading, loading]);

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

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(sessions.find((s) => s.id !== id)?.id || null);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentSessionId) return;

    const userMessageText = inputValue.trim();
    setInputValue("");
    setLoading(true);

    // 1. Instantly update UI with User message
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: userMessageText,
      timestamp: Date.now(),
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          const updatedMessages = [...s.messages, newMessage];
          return {
            ...s,
            messages: updatedMessages,
            title: s.messages.length === 0 ? userMessageText.substring(0, 30) + "..." : s.title,
            updatedAt: Date.now(),
          };
        }
        return s;
      })
    );

    try {
      // Get student level from local storage or default
      const studentLevel = localStorage.getItem("edu_student_level") || "Intermediate";

      // 2. Transmit to backend
      const res = await fetch(`${API_BASE}/chat/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({ 
          message: userMessageText, 
          subject: null,
          student_level: studentLevel 
        }),
      });

      if (!res.ok) {
        throw new Error("Unable to reach AI Coach");
      }

      const data = await res.json();
      const replyText = data.reply || "No reply was generated.";

      // 3. Update Session with AI Response
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
                    text: replyText,
                    timestamp: Date.now(),
                  },
                ],
                updatedAt: Date.now(),
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
                    text: `⚠️ **Error connecting to AI Coach:** ${error.message}`,
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

    try {
      const formData = new FormData();
      formData.append("file", file);
      // Backend requires a subject. We auto-generate a subject for the context.
      formData.append("subject", `Study Material: ${file.name.replace(/\.[^/.]+$/, "")}`);

      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: "POST",
        credentials: "include", 
        body: formData,
      });

      if (!res.ok) {
        throw new Error("PDF processing failed.");
      }

      const data = await res.json();
      
      // Inject system message notifying user of success
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
                    text: `✅ Automatically processed **${file.name}**! Extracted ${data.concepts_extracted} learning concepts. You can now ask me questions about it, and I will strictly coach you through the material.`,
                    timestamp: Date.now(),
                  },
                ],
              }
            : s
        )
      );
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white text-gray-800 rounded-xl border border-gray-200 shadow-sm relative m-4 mb-8 font-sans">
      
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 transition-all duration-300">
        
        {/* Chat Header */}
        <header className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Bot size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">EduSense AI Coach</h1>
              <p className="text-xs text-indigo-500 font-medium">Powered by Semantic Context Search</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            title="Toggle previous chats"
          >
            {isSidebarOpen ? <PanelRightClose size={22} /> : <PanelRightOpen size={22} />}
          </button>
        </header>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {!currentSession || currentSession.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-70 px-4">
              <div className="bg-indigo-50 p-6 rounded-3xl mb-4 border border-indigo-100">
                <FileText size={48} className="text-indigo-400 mx-auto" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-semibold mb-2 text-gray-700">I am your strictly-guided AI Coach</h2>
              <p className="max-w-md text-gray-500 mb-8 leading-relaxed">
                Upload your course PDF by clicking the paperclip below. I will digest the concepts automatically, allowing you to ask questions. I won't give direct answers, but I'll guide you so you truly learn!
              </p>
            </div>
          ) : (
            currentSession.messages.map((msg) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={`flex gap-4 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"} max-w-4xl mx-auto`}
              >
                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center mt-1 ${
                  msg.sender === "ai" ? "bg-indigo-100 text-indigo-600" : "bg-gray-800 text-white"
                }`}>
                  {msg.sender === "ai" ? <Bot size={18} /> : <User size={18} />}
                </div>
                
                <div className={`p-4 rounded-2xl max-w-[85%] text-[15px] leading-relaxed relative ${
                  msg.sender === "user" 
                    ? "bg-gray-800 text-white rounded-tr-sm" 
                    : "bg-white border border-gray-200 shadow-sm text-gray-700 rounded-tl-sm prose prose-indigo max-w-none"
                }`}>
                  {msg.text}
                </div>
              </motion.div>
            ))
          )}

          {uploading && (
            <div className="flex gap-4 max-w-4xl mx-auto opacity-70">
               <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mt-1">
                 <Bot size={18} />
               </div>
               <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center gap-3">
                 <Loader2 className="animate-spin text-indigo-500" size={18} />
                 <span>Reading and compiling concept vectors from PDF...</span>
               </div>
            </div>
          )}

          {loading && (
            <div className="flex gap-4 max-w-4xl mx-auto opacity-70">
               <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mt-1">
                 <Bot size={18} />
               </div>
               <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center gap-2">
                 <span className="flex space-x-1">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                 </span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-3xl p-2 px-3 shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
            
            {/* Hidden File Input */}
            <input 
               type="file" 
               accept=".pdf,.docx,.pptx" 
               className="hidden" 
               ref={fileInputRef} 
               onChange={handleFileUpload} 
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || uploading}
              className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-full transition-colors disabled:opacity-50 shrink-0 mb-0.5"
              title="Upload PDF material"
            >
              <Paperclip size={20} />
            </button>
            
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask your coach anything about the reading..."
              className="w-full max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-3 text-gray-700 leading-normal"
              rows={1}
            />
            
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || loading || uploading}
              className={`p-3 rounded-full shrink-0 mb-0.5 transition-colors ${
                inputValue.trim() 
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md" 
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Send size={18} className={inputValue.trim() ? "translate-x-0.5 translate-y-[0px]" : ""} />
            </button>
          </div>
          <div className="text-center mt-2 text-xs text-gray-400">
             The AI Coach pulls from your latest uploaded PDFs using semantic similarity.
          </div>
        </div>
      </div>

      {/* Right Sidebar (Previous Chats) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-gray-200 bg-gray-50 flex flex-col shrink-0 z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.03)]"
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <h3 className="font-semibold flex items-center gap-2 text-gray-700">
                <MessageSquare size={18} className="text-indigo-500" />
                Previous Chats
              </h3>
              <button 
                onClick={createNewSession}
                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                title="New Chat"
              >
                <PlusCircle size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setCurrentSessionId(session.id)}
                  className={`group w-full text-left p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                    currentSessionId === session.id
                      ? "bg-indigo-100 text-indigo-900 shadow-sm"
                      : "hover:bg-gray-200/60 text-gray-600"
                  }`}
                >
                  <div className="truncate text-sm font-medium mr-2">
                    {session.title || "Empty Chat"}
                  </div>
                  <button 
                    onClick={(e) => deleteSession(e, session.id)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 bg-white rounded-md shadow-sm transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              
              {sessions.length === 0 && (
                <p className="text-xs text-gray-400 text-center mt-10">No chat history yet.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
