"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { logger } from "../../../lib/logger";
import { AgentInteraction, InteractionType } from "../../../lib/types";
import { ArrowLeft, Search, Database, Trash2, Code, ChevronRight, Eye, ShieldAlert, AlertCircle } from "lucide-react";

const CATEGORIES: (InteractionType | "ALL")[] = [
  "ALL",
  "SESSION_START",
  "SESSION_STOP",
  "MESSAGE_SENT",
  "MESSAGE_REGENERATED",
  "FEEDBACK_GIVEN",
  "CHAT_EXPANDED",
  "MCP_DOCS_RETRIEVED",
  "TOKEN_METRICS_UPDATED",
  "AGENT_ERROR_OCCURRED"
];

export default function LogsPage() {
  const [logs, setLogs] = useState<AgentInteraction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<InteractionType | "ALL">("ALL");
  const [selectedLog, setSelectedLog] = useState<AgentInteraction | null>(null);

  useEffect(() => {
    const updateLogs = () => {
      setLogs([...logger.getLogs()]);
    };
    updateLogs();
    const unsubscribe = logger.subscribe(updateLogs);
    return () => unsubscribe();
  }, []);

  const handleClearLogs = () => {
    logger.clear();
    setSelectedLog(null);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedType === "ALL" || log.type === selectedType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 font-sans text-slate-100">
      {/* Premium background accents */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors border border-slate-900 hover:border-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                INTERACTION LOGS COMMANDER
              </span>
            </div>
          </div>
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 rounded-lg transition-all"
            title="Clear all local log history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Database</span>
          </button>
        </div>
      </header>

      {/* Main Administrative Deck */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8 min-h-0">
        
        {/* Left Side: Filter and List View */}
        <div className="w-full lg:w-3/5 flex flex-col bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-xl min-h-[500px]">
          {/* Controls bar */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search events description or custom JSON payload details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800/85 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all font-sans"
              />
            </div>
            {/* Category quick selectors */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedType(cat)}
                  className={`px-2.5 py-1 text-[9px] font-bold tracking-wide rounded-md transition-all uppercase ${
                    selectedType === cat
                      ? "bg-emerald-500 text-slate-950 shadow-md font-extrabold"
                      : "bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/30"
                  }`}
                >
                  {cat.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* List display */}
          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[500px] pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {filteredLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-16">
                <AlertCircle className="w-8 h-8 mb-3 text-slate-700" />
                <p className="text-sm font-semibold">No interaction logs found</p>
                <p className="text-xs text-slate-600 mt-1">Try relaxing filters or generate messages in the chat interface.</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isActive = selectedLog?.id === log.id;
                let borderTheme = "border-slate-850 hover:border-slate-800 hover:bg-slate-850/10";
                let textTheme = "text-slate-400";
                
                if (isActive) {
                  borderTheme = "border-emerald-500/50 bg-emerald-500/5";
                }
                
                if (log.type === "SESSION_START") textTheme = "text-emerald-400";
                if (log.type === "SESSION_STOP") textTheme = "text-blue-400";
                if (log.type === "MESSAGE_SENT") textTheme = "text-purple-400";
                if (log.type === "FEEDBACK_GIVEN") textTheme = "text-amber-400";
                if (log.type === "MESSAGE_REGENERATED") textTheme = "text-cyan-400";
                if (log.type === "MCP_DOCS_RETRIEVED") textTheme = "text-teal-400";
                if (log.type === "TOKEN_METRICS_UPDATED") textTheme = "text-violet-400";
                if (log.type === "AGENT_ERROR_OCCURRED") textTheme = "text-rose-400 animate-pulse";

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${borderTheme}`}
                  >
                    <div className="flex flex-col gap-1.5 max-w-[85%]">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold tracking-wider uppercase ${textTheme}`}>
                          {log.type.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">{log.description}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-600"}`} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Detailed Collapsible Code Inspector Deck */}
        <div className="w-full lg:w-2/5 flex flex-col bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-xl min-h-[500px]">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-4">
            <Code className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-200">Event Inspector JSON</h3>
          </div>

          {selectedLog ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="mb-4 space-y-2">
                <div className="flex justify-between items-center bg-slate-950/40 border border-slate-800/50 p-2.5 rounded-lg">
                  <span className="text-[11px] text-slate-400">Interaction ID</span>
                  <span className="text-[11px] text-slate-100 font-mono font-bold">{selectedLog.id}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950/40 border border-slate-800/50 p-2.5 rounded-lg">
                  <span className="text-[11px] text-slate-400">Log Actor</span>
                  <span className="text-[11px] text-slate-100 font-bold">{selectedLog.actor}</span>
                </div>
                {selectedLog.durationMs !== undefined && (
                  <div className="flex justify-between items-center bg-slate-950/40 border border-slate-800/50 p-2.5 rounded-lg">
                    <span className="text-[11px] text-slate-400">Latency Duration</span>
                    <span className="text-[11px] text-emerald-400 font-bold font-mono">{selectedLog.durationMs}ms</span>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col min-h-0 bg-slate-950/80 border border-slate-800/85 rounded-xl overflow-hidden p-4">
                <span className="text-[10px] text-slate-500 font-mono block mb-2">{"// Raw Details Object"}</span>
                <pre className="flex-1 overflow-auto text-[11px] text-emerald-400 font-mono leading-relaxed scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {JSON.stringify(selectedLog.details || { info: "No additional details logged." }, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-16">
              <Eye className="w-8 h-8 mb-2 text-slate-700 animate-pulse" />
              <p className="text-xs">No event selected</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Click any log event card on the left to inspect its custom detail structures.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
