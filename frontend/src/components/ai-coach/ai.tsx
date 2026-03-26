"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, Paperclip, Send, PanelRightClose, 
  PanelRightOpen, FileText, Loader2, Bot, User, PlusCircle, 
  Trash2, Brain, CheckCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

export default function AICoachPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // New: Tab system
  const [activeTab, setActiveTab] = useState<"chat" | "quiz">("chat");

  // Quiz states
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sessions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("edu_coach_sessions");
    if (stored) {
      const parsed: ChatSession[] = JSON.parse(stored);
      setSessions(parsed);
      if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
      else createNewSession();
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
  }, [sessions, uploading, loading]);

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
      setCurrentSessionId(sessions[0]?.id || null);
    }
  };

  // ====================== CHAT ======================
  const handleSendMessage = async () => { /* ... your existing code unchanged ... */ };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { /* ... your existing code unchanged ... */ };

  // ====================== SMART QUIZ ======================
  const handleGenerateQuiz = async () => {
    setQuizLoading(true);
    setShowResults(false);
    setSelectedAnswers({});

    try {
      const res = await fetch(`${API_BASE}/chat/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          num_questions: 8,
          difficulty: "medium",
          subject: null
        }),
      });

      if (!res.ok) throw new Error("Failed to generate quiz");
      const data = await res.json();
      setQuizData(data.quiz || []);
    } catch (err) {
      alert("Could not generate quiz. Make sure you have uploaded PDFs.");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSubmitQuiz = () => {
    if (!quizData.length) return;
    let correct = 0;
    quizData.forEach((q, i) => {
      if (selectedAnswers[i] === q.correct_index) correct++;
    });
    setScore(correct);
    setShowResults(true);
  };

  const resetQuiz = () => {
    setQuizData([]);
    setSelectedAnswers({});
    setShowResults(false);
  };

  // ====================== RENDER ======================
  const currentSession = sessions.find((s) => s.id === currentSessionId);

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white text-gray-800 rounded-xl border border-gray-200 shadow-sm relative m-4 mb-8 font-sans">
      {/* HEADER WITH TABS */}
      <div className="flex flex-col flex-1">
        <header className="h-16 border-b border-gray-100 flex items-center px-6 bg-white/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Bot size={22} />
            </div>
            <h1 className="text-lg font-bold text-gray-800">EduSense AI Coach</h1>
          </div>

          {/* TABS */}
          <div className="flex bg-gray-100 rounded-3xl p-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-6 py-2 rounded-3xl transition-all flex items-center gap-2 ${
                activeTab === "chat" ? "bg-white shadow text-indigo-600" : "text-gray-600 hover:bg-white/60"
              }`}
            >
              <MessageSquare size={18} />
              Chat
            </button>
            <button
              onClick={() => setActiveTab("quiz")}
              className={`px-6 py-2 rounded-3xl transition-all flex items-center gap-2 ${
                activeTab === "quiz" ? "bg-white shadow text-indigo-600" : "text-gray-600 hover:bg-white/60"
              }`}
            >
              <Brain size={18} />
              Smart Quiz
            </button>
          </div>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="ml-6 p-2.5 rounded-full hover:bg-gray-100 text-gray-500"
          >
            {isSidebarOpen ? <PanelRightClose size={22} /> : <PanelRightOpen size={22} />}
          </button>
        </header>

        {/* CONTENT AREA */}
        {activeTab === "chat" ? (
          // ==================== CHAT VIEW (unchanged) ====================
          <>
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
              {/* your existing messages rendering code */}
              {!currentSession || currentSession.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-70 px-4">
                  <div className="bg-indigo-50 p-6 rounded-3xl mb-4 border border-indigo-100">
                    <FileText size={48} className="text-indigo-400 mx-auto" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2 text-gray-700">I am your strictly-guided AI Coach</h2>
                  <p className="max-w-md text-gray-500 mb-8 leading-relaxed">
                    Upload your course PDF. I will digest the concepts automatically and guide you to truly learn!
                  </p>
                </div>
              ) : (
                currentSession.messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-4 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"} max-w-4xl mx-auto`}
                  >
                    {/* your existing message UI */}
                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center mt-1 ${msg.sender === "ai" ? "bg-indigo-100 text-indigo-600" : "bg-gray-800 text-white"}`}>
                      {msg.sender === "ai" ? <Bot size={18} /> : <User size={18} />}
                    </div>
                    <div className={`p-4 rounded-2xl max-w-[85%] text-[15px] leading-relaxed ${msg.sender === "user" ? "bg-gray-800 text-white rounded-tr-sm" : "bg-white border border-gray-200 shadow-sm text-gray-700 rounded-tl-sm"}`}>
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
                  <div className="p-4 rounded-2xl bg-white border border-gray-200 flex items-center gap-3">
                    <Loader2 className="animate-spin" size={18} />
                    <span>Reading PDF and creating concept vectors...</span>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex gap-4 max-w-4xl mx-auto opacity-70">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mt-1">
                    <Bot size={18} />
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-gray-200 flex items-center gap-2">
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

            {/* Input Bar - only for chat */}
            <div className="p-4 bg-white border-t border-gray-100">
              {/* your existing input bar code (Paperclip + textarea + Send) */}
              <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-3xl p-2 px-3 shadow-sm">
                <input type="file" accept=".pdf,.docx,.pptx" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-indigo-600 rounded-full">
                  <Paperclip size={20} />
                </button>
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder="Ask your coach anything..."
                  className="w-full max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-3 text-gray-700"
                  rows={1}
                />
                <button onClick={handleSendMessage} disabled={!inputValue.trim() || loading || uploading} className={`p-3 rounded-full ${inputValue.trim() ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-400"}`}>
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          // ==================== SMART QUIZ VIEW ====================
          <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <Brain className="text-indigo-600" /> Smart Quiz Generator
                  </h2>
                  <p className="text-gray-500">Questions generated from your uploaded PDFs using AI</p>
                </div>
                <button
                  onClick={handleGenerateQuiz}
                  disabled={quizLoading}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-3xl flex items-center gap-3 shadow-lg transition-all"
                >
                  {quizLoading ? <Loader2 className="animate-spin" /> : <Brain />}
                  {quizLoading ? "Generating Quiz..." : "Generate New Quiz"}
                </button>
              </div>

              {quizData.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                  <Brain size={80} className="mx-auto text-gray-300 mb-6" />
                  <h3 className="text-2xl font-semibold text-gray-400">No quiz yet</h3>
                  <p className="text-gray-500 mt-2">Click the button above to generate a smart quiz from your PDFs</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {quizData.map((q, index) => (
                    <div key={index} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                      <p className="font-semibold text-lg mb-6">Q{index + 1}. {q.question}</p>
                      <div className="space-y-3">
                        {q.options.map((option, optIndex) => (
                          <label
                            key={optIndex}
                            className={`flex items-center gap-4 p-5 rounded-2xl cursor-pointer transition-all border ${
                              selectedAnswers[index] === optIndex
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q${index}`}
                              checked={selectedAnswers[index] === optIndex}
                              onChange={() => setSelectedAnswers({ ...selectedAnswers, [index]: optIndex })}
                              className="w-5 h-5 accent-indigo-600"
                            />
                            <span className="text-[15px]">{option}</span>
                          </label>
                        ))}
                      </div>

                      {showResults && (
                        <div className="mt-6 p-5 bg-gray-50 rounded-2xl text-sm">
                          <div className="flex items-center gap-2 text-green-600 font-medium">
                            <CheckCircle size={18} />
                            Correct Answer: {q.options[q.correct_index]}
                          </div>
                          <p className="mt-3 text-gray-600">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex justify-center gap-4 pt-8">
                    {!showResults ? (
                      <button
                        onClick={handleSubmitQuiz}
                        className="px-10 py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-3xl text-lg shadow-lg"
                      >
                        Submit Quiz &amp; See Results
                      </button>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-center px-8 py-5 bg-white rounded-3xl shadow">
                          Score: <span className="text-emerald-600">{score}/{quizData.length}</span>
                        </div>
                        <button
                          onClick={resetQuiz}
                          className="px-10 py-5 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-3xl"
                        >
                          Generate New Quiz
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sidebar (unchanged) */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-gray-200 bg-gray-50 flex flex-col shrink-0 z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.03)]"
            >
              {/* your existing sidebar code */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}