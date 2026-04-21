"use client";

import React, { useEffect, useState } from "react";
import {
  Brain,
  Loader2,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Trophy,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
} from "lucide-react";
import { UploadedPdf } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
const QUIZ_V2_STATE_KEY = "edu_ai_quiz_v2_state_v1";

/* ───────── Types ───────── */

interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

interface QuizScoreRecord {
  id: string;
  pdf_id: string;
  topic: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  difficulty: string;
  attempted_at: string;
}

interface Props {
  uploadedPdfs: UploadedPdf[];
}

interface PersistedQuizV2State {
  quizData: QuizQuestion[];
  selectedAnswers: { [key: number]: number };
  showResults: boolean;
  score: number;
  selectedDocId: string;
}

/* ───────── Component ───────── */

export default function SmartQuizV2({ uploadedPdfs }: Props) {
  /* Quiz state */
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: number;
  }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  /* Score history state */
  const [scoreHistory, setScoreHistory] = useState<QuizScoreRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [filterTopic, setFilterTopic] = useState<string>("");
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [scoreSaving, setScoreSaving] = useState(false);

  /* ── Restore persisted state ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUIZ_V2_STATE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedQuizV2State;
      setQuizData(Array.isArray(parsed.quizData) ? parsed.quizData : []);
      setSelectedAnswers(parsed.selectedAnswers || {});
      setShowResults(Boolean(parsed.showResults));
      setScore(Number.isFinite(parsed.score) ? parsed.score : 0);
      setSelectedDocId(parsed.selectedDocId || "");
    } catch {
      // Ignore invalid persisted state.
    }
  }, []);

  /* ── Persist quiz state ── */
  useEffect(() => {
    if (!selectedDocId) return;
    const payload: PersistedQuizV2State = {
      quizData,
      selectedAnswers,
      showResults,
      score,
      selectedDocId,
    };
    localStorage.setItem(QUIZ_V2_STATE_KEY, JSON.stringify(payload));
  }, [quizData, selectedAnswers, showResults, score, selectedDocId]);

  /* ── Validate selectedDocId still exists ── */
  useEffect(() => {
    if (!selectedDocId) return;
    if (uploadedPdfs.length === 0) return;
    const exists = uploadedPdfs.some((pdf) => pdf.id === selectedDocId);
    if (!exists) {
      setSelectedDocId("");
      setQuizData([]);
      setSelectedAnswers({});
      setShowResults(false);
      setScore(0);
      localStorage.removeItem(QUIZ_V2_STATE_KEY);
    }
  }, [selectedDocId, uploadedPdfs]);

  /* ── Fetch score topics on mount ── */
  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await fetch(`${API_BASE}/quiz-scores/topics`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setAvailableTopics(data.topics || []);
      }
    } catch {
      // silently ignore
    }
  };

  const fetchScoreHistory = async (topic?: string) => {
    setHistoryLoading(true);
    try {
      const url = topic
        ? `${API_BASE}/quiz-scores?topic=${encodeURIComponent(topic)}`
        : `${API_BASE}/quiz-scores`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch scores");
      const data = await res.json();
      setScoreHistory(data.scores || []);
    } catch {
      setScoreHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  /* ── Doc change handler ── */
  const handleDocChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDocId(e.target.value);
    setQuizData([]);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
    setError("");
    setSuccessMessage("");
  };

  /* ── Generate quiz ── */
  const generateQuiz = async () => {
    if (!selectedDocId) {
      setError("Please select a PDF document first.");
      return;
    }

    setQuizLoading(true);
    setShowResults(false);
    setSelectedAnswers({});
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(`${API_BASE}/pdf/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          num_questions: 8,
          difficulty: "medium",
          pdf_id: selectedDocId || undefined,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        throw new Error(`Server error ${res.status}: ${errText}`);
      }
      const data = await res.json();
      setQuizData(data.quiz || []);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to generate quiz. Please try again.";
      setError(message);
    } finally {
      setQuizLoading(false);
    }
  };

  /* ── Handle answer ── */
  const handleAnswer = (qIndex: number, optIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  /* ── Submit quiz & save score ── */
  const submitQuiz = async () => {
    let correctCount = 0;
    quizData.forEach((q, i) => {
      if (selectedAnswers[i] === q.correct_index) correctCount++;
    });
    setScore(correctCount);
    setShowResults(true);

    // Save score to database
    const selectedPdf = uploadedPdfs.find((p) => p.id === selectedDocId);
    const topicName = selectedPdf?.filename || "Unknown Topic";

    setScoreSaving(true);
    try {
      const res = await fetch(`${API_BASE}/quiz-scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          pdf_id: selectedDocId,
          topic: topicName,
          total_questions: quizData.length,
          correct_answers: correctCount,
          difficulty: "medium",
        }),
      });

      if (res.ok) {
        setSuccessMessage(
          `Score saved! You got ${correctCount}/${quizData.length} correct.`
        );
        // Refresh topics list
        fetchTopics();
      }
    } catch {
      // Score saving failed silently – quiz result is still shown
    } finally {
      setScoreSaving(false);
    }
  };

  /* ── Reset quiz ── */
  const resetQuiz = () => {
    setQuizData([]);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
    setError("");
    setSuccessMessage("");
  };

  /* ── Toggle score history panel ── */
  const toggleHistory = () => {
    if (!showHistory) {
      fetchScoreHistory(filterTopic || undefined);
    }
    setShowHistory((prev) => !prev);
  };

  const handleTopicFilter = (topic: string) => {
    setFilterTopic(topic);
    fetchScoreHistory(topic || undefined);
  };

  /* ── Helpers ── */
  const getScoreColor = (pct: number) => {
    if (pct >= 80) return "text-emerald-600";
    if (pct >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (pct: number) => {
    if (pct >= 80) return "bg-emerald-50 border-emerald-200";
    if (pct >= 50) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  };

  /* ───────── Render ───────── */
  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* ── Header (PdfSummarizer style) ── */}
      <div className="text-center mb-10">
        <Brain size={64} className="mx-auto text-indigo-500 mb-4" />
        <h2 className="text-3xl font-bold text-gray-800">
          AI Quiz Generator
        </h2>
        <p className="text-gray-500 mt-2">
          Select a PDF and generate AI-powered quiz questions to test your
          knowledge
        </p>
      </div>

      {/* ── PDF Selector + Generate Button (PdfSummarizer layout) ── */}
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
          onClick={generateQuiz}
          disabled={!selectedDocId || quizLoading}
          className="px-8 py-4 bg-indigo-600 font-semibold text-white rounded-2xl disabled:opacity-50 hover:bg-indigo-700 transition flex items-center justify-center gap-2 min-w-[220px]"
        >
          {quizLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Generating Quiz...
            </>
          ) : (
            <>
              <Brain size={20} />
              Generate Quiz
            </>
          )}
        </button>
      </div>

      {/* ── Messages ── */}
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

      {/* ── Loading Indicator ── */}
      {quizLoading && quizData.length === 0 && (
        <div className="mt-10 flex flex-col items-center">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
          <p className="mt-4 text-gray-600">
            Generating AI quiz questions from your study material...
          </p>
        </div>
      )}

      {/* ── Empty State ── */}
      {quizData.length === 0 && !quizLoading && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <Brain size={80} className="mx-auto text-gray-300 mb-6" />
          <p className="text-xl text-gray-400">No quiz generated yet</p>
          <p className="text-gray-500 mt-2">
            Select a PDF above and click &quot;Generate Quiz&quot; to start
          </p>
        </div>
      )}

      {/* ── Quiz Questions ── */}
      {quizData.length > 0 && (
        <div className="space-y-10">
          {quizData.map((q, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-3xl border shadow-sm"
            >
              <p className="font-semibold text-lg mb-6 leading-relaxed">
                Q{index + 1}. {q.question}
              </p>
              <div className="space-y-4">
                {q.options.map((option, optIdx) => (
                  <label
                    key={optIdx}
                    className={`block p-5 rounded-2xl border cursor-pointer transition-all ${showResults
                        ? optIdx === q.correct_index
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : selectedAnswers[index] === optIdx
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-gray-100 opacity-50"
                        : selectedAnswers[index] === optIdx
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <input
                      type="radio"
                      name={`q-v2-${index}`}
                      disabled={showResults}
                      checked={selectedAnswers[index] === optIdx}
                      onChange={() => handleAnswer(index, optIdx)}
                      className="mr-4 accent-indigo-600"
                    />
                    {option}
                  </label>
                ))}
              </div>

              {showResults && (
                <div className="mt-6 p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">
                    <CheckCircle size={20} /> Correct Answer:{" "}
                    {q.options[q.correct_index]}
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{q.explanation}</p>
                </div>
              )}
            </div>
          ))}

          {/* ── Submit / Score / New Quiz ── */}
          <div className="flex justify-center gap-4 pt-6">
            {!showResults ? (
              <button
                onClick={submitQuiz}
                className="px-12 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-semibold text-lg"
              >
                Submit Answers
              </button>
            ) : (
              <>
                <div className="px-10 py-5 bg-white rounded-3xl shadow text-2xl font-bold flex items-center gap-3">
                  <Trophy className="text-amber-500" size={28} />
                  Score:{" "}
                  <span className="text-emerald-600">{score}</span> /{" "}
                  {quizData.length}
                  {scoreSaving && (
                    <Loader2
                      className="animate-spin text-gray-400 ml-2"
                      size={18}
                    />
                  )}
                </div>
                <button
                  onClick={resetQuiz}
                  className="flex items-center gap-3 px-10 py-5 bg-gray-800 hover:bg-gray-900 text-white rounded-3xl font-semibold"
                >
                  <RefreshCw size={20} /> New Quiz
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SCORE HISTORY SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <div className="mt-16">
        <button
          onClick={toggleHistory}
          className="w-full flex items-center justify-between px-8 py-5 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 hover:border-indigo-300 transition-all group"
        >
          <div className="flex items-center gap-3">
            <BarChart3 size={24} className="text-indigo-600" />
            <span className="text-lg font-bold text-indigo-900">
              My Quiz Score History
            </span>
          </div>
          {showHistory ? (
            <ChevronUp size={20} className="text-indigo-600" />
          ) : (
            <ChevronDown size={20} className="text-indigo-600" />
          )}
        </button>

        {showHistory && (
          <div className="mt-6 space-y-6 animate-in fade-in">
            {/* ── Topic filter ── */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Target size={16} />
                Filter by Topic:
              </label>
              <select
                value={filterTopic}
                onChange={(e) => handleTopicFilter(e.target.value)}
                className="p-3 border border-gray-300 rounded-xl min-w-[250px] outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Topics</option>
                {availableTopics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* ── Loading ── */}
            {historyLoading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
              </div>
            )}

            {/* ── Empty history ── */}
            {!historyLoading && scoreHistory.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400 text-lg">
                  No quiz scores found
                  {filterTopic ? ` for "${filterTopic}"` : ""}
                </p>
                <p className="text-gray-500 mt-2 text-sm">
                  Complete a quiz to see your scores here
                </p>
              </div>
            )}

            {/* ── Score cards ── */}
            {!historyLoading && scoreHistory.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scoreHistory.map((s) => (
                  <div
                    key={s.id}
                    className={`p-6 rounded-2xl border-2 transition-all hover:shadow-md ${getScoreBg(
                      s.score_percentage
                    )}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="font-semibold text-gray-900 text-base truncate max-w-[200px]">
                        {s.topic}
                      </h5>
                      <span
                        className={`text-2xl font-bold ${getScoreColor(
                          s.score_percentage
                        )}`}
                      >
                        {s.score_percentage}%
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <CheckCircle size={14} className="text-emerald-500" />
                        {s.correct_answers}/{s.total_questions} correct
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} className="text-gray-400" />
                        {new Date(s.attempted_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            s.score_percentage >= 80
                              ? "bg-emerald-500"
                              : s.score_percentage >= 50
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${s.score_percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
