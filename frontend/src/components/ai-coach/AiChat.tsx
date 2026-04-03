"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, Paperclip, Send, PanelRightClose, 
  PanelRightOpen, FileText, Loader2, Bot, User, PlusCircle, Trash2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

export default function AiChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sessions from localStorage
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

  // Save to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("edu_coach_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  // Auto scroll to bottom
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
      const remaining = sessions.filter((s) => s.id !== id);
      setCurrentSessionId(remaining.length > 0 ? remaining[0].id : null);
    }
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
      prev.map((s) => {
        if (s.id === currentSessionId) {
          const updatedMessages = [...s.messages, newMessage];
          return {
            ...s,
            messages: updatedMessages,
            title: s.messages.length === 0 
              ? userMessageText.substring(0, 40) + "..." 
              : s.title,
            updatedAt: Date.now(),
          };
        }
        return s;
      })
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
          student_level: studentLevel 
        }),
      });

      if (!res.ok) throw new Error("Failed to get response from AI Coach");

      const data = await res.json();
      const replyText = data.reply || "Sorry, I couldn't generate a response.";

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
                    text: `⚠️ **Error:** Unable to connect to AI Coach. Please try again.`,
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
      formData.append("subject", `Study Material: ${file.name.replace(/\.[^/.]+$/, "")}`);

      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error("PDF processing failed.");

      const data = await res.json();

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
                    text: `✅ **File Processed Successfully!**\n\nI have analyzed **${file.name}** and extracted ${data.concepts_extracted || 0} key learning concepts.\n\nYou can now ask me questions about this material. I'll guide you step by step using the content from your PDF.`,
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
        
        {/* Header */}
        <header className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white/90 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Bot size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">EduSense AI Coach</h1>
              <p className="text-xs text-indigo-500 font-medium">Your Personal Academic Tutor</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            title="Toggle chat history"
          >
            {isSidebarOpen ? <PanelRightClose size={22} /> : <PanelRightOpen size={22} />}
          </button>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-gray-50">
          {!currentSession || currentSession.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-75 px-4">
              <div className="bg-indigo-50 p-8 rounded-3xl mb-6 border border-indigo-100">
                <FileText size={64} className="text-indigo-400 mx-auto" strokeWidth={1.2} />
              </div>
              <h2 className="text-3xl font-semibold mb-3 text-gray-700">Ready to Learn?</h2>
              <p className="max-w-md text-gray-500 text-lg leading-relaxed">
                Upload your lecture PDF using the paperclip icon below.<br />
                I'll extract the concepts and guide you through the material step by step.
              </p>
            </div>
          ) : (
            currentSession.messages.map((msg) => (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={`flex gap-4 ${msg.sender === "user" ? "justify-end" : "justify-start"} max-w-4xl mx-auto`}
              >
                <div className={`w-9 h-9 shrink-0 rounded-2xl flex items-center justify-center mt-1 ${
                  msg.sender === "ai" 
                    ? "bg-indigo-100 text-indigo-600" 
                    : "bg-gray-800 text-white"
                }`}>
                  {msg.sender === "ai" ? <Bot size={20} /> : <User size={20} />}
                </div>

                <div className={`p-5 rounded-3xl max-w-[80%] text-[15.2px] leading-relaxed ${
                  msg.sender === "user" 
                    ? "bg-gray-800 text-white rounded-tr-none" 
                    : "bg-white border border-gray-200 shadow-sm text-gray-700 rounded-tl-none"
                }`}>
                  {msg.sender === "user" ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="prose prose-indigo prose-base max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: (props) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-800" {...props} />,
                          h2: (props) => <h2 className="text-xl font-semibold mt-5 mb-3 text-indigo-700" {...props} />,
                          h3: (props) => <h3 className="text-lg font-medium mt-4 mb-2 text-gray-700" {...props} />,
                          strong: (props) => <strong className="font-semibold text-indigo-700" {...props} />,
                          ul: (props) => <ul className="list-disc pl-6 my-4 space-y-2" {...props} />,
                          ol: (props) => <ol className="list-decimal pl-6 my-4 space-y-2" {...props} />,
                          li: (props) => <li className="text-gray-700 leading-relaxed" {...props} />,
                          p: (props) => <p className="my-3 leading-relaxed text-gray-700" {...props} />,
                          blockquote: (props) => (
                            <blockquote className="border-l-4 border-indigo-300 pl-4 italic my-4 text-gray-600" {...props} />
                          ),
                          code: ({ inline, ...props }: any) =>
                            inline ? (
                              <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-sm" {...props} />
                            ) : (
                              <code className="block bg-gray-900 text-gray-100 p-4 rounded-2xl my-4 overflow-x-auto font-mono text-sm" {...props} />
                            ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}

          {/* Upload & Loading Indicators */}
          {uploading && (
            <div className="flex gap-4 max-w-4xl mx-auto">
              <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm flex items-center gap-3">
                <Loader2 className="animate-spin text-indigo-500" size={22} />
                <span className="text-gray-600">Processing PDF and extracting concepts...</span>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex gap-4 max-w-4xl mx-auto">
              <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">AI Coach is thinking</span>
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: "0ms"}}></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: "150ms"}}></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: "300ms"}}></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-8" />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-3xl p-2 px-4 shadow-sm focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-300 transition-all">
            
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
              className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-2xl transition-all disabled:opacity-50"
              title="Upload study material (PDF)"
            >
              <Paperclip size={22} />
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
              placeholder="Ask anything about your study material..."
              className="flex-1 max-h-32 min-h-[52px] bg-transparent resize-y outline-none py-3 px-2 text-gray-700 leading-relaxed"
              rows={1}
            />
            
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || loading || uploading}
              className={`p-3.5 rounded-2xl shrink-0 transition-all ${
                inputValue.trim() 
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md" 
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Send size={20} className={inputValue.trim() ? "translate-x-0.5" : ""} />
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-3">
            AI Coach uses semantic search from your uploaded PDFs • Answers are based only on your material
          </p>
        </div>
      </div>

      {/* Sidebar - Chat History */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-gray-200 bg-gray-50 flex flex-col shrink-0 z-20 shadow-[-10px_0_20px_-5px_rgba(0,0,0,0.05)]"
          >
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2 text-gray-700">
                <MessageSquare size={18} className="text-indigo-500" />
                Previous Sessions
              </h3>
              <button 
                onClick={createNewSession}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                title="New Chat"
              >
                <PlusCircle size={22} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setCurrentSessionId(session.id)}
                  className={`group w-full text-left p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                    currentSessionId === session.id
                      ? "bg-indigo-100 text-indigo-900 shadow-sm"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <div className="truncate text-sm font-medium pr-2">
                    {session.title || "Untitled Session"}
                  </div>
                  <button 
                    onClick={(e) => deleteSession(e, session.id)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              
              {sessions.length === 0 && (
                <p className="text-sm text-gray-400 text-center mt-12">No previous chats yet</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}