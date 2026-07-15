import React from "react";
import { Thread } from "../types";
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Compass, 
  Settings, 
  Github,
  Heart,
  Menu,
  X
} from "lucide-react";

interface SidebarProps {
  threads: Thread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
  onDeleteThread: (id: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
}

export default function Sidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  onClearAll
}: SidebarProps) {
  return (
    <aside className="w-64 bg-[#131414] border-r border-zinc-800 flex flex-col h-full text-zinc-400">
      {/* Brand & New Thread Button */}
      <div className="p-4 border-b border-zinc-800 flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
            <div className="w-4 h-4 bg-[#131414] rounded-sm rotate-45"></div>
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-white">
            perplexity
          </span>
        </div>

        <button
          onClick={onNewThread}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700/80 text-white rounded-lg transition-all duration-200 border border-zinc-700/50 hover:border-zinc-600 font-sans text-sm font-medium shadow-sm active:scale-95 group"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-zinc-100 group-hover:rotate-90 transition-transform duration-200" />
            New Thread
          </span>
          <span className="text-[10px] bg-zinc-950 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800/80 font-mono">
            Ctrl K
          </span>
        </button>
      </div>

      {/* Thread History List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <div className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider font-display flex items-center justify-between">
          <span>Recent Threads</span>
          {threads.length > 0 && (
            <button 
              onClick={onClearAll}
              className="text-[10px] text-zinc-500 hover:text-rose-400 transition-colors duration-150 normal-case font-normal"
            >
              Clear all
            </button>
          )}
        </div>

        {threads.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-zinc-600 font-sans">
            No past searches. Your search threads will appear here.
          </div>
        ) : (
          threads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            return (
              <div
                key={thread.id}
                onClick={() => onSelectThread(thread.id)}
                className={`group relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "bg-zinc-800 border border-zinc-700/60 text-white font-medium"
                    : "hover:bg-zinc-800/40 border border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-zinc-200' : 'text-zinc-600 group-hover:text-zinc-500'}`} />
                  <span className="truncate text-sm font-sans block text-left">
                    {thread.title}
                  </span>
                </div>
                <button
                  onClick={(e) => onDeleteThread(thread.id, e)}
                  className="opacity-0 group-hover:opacity-100 hover:bg-zinc-700/60 p-1 rounded text-zinc-500 hover:text-rose-400 transition-all duration-150"
                  title="Delete Thread"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-zinc-800 bg-[#0c0d0d] text-xs text-zinc-500 font-sans space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="flex items-center gap-1.5 hover:text-zinc-300 cursor-help">
            <Compass className="w-3.5 h-3.5 text-zinc-400" />
            Discover
          </span>
          <span className="font-mono text-[10px] text-zinc-600">v1.1.0</span>
        </div>
        
        <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-1 px-1">
          <div className="flex items-center justify-between text-[11px]">
            <span>Developer Support</span>
            <span className="text-zinc-400 font-medium">Active</span>
          </div>
          <p className="text-[10px] text-zinc-600 truncate">
            abdulkashim444@gmail.com
          </p>
        </div>
      </div>
    </aside>
  );
}
