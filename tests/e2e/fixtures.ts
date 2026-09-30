import { test as base, expect, type Locator, type Page } from "@playwright/test";

/** The playground, driven the way a person would. */
export class Playground {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async open() {
    await this.page.goto("/");
    await expect(this.page.locator(".svc-creator")).toBeVisible();
  }

  tab(name: "Designer" | "Fill" | "JSON") {
    return this.page.locator("header nav button", { hasText: name }).click();
  }

  /** The EN/FA switch. Chromium names buttons with CSS text-transform applied. */
  language(code: "en" | "fa") {
    return this.page.getByRole("button", { name: new RegExp(`^${code}$`, "i") }).click();
  }

  async loadSample(name: string) {
    await this.page.getByLabel("Load a sample survey").selectOption({ label: name });
  }

  jsonEditor(): Locator {
    return this.page.getByLabel("Survey JSON");
  }

  /** The survey JSON, from the JSON tab. */
  async json(): Promise<Record<string, unknown>> {
    await this.tab("JSON");
    const text = await this.jsonEditor().inputValue();
    await this.tab("Designer");
    return JSON.parse(text);
  }

  events(): Locator {
    return this.page.locator("aside li");
  }

  /** The creator's own tabs: Designer, Preview, Logic, ... */
  creatorTab(name: string) {
    return this.page.getByRole("tab", { name }).click();
  }

  /** A button the library adds to the creator's toolbar, by its name. */
  toolbarButton(name: "AI assistant" | "Edit result template" | "Format JSON (Shift+Alt+F)"): Locator {
    return this.page.locator(".svc-creator").getByRole("button", { name, exact: true });
  }
}

/** A question in a rendered survey, by (part of) its title. */
export function question(scope: Page | Locator, title: string | RegExp): Locator {
  const page = "page" in scope ? scope.page() : scope;
  // Visible only: the designer stays mounted, hidden, with its own copies
  return scope
    .locator(".sd-question")
    .filter({ has: page.locator(".sd-question__title", { hasText: title }), visible: true });
}

export const test = base.extend<{ playground: Playground }>({
  // auto: every test opens the playground, whether or not it asks for it
  playground: [
    async ({ page }, use) => {
      const playground = new Playground(page);
      // Each test starts from a clean playground, in English and light mode;
      // a reload within the test keeps its state
      await page.addInitScript(() => {
        if (!sessionStorage.getItem("fb-e2e")) {
          localStorage.clear();
          localStorage.setItem("form-builder-playground", JSON.stringify({ locale: "en", dark: false }));
          sessionStorage.setItem("fb-e2e", "1");
        }
      });
      await playground.open();
      await use(playground);
    },
    { auto: true },
  ],
});

export { expect };
