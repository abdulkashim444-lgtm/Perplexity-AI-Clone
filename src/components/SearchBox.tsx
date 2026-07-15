import React, { useState, useRef } from "react";
import { SearchFocus } from "../types";
import {
  Globe,
  BookOpen,
  PenTool,
  Youtube,
  MessageSquare,
  ArrowRight,
  Zap,
  Paperclip,
  X,
  Sparkles,
  Info
} from "lucide-react";

interface SearchBoxProps {
  onSearch: (query: string, focus: SearchFocus, proMode: boolean, file?: File | null) => void;
  isLoading: boolean;
  initialQuery?: string;
}

export default function SearchBox({ onSearch, isLoading, initialQuery = "" }: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);
  const [focus, setFocus] = useState<SearchFocus>("all");
  const [proMode, setProMode] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !file) return;
    onSearch(query, focus, proMode, file);
    setQuery("");
    setFile(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const focusOptions: { id: SearchFocus; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: "all", label: "All", icon: <Globe className="w-4 h-4" />, desc: "Search entire web" },
    { id: "academic", label: "Academic", icon: <BookOpen className="w-4 h-4" />, desc: "Peer-reviewed literature" },
    { id: "writing", label: "Writing", icon: <PenTool className="w-4 h-4" />, desc: "AI writing, no web search" },
    { id: "youtube", label: "YouTube", icon: <Youtube className="w-4 h-4" />, desc: "Find video references" },
    { id: "reddit", label: "Reddit", icon: <MessageSquare className="w-4 h-4" />, desc: "Community opinion & discussions" },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Search Container with Drag & Drop */}
      <form
        onSubmit={handleSubmit}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative bg-[#202222] rounded-2xl border transition-all duration-300 shadow-2xl ${
          dragActive
            ? "border-zinc-500 bg-zinc-800/20 ring-2 ring-zinc-500/20"
            : "border-zinc-700 focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-500/10"
        }`}
      >
        <div className="p-4 flex flex-col gap-2">
          {/* File input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf,.txt,.doc,.docx"
          />

          {/* Attachment Preview capsule */}
          {file && (
            <div className="flex items-center gap-2 bg-zinc-800/80 border border-zinc-700 rounded-lg px-3 py-1.5 self-start text-xs text-zinc-300">
              <Paperclip className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate max-w-[200px] font-mono">{file.name}</span>
              <span className="text-[10px] text-zinc-500">({(file.size / 1024).toFixed(1)} KB)</span>
              <button
                type="button"
                onClick={removeFile}
                className="hover:bg-zinc-700 p-0.5 rounded transition-colors text-zinc-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Input field */}
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              focus === "writing"
                ? "Ask anything... (AI creative mode enabled)"
                : `Ask anything... (${focusOptions.find((f) => f.id === focus)?.desc})`
            }
            rows={2}
            className="w-full bg-transparent text-white placeholder-zinc-500 focus:outline-none resize-none font-sans text-[16px] leading-relaxed"
            disabled={isLoading}
          />
        </div>

        {/* Lower Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-zinc-800 bg-[#191a1a] rounded-b-2xl">
          {/* File Upload Trigger */}
          <button
            type="button"
            onClick={triggerFileSelect}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 transition-all duration-200"
            title="Attach file (PDF, TXT, images)"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span className="font-medium">Attach</span>
          </button>

          {/* Pro Mode & Submit */}
          <div className="flex items-center gap-4">
            {/* Pro Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setProMode(!proMode)}
                className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-all duration-300 font-medium ${
                  proMode
                    ? "bg-zinc-100 text-zinc-950 border-white shadow-sm"
                    : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300"
                }`}
                title="Pro Mode uses multi-step reasoning for deep search."
              >
                <Zap className={`w-3.5 h-3.5 ${proMode ? "text-zinc-950 fill-zinc-950" : "text-zinc-500"}`} />
                <span>Pro Mode</span>
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || (!query.trim() && !file)}
              className={`p-2.5 rounded-full transition-all duration-200 ${
                (query.trim() || file) && !isLoading
                  ? "bg-zinc-100 hover:bg-white text-zinc-950 hover:scale-105 active:scale-95 shadow-lg"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}
            >
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      </form>

      {/* Focus Pill Bar */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {focusOptions.map((opt) => {
          const isSelected = focus === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFocus(opt.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-sans font-medium border transition-all duration-200 ${
                isSelected
                  ? "bg-zinc-800 text-white border-zinc-600 shadow-sm"
                  : "bg-zinc-800/30 text-zinc-400 border-zinc-800 hover:bg-zinc-800/50 hover:text-white"
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Drag overlay text hint */}
      {dragActive && (
        <div className="absolute inset-0 bg-zinc-950/80 border border-zinc-500 border-dashed rounded-2xl flex items-center justify-center gap-2 text-sm text-zinc-300 pointer-events-none">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>Drop your file anywhere to attach!</span>
        </div>
      )}
    </div>
  );
}
