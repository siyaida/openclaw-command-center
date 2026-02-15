import { z } from "zod";

// Auth
export const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Board
export const createBoardSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
});

export const updateBoardSchema = z.object({
  title: z.string().min(1).max(100).optional(),
});

// Column
export const createColumnSchema = z.object({
  title: z.string().min(1, "Title is required").max(50),
});

export const reorderColumnsSchema = z.object({
  columnIds: z.array(z.string()),
});

// Task
export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  labels: z.array(z.string()).default([]),
  dueDate: z.string().datetime().optional().nullable(),
  assignee: z.enum(["me", "openclaw_bot"]).default("me"),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  labels: z.array(z.string()).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assignee: z.enum(["me", "openclaw_bot"]).optional(),
});

export const moveTaskSchema = z.object({
  columnId: z.string(),
  order: z.number().int().min(0),
});

// OpenClaw Config
export const openclawConfigSchema = z.object({
  baseUrl: z.string().url("Must be a valid URL").or(z.literal("")),
  token: z.string().optional(),
  mode: z.enum(["mock", "real"]).default("mock"),
  healthPath: z.string().default("/health"),
});

// Command Center
export const executeCommandSchema = z.object({
  command: z.enum([
    "openclaw.health",
    "repo.scan",
    "md.index",
    "routes.validate",
    "tests.run",
    "wiring.export",
    "task.sync",
  ]),
  params: z.record(z.string(), z.unknown()).optional(),
});

// Webhook
export const jobStatusWebhookSchema = z.object({
  jobId: z.string(),
  status: z.enum(["pending", "running", "completed", "failed", "cancelled"]),
  result: z.unknown().optional(),
  error: z.string().optional(),
});

export const logWebhookSchema = z.object({
  jobId: z.string(),
  level: z.enum(["info", "warn", "error", "debug"]),
  message: z.string(),
  timestamp: z.string().datetime().optional(),
});

// Types
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type OpenClawConfigInput = z.infer<typeof openclawConfigSchema>;
export type ExecuteCommandInput = z.infer<typeof executeCommandSchema>;
