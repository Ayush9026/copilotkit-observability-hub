import { AgentInteraction } from "./types";

const MAX_LOGS = 50;

class AgentLogger {
  private logs: AgentInteraction[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("copilotkit_observability_logs");
        if (saved) {
          this.logs = JSON.parse(saved);
        }
      } catch (e) {
        console.error("Failed to parse logs from localStorage", e);
      }
    }
  }

  log(interaction: Omit<AgentInteraction, "id" | "timestamp">) {
    const newLog: AgentInteraction = {
      ...interaction,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
    };

    this.logs.unshift(newLog); // newest first

    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(0, MAX_LOGS);
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("copilotkit_observability_logs", JSON.stringify(this.logs));
      } catch (e) {
        console.error("Failed to save logs to localStorage", e);
      }
    }

    this.notify();
  }

  getLogs(): AgentInteraction[] {
    return this.logs;
  }

  clear() {
    this.logs = [];
    if (typeof window !== "undefined") {
      localStorage.removeItem("copilotkit_observability_logs");
    }
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error("Error in logger listener", e);
      }
    });
  }
}

// SSR safe singleton reference
export const logger = typeof window !== "undefined"
  ? ((window as any).__agentLogger || ((window as any).__agentLogger = new AgentLogger()))
  : new AgentLogger();
export type { AgentLogger };
