"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { logger } from "../lib/logger";
import { AgentInteraction, TelemetryStats } from "../lib/types";
import { 
  Terminal, 
  Activity, 
  Sparkles, 
  AlertCircle, 
  Copy, 
  Check, 
  BarChart2, 
  Trash2,
  Cpu,
  Network,
  RefreshCw,
  Clock
} from "lucide-react";

export const DebugPanel: React.FC = () => {
  const [logs, setLogs] = useState<AgentInteraction[]>([]);
  const [stats, setStats] = useState<TelemetryStats>({
    sessionActive: false,
    sessionDurationMs: 0,
    messageCount: 0,
    averageLatencyMs: 0,
    positiveFeedbackCount: 0,
    negativeFeedbackCount: 0,
    regeneratedCount: 0,
    totalInteractions: 0,
    
    // Advanced Metrics
    totalTokensUsed: 0,
    timeToFirstTokenMs: 0,
    retryCount: 0,
    mcpRequestsCount: 0
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const updateState = () => {
      const currentLogs: AgentInteraction[] = logger.getLogs();
      setLogs([...currentLogs]);

      // Calculate statistics dynamically
      const messages = currentLogs.filter((l: AgentInteraction) => l.type === "MESSAGE_SENT");
      const regenerations = currentLogs.filter((l: AgentInteraction) => l.type === "MESSAGE_REGENERATED");
      const feedbacks = currentLogs.filter((l: AgentInteraction) => l.type === "FEEDBACK_GIVEN");
      
      const positive = feedbacks.filter((f: AgentInteraction) => {
        const val = f.details?.feedback;
        return val?.type === "positive" || val?.rating === 1 || val?.rating === "positive";
      }).length;

      const negative = feedbacks.filter((f: AgentInteraction) => {
        const val = f.details?.feedback;
        return val?.type === "negative" || val?.rating === -1 || val?.rating === "negative";
      }).length;

      const stops = currentLogs.filter((l: AgentInteraction) => l.type === "SESSION_STOP" && l.durationMs !== undefined);
      const avgLatency = stops.length > 0
        ? Math.round(stops.reduce((acc: number, curr: AgentInteraction) => acc + (curr.durationMs || 0), 0) / stops.length)
        : 0;

      // New Granular Observability Stats Calculations
      const tokenEvents = currentLogs.filter((l: AgentInteraction) => l.type === "TOKEN_METRICS_UPDATED");
      const totalTokens = tokenEvents.reduce((acc: number, curr: AgentInteraction) => {
        const det = curr.details || {};
        return acc + (det.totalTokens || (det.promptTokens || 0) + (det.completionTokens || 0));
      }, 0);

      const ttftEvents = tokenEvents.filter((l: AgentInteraction) => l.details?.timeToFirstTokenMs !== undefined);
      const avgTTFT = ttftEvents.length > 0
        ? Math.round(ttftEvents.reduce((acc: number, curr: AgentInteraction) => acc + (curr.details?.timeToFirstTokenMs || 0), 0) / ttftEvents.length)
        : 0;

      const errors = currentLogs.filter((l: AgentInteraction) => l.type === "AGENT_ERROR_OCCURRED");
      const mcpFetches = currentLogs.filter((l: AgentInteraction) => l.type === "MCP_DOCS_RETRIEVED");

      // Real, event-driven count: one per RUN_ERROR emitted by the agent stream.
      // (There is no retry channel in the mock agent, so nothing is fabricated.)
      const errorCount = errors.length;

      const latestIsStart = currentLogs[0]?.type === "SESSION_START";

      setStats({
        sessionActive: latestIsStart,
        sessionDurationMs: latestIsStart ? Date.now() - new Date(currentLogs[0].timestamp).getTime() : 0,
        messageCount: messages.length,
        averageLatencyMs: avgLatency,
        positiveFeedbackCount: positive,
        negativeFeedbackCount: negative,
        regeneratedCount: regenerations.length,
        totalInteractions: currentLogs.length,
        
        // Granular Telemetry Assigns
        totalTokensUsed: totalTokens,
        timeToFirstTokenMs: avgTTFT,
        retryCount: errorCount,
        mcpRequestsCount: mcpFetches.length
      });
    };

    updateState();
    const unsubscribe = logger.subscribe(updateState);

    // Periodically update to refresh active timer counters
    const timer = setInterval(() => {
      updateState();
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const handleCopyLogs = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy logs", e);
    }
  };

  const handleClearLogs = () => {
    logger.clear();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-100 tracking-tight text-lg flex items-center gap-1.5">
              Observability HUD
              <Sparkles className="w-4 h-4 text-emerald-400 animate-bounce" />
            </h2>
            <p className="text-xs text-slate-400">CopilotKit Real-Time Diagnostics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700/80 rounded-lg transition-colors border border-slate-700/50"
            title="Copy logs JSON"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </>
            )}
          </button>
          <button
            onClick={handleClearLogs}
            className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800/60 hover:bg-rose-500/10 border border-slate-700/50 rounded-lg transition-all"
            title="Clear interaction database"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Observability Diagnostics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 flex flex-col justify-between hover:border-emerald-500/20 transition-all">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Session Status</span>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2.5 h-2.5 rounded-full ${stats.sessionActive ? "bg-emerald-500 animate-ping" : "bg-slate-600"}`} />
            <span className="text-sm font-semibold text-slate-100">{stats.sessionActive ? "Streaming" : "Idle"}</span>
          </div>
        </div>

        <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 flex flex-col justify-between hover:border-blue-500/20 transition-all">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Latency</span>
          <span className="text-sm font-semibold text-slate-100 mt-1">
            {stats.averageLatencyMs > 0 ? `${stats.averageLatencyMs}ms` : "N/A"}
          </span>
        </div>

        <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 flex flex-col justify-between hover:border-purple-500/20 transition-all">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Cpu className="w-3 h-3 text-purple-400" />
            Tokens Count
            <span className="text-[8px] text-slate-500 font-semibold normal-case tracking-normal">(Estimated)</span>
          </span>
          <span className="text-sm font-bold text-purple-400 mt-1">{stats.totalTokensUsed} <span className="text-[9px] text-slate-500">t</span></span>
        </div>

        <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 flex flex-col justify-between hover:border-teal-500/20 transition-all">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Network className="w-3 h-3 text-teal-400" />
            MCP Doc Fetches
            <span className="text-[8px] text-slate-500 font-semibold normal-case tracking-normal">(Simulated)</span>
          </span>
          <span className="text-sm font-bold text-teal-400 mt-1">{stats.mcpRequestsCount} <span className="text-[9px] text-slate-500">runs</span></span>
        </div>

        <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 flex flex-col justify-between hover:border-amber-500/20 transition-all">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            Avg TTFT
          </span>
          <span className="text-sm font-semibold text-amber-400 mt-1">
            {stats.timeToFirstTokenMs > 0 ? `${stats.timeToFirstTokenMs}ms` : "N/A"}
          </span>
        </div>

        <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 flex flex-col justify-between hover:border-rose-500/20 transition-all">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-rose-400" />
            Run Errors
          </span>
          <span className={`text-sm font-bold mt-1 ${stats.retryCount > 0 ? "text-rose-400 animate-pulse" : "text-slate-400"}`}>
            {stats.retryCount}
          </span>
        </div>
      </div>

      {/* Events Log Stream */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-950/50 border border-slate-800/60 rounded-xl overflow-hidden p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Telemetry Interaction Log</span>
          </div>
          <Link
            href="/admin/logs"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            Open Commander &rarr;
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-8">
              <AlertCircle className="w-6 h-6 mb-2 text-slate-600" />
              <p className="text-xs">No active telemetry received.</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Interact with the Chat or Simulation controls.</p>
            </div>
          ) : (
            logs.map((log) => {
              let badgeColor = "bg-slate-800 text-slate-300";
              if (log.type === "SESSION_START") badgeColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
              if (log.type === "SESSION_STOP") badgeColor = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
              if (log.type === "MESSAGE_SENT") badgeColor = "bg-purple-500/10 text-purple-400 border border-purple-500/20";
              if (log.type === "FEEDBACK_GIVEN") badgeColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
              if (log.type === "MESSAGE_REGENERATED") badgeColor = "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
              if (log.type === "MCP_DOCS_RETRIEVED") badgeColor = "bg-teal-500/10 text-teal-400 border border-teal-500/20";
              if (log.type === "TOKEN_METRICS_UPDATED") badgeColor = "bg-violet-500/10 text-violet-400 border border-violet-500/20";
              if (log.type === "AGENT_ERROR_OCCURRED") badgeColor = "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse";

              return (
                <div key={log.id} className="text-xs border-b border-slate-900 pb-2 last:border-0 hover:bg-slate-850/20 transition-all rounded px-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase ${badgeColor}`}>
                      {log.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed font-sans">{log.description}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
