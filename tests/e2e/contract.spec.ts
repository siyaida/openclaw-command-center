import { test, expect } from "@playwright/test";

test.describe("Contract Endpoint Tests", () => {
  test("GET /api/openclaw/contract returns valid JSON", async ({ request }) => {
    const response = await request.get("/api/openclaw/contract");

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);

    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("application/json");

    const body = await response.json();
    expect(body).toBeDefined();
    expect(typeof body).toBe("object");
  });

  test("contract has required fields", async ({ request }) => {
    const response = await request.get("/api/openclaw/contract");
    const contract = await response.json();

    // Must have version
    expect(contract).toHaveProperty("version");
    expect(typeof contract.version).toBe("string");
    expect(contract.version).toMatch(/^\d+\.\d+\.\d+$/);

    // Must have commands array
    expect(contract).toHaveProperty("commands");
    expect(Array.isArray(contract.commands)).toBe(true);
    expect(contract.commands.length).toBeGreaterThan(0);

    // Must have webhooks array
    expect(contract).toHaveProperty("webhooks");
    expect(Array.isArray(contract.webhooks)).toBe(true);
    expect(contract.webhooks.length).toBeGreaterThan(0);

    // Must have name and description
    expect(contract).toHaveProperty("name");
    expect(contract).toHaveProperty("description");
  });

  test("each command has name, endpoint, method, requestSchema, responseSchema", async ({
    request,
  }) => {
    const response = await request.get("/api/openclaw/contract");
    const contract = await response.json();

    for (const command of contract.commands) {
      expect(command).toHaveProperty("name");
      expect(typeof command.name).toBe("string");
      expect(command.name.length).toBeGreaterThan(0);

      expect(command).toHaveProperty("endpoint");
      expect(typeof command.endpoint).toBe("string");
      expect(command.endpoint).toMatch(/^\/api\//);

      expect(command).toHaveProperty("method");
      expect(typeof command.method).toBe("string");
      expect(["GET", "POST", "PUT", "DELETE", "PATCH"]).toContain(command.method);

      expect(command).toHaveProperty("requestSchema");
      expect(typeof command.requestSchema).toBe("object");
      expect(command.requestSchema).toHaveProperty("type");

      expect(command).toHaveProperty("responseSchema");
      expect(typeof command.responseSchema).toBe("object");
      expect(command.responseSchema).toHaveProperty("type");

      // Each command should have a description
      expect(command).toHaveProperty("description");
      expect(typeof command.description).toBe("string");
    }
  });

  test("webhook endpoints have correct structure", async ({ request }) => {
    const response = await request.get("/api/openclaw/contract");
    const contract = await response.json();

    for (const webhook of contract.webhooks) {
      // Must have endpoint
      expect(webhook).toHaveProperty("endpoint");
      expect(typeof webhook.endpoint).toBe("string");
      expect(webhook.endpoint).toMatch(/^\/api\/openclaw\/webhook\//);

      // Must have method
      expect(webhook).toHaveProperty("method");
      expect(webhook.method).toBe("POST");

      // Must have headers with X-OPENCLAW-SECRET
      expect(webhook).toHaveProperty("headers");
      expect(webhook.headers).toHaveProperty("X-OPENCLAW-SECRET");

      // Must have payloadSchema
      expect(webhook).toHaveProperty("payloadSchema");
      expect(typeof webhook.payloadSchema).toBe("object");
      expect(webhook.payloadSchema).toHaveProperty("type", "object");
      expect(webhook.payloadSchema).toHaveProperty("properties");
      expect(webhook.payloadSchema).toHaveProperty("required");
      expect(Array.isArray(webhook.payloadSchema.required)).toBe(true);

      // Must have description
      expect(webhook).toHaveProperty("description");
      expect(typeof webhook.description).toBe("string");
    }
  });

  test("contract includes specific known commands", async ({ request }) => {
    const response = await request.get("/api/openclaw/contract");
    const contract = await response.json();

    const commandNames = contract.commands.map(
      (c: { name: string }) => c.name
    );

    expect(commandNames).toContain("openclaw.health");
    expect(commandNames).toContain("repo.scan");
    expect(commandNames).toContain("md.index");
    expect(commandNames).toContain("routes.validate");
    expect(commandNames).toContain("tests.run");
    expect(commandNames).toContain("wiring.export");
    expect(commandNames).toContain("task.sync");
  });

  test("contract includes dispatch and health endpoints", async ({
    request,
  }) => {
    const response = await request.get("/api/openclaw/contract");
    const contract = await response.json();

    // Dispatch endpoint
    expect(contract).toHaveProperty("dispatch");
    expect(contract.dispatch).toHaveProperty("endpoint", "/api/openclaw/dispatch");
    expect(contract.dispatch).toHaveProperty("method", "POST");
    expect(contract.dispatch).toHaveProperty("headers");

    // Health endpoint
    expect(contract).toHaveProperty("health");
    expect(contract.health).toHaveProperty("endpoint", "/api/openclaw/health");
    expect(contract.health).toHaveProperty("method", "GET");
  });

  test("webhook payloads have expected fields", async ({ request }) => {
    const response = await request.get("/api/openclaw/contract");
    const contract = await response.json();

    // Find job-status webhook
    const jobStatusWebhook = contract.webhooks.find(
      (w: { endpoint: string }) => w.endpoint === "/api/openclaw/webhook/job-status"
    );
    expect(jobStatusWebhook).toBeDefined();
    expect(jobStatusWebhook.payloadSchema.properties).toHaveProperty("jobId");
    expect(jobStatusWebhook.payloadSchema.properties).toHaveProperty("status");
    expect(jobStatusWebhook.payloadSchema.required).toContain("jobId");
    expect(jobStatusWebhook.payloadSchema.required).toContain("status");

    // Find log webhook
    const logWebhook = contract.webhooks.find(
      (w: { endpoint: string }) => w.endpoint === "/api/openclaw/webhook/log"
    );
    expect(logWebhook).toBeDefined();
    expect(logWebhook.payloadSchema.properties).toHaveProperty("jobId");
    expect(logWebhook.payloadSchema.properties).toHaveProperty("level");
    expect(logWebhook.payloadSchema.properties).toHaveProperty("message");
    expect(logWebhook.payloadSchema.required).toContain("jobId");
    expect(logWebhook.payloadSchema.required).toContain("level");
    expect(logWebhook.payloadSchema.required).toContain("message");
  });
});
