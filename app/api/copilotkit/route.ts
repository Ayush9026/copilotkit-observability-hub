import { CopilotRuntime, OpenAIAdapter, copilotRuntimeNextJSAppRouterEndpoint } from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import { AbstractAgent, BaseEvent, EventType, RunAgentInput } from "@ag-ui/client";
import { Observable } from "rxjs";

// ObservabilityMockAgent subclassing the required AbstractAgent base class.
// This implements correct v2 telemetry and offline agent-execution streams.
class ObservabilityMockAgent extends AbstractAgent {
  constructor() {
    super({
      agentId: "research-agent",
      description: "A helpful coding assistant that can answer questions about CopilotKit, debug stack traces, and write code.",
    });
  }

  run(input: RunAgentInput): Observable<BaseEvent> {
    return new Observable<BaseEvent>((subscriber) => {
      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      const runId = input.runId || Math.random().toString(36).substring(7);
      const messageId = "msg-" + Math.random().toString(36).substring(7);
      const stepId = "step-" + Math.random().toString(36).substring(7);
      const reasoningId = "reas-" + Math.random().toString(36).substring(7);

      const runSequence = async () => {
        // Parse user query for smart coding assistant behavior
        const messages = input.messages || [];
        const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
        const prompt = (lastUserMsg?.content || "").toString().toLowerCase();

        // 1. Emit Step Started
        subscriber.next({
          type: EventType.STEP_STARTED,
          runId,
          stepId,
          stepName: "Parsing Query & Planning Response",
          timestamp: Date.now(),
        } as any as BaseEvent);
        await sleep(350);

        // Simulate MCP document fetching if looking for help/code/error/mcp
        const isCodingRelated = prompt.includes("code") || prompt.includes("mcp") || prompt.includes("error") || prompt.includes("bug") || prompt.includes("help") || prompt.includes("hi");
        if (isCodingRelated) {
          const mcpStepId = "step-mcp-" + Math.random().toString(36).substring(7);
          subscriber.next({
            type: EventType.STEP_STARTED,
            runId,
            stepId: mcpStepId,
            stepName: "MCP Server: Fetching CopilotKit Coding Agent Docs",
            timestamp: Date.now(),
          } as any as BaseEvent);
          await sleep(550);

          subscriber.next({
            type: EventType.STEP_FINISHED,
            runId,
            stepId: mcpStepId,
            timestamp: Date.now(),
          } as any as BaseEvent);
          await sleep(200);
        }

        // 2. Emit Reasoning (Thoughts)
        subscriber.next({
          type: EventType.REASONING_START,
          runId,
          messageId: reasoningId,
          timestamp: Date.now(),
        } as any as BaseEvent);
        await sleep(150);

        subscriber.next({
          type: EventType.REASONING_MESSAGE_START,
          runId,
          messageId: reasoningId,
          role: "reasoning",
          timestamp: Date.now(),
        } as any as BaseEvent);
        await sleep(150);

        let thoughts = [
          "Analyzing prompt to determine specific CopilotKit implementation guidelines...",
          "\nApplying Model Context Protocol (MCP) indexing on coding agent documentation...",
          "\nSynthesizing custom TS/JS solutions for client event-logging...",
        ];

        if (prompt.includes("error") || prompt.includes("bug") || prompt.includes("fail")) {
          thoughts = [
            "Intercepting failure signature inside prompt...",
            "\nTracing stack trace to CopilotRuntime endpoint configurations...",
            "\nResolving typescript compiler signature mismatch... Planning strict recovery...",
          ];
        }

        for (const chunk of thoughts) {
          subscriber.next({
            type: EventType.REASONING_MESSAGE_CONTENT,
            runId,
            messageId: reasoningId,
            delta: chunk,
            timestamp: Date.now(),
          } as any as BaseEvent);
          await sleep(400);
        }

        subscriber.next({
          type: EventType.REASONING_MESSAGE_END,
          runId,
          messageId: reasoningId,
          timestamp: Date.now(),
        } as any as BaseEvent);
        await sleep(150);

        subscriber.next({
          type: EventType.REASONING_END,
          runId,
          messageId: reasoningId,
          timestamp: Date.now(),
        } as any as BaseEvent);
        await sleep(200);

        // 3. Emit Step Finished
        subscriber.next({
          type: EventType.STEP_FINISHED,
          runId,
          stepId,
          timestamp: Date.now(),
        } as any as BaseEvent);
        await sleep(250);

        // 4. Emit Text Message response
        subscriber.next({
          type: EventType.TEXT_MESSAGE_START,
          runId,
          messageId,
          role: "assistant",
          timestamp: Date.now(),
        } as any as BaseEvent);
        await sleep(150);

        let responseChunks: string[] = [];

        if (prompt.includes("error") || prompt.includes("bug") || prompt.includes("fail")) {
          responseChunks = [
            "### 🛠️ CopilotKit Coding Agent - Debugger Active\n\n",
            "I noticed you are asking about an **error or bug** in your application. Let's analyze it:\n\n",
            "```typescript\n",
            "// Common CopilotKit v2 Mismatch Error:\n",
            "Type error: Property 'onChatExpanded' does not exist on type 'CopilotChatProps'\n",
            "```\n\n",
            "**Why this happens:** In CopilotKit v2, the standard UI component delegates event tracking. To log interactions, you should write a reactive `useEffect` monitoring the `useAgent` hook or subscribe to the `copilotkit` instance directly rather than passing static props.\n\n",
            "**Solution:** Wrap your component and call `useAgent({ agentId: 'research-agent' })`. Listen to state changes programmatically inside your components."
          ];
        } else if (prompt.includes("mcp") || prompt.includes("agent") || prompt.includes("code") || prompt.includes("doc")) {
          responseChunks = [
            "### 🤖 CopilotKit Coding Agent - MCP Integrations\n\n",
            "Using the **Model Context Protocol (MCP) server** transforms standard agents into CopilotKit integration experts.\n\n",
            "**Key benefits of the MCP server:**\n",
            "1. **Live Docs Access:** Fetches real-time updates directly from the official [CopilotKit Docs](https://docs.copilotkit.ai).\n",
            "2. **Strict v2 Typings:** Guarantees that generated agent logic complies with the latest stable components without hallucinating properties.\n\n",
            "**Try this prompt in your IDE agent:**\n",
            "`Use the CopilotKit MCP server to add a new custom agent that reads database queries in route.ts.`"
          ];
        } else {
          responseChunks = [
            "### 🚀 CopilotKit Coding Agent - Observability Active\n\n",
            "Hello! I am your interactive **Coding Assistant**, operating within a highly observable React environment.\n\n",
            "I checked your query and ran it through the **Model Context Protocol (MCP)** doc retriever to index optimal observability configurations.\n\n",
            "**Try asking me about:**\n",
            "- `how to fix compilation errors` 🛠️\n",
            "- `explain mcp server advantages` 🤖\n",
            "- `retrieve code examples for logging` 📄\n\n",
            "All token outputs, latencies, and search traces have been successfully logged to your diagnostics panel on the right."
          ];
        }

        for (const chunk of responseChunks) {
          subscriber.next({
            type: EventType.TEXT_MESSAGE_CONTENT,
            runId,
            messageId,
            delta: chunk,
            timestamp: Date.now(),
          } as any as BaseEvent);
          await sleep(150);
        }

        subscriber.next({
          type: EventType.TEXT_MESSAGE_END,
          runId,
          messageId,
          timestamp: Date.now(),
        } as any as BaseEvent);
      };

      runSequence()
        .then(() => {
          subscriber.next({
            type: EventType.RUN_FINISHED,
            runId: input.runId,
            threadId: input.threadId,
            timestamp: Date.now(),
          } as any as BaseEvent);
          subscriber.complete();
        })
        .catch((err) => {
          subscriber.next({
            type: EventType.RUN_ERROR,
            runId: input.runId,
            threadId: input.threadId,
            message: err.message,
            timestamp: Date.now(),
          } as any as BaseEvent);
          subscriber.error(err);
        });
    });
  }

  clone(): AbstractAgent {
    return new ObservabilityMockAgent();
  }
}

// CopilotRuntime: serviceAdapter is NOT a constructor param in v1.57.
// It is passed to copilotRuntimeNextJSAppRouterEndpoint.
// Since ObservabilityMockAgent handles all responses, we use OpenAIAdapter as the
// service adapter for the endpoint so the runtime has a valid LLM backend reference.
const mockOpenAI = {
  chat: {
    completions: {
      create: async (params: any) => {
        if (params.stream) {
          async function* makeStream() {
            yield { choices: [{ delta: { role: "assistant", content: "" }, finish_reason: "stop" }] };
          }
          return makeStream();
        }
        return { choices: [{ message: { role: "assistant", content: "" } }] };
      },
    },
  },
} as any;

const serviceAdapter = new OpenAIAdapter({ openai: mockOpenAI });

const runtime = new CopilotRuntime({
  agents: {
    "research-agent": new ObservabilityMockAgent(),
  },
  debug: {
    events: true,
    lifecycle: true,
    verbose: false,
  },
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });
  return handleRequest(req);
};


