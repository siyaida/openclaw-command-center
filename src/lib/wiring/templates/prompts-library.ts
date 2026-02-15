export function getPromptsLibrary(): string {
  return `# OpenClaw Command Center — Prompts Library

This document contains parameterized prompt templates for use with the OpenClaw AI agent. Each template uses \`{placeholder}\` syntax for variable substitution. The Command Center fills in these placeholders before dispatching the prompt to the agent.

---

## Template A: Repo Scan

**Command**: \`repo.scan\`
**Purpose**: Analyze a code repository's structure, detect languages, identify issues, and provide recommendations.

### Prompt
\`\`\`
You are a code analysis agent. Scan the repository at {repoPath}.
Focus: {focus}
Return JSON matching this schema: {outputSchema}
Rules: Return JSON only. No hallucinations. Be precise about file counts and languages.
\`\`\`

### Parameters

| Parameter      | Type   | Description                                           | Example                        |
|----------------|--------|-------------------------------------------------------|--------------------------------|
| \`repoPath\`   | string | Absolute path to the repository root                  | \`/home/user/projects/my-app\` |
| \`focus\`      | string | Analysis focus area                                   | \`structure\`, \`security\`, \`performance\`, \`all\` |
| \`outputSchema\`| string | JSON schema the response must conform to             | See below                      |

### Output Schema
\`\`\`json
{
  "type": "object",
  "required": ["files", "languages", "summary", "issues", "recommendations"],
  "properties": {
    "files": { "type": "number", "description": "Total files scanned" },
    "languages": { "type": "array", "items": { "type": "string" }, "description": "Detected languages" },
    "summary": { "type": "string", "description": "One-paragraph summary" },
    "issues": { "type": "array", "items": { "type": "string" }, "description": "Problems found" },
    "recommendations": { "type": "array", "items": { "type": "string" }, "description": "Improvement suggestions" }
  }
}
\`\`\`

### Filled Example
\`\`\`
You are a code analysis agent. Scan the repository at /home/user/projects/my-app.
Focus: security
Return JSON matching this schema: { "files": number, "languages": string[], "summary": string, "issues": string[], "recommendations": string[] }
Rules: Return JSON only. No hallucinations. Be precise about file counts and languages.
\`\`\`

---

## Template B: MD Index

**Command**: \`md.index\`
**Purpose**: Index all markdown documentation files, extracting titles and section counts.

### Prompt
\`\`\`
You are a documentation indexer. Index all markdown files under {mdRoot}.
Include patterns: {includePatterns}
Return JSON matching: {outputSchema}
Rules: Return JSON only. Include accurate section counts.
\`\`\`

### Parameters

| Parameter          | Type     | Description                                     | Example                    |
|--------------------|----------|-------------------------------------------------|----------------------------|
| \`mdRoot\`         | string   | Root directory to search for markdown files     | \`./docs\`                 |
| \`includePatterns\`| string[] | Glob patterns for file matching                 | \`["**/*.md", "**/*.mdx"]\`|
| \`outputSchema\`   | string   | JSON schema the response must conform to       | See below                  |

### Output Schema
\`\`\`json
{
  "type": "object",
  "required": ["documents", "index"],
  "properties": {
    "documents": { "type": "number", "description": "Total documents found" },
    "index": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["path", "title", "sections"],
        "properties": {
          "path": { "type": "string", "description": "Relative file path" },
          "title": { "type": "string", "description": "Document title from first H1 or filename" },
          "sections": { "type": "number", "description": "Number of heading sections" }
        }
      }
    }
  }
}
\`\`\`

### Filled Example
\`\`\`
You are a documentation indexer. Index all markdown files under ./docs.
Include patterns: ["**/*.md"]
Return JSON matching: { "documents": number, "index": [{ "path": string, "title": string, "sections": number }] }
Rules: Return JSON only. Include accurate section counts.
\`\`\`

---

## Template C: Route Validation

**Command**: \`routes.validate\`
**Purpose**: Validate a set of API routes by checking availability, supported methods, and expected behavior.

### Prompt
\`\`\`
You are an API validator. Validate routes at {baseUrl}.
Routes to validate: {routesList}
Expected behaviors: {expectedBehaviors}
Return JSON only with validation status per route.
\`\`\`

### Parameters

| Parameter             | Type     | Description                                    | Example                          |
|-----------------------|----------|------------------------------------------------|----------------------------------|
| \`baseUrl\`           | string   | Base URL of the application                    | \`http://localhost:3000\`        |
| \`routesList\`        | string[] | List of route paths to validate                | \`["/api/boards", "/api/tasks"]\`|
| \`expectedBehaviors\` | string   | Description of expected route behaviors        | See below                        |

### Expected Behaviors Format
\`\`\`json
{
  "/api/boards": {
    "GET": { "status": 200, "returns": "array of boards" },
    "POST": { "status": 201, "requires": "title field" }
  },
  "/api/tasks/:id": {
    "GET": { "status": 200, "returns": "single task" },
    "PUT": { "status": 200, "requires": "at least one updatable field" },
    "DELETE": { "status": 200, "returns": "deletion confirmation" }
  }
}
\`\`\`

### Output Schema
\`\`\`json
{
  "type": "object",
  "required": ["total", "valid", "invalid", "routes"],
  "properties": {
    "total": { "type": "number" },
    "valid": { "type": "number" },
    "invalid": { "type": "number" },
    "routes": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["path", "methods", "status"],
        "properties": {
          "path": { "type": "string" },
          "methods": { "type": "array", "items": { "type": "string" } },
          "status": { "type": "string", "enum": ["valid", "invalid", "timeout", "error"] }
        }
      }
    }
  }
}
\`\`\`

### Filled Example
\`\`\`
You are an API validator. Validate routes at http://localhost:3000.
Routes to validate: ["/api/boards", "/api/tasks/:id", "/api/openclaw/health"]
Expected behaviors: { "/api/boards": { "GET": { "status": 200 }, "POST": { "status": 201 } } }
Return JSON only with validation status per route.
\`\`\`

---

## Template D: Test Runner

**Command**: \`tests.run\`
**Purpose**: Execute test commands and return aggregated pass/fail results.

### Prompt
\`\`\`
You are a test execution agent. Run the following commands: {commands}
Expected outputs: {expectedOutputs}
Return JSON with pass/fail status and any error details.
\`\`\`

### Parameters

| Parameter          | Type     | Description                                       | Example                           |
|--------------------|----------|---------------------------------------------------|------------------------------------|
| \`commands\`       | string[] | Shell commands to execute                         | \`["npx playwright test"]\`        |
| \`expectedOutputs\`| string   | Description of what successful output looks like  | See below                          |

### Expected Outputs Format
\`\`\`json
{
  "npx playwright test": {
    "exitCode": 0,
    "contains": ["passed"],
    "notContains": ["FAIL", "Error"]
  },
  "npm run lint": {
    "exitCode": 0,
    "contains": ["no warnings"]
  }
}
\`\`\`

### Output Schema
\`\`\`json
{
  "type": "object",
  "required": ["total", "passed", "failed", "duration", "results"],
  "properties": {
    "total": { "type": "number" },
    "passed": { "type": "number" },
    "failed": { "type": "number" },
    "duration": { "type": "string", "description": "e.g. '3.2s'" },
    "results": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "status"],
        "properties": {
          "name": { "type": "string" },
          "status": { "type": "string", "enum": ["passed", "failed", "skipped"] }
        }
      }
    }
  }
}
\`\`\`

### Filled Example
\`\`\`
You are a test execution agent. Run the following commands: ["npx playwright test", "npm run lint"]
Expected outputs: { "npx playwright test": { "exitCode": 0, "contains": ["passed"] } }
Return JSON with pass/fail status and any error details.
\`\`\`

---

## Template E: Suggest Next Move

**Command**: N/A (advisory, not bound to a specific command)
**Purpose**: Analyze the current state of the project and suggest prioritized next steps.

### Prompt
\`\`\`
You are a project advisor. Given:
- Repository summary: {repoSummary}
- Documentation summary: {mdSummary}
- Current Kanban state: {kanbanState}
Return JSON with: prioritized tasks, identified risks, dependency graph.
Rules: Return JSON only. Be actionable and specific.
\`\`\`

### Parameters

| Parameter       | Type   | Description                                          | Example                         |
|-----------------|--------|------------------------------------------------------|---------------------------------|
| \`repoSummary\` | string | Output from a previous \`repo.scan\` command         | JSON string of scan results     |
| \`mdSummary\`   | string | Output from a previous \`md.index\` command          | JSON string of index results    |
| \`kanbanState\` | string | Current board state with columns and task counts     | See below                       |

### Kanban State Format
\`\`\`json
{
  "boardTitle": "OpenClaw Command Center",
  "columns": [
    { "title": "Backlog", "taskCount": 5, "tasks": ["Implement rate limiting", "Add error monitoring"] },
    { "title": "To Do", "taskCount": 3, "tasks": ["Write webhook tests", "Update README"] },
    { "title": "In Progress", "taskCount": 2, "tasks": ["Build wiring pack generator"] },
    { "title": "Done", "taskCount": 10, "tasks": ["Auth system", "Board CRUD"] }
  ]
}
\`\`\`

### Output Schema
\`\`\`json
{
  "type": "object",
  "required": ["prioritizedTasks", "risks", "dependencyGraph"],
  "properties": {
    "prioritizedTasks": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["title", "priority", "reason", "estimatedEffort"],
        "properties": {
          "title": { "type": "string", "description": "Task title" },
          "priority": { "type": "number", "description": "1 = highest priority" },
          "reason": { "type": "string", "description": "Why this should be done next" },
          "estimatedEffort": { "type": "string", "description": "e.g. '2 hours', '1 day'" }
        }
      }
    },
    "risks": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["description", "severity", "mitigation"],
        "properties": {
          "description": { "type": "string" },
          "severity": { "type": "string", "enum": ["low", "medium", "high", "critical"] },
          "mitigation": { "type": "string" }
        }
      }
    },
    "dependencyGraph": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["task", "dependsOn"],
        "properties": {
          "task": { "type": "string", "description": "Task that has dependencies" },
          "dependsOn": { "type": "array", "items": { "type": "string" }, "description": "Tasks that must complete first" }
        }
      }
    }
  }
}
\`\`\`

### Filled Example
\`\`\`
You are a project advisor. Given:
- Repository summary: {"files":42,"languages":["TypeScript","CSS"],"summary":"Next.js app with Prisma","issues":["No test coverage"],"recommendations":["Add tests"]}
- Documentation summary: {"documents":5,"index":[{"path":"README.md","title":"OpenClaw","sections":8}]}
- Current Kanban state: {"boardTitle":"OpenClaw","columns":[{"title":"To Do","taskCount":3},{"title":"In Progress","taskCount":1},{"title":"Done","taskCount":10}]}
Return JSON with: prioritized tasks, identified risks, dependency graph.
Rules: Return JSON only. Be actionable and specific.
\`\`\`

---

## Usage Notes

1. **Placeholder Syntax**: All placeholders use \`{variableName}\` format. The Command Center performs string replacement before sending to the agent.
2. **Schema Enforcement**: The agent is instructed to return JSON matching the output schema. The Command Center validates responses against these schemas.
3. **Chaining**: Templates can be chained. For example, run Template A (repo.scan), then Template B (md.index), then feed both results into Template E (suggest next move).
4. **Customization**: These templates can be modified via the wiring pack. Download the pack, edit the prompts, and re-upload to customize agent behavior.
5. **Error Handling**: If the agent cannot fulfill a request, it should return \`{ "success": false, "error": "description" }\` instead of the expected schema.
`;
}
