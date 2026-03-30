"use client";

import React, { useState } from "react";
import { Brain, Loader2, CheckCircle, RefreshCw } from "lucide-react";
import { UploadedPdf } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

interface Props {
  uploadedPdfs: UploadedPdf[];
}

export default function SmartQuiz({ uploadedPdfs }: Props) {
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedDocId, setSelectedDocId] = useState<string>("");

  const generateQuiz = async () => {
    if (uploadedPdfs.length === 0 && !selectedDocId) {
      alert("Please upload at least one PDF first.");
      return;
    }

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
            pdf_id: selectedDocId || undefined
        }),
      });

      if (!res.ok) throw new Error("Failed to generate quiz");
      const data = await res.json();
      setQuizData(data.quiz || []);
    } catch (err) {
      alert("Failed to generate quiz. Please upload some PDFs first using the header button.");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleAnswer = (qIndex: number, optIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const submitQuiz = () => {
    let correctCount = 0;
    quizData.forEach((q, i) => {
      if (selectedAnswers[i] === q.correct_index) correctCount++;
    });
    setScore(correctCount);
    setShowResults(true);
  };

  const resetQuiz = () => {
    setQuizData([]);
    setSelectedAnswers({});
    setShowResults(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="text-indigo-600" /> Smart Quiz Generator
          </h2>
          <p className="text-gray-500">AI-generated questions from your uploaded materials</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={selectedDocId} 
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="p-4 border border-gray-300 rounded-3xl min-w-[200px] outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All PDFs</option>
            {uploadedPdfs.map(pdf => (
              <option key={pdf.id} value={pdf.id}>{pdf.filename}</option>
            ))}
          </select>
          <button
            onClick={generateQuiz}
            disabled={quizLoading}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-semibold shadow-lg disabled:opacity-70 whitespace-nowrap overflow-hidden"
          >
            {quizLoading ? <Loader2 className="animate-spin shrink-0" /> : <Brain className="shrink-0" />}
            {quizLoading ? "Generating..." : "Generate New Quiz"}
          </button>
        </div>
      </div>

      {quizData.length === 0 && !quizLoading && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed">
          <Brain size={80} className="mx-auto text-gray-300 mb-6" />
          <p className="text-xl text-gray-400">No quiz generated yet</p>
          <p className="text-gray-500 mt-2">Upload PDFs via the header button first, then generate a quiz</p>
        </div>
      )}

      {quizData.length > 0 && (
        <div className="space-y-10">
          {quizData.map((q, index) => (
            <div key={index} className="bg-white p-8 rounded-3xl border shadow-sm">
              <p className="font-semibold text-lg mb-6 leading-relaxed">
                Q{index + 1}. {q.question}
              </p>
              <div className="space-y-4">
                {q.options.map((option, optIdx) => (
                  <label
                    key={optIdx}
                    className={`block p-5 rounded-2xl border cursor-pointer transition-all ${
                      selectedAnswers[index] === optIdx
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q${index}`}
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
                    <CheckCircle size={20} /> Correct Answer: {q.options[q.correct_index]}
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{q.explanation}</p>
                </div>
              )}
            </div>
          ))}

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
                <div className="px-10 py-5 bg-white rounded-3xl shadow text-2xl font-bold">
                  Score: <span className="text-emerald-600">{score}</span> / {quizData.length}
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
    </div>
  );
}