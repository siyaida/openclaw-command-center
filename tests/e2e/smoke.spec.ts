import { test, expect } from "@playwright/test";

const TEST_USER = {
  email: `smoke-test-${Date.now()}@example.com`,
  password: "TestPassword123!",
  name: "Smoke Test User",
};

test.describe("Smoke Tests", () => {
  test("can load login page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/OpenClaw|Command Center|Login|Sign/i);
  });

  test("can register a new user", async ({ page }) => {
    await page.goto("/");

    // Look for a register/sign-up link or navigate directly
    const registerLink = page.getByRole("link", { name: /register|sign up|create account/i });
    if (await registerLink.isVisible()) {
      await registerLink.click();
    } else {
      await page.goto("/register");
    }

    // Fill registration form
    await page.getByLabel(/name/i).fill(TEST_USER.name);
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).first().fill(TEST_USER.password);

    // Check for confirm password field
    const confirmPassword = page.getByLabel(/confirm password/i);
    if (await confirmPassword.isVisible()) {
      await confirmPassword.fill(TEST_USER.password);
    }

    // Submit
    await page.getByRole("button", { name: /register|sign up|create/i }).click();

    // Should redirect to dashboard/boards or login page
    await expect(page).toHaveURL(/\/(boards|dashboard|login|$)/);
  });

  test("can login", async ({ page }) => {
    // First register
    await page.goto("/register");
    const loginEmail = `login-test-${Date.now()}@example.com`;
    await page.getByLabel(/name/i).fill("Login Test");
    await page.getByLabel(/email/i).fill(loginEmail);
    await page.getByLabel(/password/i).first().fill(TEST_USER.password);
    const confirmPassword = page.getByLabel(/confirm password/i);
    if (await confirmPassword.isVisible()) {
      await confirmPassword.fill(TEST_USER.password);
    }
    await page.getByRole("button", { name: /register|sign up|create/i }).click();
    await page.waitForURL(/\/(boards|dashboard|login|$)/);

    // If redirected to login, sign in
    if (page.url().includes("login") || page.url().endsWith("/")) {
      await page.goto("/login");
      await page.getByLabel(/email/i).fill(loginEmail);
      await page.getByLabel(/password/i).fill(TEST_USER.password);
      await page.getByRole("button", { name: /sign in|log in|login/i }).click();
      await page.waitForURL(/\/(boards|dashboard)/);
    }

    // Should be on the boards/dashboard page
    await expect(page).toHaveURL(/\/(boards|dashboard)/);
  });

  test("can see boards page", async ({ page }) => {
    // Register and login
    const email = `boards-test-${Date.now()}@example.com`;
    await page.goto("/register");
    await page.getByLabel(/name/i).fill("Boards Test");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).first().fill(TEST_USER.password);
    const confirmPassword = page.getByLabel(/confirm password/i);
    if (await confirmPassword.isVisible()) {
      await confirmPassword.fill(TEST_USER.password);
    }
    await page.getByRole("button", { name: /register|sign up|create/i }).click();
    await page.waitForURL(/\/(boards|dashboard|login|$)/);

    if (page.url().includes("login") || page.url().endsWith("/")) {
      await page.goto("/login");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(TEST_USER.password);
      await page.getByRole("button", { name: /sign in|log in|login/i }).click();
      await page.waitForURL(/\/(boards|dashboard)/);
    }

    // Should see board content (default board is "My First Board")
    await expect(page.getByText(/board|my first board/i).first()).toBeVisible();
  });

  test("can create a board", async ({ page }) => {
    // Register and login
    const email = `create-board-${Date.now()}@example.com`;
    await page.goto("/register");
    await page.getByLabel(/name/i).fill("Board Creator");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).first().fill(TEST_USER.password);
    const confirmPassword = page.getByLabel(/confirm password/i);
    if (await confirmPassword.isVisible()) {
      await confirmPassword.fill(TEST_USER.password);
    }
    await page.getByRole("button", { name: /register|sign up|create/i }).click();
    await page.waitForURL(/\/(boards|dashboard|login|$)/);

    if (page.url().includes("login") || page.url().endsWith("/")) {
      await page.goto("/login");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(TEST_USER.password);
      await page.getByRole("button", { name: /sign in|log in|login/i }).click();
      await page.waitForURL(/\/(boards|dashboard)/);
    }

    // Click create board button
    const createButton = page.getByRole("button", { name: /new board|create board|add board/i });
    await createButton.click();

    // Fill in board title
    const titleInput = page.getByLabel(/title|name|board name/i);
    await titleInput.fill("Test Board E2E");

    // Submit
    const submitButton = page.getByRole("button", { name: /create|save|add/i });
    await submitButton.click();

    // Should see the new board
    await expect(page.getByText("Test Board E2E")).toBeVisible();
  });

  test("can see kanban board with default columns", async ({ page }) => {
    // Register and login
    const email = `kanban-test-${Date.now()}@example.com`;
    await page.goto("/register");
    await page.getByLabel(/name/i).fill("Kanban Test");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).first().fill(TEST_USER.password);
    const confirmPassword = page.getByLabel(/confirm password/i);
    if (await confirmPassword.isVisible()) {
      await confirmPassword.fill(TEST_USER.password);
    }
    await page.getByRole("button", { name: /register|sign up|create/i }).click();
    await page.waitForURL(/\/(boards|dashboard|login|$)/);

    if (page.url().includes("login") || page.url().endsWith("/")) {
      await page.goto("/login");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(TEST_USER.password);
      await page.getByRole("button", { name: /sign in|log in|login/i }).click();
      await page.waitForURL(/\/(boards|dashboard)/);
    }

    // Navigate to the first board (My First Board is created on registration)
    const boardLink = page.getByText(/my first board/i).first();
    if (await boardLink.isVisible()) {
      await boardLink.click();
    }

    // Should see default columns
    await expect(page.getByText("To Do")).toBeVisible();
    await expect(page.getByText("In Progress")).toBeVisible();
    await expect(page.getByText("Done")).toBeVisible();
  });

  test("can create a task", async ({ page }) => {
    // Register and login
    const email = `task-test-${Date.now()}@example.com`;
    await page.goto("/register");
    await page.getByLabel(/name/i).fill("Task Creator");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).first().fill(TEST_USER.password);
    const confirmPassword = page.getByLabel(/confirm password/i);
    if (await confirmPassword.isVisible()) {
      await confirmPassword.fill(TEST_USER.password);
    }
    await page.getByRole("button", { name: /register|sign up|create/i }).click();
    await page.waitForURL(/\/(boards|dashboard|login|$)/);

    if (page.url().includes("login") || page.url().endsWith("/")) {
      await page.goto("/login");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(TEST_USER.password);
      await page.getByRole("button", { name: /sign in|log in|login/i }).click();
      await page.waitForURL(/\/(boards|dashboard)/);
    }

    // Navigate to board
    const boardLink = page.getByText(/my first board/i).first();
    if (await boardLink.isVisible()) {
      await boardLink.click();
    }

    // Click add task button (typically in the "To Do" column)
    const addTaskButton = page.getByRole("button", { name: /add task|new task|\+/i }).first();
    await addTaskButton.click();

    // Fill task title
    const taskTitleInput = page.getByLabel(/title|task name/i);
    await taskTitleInput.fill("E2E Test Task");

    // Submit
    const saveButton = page.getByRole("button", { name: /create|save|add/i });
    await saveButton.click();

    // Should see the task in the board
    await expect(page.getByText("E2E Test Task")).toBeVisible();
  });

  test("command center panel opens", async ({ page }) => {
    // Register and login
    const email = `cmd-test-${Date.now()}@example.com`;
    await page.goto("/register");
    await page.getByLabel(/name/i).fill("CMD Test");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).first().fill(TEST_USER.password);
    const confirmPassword = page.getByLabel(/confirm password/i);
    if (await confirmPassword.isVisible()) {
      await confirmPassword.fill(TEST_USER.password);
    }
    await page.getByRole("button", { name: /register|sign up|create/i }).click();
    await page.waitForURL(/\/(boards|dashboard|login|$)/);

    if (page.url().includes("login") || page.url().endsWith("/")) {
      await page.goto("/login");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(TEST_USER.password);
      await page.getByRole("button", { name: /sign in|log in|login/i }).click();
      await page.waitForURL(/\/(boards|dashboard)/);
    }

    // Click the command center / terminal button
    const cmdButton = page.getByRole("button", { name: /command|terminal|console/i });
    if (await cmdButton.isVisible()) {
      await cmdButton.click();
    }

    // Should see the command center panel with input area
    await expect(
      page.getByPlaceholder(/command|type.*command|enter/i).or(
        page.getByRole("textbox", { name: /command/i })
      )
    ).toBeVisible();
  });

  test("can run openclaw.health in mock mode", async ({ page }) => {
    // Register and login
    const email = `health-test-${Date.now()}@example.com`;
    await page.goto("/register");
    await page.getByLabel(/name/i).fill("Health Test");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).first().fill(TEST_USER.password);
    const confirmPassword = page.getByLabel(/confirm password/i);
    if (await confirmPassword.isVisible()) {
      await confirmPassword.fill(TEST_USER.password);
    }
    await page.getByRole("button", { name: /register|sign up|create/i }).click();
    await page.waitForURL(/\/(boards|dashboard|login|$)/);

    if (page.url().includes("login") || page.url().endsWith("/")) {
      await page.goto("/login");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(TEST_USER.password);
      await page.getByRole("button", { name: /sign in|log in|login/i }).click();
      await page.waitForURL(/\/(boards|dashboard)/);
    }

    // Open command center
    const cmdButton = page.getByRole("button", { name: /command|terminal|console/i });
    if (await cmdButton.isVisible()) {
      await cmdButton.click();
    }

    // Type and run the health command
    const cmdInput = page.getByPlaceholder(/command|type.*command|enter/i).or(
      page.getByRole("textbox", { name: /command/i })
    );
    await cmdInput.fill("openclaw.health");
    await cmdInput.press("Enter");

    // Should see a success response with "ok" or "mock"
    await expect(
      page.getByText(/ok|success|mock|connected/i).first()
    ).toBeVisible({ timeout: 10000 });
  });
});
