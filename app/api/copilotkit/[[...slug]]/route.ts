import { CopilotRuntime, InMemoryAgentRunner, createCopilotHonoHandler } from "@copilotkit/runtime/v2";
import { handle } from "hono/vercel";
import { AbstractAgent, BaseEvent, EventType, RunAgentInput } from "@ag-ui/client";
import { Observable } from "rxjs";

// This route runs on the Node.js runtime (the in-memory runner keeps run state
// in module scope, which the edge runtime would not preserve).
export const runtime = "nodejs";

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

      // Rough token estimator (~4 chars/token). This is a heuristic, not a
      // billing-grade tokenizer — labelled as an estimate on the client.
      const estimateTokens = (text: string) => Math.max(0, Math.ceil(text.length / 4));

      const runSequence = async () => {
        // Parse user query for smart coding assistant behavior
        const messages = input.messages || [];
        const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
        const prompt = (lastUserMsg?.content || "").toString().toLowerCase();

        // Accumulate the full prompt + completion so we can report real
        // (content-derived) token counts on RUN_FINISHED.
        const promptText = messages
          .map((m: any) => (typeof m.content === "string" ? m.content : ""))
          .join(" ");
        let completionText = "";

        // 0. Emit Run Started. AG-UI requires RUN_STARTED as the very first
        // event of a run — @ag-ui/client's verifyEvents rejects any stream that
        // opens with a different type ("First event must be 'RUN_STARTED'"),
        // which aborts the run before a single subscriber callback fires.
        subscriber.next({
          type: EventType.RUN_STARTED,
          runId,
          threadId: input.threadId,
          timestamp: Date.now(),
        } as any as BaseEvent);

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
            stepName: "MCP: Retrieving CopilotKit docs",
            timestamp: Date.now(),
          } as any as BaseEvent);
          await sleep(550);

          subscriber.next({
            type: EventType.STEP_FINISHED,
            runId,
            stepId: mcpStepId,
            // AG-UI matches STEP_FINISHED to its STEP_STARTED by stepName, so it
            // must equal the name emitted above or verifyEvents rejects the run.
            stepName: "MCP: Retrieving CopilotKit docs",
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

        // 3. Emit Step Finished. stepName must match the opening STEP_STARTED
        // (AG-UI closes steps by name, not by stepId).
        subscriber.next({
          type: EventType.STEP_FINISHED,
          runId,
          stepId,
          stepName: "Parsing Query & Planning Response",
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
            "CopilotKit lets you connect your agent to external **Model Context Protocol (MCP) servers** (for example Composio) so it can call tools and pull in extra context.\n\n",
            "**What MCP gives your agent:**\n",
            "1. **External tools & context:** Wire the agent up to MCP servers you configure to fetch data or take actions.\n",
            "2. **Grounded answers:** Feeding docs or code context in through MCP reduces guesswork versus relying on the model alone.\n\n",
            "See the [CopilotKit docs](https://docs.copilotkit.ai/) for how to configure MCP servers.\n\n",
            "**Try this prompt in your IDE agent:**\n",
            "`Add a new custom agent in route.ts that reads database queries.`"
          ];
        } else {
          responseChunks = [
            "### 🚀 CopilotKit Coding Agent - Observability Active\n\n",
            "Hello! I am your interactive **Coding Assistant**, operating within a highly observable React environment.\n\n",
            "This is a demo agent: it streams AG-UI events (steps, reasoning, text) that the Observability HUD captures as real telemetry.\n\n",
            "**Try asking me about:**\n",
            "- `how to fix compilation errors` 🛠️\n",
            "- `explain mcp server advantages` 🤖\n",
            "- `retrieve code examples for logging` 📄\n\n",
            "All token outputs, latencies, and search traces have been successfully logged to your diagnostics panel on the right."
          ];
        }

        for (const chunk of responseChunks) {
          completionText += chunk;
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

        return {
          promptTokens: estimateTokens(promptText),
          completionTokens: estimateTokens(completionText),
        };
      };

      runSequence()
        .then(({ promptTokens, completionTokens }) => {
          subscriber.next({
            type: EventType.RUN_FINISHED,
            runId: input.runId,
            threadId: input.threadId,
            // Real, content-derived usage carried on RUN_FINISHED.result.
            // AG-UI has no first-class usage field, so the client reads it here.
            result: {
              usage: {
                promptTokens,
                completionTokens,
                totalTokens: promptTokens + completionTokens,
                estimated: true,
              },
            },
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

// Official CopilotKit v2 runtime. The InMemoryAgentRunner runs agents in-process
// (SSE mode) with no external services or LLM API key required — the demo stays
// self-contained. The ObservabilityMockAgent is registered under "research-agent",
// matching the agentId used by useAgent() and <CopilotChat> on the frontend.
const copilotRuntime = new CopilotRuntime({
  agents: {
    "research-agent": new ObservabilityMockAgent(),
  },
  runner: new InMemoryAgentRunner(),
  debug: {
    events: true,
    lifecycle: true,
    verbose: false,
  },
});

// createCopilotHonoHandler builds a Hono app exposing the full v2 route surface
// (agent discovery, run, thread endpoints) under basePath. hono/vercel's `handle`
// adapts it to the Next.js App Router request/response contract.
//
// This route lives in an optional catch-all segment ([[...slug]]) so it matches
// both /api/copilotkit and every sub-path the v2 frontend calls (/info,
// /agent/<id>/run, /threads/...). A plain route.ts would only match the exact
// base path and 404 the discovery + run requests.
const app = createCopilotHonoHandler({
  runtime: copilotRuntime,
  basePath: "/api/copilotkit",
});

// Export every verb the v2 frontend uses: GET drives the /info agent-discovery
// sync, POST runs the agent, and PATCH/DELETE back the thread lifecycle routes.
export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
