import React from "react";
import SearchBox from "./SearchBox";
import { SearchFocus } from "../types";
import { 
  Sparkles, 
  TrendingUp, 
  Lightbulb, 
  MessageSquare, 
  GraduationCap, 
  Search,
  PenTool,
  Youtube
} from "lucide-react";

interface LandingViewProps {
  onSearch: (query: string, focus: SearchFocus, proMode: boolean, file?: File | null) => void;
  isLoading: boolean;
}

export default function LandingView({ onSearch, isLoading }: LandingViewProps) {
  // Creative bento-grid discover recommendations
  const recommendations = [
    {
      title: "Explain Quantum Computing",
      description: "A scholarly breakdown of superposition, entanglement, and qubits.",
      icon: <GraduationCap className="w-5 h-5 text-zinc-300" />,
      focus: "academic" as SearchFocus,
      query: "Explain the fundamental principles of quantum computing, superposition, and entanglement in simple scholarly terms.",
      proMode: true,
    },
    {
      title: "reddit keyboard debates",
      description: "Summarize community consensus on linear vs tactile switches.",
      icon: <MessageSquare className="w-5 h-5 text-zinc-300" />,
      focus: "reddit" as SearchFocus,
      query: "Summarize Reddit discussions and community opinions on tactile vs linear mechanical keyboard switches.",
      proMode: false,
    },
    {
      title: "Mentorship Cold Outreach",
      description: "Draft a polished, creative, and professional connection email.",
      icon: <PenTool className="w-5 h-5 text-zinc-300" />,
      focus: "writing" as SearchFocus,
      query: "Help me write a polite, professional, and creative cold outreach email requesting a 15-minute virtual coffee chat for industry mentorship.",
      proMode: false,
    },
    {
      title: "Synthesize tech breakthroughs",
      description: "What are the most pivotal global technological shifts in 2026?",
      icon: <Sparkles className="w-5 h-5 text-zinc-300" />,
      focus: "all" as SearchFocus,
      query: "What are the most pivotal breakthroughs in AI and robotics so far in 2026? Summarize the main tech events.",
      proMode: true,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-4 max-w-4xl mx-auto w-full py-12 space-y-12">
      {/* Visual Title Header */}
      <div className="space-y-4 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-800/40 border border-zinc-700/60 rounded-full text-xs text-zinc-300 font-medium font-sans">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation AI Search & Synthesizer</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-sans font-semibold tracking-tight text-white leading-tight">
          Where knowledge begins
        </h1>
        
        <p className="text-zinc-400 text-sm md:text-base font-sans leading-relaxed">
          Ask a search question. Perplexity searches the live web, resolves citation sources, and synthesizes an authoritative answer in real-time.
        </p>
      </div>

      {/* Primary Search Box */}
      <div className="w-full">
        <SearchBox onSearch={onSearch} isLoading={isLoading} />
      </div>

      {/* Discovery Recommendations / Bento Grid */}
      <div className="w-full space-y-4 pt-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 font-display">
          <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
          <span>Curated Search Explorations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec, idx) => (
            <button
              key={idx}
              onClick={() => onSearch(rec.query, rec.focus, rec.proMode)}
              className="flex items-start gap-4 p-4 bg-zinc-800/30 border border-zinc-850 hover:bg-zinc-800/50 rounded-2xl transition-all duration-300 text-left group hover:shadow-lg"
            >
              <div className="p-2.5 bg-[#191a1a] rounded-xl border border-zinc-800 shrink-0 group-hover:border-zinc-700 transition-all">
                {rec.icon}
              </div>
              <div className="space-y-1 min-w-0">
                <span className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors flex items-center gap-1.5 font-sans">
                  {rec.title}
                  {rec.proMode && (
                    <span className="text-[9px] bg-zinc-800 border border-zinc-700 text-zinc-300 px-1 py-0.2 rounded uppercase font-mono font-bold tracking-wider">
                      PRO
                    </span>
                  )}
                </span>
                <p className="text-xs text-zinc-400 leading-normal line-clamp-2 font-sans">
                  {rec.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
