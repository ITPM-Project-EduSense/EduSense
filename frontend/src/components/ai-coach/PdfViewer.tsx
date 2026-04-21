"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Loader2,
  AlertCircle,
  Search,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { UploadedPdf } from "./types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
const PDF_VIEWER_STATE_KEY = "edu_ai_pdf_viewer_state_v1";

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

interface PersistedPdfViewerState {
  selectedDocId: string;
  error: string;
  content: PdfMaterialResponse["material"] | null;
}

interface Props {
  uploadedPdfs: UploadedPdf[];
}

export default function PdfViewer({ uploadedPdfs }: Props) {
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [content, setContent] = useState<
    PdfMaterialResponse["material"] | null
  >(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const defaultViewerRef = useRef<HTMLDivElement | null>(null);
  const expandedViewerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PDF_VIEWER_STATE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedPdfViewerState;
      setSelectedDocId(parsed.selectedDocId || "");
      setError(parsed.error || "");
      setContent(parsed.content || null);
    } catch {
      // Ignore invalid persisted viewer state.
    }
  }, []);

  // Persist viewer state only after a document is selected.
  useEffect(() => {
    if (!selectedDocId) return; // avoid overwriting with empty payload on initial mount
    const payload: PersistedPdfViewerState = {
      selectedDocId,
      error,
      content,
    };
    localStorage.setItem(PDF_VIEWER_STATE_KEY, JSON.stringify(payload));
  }, [selectedDocId, error, content]);

  useEffect(() => {
    if (!selectedDocId) return;
    if (uploadedPdfs.length === 0) return;
    const exists = uploadedPdfs.some((pdf) => pdf.id === selectedDocId);
    if (!exists) {
      setSelectedDocId("");
      setError("");
      setContent(null);
    }
  }, [selectedDocId, uploadedPdfs]);

  useEffect(() => {
    if (!content) {
      setShowSearch(false);
      setSearchQuery("");
      setActiveMatchIndex(0);
      setIsExpanded(false);
    }
  }, [content]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setShowSearch(true);
        requestAnimationFrame(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        });
      }

      if (event.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isExpanded]);

  const matchCount = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query || !content?.extracted_text) return 0;

    const lowerText = content.extracted_text.toLowerCase();
    let count = 0;
    let fromIndex = 0;

    while (fromIndex < lowerText.length) {
      const foundAt = lowerText.indexOf(query, fromIndex);
      if (foundAt === -1) break;
      count += 1;
      fromIndex = foundAt + query.length;
    }

    return count;
  }, [searchQuery, content?.extracted_text]);

  useEffect(() => {
    setActiveMatchIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (activeMatchIndex >= matchCount) {
      setActiveMatchIndex(0);
    }
  }, [activeMatchIndex, matchCount]);

  useEffect(() => {
    if (matchCount === 0) return;
    const viewer = isExpanded
      ? expandedViewerRef.current
      : defaultViewerRef.current;
    if (!viewer) return;
    const activeMatch = viewer.querySelector(
      'mark[data-active-match="true"]',
    ) as HTMLElement | null;
    if (activeMatch) {
      activeMatch.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeMatchIndex, isExpanded, matchCount]);

  const goToNextMatch = () => {
    if (matchCount === 0) return;
    setActiveMatchIndex((prev) => (prev + 1) % matchCount);
  };

  const highlightText = (
    text: string,
    matchCursorRef: { value: number },
  ): React.ReactNode => {
    const query = searchQuery.trim();
    if (!query || !text) return <>{text}</>;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const nodes: React.ReactNode[] = [];
    let cursor = 0;

    while (cursor < text.length) {
      const foundAt = lowerText.indexOf(lowerQuery, cursor);
      if (foundAt === -1) {
        nodes.push(<span key={`t-${cursor}`}>{text.slice(cursor)}</span>);
        break;
      }
      if (foundAt > cursor) {
        nodes.push(<span key={`t-${cursor}`}>{text.slice(cursor, foundAt)}</span>);
      }
      const currentMatch = matchCursorRef.value;
      const isActive = currentMatch === activeMatchIndex;
      matchCursorRef.value += 1;
      nodes.push(
        <mark
          key={`m-${currentMatch}`}
          data-active-match={isActive ? "true" : "false"}
          className={
            isActive
              ? "bg-amber-300 text-black rounded px-0.5"
              : "bg-yellow-200 text-black rounded px-0.5"
          }
        >
          {text.slice(foundAt, foundAt + query.length)}
        </mark>,
      );
      cursor = foundAt + query.length;
    }
    return <>{nodes}</>;
  };

  const highlightChildren = (
    children: React.ReactNode,
    matchCursorRef: { value: number },
  ): React.ReactNode => {
    return React.Children.map(children, (child) => {
      if (typeof child === "string") {
        return highlightText(child, matchCursorRef);
      }
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<any>, {
          children: highlightChildren(
            (child.props as any).children,
            matchCursorRef,
          ),
        });
      }
      return child;
    });
  };

  const getMarkdownComponents = (matchCursorRef: { value: number }) => ({
    h1: (props: any) => (
      <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-800">
        {highlightChildren(props.children, matchCursorRef)}
      </h1>
    ),
    h2: (props: any) => (
      <h2 className="text-xl font-semibold mt-5 mb-3 text-indigo-700">
        {highlightChildren(props.children, matchCursorRef)}
      </h2>
    ),
    h3: (props: any) => (
      <h3 className="text-lg font-medium mt-4 mb-2 text-gray-700">
        {highlightChildren(props.children, matchCursorRef)}
      </h3>
    ),
    strong: (props: any) => (
      <strong className="font-semibold text-indigo-700">
        {highlightChildren(props.children, matchCursorRef)}
      </strong>
    ),
    p: (props: any) => (
      <p className="my-3 leading-relaxed text-gray-700">
        {highlightChildren(props.children, matchCursorRef)}
      </p>
    ),
    ul: (props: any) => (
      <ul className="list-disc pl-6 my-4 space-y-2">
        {highlightChildren(props.children, matchCursorRef)}
      </ul>
    ),
    ol: (props: any) => (
      <ol className="list-decimal pl-6 my-4 space-y-2">
        {highlightChildren(props.children, matchCursorRef)}
      </ol>
    ),
    li: (props: any) => (
      <li className="text-gray-700 leading-relaxed">
        {highlightChildren(props.children, matchCursorRef)}
      </li>
    ),
    blockquote: (props: any) => (
      <blockquote className="border-l-4 border-indigo-300 pl-4 italic my-4 text-gray-600">
        {highlightChildren(props.children, matchCursorRef)}
      </blockquote>
    ),
    code: ({ inline, ...props }: any) =>
      inline ? (
        <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-sm" {...props}>
          {highlightChildren(props.children, matchCursorRef)}
        </code>
      ) : (
        <code className="block bg-gray-900 text-gray-100 p-4 rounded-2xl my-4 overflow-x-auto font-mono text-sm" {...props}>
          {highlightChildren(props.children, matchCursorRef)}
        </code>
      ),
  });

  const renderStructuredContent = () => {
    const text = content?.extracted_text || "";
    if (!text.trim()) {
      return <p className="text-sm text-gray-500">(No extracted text)</p>;
    }

    const matchCursorRef = { value: 0 };
    return (
      <div className="prose prose-indigo prose-base max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={getMarkdownComponents(matchCursorRef)}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
  };

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
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to load PDF content.";
      setError(message);
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
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="font-semibold mb-2">{content.filename}</div>
              <div className="text-sm text-gray-500">{content.subject}</div>
            </div>

            <div className="flex items-center gap-2 self-start">
              <button
                type="button"
                onClick={() => {
                  setShowSearch((prev) => !prev);
                  requestAnimationFrame(() => {
                    searchInputRef.current?.focus();
                    searchInputRef.current?.select();
                  });
                }}
                className="inline-flex items-center justify-center p-2 rounded-xl border border-gray-200 hover:bg-gray-50"
                title="Search in content (Ctrl+F)"
                aria-label="Search in content"
              >
                <Search size={18} />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="inline-flex items-center justify-center p-2 rounded-xl border border-gray-200 hover:bg-gray-50"
                title="Expand content"
                aria-label="Expand content"
              >
                <Maximize2 size={18} />
              </button>
            </div>
          </div>

          {showSearch && (
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="relative w-full sm:max-w-md">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      goToNextMatch();
                    }
                  }}
                  placeholder="Search text in this PDF..."
                  className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={goToNextMatch}
                disabled={matchCount === 0}
                className="px-4 py-2 rounded-xl border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Find Next
              </button>

              {searchQuery.trim() && (
                <div className="text-sm text-gray-600">
                  {matchCount > 0
                    ? `${activeMatchIndex + 1} of ${matchCount} matches`
                    : "No matches found"}
                </div>
              )}
            </div>
          )}

          <div
            ref={defaultViewerRef}
            className="mt-4 text-sm text-gray-800 bg-gray-50 rounded-2xl p-5 border max-h-130 overflow-auto"
          >
            {renderStructuredContent()}
          </div>

          {isExpanded && (
            <div className="fixed inset-0 z-50 bg-black/45 p-4 sm:p-8">
              <div className="h-full w-full bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {content.filename}
                    </div>
                    <div className="text-xs text-gray-500">Expanded view</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsExpanded(false)}
                      className="inline-flex items-center justify-center p-2 rounded-xl border border-gray-200 hover:bg-gray-50"
                      title="Exit expanded view"
                      aria-label="Exit expanded view"
                    >
                      <Minimize2 size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsExpanded(false)}
                      className="inline-flex items-center justify-center p-2 rounded-xl border border-gray-200 hover:bg-gray-50"
                      title="Close"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div
                  ref={expandedViewerRef}
                  className="flex-1 overflow-auto p-6 text-sm text-gray-800 bg-gray-50"
                >
                  {renderStructuredContent()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
