import { expect, question, test } from "./fixtures.ts";

test.describe("AI assistant", () => {
  test("generates a survey from the prompt", async ({ playground, page }) => {
    await playground.toolbarButton("AI assistant").click();
    const prompt = page.locator("textarea.prompt-textarea");
    await expect(prompt).toBeVisible();
    await prompt.fill("Full name, Email address, Feedback");
    await page.locator("button.submit-button").click();

    // The mock takes 1.5s; the button shows progress meanwhile
    await expect(page.locator("button.submit-button")).toBeDisabled();
    await expect(prompt).toBeHidden();
    await expect(page.locator(".svc-creator")).toContainText("Email address");
    await expect(playground.events().filter({ hasText: "schema returned" })).toHaveCount(1);
  });

  test("a failed request leaves the form as it was", async ({ playground, page }) => {
    await playground.loadSample("Heart risk (result template)");
    await page.getByLabel("AI mock fails").check();
    await playground.toolbarButton("AI assistant").click();
    await page.locator("textarea.prompt-textarea").fill("Replace everything");
    await page.locator("button.submit-button").click();

    await expect(playground.events().filter({ hasText: "AI mock failed" })).toHaveCount(1);
    await expect(page.locator(".svc-creator")).toContainText("Do you smoke?");
  });
});

test.describe("result template editor", () => {
  test("edits and saves the template into the survey JSON", async ({ playground, page }) => {
    await playground.loadSample("Heart risk (result template)");
    await playground.toolbarButton("Edit result template").click();
    const dialog = page.locator(".fixed.inset-0").filter({ hasText: "Edit result template" });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "+ Add status label" }).click();
    const labels = dialog.locator("input[type=text]").filter({ hasNot: page.locator("[placeholder]") });
    await labels.last().fill("Critical");
    await dialog.locator("label", { hasText: /^Title$/ }).locator("..").locator("input").fill("Saved title");
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(dialog).toBeHidden();
    // The creator autosaves the change into v-model after its short delay
    await expect(playground.events().filter({ hasText: "autosave" })).toHaveCount(1);

    const json = await playground.json();
    expect(json.resultTemplate).toMatchObject({ title: "Saved title" });
    expect((json.resultTemplate as { statusLabels: string[] }).statusLabels.at(-1)).toBe("Critical");
  });

  test("its preview shows the chosen display with the fb-* colours applied", async ({ playground, page }) => {
    await playground.loadSample("Heart risk (result template)");
    await playground.toolbarButton("Edit result template").click();
    const shell = page.locator(".bg-fb-shell").first();
    await expect(shell).toBeVisible();
    // The colour comes from the creator theme, not transparent
    const background = await shell.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(background).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("the reminder appears once when a survey has no template", async ({ page }) => {
    const toolbox = page.locator(".svc-toolbox");
    const reminder = page.getByText("Result template is required");

    await toolbox.getByRole("button", { name: "Single-Line Input" }).click();
    await expect(reminder).toBeVisible();
    await page.getByRole("button", { name: "Dismiss" }).click();
    await expect(reminder).toBeHidden();

    // Further autosaves do not bring it back
    await toolbox.getByRole("button", { name: "Long Text" }).click();
    await expect(page.locator(".svc-creator")).toContainText("question2");
    await page.waitForTimeout(1500);
    await expect(reminder).toBeHidden();
  });
});

test.describe("custom question types and logic", () => {
  test.beforeEach(async ({ playground }) => {
    await playground.loadSample("Custom question types and logic");
    await playground.tab("Fill");
  });

  test("the async dropdown searches, pages and selects", async ({ page }) => {
    const dropdown = question(page, "Where do you live?");
    const input = dropdown.locator("input");
    await input.click();
    await expect(dropdown.locator("li.sv-list__item").first()).toBeVisible();
    await input.fill("ira");
    // "ira" is in Iraq, Iran and United Arab Emirates, in the list's order
    await expect(dropdown.locator("li.sv-list__item")).toHaveText(["Iraq", "Iran", "United Arab Emirates"]);
    await dropdown.locator("li.sv-list__item", { hasText: "Iran" }).dispatchEvent("mousedown");
    await expect(input).toHaveValue("Iran");
  });

  test("the custom reminder trigger fires from the survey", async ({ playground, page }) => {
    await question(page, "How satisfied").getByText("1", { exact: true }).click();
    await expect(playground.events().filter({ hasText: "reminder fired" })).toHaveCount(1);
  });

  test("the survey completes and hands back its data", async ({ page }) => {
    const dropdown = question(page, "Where do you live?");
    await dropdown.locator("input").click();
    await dropdown.locator("li.sv-list__item").first().dispatchEvent("mousedown");
    await question(page, "Favourite country").locator("input").fill("Japan");
    await page.getByRole("button", { name: "Complete" }).click();
    await expect(page.getByRole("heading", { name: "Submitted data" })).toBeVisible();
    await expect(page.locator("pre").last()).toContainText('"favourite": "Japan"');
  });

  test("a required question is flagged before completing", async ({ page }) => {
    await page.getByRole("button", { name: "Complete" }).click();
    await expect(question(page, "Where do you live?").locator(".sd-question__erbox")).toBeVisible();
  });
});

test("the survey is translated for respondents in Persian", async ({ playground, page }) => {
  await playground.loadSample("Heart risk (result template)");
  await playground.language("fa");
  await playground.tab("Fill");
  // SurveyJS's own strings (the complete button) come in Persian
  await expect(page.locator(".sd-navigation__complete-btn")).toHaveValue("تکمیل");
});
