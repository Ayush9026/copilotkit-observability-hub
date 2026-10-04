"use client";

import React, { useRef, useEffect, useState } from "react";
import { CopilotChat, useAgent } from "@copilotkit/react-core/v2";
import { logger } from "../lib/logger";
import {
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Maximize2,
  Minimize2,
  Sparkles,
  Trash2,
  HelpCircle,
} from "lucide-react";

// Rough token estimator (~4 chars/token). Used only as a client-side fallback
// when the runtime doesn't report usage; the value is labelled "estimated".
const estimateTokens = (text: string) => Math.max(0, Math.ceil(text.length / 4));

export const ObservableChat: React.FC = () => {
  const { agent } = useAgent({ agentId: "research-agent" });

  const isExpandedRef = useRef(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Subscribe to the agent's real AG-UI event stream and log genuine telemetry.
  // Every metric below is measured from the actual run, not fabricated:
  //   - session start/stop + latency from run lifecycle events
  //   - time-to-first-token from the first TEXT_MESSAGE_CONTENT event
  //   - MCP retrieval from real STEP_STARTED events
  //   - token usage from RUN_FINISHED.result (with a client-side estimate fallback)
  //   - errors from RUN_ERROR events
  useEffect(() => {
    if (!agent) return;

    // Per-run measurement state, reset on each run start.
    let runStartedAt = 0;
    let firstTokenAt = 0;
    let completionBuffer = "";

    const { unsubscribe } = agent.subscribe({
      onRunStartedEvent: () => {
        runStartedAt = Date.now();
        firstTokenAt = 0;
        completionBuffer = "";
        logger.log({
          type: "SESSION_START",
          actor: "SYSTEM",
          description: "Agent run started.",
        });
      },

      onStepStartedEvent: ({ event }) => {
        const stepName = (event as any)?.stepName ?? "";
        // The runtime emits a dedicated MCP retrieval step in the stream.
        if (/mcp/i.test(stepName)) {
          logger.log({
            type: "MCP_DOCS_RETRIEVED",
            actor: "SYSTEM",
            description: `MCP step: ${stepName}`,
            details: { stepName },
          });
        }
      },

      onTextMessageContentEvent: ({ textMessageBuffer }: any) => {
        // First content chunk → measured time-to-first-token.
        if (!firstTokenAt && runStartedAt) {
          firstTokenAt = Date.now();
        }
        // Keep the full assistant text for the token-estimate fallback.
        if (typeof textMessageBuffer === "string") {
          completionBuffer = textMessageBuffer;
        }
      },

      onRunFinishedEvent: ({ event, messages }) => {
        const now = Date.now();
        const durationMs = runStartedAt ? now - runStartedAt : 0;
        const ttft = firstTokenAt && runStartedAt ? firstTokenAt - runStartedAt : 0;

        logger.log({
          type: "SESSION_STOP",
          actor: "SYSTEM",
          description: `Agent run finished in ${durationMs}ms.`,
          durationMs,
        });

        // Prefer real usage from the runtime; fall back to a labelled estimate
        // derived from the actual streamed message content.
        const usage = (event as any)?.result?.usage;
        const lastAssistant = [...(messages || [])]
          .reverse()
          .find((m: any) => m.role === "assistant");
        const assistantText =
          typeof lastAssistant?.content === "string" ? lastAssistant.content : completionBuffer;
        const promptText = (messages || [])
          .map((m: any) => (typeof m.content === "string" ? m.content : ""))
          .join(" ");

        const promptTokens = usage?.promptTokens ?? estimateTokens(promptText);
        const completionTokens = usage?.completionTokens ?? estimateTokens(assistantText);
        const estimated = usage?.estimated ?? usage === undefined;

        logger.log({
          type: "TOKEN_METRICS_UPDATED",
          actor: "SYSTEM",
          description: `Usage${estimated ? " (estimated)" : ""}: prompt ${promptTokens}, completion ${completionTokens}, TTFT ${ttft}ms.`,
          details: {
            promptTokens,
            completionTokens,
            totalTokens: usage?.totalTokens ?? promptTokens + completionTokens,
            timeToFirstTokenMs: ttft,
            estimated,
          },
        });
      },

      onRunErrorEvent: ({ event }) => {
        logger.log({
          type: "AGENT_ERROR_OCCURRED",
          actor: "SYSTEM",
          description: `Agent run error: ${(event as any)?.message ?? "unknown error"}`,
          details: {
            message: (event as any)?.message,
            code: (event as any)?.code,
          },
        });
      },

      // Log the user's message as it enters the run.
      onNewMessage: ({ message }: any) => {
        if (message?.role !== "user") return;
        const contentStr =
          typeof message.content === "string"
            ? message.content
            : Array.isArray(message.content)
            ? message.content.map((c: any) => c.text || "").join(" ")
            : "";
        logger.log({
          type: "MESSAGE_SENT",
          actor: "USER",
          description: `Message sent by USER: "${contentStr}"`,
          details: { content: contentStr || "Empty message" },
        });
      },
    });

    return () => unsubscribe();
  }, [agent]);

  const handleToggleExpand = () => {
    const nextState = !isExpandedRef.current;
    isExpandedRef.current = nextState;
    setIsExpanded(nextState);
    logger.log({
      type: "CHAT_EXPANDED",
      actor: "USER",
      description: `Chat pane was ${nextState ? "expanded to fullscreen" : "collapsed to standard viewport"}.`,
      details: { expanded: nextState },
    });
  };

  // Feedback and regenerate are genuine user actions worth logging.
  const handleFeedback = (isPositive: boolean) => {
    const feedbackType = isPositive ? "positive" : "negative";
    logger.log({
      type: "FEEDBACK_GIVEN",
      actor: "USER",
      description: `Feedback given: ${feedbackType.toUpperCase()}`,
      details: {
        feedback: {
          type: feedbackType,
          rating: isPositive ? 1 : -1,
        },
      },
    });
  };

  const handleRegenerate = () => {
    logger.log({
      type: "MESSAGE_REGENERATED",
      actor: "USER",
      description: "User requested message regeneration.",
    });
  };

  const handleClearLogs = () => {
    logger.clear();
  };

  return (
    <div className={`w-full flex flex-col border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl bg-slate-900/40 backdrop-blur-xl transition-all duration-500 ${isExpanded ? "min-h-[750px] lg:scale-105 border-emerald-500/30 ring-1 ring-emerald-500/20" : "min-h-[500px]"}`}>
      {/* Toolbar: real user-interaction controls only. Telemetry below is
          captured automatically from the agent's event stream. */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 relative z-20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          <span className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Chat Controls
          </span>
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="text-slate-500 hover:text-slate-400 transition-colors"
            aria-label="Info"
          >
            <HelpCircle className="w-4.5 h-4.5" />
          </button>
          {showTooltip && (
            <div className="absolute top-12 left-4 z-30 max-w-xs p-3 bg-slate-900 border border-slate-700 rounded-xl text-[11px] text-slate-300 shadow-2xl leading-relaxed">
              Send a message to the agent — session, latency, time-to-first-token, MCP steps, token usage, and errors are captured live from the agent&apos;s event stream and shown in the Telemetry HUD.
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={handleToggleExpand}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-[10px] font-semibold text-slate-300 hover:text-white transition-all duration-200"
            title="Toggle expanded pane size"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5 text-emerald-400" /> : <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>Resize</span>
          </button>

          <button
            onClick={() => handleFeedback(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/30 text-[10px] font-semibold text-slate-300 hover:text-emerald-400 transition-all duration-200"
            title="Rate the last response positively"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>👍 Feedback</span>
          </button>

          <button
            onClick={() => handleFeedback(false)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 text-[10px] font-semibold text-slate-300 hover:text-rose-400 transition-all duration-200"
            title="Rate the last response negatively"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>👎 Feedback</span>
          </button>

          <button
            onClick={handleRegenerate}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-blue-500/10 border border-slate-800 hover:border-blue-500/30 text-[10px] font-semibold text-slate-300 hover:text-blue-400 transition-all duration-200"
            title="Log a response regeneration request"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regen</span>
          </button>

          <div className="w-[1px] h-4 bg-slate-800 mx-1 hidden sm:block" />

          <button
            onClick={handleClearLogs}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950/60 hover:bg-rose-950/40 border border-rose-950/40 text-[10px] font-semibold text-rose-400 hover:text-rose-300 transition-all duration-200"
            title="Clear all logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Main CopilotChat core component. The AG-UI inspector is controlled on the
          provider via showDevConsole rather than mounted here. */}
      <div className="flex-1 min-h-0 relative">
        <CopilotChat agentId="research-agent" />
      </div>
    </div>
  );
};
