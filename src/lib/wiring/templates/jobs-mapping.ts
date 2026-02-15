export function getJobsMapping(): string {
  return `# OpenClaw Command Center — Jobs and Tasks Mapping

This document describes how Kanban board tasks in the Command Center map to OpenClaw jobs, including field mappings, state transitions, and the full lifecycle of a task-to-job pipeline.

---

## Overview

The OpenClaw Command Center uses a Kanban board as the primary interface for managing work. When a task is assigned to \`openclaw_bot\`, the Command Center automatically creates a corresponding OpenClaw job. As the job progresses, webhook callbacks update the task's position on the board.

### Flow Diagram

\`\`\`
User creates task                     OpenClaw processes job
       |                                       |
       v                                       v
[Kanban Task] --assign to bot--> [OpenClaw Job Created]
       |                                       |
       v                                       v
[Task: "In Progress"]  <--webhook-- [Job: "running"]
       |                                       |
       v                                       v
[Task: "Done"]         <--webhook-- [Job: "completed"]
\`\`\`

---

## Field Mapping

The following table shows how Kanban task fields map to OpenClaw job fields:

| Kanban Task Field  | OpenClaw Job Field     | Direction        | Notes                                          |
|--------------------|------------------------|------------------|-------------------------------------------------|
| \`id\`             | \`payload.taskId\`     | Task -> Job      | Links the job back to the originating task      |
| \`title\`          | \`payload.type\`       | Task -> Job      | Used as the job type identifier                 |
| \`description\`    | \`payload.params\`     | Task -> Job      | Parsed for parameters; free text used as context|
| \`priority\`       | \`payload.params.priority\` | Task -> Job | Forwarded so the agent can prioritize           |
| \`labels\`         | \`payload.params.labels\`   | Task -> Job | Forwarded for agent context                     |
| \`assignee\`       | N/A                    | Task only        | Must be \`openclaw_bot\` to trigger job creation|
| \`columnId\`       | N/A                    | Task only        | Updated by webhook based on job status          |
| \`order\`          | N/A                    | Task only        | Board ordering, not relevant to OpenClaw        |
| N/A                | \`jobId\`              | Job -> Task      | Stored on the task's OpenClawJob record         |
| N/A                | \`status\`             | Job -> Task      | Maps to column position (see State Transitions) |
| N/A                | \`result\`             | Job -> Task      | Stored as \`lastResponse\` on the job record    |
| N/A                | \`error\`              | Job -> Task      | Stored as \`lastResponse\` on the job record    |
| N/A                | \`createdAt\`          | Job -> Task      | Logged in task activity feed                    |

---

## State Transitions

When a task is assigned to \`openclaw_bot\`, the following state machine governs its lifecycle:

### 1. Task Created / Assigned to Bot

**Trigger**: User sets \`assignee\` to \`openclaw_bot\` on a task (via create or update).

**Actions**:
- Command Center creates an OpenClaw job via \`POST /api/jobs\`
- Job payload includes \`taskId\`, task title as type, and description-derived params
- An \`OpenClawJob\` record is created in the database linking \`jobId\` to \`taskId\`
- Task remains in its current column (typically "To Do" or "Backlog")
- Activity entry: "Task assigned to OpenClaw bot, job {jobId} created"

### 2. Job Running

**Trigger**: OpenClaw sends a webhook to \`POST /api/openclaw/webhook/job-status\` with \`status: "running"\`.

**Actions**:
- \`OpenClawJob.status\` updated to \`running\`
- Task is automatically moved to the **"In Progress"** column
- Activity entry: "OpenClaw job {jobId} is now running"

### 3. Job Completed

**Trigger**: OpenClaw sends a webhook with \`status: "completed"\` and a \`result\` payload.

**Actions**:
- \`OpenClawJob.status\` updated to \`completed\`
- \`OpenClawJob.lastResponse\` stores the JSON result
- Task is automatically moved to the **"Done"** column
- Activity entry: "OpenClaw job {jobId} completed successfully"
- Result data is available in the task detail view

### 4. Job Failed

**Trigger**: OpenClaw sends a webhook with \`status: "failed"\` and an \`error\` message.

**Actions**:
- \`OpenClawJob.status\` updated to \`failed\`
- \`OpenClawJob.lastResponse\` stores the error message
- Task is automatically moved back to the **"To Do"** column (for retry)
- Task priority is escalated to \`high\` if not already
- Activity entry: "OpenClaw job {jobId} failed: {error}"

### 5. Job Cancelled

**Trigger**: User manually cancels via UI, or OpenClaw sends \`status: "cancelled"\`.

**Actions**:
- \`OpenClawJob.status\` updated to \`cancelled\`
- Task remains in its current column
- Assignee is reset from \`openclaw_bot\` to \`me\`
- Activity entry: "OpenClaw job {jobId} was cancelled"

---

## Column Mapping

The default column-to-status mapping:

| Job Status   | Target Column    | Notes                                    |
|--------------|------------------|------------------------------------------|
| \`pending\`  | (no move)        | Task stays where it was assigned          |
| \`running\`  | In Progress      | Auto-moved when job starts                |
| \`completed\`| Done             | Auto-moved when job finishes successfully |
| \`failed\`   | To Do            | Returned for retry or manual intervention |
| \`cancelled\`| (no move)        | Stays in place, assignee reset            |

The Command Center identifies target columns by their title. If a matching column is not found on the board, the task is not moved and a warning is logged.

---

## Task Sync

The \`task.sync\` command reconciles the state of all tasks assigned to \`openclaw_bot\` with their corresponding OpenClaw jobs:

1. Queries all tasks where \`assignee = "openclaw_bot"\`
2. For each task with a linked \`OpenClawJob\`:
   - Fetches the latest job status from OpenClaw
   - Updates the local \`OpenClawJob\` record if status has changed
   - Moves the task to the appropriate column based on the new status
3. Reports results with per-task sync status:
   - **synced**: Task and job are in consistent state
   - **conflict**: Task column does not match expected column for current job status
   - **orphaned**: Task has a job link but the job no longer exists in OpenClaw

---

## Database Schema Reference

### OpenClawJob Table

| Column         | Type     | Description                            |
|----------------|----------|----------------------------------------|
| \`id\`         | String   | Primary key (cuid)                     |
| \`jobId\`      | String   | OpenClaw job identifier (unique)       |
| \`taskId\`     | String   | Foreign key to the Kanban task         |
| \`status\`     | String   | Current job status                     |
| \`lastResponse\`| String  | Last JSON response or error message    |
| \`createdAt\`  | DateTime | When the job record was created        |
| \`updatedAt\`  | DateTime | When the job record was last updated   |

---

## Example: Full Lifecycle

\`\`\`
1. User creates task "Scan repository for security issues"
   -> assignee: openclaw_bot
   -> priority: high
   -> labels: ["security", "scan"]

2. Command Center calls OpenClaw:
   POST /api/jobs
   {
     "type": "Scan repository for security issues",
     "taskId": "clx1abc",
     "params": {
       "priority": "high",
       "labels": ["security", "scan"],
       "context": "Scan repository for security issues"
     }
   }

3. OpenClaw responds:
   { "jobId": "job-sec-001", "status": "pending", "createdAt": "2025-01-15T10:00:00Z" }

4. OpenClaw webhook fires (job started):
   POST /api/openclaw/webhook/job-status
   { "jobId": "job-sec-001", "status": "running" }
   -> Task moves to "In Progress"

5. OpenClaw webhook fires (job done):
   POST /api/openclaw/webhook/job-status
   {
     "jobId": "job-sec-001",
     "status": "completed",
     "result": {
       "files": 42,
       "languages": ["TypeScript"],
       "issues": ["Exposed API key in config.ts"],
       "recommendations": ["Move secrets to environment variables"]
     }
   }
   -> Task moves to "Done"
   -> Result stored and visible in task detail
\`\`\`
`;
}
