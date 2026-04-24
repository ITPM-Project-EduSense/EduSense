"use client";
import React, { useState } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { UploadedPdf } from "./types";


interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newPdf: UploadedPdf) => void;
}

export default function PdfUploaderModal({ isOpen, onClose, onUploadSuccess }: Props) {
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic file type validation
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload only PDF, DOCX, or PPTX files.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("subject", `Study Material: ${file.name.replace(/\.[^/.]+$/, "")}`);

    try {
      const res = await fetch(`${API_BASE}/pdf/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();

        const newPdf = {
          id: data.id || data.material_id,
          filename: file.name,
          subject: data.subject || "General",
          uploadedAt: new Date().toISOString(),
        };

        onUploadSuccess(newPdf);
        onClose();
        alert(`${file.name} uploaded successfully!`);
      } 
      else if (res.status === 401) {
        alert("You are not logged in or your session has expired. Please log in again.");
      } 
      else {
        const errorText = await res.text().catch(() => "Unknown error");
        alert(`Upload failed: ${res.status} - ${errorText}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed: Could not connect to the server. Please check your internet and login status.");
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset file input
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Upload Study Material</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        <div className="p-10 text-center">
          <div className="mx-auto w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
            <Upload size={48} className="text-indigo-600" />
          </div>

          <h3 className="text-xl font-semibold mb-2">Drop your PDF here</h3>
          <p className="text-gray-500 mb-8">or click below to select file</p>

          <label className="cursor-pointer block">
            <div className="border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-2xl p-12 transition-all">
              <Upload size={40} className="mx-auto text-gray-400 mb-4" />
              <p className="font-medium text-gray-700">Click to select PDF, DOCX or PPTX</p>
              <p className="text-xs text-gray-400 mt-1">Maximum recommended size: 50MB</p>
            </div>
            <input
              type="file"
              accept=".pdf,.docx,.pptx"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>

          {uploading && (
            <div className="mt-6 flex items-center justify-center gap-3 text-indigo-600">
              <Loader2 className="animate-spin" size={24} />
              Saving file locally & updating database...
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 text-center text-sm text-gray-500">
          Files are stored locally and metadata saved in MongoDB
        </div>
      </div>
    </div>
  );
}
import { API_BASE } from "@/lib/api";
