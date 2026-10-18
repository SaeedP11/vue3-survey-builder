import { describe, expect, test } from "vitest";
import {
  actionShownFor,
  fillPlaceholders,
  imagesForScore,
  legacyActions,
  resolveActions,
  safeImageSrc,
  safeLinkUrl,
} from "../../src/utils/resultContent.ts";
import { editableProps, getDefaultProps } from "../../src/schemas/templates.ts";
import { surveyResult } from "../../src/locales/index.ts";
import type { ResultAction, ResultImage } from "../../src/types/index.ts";

const COPY = { primaryLabel: "P", secondaryLabel: "S", close: "C" };

describe("legacy buttons", () => {
  test("a template's labels become its three buttons, the locale's when empty", () => {
    expect(
      legacyActions({ primaryLabel: "Book", secondaryLabel: " ", closeLabel: "Done" }, COPY).map(
        (a) => [a.id, a.type, a.variant, a.label],
      ),
    ).toEqual([
      ["primary", "custom", "primary", "Book"],
      ["secondary", "custom", "secondary", "S"],
      ["close", "close", "text", "Done"],
    ]);
  });

  test("a template's own actions win, even when empty", () => {
    expect(resolveActions({ actions: [], primaryLabel: "Book" }, COPY)).toEqual([]);
    expect(resolveActions({ primaryLabel: "Book" }, COPY)).toHaveLength(3);
  });

  test("editing a legacy template turns its labels into buttons and drops them", () => {
    const props = editableProps({ title: "T", primaryLabel: "Book" }, "en");
    expect(props.actions?.[0]).toMatchObject({ id: "primary", label: "Book" });
    expect(props).not.toHaveProperty("primaryLabel");
    expect(props.title).toBe("T");
  });

  test("editing a template with actions keeps them", () => {
    const actions = [{ id: "x", label: "X", type: "close" as const }];
    expect(editableProps({ actions }, "en").actions).toEqual(actions);
  });

  test("a new template starts from the defaults", () => {
    expect(editableProps(undefined, "fa")).toEqual(getDefaultProps("fa"));
    expect(getDefaultProps("fa").actions[2].label).toBe(surveyResult.fa.close);
  });
});

describe("safeLinkUrl", () => {
  test.each([
    "https://example.com",
    "http://example.com/a?b=c",
    "mailto:a@b.test",
    "tel:+98123",
    "/relative/path",
    "page?x=1",
    "#anchor",
  ])("allows %s", (url) => {
    expect(safeLinkUrl(url)).toBe(url);
  });

  test.each([
    "javascript:alert(1)",
    " JavaScript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "data:text/html,x",
    "vbscript:x",
    "",
    undefined,
  ])(
    "refuses %s",
    (url) => {
      expect(safeLinkUrl(url)).toBeUndefined();
    },
  );
});

describe("safeImageSrc", () => {
  test.each([
    "https://img.test/a.png",
    "/img/a.png",
    "blob:https://app.test/123",
    "data:image/png;base64,iVBORw0KGgo=",
  ])("allows %s", (src) => {
    expect(safeImageSrc(src)).toBe(src);
  });

  test.each(["javascript:alert(1)", "data:text/html,x", "data:image/svg+xml,<svg/>", ""])(
    "refuses %s",
    (src) => {
      expect(safeImageSrc(src)).toBeUndefined();
    },
  );
});

describe("fillPlaceholders", () => {
  test("puts in answers, encoded, and empties unknown names", () => {
    expect(
      fillPlaceholders("/r?s={score}&n={ name }&o={obj}&m={missing}", {
        score: 7.5,
        name: "Ali & Sara",
        obj: { a: 1 },
      }),
    ).toBe("/r?s=7.5&n=Ali%20%26%20Sara&o=%7B%22a%22%3A1%7D&m=");
  });

  test("leaves an address without placeholders alone", () => {
    expect(fillPlaceholders("https://x.test/a", { a: 1 })).toBe("https://x.test/a");
  });
});

describe("imagesForScore", () => {
  const images: ResultImage[] = [
    { id: "all", src: "a" },
    { id: "t0", src: "b", tier: 0 },
    { id: "t2", src: "c", tier: 2 },
  ];
  const ids = (list: ResultImage[]) => list.map((i) => i.id);

  test("keeps the images for every result and the score's tier", () => {
    expect(ids(imagesForScore(images, 0, 0, 90, 3))).toEqual(["all", "t0"]);
    expect(ids(imagesForScore(images, 90, 0, 90, 3))).toEqual(["all", "t2"]);
    expect(ids(imagesForScore(images, 45, 0, 90, 3))).toEqual(["all"]);
  });

  test("without a score keeps only the images for every result", () => {
    expect(ids(imagesForScore(images, undefined, 0, 90, 3))).toEqual(["all"]);
  });
});

describe("actionShownFor", () => {
  const action = (over: Partial<ResultAction>): ResultAction => ({
    id: "a",
    label: "A",
    type: "custom",
    ...over,
  });

  test("a button without a condition shows for every result, with or without a score", () => {
    expect(actionShownFor(action({}), 10, 0)).toBe(true);
    expect(actionShownFor(action({}), undefined, undefined)).toBe(true);
  });

  test("a tier's button shows only for that tier", () => {
    expect(actionShownFor(action({ tier: 1 }), 60, 1)).toBe(true);
    expect(actionShownFor(action({ tier: 1 }), 10, 0)).toBe(false);
    // Tier 0 is a condition too, not "unset"
    expect(actionShownFor(action({ tier: 0 }), 60, 1)).toBe(false);
  });

  test("a score range includes its ends, and an open end has no limit", () => {
    const range = action({ scoreMin: 40, scoreMax: 60 });
    expect([39, 40, 60, 61].map((s) => actionShownFor(range, s, 0))).toEqual([false, true, true, false]);
    expect(actionShownFor(action({ scoreMin: 40 }), 1000, 0)).toBe(true);
    expect(actionShownFor(action({ scoreMax: 40 }), -5, 0)).toBe(true);
    expect(actionShownFor(action({ scoreMax: 40 }), 41, 0)).toBe(false);
  });

  test("a button limited to some scores stays hidden without a score", () => {
    expect(actionShownFor(action({ tier: 0 }), undefined, undefined)).toBe(false);
    expect(actionShownFor(action({ scoreMin: 0 }), undefined, undefined)).toBe(false);
  });
});
