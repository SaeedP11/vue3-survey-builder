import { expect, question, test, type Playground } from "./fixtures.ts";
import type { Page } from "@playwright/test";

/** The result editor, opened on the heart-risk sample. */
async function openEditor(playground: Playground, page: Page) {
  await playground.loadSample("Heart risk (result template)");
  await playground.toolbarButton("Edit result template").click();
  const dialog = page.locator(".fixed.inset-0").filter({ hasText: "Edit result template" });
  await expect(dialog).toBeVisible();
  return {
    dialog,
    /** A block on the preview, by its id. */
    canvas: (id: string) => dialog.locator(`.fb-canvas-block[data-block-id="${id}"]`),
    /** The preview's blocks, top to bottom, by id. */
    canvasOrder: () =>
      dialog.locator(".fb-canvas-block").evaluateAll((els) => els.map((el) => el.getAttribute("data-block-id"))),
    /** The Layout panel's rows, top to bottom, by id. */
    panelOrder: () =>
      dialog.locator("li[data-block-id]").evaluateAll((els) => els.map((el) => el.getAttribute("data-block-id"))),
    row: (id: string) => dialog.locator(`li[data-block-id="${id}"]`),
    save: async () => {
      await dialog.getByRole("button", { name: "Save", exact: true }).click();
      await expect(dialog).toBeHidden();
      await expect(playground.events().filter({ hasText: "autosave" })).toHaveCount(1);
    },
  };
}

type Layout = { id: string; type: string; html?: string; hidden?: boolean }[];

test.describe("result page layout", () => {
  test("the preview shows the sample's blocks in its layout's order", async ({ playground, page }) => {
    const { canvasOrder, panelOrder } = await openEditor(playground, page);
    // Every block of the layout with something to show; the panel lists them all
    await expect.poll(canvasOrder).toEqual(["hero", "score", "html-summary", "html-high", "note", "divider-1", "actions"]);
    await expect.poll(panelOrder).toEqual(["hero", "score", "html-summary", "html-high", "note", "divider-1", "actions"]);
  });

  test("a block dragged on the preview moves there and in the panel, and is saved", async ({ playground, page }) => {
    const { canvas, canvasOrder, panelOrder, save } = await openEditor(playground, page);
    // The hero onto the lower half of the score: after it. Both are in view, as
    // Playwright scrolling mid-drag would pick up whatever then sits under the pointer
    const box = (await canvas("score").boundingBox())!;
    await canvas("hero").dragTo(canvas("score"), { targetPosition: { x: 40, y: box.height - 10 } });
    const moved = ["score", "hero", "html-summary", "html-high", "note", "divider-1", "actions"];
    await expect.poll(canvasOrder).toEqual(moved);
    await expect.poll(panelOrder).toEqual(moved);

    await save();
    const json = await playground.json();
    expect((json.resultTemplate as { layout: Layout }).layout.map((b) => b.id)).toEqual(moved);
  });

  test("a row dragged in the Layout panel moves the preview's block", async ({ playground, page }) => {
    const { row, canvasOrder } = await openEditor(playground, page);
    const handle = row("note").locator("[draggable=true]");
    await handle.dragTo(row("hero"), { targetPosition: { x: 20, y: 4 } });
    await expect.poll(canvasOrder).toEqual(["note", "hero", "score", "html-summary", "html-high", "divider-1", "actions"]);
  });

  test("an HTML block dragged in from the palette is sanitized on the preview", async ({ playground, page }) => {
    const { dialog, canvas, canvasOrder, save } = await openEditor(playground, page);
    await dialog.locator('[data-palette="html"]').dragTo(canvas("score"), { targetPosition: { x: 40, y: 10 } });
    // It lands before the score, selected, with its editor open
    const order = await canvasOrder();
    const added = order[order.indexOf("score") - 1]!;
    expect(added).toMatch(/^html-/);
    await expect(canvas(added)).toHaveAttribute("aria-current", "true");

    const textarea = dialog.locator(`li[data-block-id="${added}"] textarea`);
    await textarea.fill('<h3 id="t">Booked?</h3><p onclick="alert(1)">Call <a href="javascript:alert(1)">us</a></p><script>alert(1)</script><button>Go</button>');
    const block = canvas(added).locator(".fb-result-html");
    await expect(block.locator("h3")).toHaveText("Booked?");
    await expect(block.locator("script, button, [onclick]")).toHaveCount(0);
    await expect(block.locator("a")).not.toHaveAttribute("href", /.*/);

    // A value inserted at the cursor
    await textarea.press("End");
    await dialog.getByRole("button", { name: "{$status}", exact: true }).click();
    await expect(textarea).toHaveValue(/\{\$status\}$/);

    await save();
    const json = await playground.json();
    const html = (json.resultTemplate as { layout: Layout }).layout.find((b) => b.id === added);
    expect(html?.html).toContain("{$status}");
  });

  test("a block hidden on the preview stays there dimmed, and is saved hidden", async ({ playground, page }) => {
    const { canvas, save } = await openEditor(playground, page);
    await canvas("note").hover();
    await canvas("note").getByRole("button", { name: "Hide on the result page: Note" }).click();
    await expect(canvas("note")).toContainText("Hidden");
    await save();
    const json = await playground.json();
    expect((json.resultTemplate as { layout: Layout }).layout.find((b) => b.id === "note")).toEqual({
      id: "note",
      type: "note",
      hidden: true,
    });
  });

  test("a focused block moves with Alt+arrows", async ({ playground, page }) => {
    const { canvas, canvasOrder } = await openEditor(playground, page);
    await canvas("score").focus();
    await page.keyboard.press("Alt+ArrowUp");
    await expect.poll(canvasOrder).toEqual(["score", "hero", "html-summary", "html-high", "note", "divider-1", "actions"]);
  });

  test("a respondent sees the blocks for their tier, filled from their answers", async ({ playground, page }) => {
    await playground.loadSample("Heart risk (result template)");
    await playground.creatorTab("Preview");
    // 60, a smoker, 150 mmHg, rarely active: 20 + 25 + 25 + 20 = 90, the top tier
    await question(page, "Age").locator("input").fill("60");
    await question(page, "Do you smoke?").getByText("Yes").click();
    await question(page, "Systolic").locator("input").fill("150");
    await question(page, "How often do you exercise?").getByText("Rarely").click();
    await page.getByRole("button", { name: "Complete" }).click();

    const result = page.locator(".fb-result-html");
    await expect(result.first()).toContainText("Your score is 90: Very high risk.");
    await expect(result.nth(1)).toContainText("At 60, a reading of 150 mmHg");
    // The editor's chrome is not there for respondents
    await expect(page.locator(".fb-canvas-block")).toHaveCount(0);
  });

  test("a lower score leaves the top tier's block out", async ({ playground, page }) => {
    await playground.loadSample("Heart risk (result template)");
    await playground.creatorTab("Preview");
    // 30, a non-smoker, 110 mmHg, active: 0
    await question(page, "Age").locator("input").fill("30");
    await question(page, "Do you smoke?").getByText("No").click();
    await question(page, "Systolic").locator("input").fill("110");
    await question(page, "How often do you exercise?").getByText("Three times a week or more").click();
    await page.getByRole("button", { name: "Complete" }).click();

    await expect(page.locator(".fb-result-html").first()).toContainText("Your score is 0: Low risk.");
    await expect(page.locator(".fb-result-html")).toHaveCount(1);
  });
});
