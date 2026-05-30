import React from "react";
import type { Metadata } from "next";
import { ObservableChat } from "../components/ObservableChat";
import { DebugPanel } from "../components/DebugPanel";
import { Eye, ShieldAlert, Cpu } from "lucide-react";

export const metadata: Metadata = {
  title: "CopilotKit Observability Hub",
  description: "Real-time AI agent telemetry, response diagnostics, and interaction observability.",
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 font-sans text-slate-100">
      {/* Background gradients for premium visual wow factor */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Glassmorphic Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-6 h-6 text-emerald-400" />
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              COPILOTKIT OBSERVABILITY
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Telemetry Hub Active</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full font-medium border border-slate-700/50">
              <Cpu className="w-3.5 h-3.5" />
              <span>V2 Protocol Ready</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col gap-8 relative">
        {/* Title Deck */}
        <div className="flex flex-col gap-2 max-w-2xl">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent sm:text-5xl">
            AI Agent Observability Hub
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed sm:text-base">
            Monitor interaction latencies, query regenerations, and granular feedback loops in real-time. 
            Powered by the modern CopilotKit V2 core interface and typed telemetry engines.
          </p>
        </div>

        {/* Dashboard Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch min-h-[600px]">
          {/* Chat Pane */}
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Interactive Interface</span>
            </div>
            <div className="flex-1 h-full min-h-[500px]">
              <ObservableChat />
            </div>
          </div>

          {/* Telemetry Pane */}
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
              <span>Real-Time Telemetry HUD</span>
            </div>
            <div className="flex-1 h-full min-h-[500px]">
              <DebugPanel />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 py-6 px-6 bg-slate-950/80 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} CopilotKit Observability Demo App. Designed for premium production-grade validation.</p>
      </footer>
    </div>
  );
}
