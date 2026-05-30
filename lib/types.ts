export type InteractionType = 
  | 'SESSION_START' 
  | 'SESSION_STOP' 
  | 'MESSAGE_SENT' 
  | 'MESSAGE_REGENERATED' 
  | 'FEEDBACK_GIVEN' 
  | 'CHAT_EXPANDED'
  | 'MCP_DOCS_RETRIEVED'
  | 'TOKEN_METRICS_UPDATED'
  | 'AGENT_ERROR_OCCURRED';

export interface AgentInteraction {
  id: string;
  timestamp: string;
  type: InteractionType;
  actor: 'USER' | 'AGENT' | 'SYSTEM';
  description: string;
  details?: Record<string, any>;
  durationMs?: number;
}

export interface TelemetryStats {
  sessionActive: boolean;
  sessionDurationMs: number;
  messageCount: number;
  averageLatencyMs: number;
  positiveFeedbackCount: number;
  negativeFeedbackCount: number;
  regeneratedCount: number;
  totalInteractions: number;
  
  // New Granular Observability Metrics
  totalTokensUsed: number;
  timeToFirstTokenMs: number;
  retryCount: number;
  mcpRequestsCount: number;
}
