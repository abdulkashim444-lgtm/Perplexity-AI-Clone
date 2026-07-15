import React, { useEffect, useRef, useState } from "react";
import { Message, Source, SearchFocus } from "../types";
import ReactMarkdown from "react-markdown";
import {
  Globe,
  Compass,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  RefreshCw,
  Clock,
  User,
  BrainCircuit,
  Zap,
  CheckCircle2,
  ListTodo
} from "lucide-react";

interface ThreadViewProps {
  messages: Message[];
  isLoading: boolean;
  activeStep: number;
  onFollowUpSearch: (query: string) => void;
}

export default function ThreadView({
  messages,
  isLoading,
  activeStep,
  onFollowUpSearch,
}: ThreadViewProps) {
  const [followUp, setFollowUp] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, activeStep]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUp.trim() || isLoading) return;
    onFollowUpSearch(followUp);
    setFollowUp("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // List of professional search progress states
  const loadingSteps = [
    { title: "Planning research strategy...", icon: <BrainCircuit className="w-4 h-4 text-zinc-400" /> },
    { title: "Analyzing and searching live web...", icon: <Globe className="w-4 h-4 text-zinc-400" /> },
    { title: "Retrieving web source documentation...", icon: <Sparkles className="w-4 h-4 text-zinc-400" /> },
    { title: "Evaluating and resolving citations...", icon: <CheckCircle2 className="w-4 h-4 text-zinc-400" /> },
    { title: "Structuring comprehensive answer...", icon: <ListTodo className="w-4 h-4 text-zinc-400" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-[#191a1a] text-zinc-300">
      {/* Scrollable Conversation Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-10 max-w-4xl mx-auto w-full pb-32">
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";

          // Process citations in assistant content to render as markdown links
          let processedContent = msg.content;
          if (!isUser && msg.sources && msg.sources.length > 0) {
            // Replaces [1] with [[1]](url)
            processedContent = msg.content.replace(/\[([0-9]+)\]/g, (match, numStr) => {
              const idx = parseInt(numStr, 10) - 1;
              const source = msg.sources[idx];
              if (source) {
                return `[${numStr}](${source.url})`;
              }
              return match;
            });
          }

          return (
            <div
              key={msg.id || index}
              className={`flex gap-4 ${
                isUser ? "justify-end" : "justify-start"
              } animate-fade-in`}
            >
              {/* Message block */}
              <div
                className={`flex gap-3 md:gap-4 max-w-full ${
                  isUser ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* User/Model avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    isUser
                      ? "bg-zinc-800 border-zinc-700 text-zinc-300"
                      : "bg-[#202222] border-zinc-800 text-zinc-400"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-zinc-400" />}
                </div>

                {/* Message body */}
                <div className="space-y-4 min-w-0 max-w-2xl">
                  {/* Query Header for User */}
                  {isUser ? (
                    <div className="bg-[#202222] border border-zinc-800 px-4 py-3 rounded-2xl text-[15px] font-sans text-white">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Search Header Metadata */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 font-display">
                            <Globe className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Sources Grounded</span>
                          </div>

                          {/* Sources list horizontally scrollable */}
                          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                            {msg.sources.map((src, sIdx) => {
                              let domain = "";
                              try {
                                domain = new URL(src.url).hostname.replace("www.", "");
                              } catch {
                                domain = "web";
                              }

                              return (
                                <a
                                  key={sIdx}
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex flex-col gap-1.5 p-3 bg-[#202222] hover:bg-zinc-850/80 border border-zinc-800 rounded-xl min-w-[140px] max-w-[180px] shrink-0 transition-all duration-200 hover:scale-[1.02] group hover:border-zinc-700"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <img
                                      src={src.favicon}
                                      alt=""
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = "none";
                                      }}
                                      className="w-4.5 h-4.5 rounded-sm bg-zinc-800"
                                    />
                                    <span className="text-[10px] text-zinc-500 font-mono font-medium truncate">
                                      {domain}
                                    </span>
                                  </div>
                                  <span className="text-xs text-zinc-200 font-sans font-semibold line-clamp-2 leading-tight group-hover:text-white">
                                    {src.title}
                                  </span>
                                  <span className="text-[9px] text-zinc-600 font-mono mt-auto flex items-center gap-0.5">
                                    Source [{sIdx + 1}]
                                    <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Main Answer Area */}
                      <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed font-sans font-normal">
                        <ReactMarkdown
                          components={{
                            a: ({ node, ...props }) => (
                              <a
                                className="inline-flex items-center gap-0.5 text-zinc-100 hover:text-white font-semibold text-xs bg-zinc-800 hover:bg-zinc-700 px-1.5 py-0.5 rounded-md ml-0.5 font-mono cursor-pointer transition-colors border border-zinc-700"
                                target="_blank"
                                rel="noopener noreferrer"
                                {...props}
                              />
                            ),
                            h1: ({ node, ...props }) => (
                              <h1 className="text-xl font-bold mt-6 mb-3 text-white font-display border-b border-zinc-800 pb-1.5" {...props} />
                            ),
                            h2: ({ node, ...props }) => (
                              <h2 className="text-lg font-bold mt-5 mb-2.5 text-white font-display" {...props} />
                            ),
                            h3: ({ node, ...props }) => (
                              <h3 className="text-md font-semibold mt-4 mb-2 text-white font-display" {...props} />
                            ),
                            p: ({ node, ...props }) => (
                              <p className="text-[14.5px] leading-relaxed text-zinc-300 mb-3.5" {...props} />
                            ),
                            li: ({ node, ...props }) => (
                              <li className="text-[14.5px] text-zinc-300 list-disc ml-6 mb-1.5" {...props} />
                            ),
                            ul: ({ node, ...props }) => (
                              <ul className="mb-4" {...props} />
                            ),
                            ol: ({ node, ...props }) => (
                              <ol className="mb-4 list-decimal ml-6" {...props} />
                            ),
                            code: ({ node, ...props }) => (
                              <code className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded font-mono text-sm border border-zinc-700" {...props} />
                            ),
                            pre: ({ node, ...props }) => (
                              <pre className="bg-[#202222] border border-zinc-800 p-4 rounded-xl font-mono text-sm overflow-x-auto text-zinc-200 my-4" {...props} />
                            ),
                          }}
                        >
                          {processedContent}
                        </ReactMarkdown>
                      </div>

                      {/* Related follow-ups */}
                      {msg.relatedQuestions && msg.relatedQuestions.length > 0 && (
                        <div className="pt-4 border-t border-zinc-800 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 font-display">
                            <Compass className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Related Inquiries</span>
                          </div>
                          <div className="flex flex-col gap-2">
                            {msg.relatedQuestions.map((q, qIdx) => (
                              <button
                                key={qIdx}
                                onClick={() => onFollowUpSearch(q)}
                                className="flex items-center justify-between text-left text-[13px] text-zinc-300 hover:text-white bg-[#202222]/50 hover:bg-[#202222] border border-zinc-800 hover:border-zinc-600 px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group"
                              >
                                <span>{q}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading / Searching Active state */}
        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-full bg-[#202222] border border-zinc-800 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-zinc-400 animate-pulse" />
            </div>

            <div className="space-y-4 min-w-0 max-w-2xl flex-1">
              {/* Sequential searching progress steps */}
              <div className="bg-[#202222]/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-display flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
                  <span>Synthesizing Real-time Search</span>
                </div>

                <div className="space-y-2">
                  {loadingSteps.map((step, sIdx) => {
                    const isDone = sIdx < activeStep;
                    const isActive = sIdx === activeStep;

                    return (
                      <div
                        key={sIdx}
                        className={`flex items-center gap-3.5 text-xs transition-all duration-300 ${
                          isDone
                            ? "text-zinc-500 font-medium"
                            : isActive
                            ? "text-white font-semibold"
                            : "text-zinc-600"
                        }`}
                      >
                        <div className="shrink-0">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                          ) : (
                            step.icon
                          )}
                        </div>
                        <span className="truncate">{step.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Skeleton loading text */}
              <div className="space-y-2.5 animate-pulse-slow">
                <div className="h-3.5 bg-zinc-800 rounded-md w-full" />
                <div className="h-3.5 bg-zinc-800 rounded-md w-[92%]" />
                <div className="h-3.5 bg-zinc-800 rounded-md w-[85%]" />
              </div>
            </div>
          </div>
        )}

        {/* Anchor scroll point */}
        <div ref={scrollRef} />
      </div>

      {/* Sticky Bottom Follow-up Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-gradient-to-t from-[#191a1a] via-[#191a1a]/95 to-transparent pt-10 pb-6 px-4">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 bg-[#202222] border border-zinc-800 focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-500/10 px-4 py-2.5 rounded-xl shadow-2xl"
          >
            <textarea
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a follow-up query..."
              rows={1}
              className="flex-1 bg-transparent text-zinc-200 placeholder-zinc-500 focus:outline-none resize-none font-sans text-sm py-1 max-h-12 overflow-y-auto"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={isLoading || !followUp.trim()}
              className={`p-2 rounded-lg transition-all ${
                followUp.trim() && !isLoading
                  ? "bg-zinc-100 hover:bg-white text-zinc-950 active:scale-95"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}
            >
              <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </form>
          <div className="text-[10px] text-center text-zinc-600 font-sans mt-2">
            Perplexity Clone maintains thread context for seamless follow-up research questions.
          </div>
        </div>
      </div>
    </div>
  );
}
