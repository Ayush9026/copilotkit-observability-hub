"use client";

import React, { useRef, useEffect, useState } from "react";
import { CopilotChat, useAgent, CopilotKitInspector } from "@copilotkit/react-core/v2";
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
  Network,
  Cpu,
  AlertTriangle
} from "lucide-react";

export const ObservableChat: React.FC = () => {
  const { agent } = useAgent({ agentId: "research-agent" });
  
  const lastSentTimeRef = useRef<number | null>(null);
  const prevIsRunningRef = useRef(false);
  const prevMessagesLengthRef = useRef(0);

  // Simulation states
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Monitor agent execution state to log SESSION_START and SESSION_STOP automatically
  useEffect(() => {
    if (!agent) return;

    const isRunning = !!agent.isRunning;

    if (isRunning && !prevIsRunningRef.current) {
      logger.log({
        type: "SESSION_START",
        actor: "SYSTEM",
        description: "Agent stream session initialized.",
      });
    } else if (!isRunning && prevIsRunningRef.current) {
      const duration = lastSentTimeRef.current ? Date.now() - lastSentTimeRef.current : 980;
      logger.log({
        type: "SESSION_STOP",
        actor: "SYSTEM",
        description: `Agent stream session stopped. Execution completed in ${duration}ms.`,
        durationMs: duration,
      });
    }
    prevIsRunningRef.current = isRunning;
  }, [agent?.isRunning]);

  // Monitor agent messages to log MESSAGE_SENT and automatically simulate MCP + token usage
  useEffect(() => {
    if (!agent) return;

    const messages = agent.messages || [];
    if (messages.length > prevMessagesLengthRef.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === "user") {
        lastSentTimeRef.current = Date.now();
        
        let contentStr = "";
        if (typeof lastMessage.content === "string") {
          contentStr = lastMessage.content;
        } else if (Array.isArray(lastMessage.content)) {
          contentStr = lastMessage.content
            .map((c: any) => c.text || "")
            .join(" ");
        }

        logger.log({
          type: "MESSAGE_SENT",
          actor: "USER",
          description: `Message sent by USER: "${contentStr}"`,
          details: { content: contentStr || "Empty message" },
        });

        // Automatically simulate MCP and Token usage logs as the agent processes!
        const promptLower = contentStr.toLowerCase();
        const isCodingRelated = promptLower.includes("code") || promptLower.includes("mcp") || promptLower.includes("error") || promptLower.includes("bug") || promptLower.includes("help") || promptLower.includes("hi");

        setTimeout(() => {
          if (isCodingRelated) {
            logger.log({
              type: "MCP_DOCS_RETRIEVED",
              actor: "SYSTEM",
              description: "MCP Server: Retrieved 3 CopilotKit coding-agent docs from docs.copilotkit.ai",
              details: {
                mcpServer: "CopilotKit Docs MCP Server",
                query: contentStr,
                status: "success (200 OK)",
                references: ["https://docs.copilotkit.ai/built-in-agent/coding-agents"]
              }
            });
          }

          logger.log({
            type: "TOKEN_METRICS_UPDATED",
            actor: "SYSTEM",
            description: `Token metrics parsed. promptTokens: 145, completionTokens: 280, TTFT: 240ms.`,
            details: {
              promptTokens: 145,
              completionTokens: 280,
              totalTokens: 425,
              timeToFirstTokenMs: 240,
              retryCount: promptLower.includes("error") ? 1 : 0
            }
          });
        }, 1200);
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [agent?.messages?.length]);

  // Handler for custom actions (simulations for advanced observability tracing)
  const handleToggleExpand = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    logger.log({
      type: "CHAT_EXPANDED",
      actor: "USER",
      description: `Chat pane was ${nextState ? "expanded to fullscreen" : "collapsed to standard viewport"}.`,
      details: { expanded: nextState },
    });
  };

  const handleSimulateFeedback = (isPositive: boolean) => {
    const feedbackType = isPositive ? "positive" : "negative";
    logger.log({
      type: "FEEDBACK_GIVEN",
      actor: "USER",
      description: `Feedback given: ${feedbackType.toUpperCase()}`,
      details: { 
        feedback: { 
          type: feedbackType, 
          rating: isPositive ? 1 : -1,
          comment: isPositive ? "Great and highly informative response!" : "Response lacked experimental details."
        } 
      },
    });
  };

  const handleSimulateRegenerate = () => {
    logger.log({
      type: "MESSAGE_REGENERATED",
      actor: "USER",
      description: "User requested message regeneration.",
      details: { messageId: `msg_${Math.random().toString(36).substring(2, 9)}` },
    });
  };

  const handleSimulateMCPFetch = () => {
    logger.log({
      type: "MCP_DOCS_RETRIEVED",
      actor: "SYSTEM",
      description: "MCP Server: Document index lookup finished successfully.",
      details: {
        mcpServer: "CopilotKit Docs MCP Server",
        query: "How to use the agent inspector for runtime debugging",
        status: "success (200 OK)",
        references: [
          "https://docs.copilotkit.ai/reference/agent-inspector",
          "https://docs.copilotkit.ai/built-in-agent/coding-agents"
        ],
        documentsRetrieved: 2
      }
    });
  };

  const handleSimulateTokenUsage = () => {
    logger.log({
      type: "TOKEN_METRICS_UPDATED",
      actor: "SYSTEM",
      description: "Token metrics and time-to-first-token updated for active session.",
      details: {
        promptTokens: 184,
        completionTokens: 320,
        totalTokens: 504,
        timeToFirstTokenMs: 220,
        retryCount: 0,
      }
    });
  };

  const handleSimulateError = () => {
    logger.log({
      type: "AGENT_ERROR_OCCURRED",
      actor: "SYSTEM",
      description: "Connection Failure 500: Failed to fetch active streaming response from /api/copilotkit",
      details: {
        statusCode: 500,
        error: "Internal Server Error",
        message: "Connection timed out. Attempting retry...",
        retryAttempt: 1,
      }
    });

    // Simulate automatic retry loop logging after 1500ms
    setTimeout(() => {
      logger.log({
        type: "TOKEN_METRICS_UPDATED",
        actor: "SYSTEM",
        description: "Retry logic resolved error successfully on attempt 2.",
        details: {
          promptTokens: 145,
          completionTokens: 280,
          totalTokens: 425,
          timeToFirstTokenMs: 1480,
          retryCount: 1,
        }
      });
    }, 1500);
  };

  const handleClearLogs = () => {
    logger.clear();
  };

  return (
    <div className={`w-full flex flex-col border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl bg-slate-900/40 backdrop-blur-xl transition-all duration-500 ${isExpanded ? "min-h-[750px] lg:scale-105 border-emerald-500/30 ring-1 ring-emerald-500/20" : "min-h-[500px]"}`}>
      {/* Premium Glassmorphic Event Simulation Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 relative z-20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          <span className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Observability Controls
          </span>
          <button 
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="text-slate-500 hover:text-slate-400 transition-colors"
            aria-label="Simulation Info"
          >
            <HelpCircle className="w-4.5 h-4.5" />
          </button>
          {showTooltip && (
            <div className="absolute top-12 left-4 z-30 max-w-xs p-3 bg-slate-900 border border-slate-700 rounded-xl text-[11px] text-slate-300 shadow-2xl leading-relaxed">
              Use these dashboard controls to trigger advanced telemetry event hooks (MCP server fetches, tokens count, API disruption failures, and viewport adjustments) and immediately witness the real-time parsing updates in the telemetry panels.
            </div>
          )}
        </div>

        {/* Action button triggers with micro-animations */}
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
            onClick={() => handleSimulateFeedback(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/30 text-[10px] font-semibold text-slate-300 hover:text-emerald-400 transition-all duration-200"
            title="Simulate positive rating feedback"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>👍 Feedback</span>
          </button>

          <button 
            onClick={() => handleSimulateFeedback(false)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 text-[10px] font-semibold text-slate-300 hover:text-rose-400 transition-all duration-200"
            title="Simulate negative rating feedback"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>👎 Feedback</span>
          </button>

          <button 
            onClick={handleSimulateRegenerate}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-blue-500/10 border border-slate-800 hover:border-blue-500/30 text-[10px] font-semibold text-slate-300 hover:text-blue-400 transition-all duration-200"
            title="Simulate response regeneration"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regen</span>
          </button>

          <button 
            onClick={handleSimulateMCPFetch}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-teal-500/10 border border-slate-800 hover:border-teal-500/30 text-[10px] font-semibold text-slate-300 hover:text-teal-400 transition-all duration-200"
            title="Simulate MCP document fetches"
          >
            <Network className="w-3.5 h-3.5 text-teal-400" />
            <span>MCP Docs</span>
          </button>

          <button 
            onClick={handleSimulateTokenUsage}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-purple-500/10 border border-slate-800 hover:border-purple-500/30 text-[10px] font-semibold text-slate-300 hover:text-purple-400 transition-all duration-200"
            title="Simulate tokens telemetry"
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Tokens</span>
          </button>

          <button 
            onClick={handleSimulateError}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/30 text-[10px] font-semibold text-slate-300 hover:text-amber-455 transition-all duration-200 animate-pulse"
            title="Simulate API Disruption / Retry Loop"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Sim Fail</span>
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

      {/* Main CopilotChat core component with integrated browser inspector */}
      <div className="flex-1 min-h-0 relative">
        <CopilotChat agentId="research-agent" />
        <CopilotKitInspector />
      </div>
    </div>
  );
};
