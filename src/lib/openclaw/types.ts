export interface OpenClawHealthResponse {
  status: "ok" | "error";
  version: string;
  timestamp?: string;
}

export interface OpenClawJobPayload {
  type: string;
  taskId?: string;
  params: Record<string, unknown>;
}

export interface OpenClawJob {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  result?: unknown;
  error?: string;
  createdAt: string;
}

export interface OpenClawCommandPayload {
  command: string;
  params: Record<string, unknown>;
}

export interface OpenClawCommandResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  durationMs: number;
}

export type OpenClawMode = "mock" | "real";

export type ConnectionStatus = "connected" | "disconnected" | "misconfigured";

export interface OpenClawStatus {
  status: ConnectionStatus;
  mode: OpenClawMode;
  latencyMs?: number;
  version?: string;
  error?: string;
}
