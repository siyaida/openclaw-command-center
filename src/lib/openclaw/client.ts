import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { mockClient } from "./mock";
import type {
  OpenClawHealthResponse,
  OpenClawJob,
  OpenClawJobPayload,
  OpenClawCommandPayload,
  OpenClawCommandResponse,
  OpenClawStatus,
} from "./types";

const TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  let lastError: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetchWithTimeout(url, options);
    } catch (err) {
      lastError = err as Error;
      if (i < retries) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastError;
}

function getHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function getConfig(workspaceId: string) {
  const config = await prisma.openClawConfig.findUnique({ where: { workspaceId } });
  if (!config) throw new Error("OpenClaw not configured for this workspace");
  return config;
}

export async function getStatus(workspaceId: string): Promise<OpenClawStatus> {
  const config = await prisma.openClawConfig.findUnique({ where: { workspaceId } });

  if (!config) {
    return { status: "misconfigured", mode: "mock", error: "OpenClaw not configured" };
  }

  if (config.mode === "mock") {
    const mockHealth = await mockClient.health();
    return {
      status: "connected",
      mode: "mock",
      version: mockHealth.version,
      latencyMs: 1,
    };
  }

  if (!config.baseUrl || !config.tokenEncrypted) {
    return { status: "misconfigured", mode: "real", error: "Base URL or token not set" };
  }

  try {
    const start = Date.now();
    const token = decrypt(config.tokenEncrypted);
    const res = await fetchWithTimeout(
      `${config.baseUrl}${config.healthPath}`,
      { method: "GET", headers: getHeaders(token) },
      5000
    );
    const latencyMs = Date.now() - start;

    if (!res.ok) {
      await prisma.openClawConfig.update({
        where: { workspaceId },
        data: { lastStatus: "disconnected", lastLatencyMs: latencyMs },
      });
      return { status: "disconnected", mode: "real", latencyMs, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const data = (await res.json()) as OpenClawHealthResponse;
    await prisma.openClawConfig.update({
      where: { workspaceId },
      data: { lastStatus: "connected", lastLatencyMs: latencyMs },
    });

    return { status: "connected", mode: "real", version: data.version, latencyMs };
  } catch (err) {
    const error = err as Error;
    await prisma.openClawConfig.update({
      where: { workspaceId },
      data: { lastStatus: "disconnected" },
    });
    return { status: "disconnected", mode: "real", error: error.message };
  }
}

export async function health(workspaceId: string): Promise<OpenClawHealthResponse> {
  const config = await getConfig(workspaceId);
  if (config.mode === "mock") return mockClient.health();

  const token = decrypt(config.tokenEncrypted);
  const res = await fetchWithRetry(`${config.baseUrl}${config.healthPath}`, {
    method: "GET",
    headers: getHeaders(token),
  });

  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

export async function createJob(workspaceId: string, payload: OpenClawJobPayload): Promise<OpenClawJob> {
  const config = await getConfig(workspaceId);
  if (config.mode === "mock") return mockClient.createJob(payload);

  const token = decrypt(config.tokenEncrypted);
  const res = await fetchWithRetry(`${config.baseUrl}/api/jobs`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Create job failed: ${res.status}`);
  return res.json();
}

export async function getJob(workspaceId: string, jobId: string): Promise<OpenClawJob> {
  const config = await getConfig(workspaceId);
  if (config.mode === "mock") return mockClient.getJob(jobId);

  const token = decrypt(config.tokenEncrypted);
  const res = await fetchWithRetry(`${config.baseUrl}/api/jobs/${jobId}`, {
    method: "GET",
    headers: getHeaders(token),
  });

  if (!res.ok) throw new Error(`Get job failed: ${res.status}`);
  return res.json();
}

export async function cancelJob(workspaceId: string, jobId: string): Promise<{ success: boolean }> {
  const config = await getConfig(workspaceId);
  if (config.mode === "mock") return mockClient.cancelJob(jobId);

  const token = decrypt(config.tokenEncrypted);
  const res = await fetchWithRetry(`${config.baseUrl}/api/jobs/${jobId}/cancel`, {
    method: "POST",
    headers: getHeaders(token),
  });

  if (!res.ok) throw new Error(`Cancel job failed: ${res.status}`);
  return res.json();
}

export async function sendCommand(workspaceId: string, payload: OpenClawCommandPayload): Promise<OpenClawCommandResponse> {
  const config = await getConfig(workspaceId);
  if (config.mode === "mock") return mockClient.sendCommand(payload);

  const token = decrypt(config.tokenEncrypted);
  const start = Date.now();
  const res = await fetchWithRetry(`${config.baseUrl}/api/command`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });

  const durationMs = Date.now() - start;
  if (!res.ok) {
    return { success: false, error: `Command failed: ${res.status}`, durationMs };
  }

  const data = await res.json();
  return { success: true, data, durationMs };
}
