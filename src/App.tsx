import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import LandingView from "./components/LandingView";
import ThreadView from "./components/ThreadView";
import { Thread, Message, SearchFocus } from "./types";
import { Menu, X, Sparkles, HelpCircle, AlertCircle } from "lucide-react";

export default function App() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);

  // Load threads from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("perplexity_clone_threads");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setThreads(parsed);
        if (parsed.length > 0) {
          setActiveThreadId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse saved threads", e);
      }
    }
  }, []);

  // Save threads to localStorage on changes
  const saveThreads = (updatedThreads: Thread[]) => {
    setThreads(updatedThreads);
    localStorage.setItem("perplexity_clone_threads", JSON.stringify(updatedThreads));
  };

  // Keyboard Shortcuts: Ctrl + K for new search, Escape to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        handleNewThread();
      }
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [threads]);

  const handleNewThread = () => {
    setActiveThreadId(null);
    setMobileMenuOpen(false);
  };

  const handleSelectThread = (id: string) => {
    setActiveThreadId(id);
    setMobileMenuOpen(false);
  };

  const handleDeleteThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = threads.filter((t) => t.id !== id);
    saveThreads(filtered);
    if (activeThreadId === id) {
      setActiveThreadId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete all search history?")) {
      saveThreads([]);
      setActiveThreadId(null);
    }
  };

  // Run search execution
  const executeSearch = async (
    query: string,
    focus: SearchFocus,
    proMode: boolean,
    file?: File | null
  ) => {
    if (!query.trim() && !file) return;

    setIsLoading(true);
    setActiveStep(0);
    setErrorNotification(null);

    // Progressive step loading animation interval
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < 4) return prev + 1;
        return prev;
      });
    }, 1500);

    // Setup active thread
    let currentThreadId = activeThreadId;
    let updatedThreads = [...threads];
    let activeThread = threads.find((t) => t.id === currentThreadId);

    const userMessageId = Math.random().toString(36).substring(7);
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: query || (file ? `Attached file: ${file.name}` : ""),
      sources: [],
      relatedQuestions: [],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      focus,
      proMode,
    };

    if (!activeThread) {
      // Create new thread
      const firstWords = query.trim().split(" ").slice(0, 5).join(" ");
      const newTitle = firstWords ? firstWords + (query.split(" ").length > 5 ? "..." : "") : "New File Search";
      
      currentThreadId = Math.random().toString(36).substring(7);
      activeThread = {
        id: currentThreadId,
        title: newTitle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [userMessage],
      };
      updatedThreads = [activeThread, ...updatedThreads];
      setActiveThreadId(currentThreadId);
    } else {
      // Append to existing thread
      activeThread.messages = [...activeThread.messages, userMessage];
      activeThread.updatedAt = new Date().toISOString();
      updatedThreads = updatedThreads.map((t) => (t.id === currentThreadId ? activeThread! : t));
    }

    saveThreads(updatedThreads);

    // Build history list for contextual AI conversations
    // Only send the last 8 messages to preserve tokens and focus
    const historyPayload = activeThread.messages
      .slice(0, -1) // Exclude current query which is sent in the main body
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))
      .slice(-8);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          focus: focus,
          proMode: proMode,
          history: historyPayload,
        }),
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch response.");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: data.answer,
        sources: data.sources || [],
        relatedQuestions: data.relatedQuestions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        focus,
        proMode,
      };

      // Append assistant response to thread
      const finalThreads = updatedThreads.map((t) => {
        if (t.id === currentThreadId) {
          return {
            ...t,
            messages: [...t.messages, assistantMessage],
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });

      saveThreads(finalThreads);
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error(err);
      
      // Append detailed explanation of failure as assistant message
      const errorMessageText = `❌ **Search Grounding Interrupted**
      
We encountered an error while synthesizing your search: 
\`${err.message || "Network Error"}\`

**To troubleshoot:**
1. Check that you have configured your **GEMINI_API_KEY** inside the **Secrets panel** in the Settings menu.
2. Ensure you have internet access and that the Google Search grounding servers are reachable.`;

      const assistantErrorMessage: Message = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: errorMessageText,
        sources: [],
        relatedQuestions: [
          "Try again",
          "What is Google Search Grounding?",
          "How do I setup my Gemini API Key?"
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        focus,
        proMode,
      };

      const finalThreads = updatedThreads.map((t) => {
        if (t.id === currentThreadId) {
          return {
            ...t,
            messages: [...t.messages, assistantErrorMessage],
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });

      saveThreads(finalThreads);
      setErrorNotification("We had trouble connecting to the live search api. Check details below.");
    } finally {
      setIsLoading(false);
    }
  };

  const activeThread = threads.find((t) => t.id === activeThreadId);

  return (
    <div className="flex h-screen bg-[#191a1a] overflow-hidden text-zinc-300">
      
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:block h-full shrink-0">
        <Sidebar
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={handleSelectThread}
          onNewThread={handleNewThread}
          onDeleteThread={handleDeleteThread}
          onClearAll={handleClearAll}
        />
      </div>

      {/* Mobile Hamburger Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#131414] border-b border-zinc-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-zinc-100 flex items-center justify-center shrink-0">
            <div className="w-3 h-3 bg-[#131414] rounded-sm rotate-45"></div>
          </div>
          <span className="font-sans font-bold text-base text-white tracking-tight">perplexity</span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Slideout Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-45 flex animate-fade-in">
          {/* Backshade */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm"
          />
          
          {/* Sidebar Drawer Container */}
          <div className="relative z-50 h-full w-64 bg-[#131414] shadow-2xl">
            <Sidebar
              threads={threads}
              activeThreadId={activeThreadId}
              onSelectThread={handleSelectThread}
              onNewThread={handleNewThread}
              onDeleteThread={handleDeleteThread}
              onClearAll={handleClearAll}
            />
          </div>
        </div>
      )}

      {/* Main Viewport Panel */}
      <main className="flex-1 h-full overflow-hidden relative pt-14 md:pt-0">
        {/* Error Notification Toast */}
        {errorNotification && (
          <div className="absolute top-4 left-4 right-4 md:left-8 md:right-8 bg-rose-500/10 border border-rose-500/25 px-4 py-3 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-300 z-50 shadow-lg backdrop-blur-md animate-slide-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorNotification}</span>
            </div>
            <button
              onClick={() => setErrorNotification(null)}
              className="text-[10px] uppercase font-bold text-rose-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content routing */}
        {!activeThread || activeThread.messages.length === 0 ? (
          <div className="h-full overflow-y-auto">
            <LandingView onSearch={executeSearch} isLoading={isLoading} />
          </div>
        ) : (
          <div className="h-full">
            <ThreadView
              messages={activeThread.messages}
              isLoading={isLoading}
              activeStep={activeStep}
              onFollowUpSearch={(q) => executeSearch(q, activeThread.messages[activeThread.messages.length - 1].focus, activeThread.messages[activeThread.messages.length - 1].proMode)}
            />
          </div>
        )}
      </main>

    </div>
  );
}
