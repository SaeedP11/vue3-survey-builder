import { expect, question, test } from "./fixtures.ts";

test("the designer loads, with the library's named toolbar buttons", async ({ playground, page }) => {
  await expect(page.locator(".svc-creator")).toBeVisible();
  await expect(playground.toolbarButton("AI assistant")).toBeVisible();
  await expect(playground.toolbarButton("Edit result template")).toBeVisible();
});

test("a sample loads into the designer and the v-model JSON", async ({ playground, page }) => {
  await playground.loadSample("Heart risk (result template)");
  await expect(page.locator(".svc-creator")).toContainText("Do you smoke?");
  const json = await playground.json();
  expect(json).toMatchObject({ title: "Heart risk check", resultTemplate: { score: "riskScore" } });
});

test("editing in the designer autosaves through v-model", async ({ playground, page }) => {
  // Clicking a toolbox item adds that question
  await page.locator(".svc-toolbox").getByRole("button", { name: "Single-Line Input" }).click();
  await expect(playground.events().filter({ hasText: "autosave" })).toHaveCount(1);
  const json = await playground.json();
  expect(JSON.stringify(json)).toContain("question1");
});

test("JSON applied in the JSON tab loads into the designer", async ({ playground, page }) => {
  await playground.tab("JSON");
  await playground
    .jsonEditor()
    .fill(JSON.stringify({ elements: [{ type: "text", name: "applied", title: "Applied from JSON" }] }));
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.locator(".svc-creator")).toContainText("Applied from JSON");
});

test("the JSON tab rejects invalid JSON", async ({ playground, page }) => {
  await playground.tab("JSON");
  await playground.jsonEditor().fill("{ not json");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.locator(".text-rose-600")).toBeVisible();
});

test("the creator's JSON Editor tab colours the JSON and formats it", async ({ playground, page }) => {
  await playground.loadSample("Heart risk (result template)");
  await playground.creatorTab("JSON Editor");
  const editor = page.locator(".fb-json-editor");
  await expect(editor.locator(".fb-json-key", { hasText: '"title"' }).first()).toBeVisible();

  const textarea = editor.locator("textarea");
  await textarea.fill('{"title":"Compact","pages":[]}');
  await playground.toolbarButton("Format JSON (Shift+Alt+F)").click();
  await expect(textarea).toHaveValue('{\n  "title": "Compact",\n  "pages": []\n}');

  // The browser's undo takes the formatting back
  await textarea.press("Control+z");
  await expect(textarea).toHaveValue('{"title":"Compact","pages":[]}');
  await textarea.press("Shift+Alt+F");
  await expect(textarea).toHaveValue('{\n  "title": "Compact",\n  "pages": []\n}');
});

test("the designer survives a reload with its survey", async ({ playground, page }) => {
  await playground.loadSample("Heart risk (result template)");
  await page.reload();
  await expect(page.locator(".svc-creator")).toContainText("Do you smoke?");
});

test("the preview completes and shows the result template with the score", async ({ playground, page }) => {
  await playground.loadSample("Heart risk (result template)");
  await playground.creatorTab("Preview");

  const preview = page.locator(".svd-simulator-content");
  await question(preview, "Age").locator("input").fill("60");
  await question(preview, "Do you smoke?").getByText("Yes").click();
  await question(preview, "Systolic").locator("input").fill("150");
  await question(preview, "exercise").getByText("Rarely").click();
  await preview.getByRole("button", { name: "Complete" }).click();

  // 25 (smoker) + 20 (over 50) + 25 (over 140) + 20 (rarely) = 90, the max
  await expect(preview).toContainText("Assessment complete");
  await expect(preview).toContainText("Very high");
});

test("switching to Persian turns the page and the designer right-to-left", async ({ playground, page }) => {
  await playground.language("fa");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  // The creator's own UI is translated, and so are the library's buttons
  await expect(page.locator(".svc-creator")).toContainText(/[؀-ۿ]/);
  await expect(page.locator(".svc-creator").getByRole("button", { name: "دستیار هوش مصنوعی" })).toBeVisible();
});

test("dark mode sets the dark class the library follows", async ({ page }) => {
  await page.getByRole("button", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Light" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
