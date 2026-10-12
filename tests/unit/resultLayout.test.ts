import { describe, expect, test } from "vitest";
import type { ResultBlock } from "../../src/types/index.ts";
import {
  MAX_BLOCKS,
  MAX_HTML_LENGTH,
  blockShownFor,
  builtInId,
  createBlock,
  defaultLayout,
  dropBlock,
  htmlBlockName,
  insertBlock,
  isBuiltIn,
  missingBlocks,
  moveBlock,
  resolveLayout,
} from "../../src/utils/resultLayout.ts";

const ids = (layout: ResultBlock[]) => layout.map((b) => b.id);

describe("defaultLayout", () => {
  test("is the page's order from before layouts", () => {
    expect(ids(defaultLayout())).toEqual([
      "images-banner",
      "hero",
      "score",
      "images-afterScore",
      "note",
      "images-beforeActions",
      "actions",
    ]);
    expect(defaultLayout().filter((b) => b.type === "images").map((b) => b.placement)).toEqual([
      "banner",
      "afterScore",
      "beforeActions",
    ]);
  });

  test("is a fresh copy each time", () => {
    const layout = defaultLayout();
    layout[0].hidden = true;
    expect(defaultLayout()[0].hidden).toBeUndefined();
  });

  test("holds only built-in blocks", () => {
    expect(defaultLayout().every(isBuiltIn)).toBe(true);
    expect(isBuiltIn({ type: "html" })).toBe(false);
    expect(isBuiltIn({ type: "divider" })).toBe(false);
  });
});

describe("resolveLayout", () => {
  test("gives the standard order without a layout", () => {
    for (const missing of [undefined, null, "x", 3, {}]) {
      expect(resolveLayout(missing)).toEqual(defaultLayout());
    }
  });

  test("keeps an empty layout empty", () => {
    expect(resolveLayout([])).toEqual([]);
  });

  test("keeps the stored order and the author's blocks", () => {
    const layout = resolveLayout([
      { id: "actions", type: "actions" },
      { id: "h1", type: "html", html: "<p>Hi</p>" },
      { id: "score", type: "score" },
      { id: "d1", type: "divider" },
    ]);
    expect(ids(layout)).toEqual(["actions", "h1", "score", "d1"]);
    expect(layout[1].html).toBe("<p>Hi</p>");
  });

  test("drops unknown blocks and entries that are not blocks", () => {
    const layout = resolveLayout([
      null,
      "hero",
      { type: "video" },
      { id: "hero", type: "hero" },
      { type: "images" },
      { type: "images", placement: "sidebar" },
    ]);
    expect(ids(layout)).toEqual(["hero"]);
  });

  test("shows a built-in block once, under its own id", () => {
    const layout = resolveLayout([
      { id: "anything", type: "score" },
      { id: "again", type: "score" },
      { type: "images", placement: "banner" },
      { type: "images", placement: "banner" },
    ]);
    expect(ids(layout)).toEqual(["score", "images-banner"]);
  });

  test("gives the author's blocks unique ids, never a built-in one", () => {
    const layout = resolveLayout([
      { id: "x", type: "html" },
      { id: "x", type: "divider" },
      { type: "html" },
      { id: "images-banner", type: "html" },
      { type: "images", placement: "banner" },
      { id: "score", type: "divider" },
    ]);
    const all = ids(layout);
    expect(new Set(all).size).toBe(all.length);
    expect(all).toContain("images-banner");
    expect(layout.find((b) => b.id === "images-banner")?.type).toBe("images");
    expect(layout.filter((b) => b.type === "score")).toHaveLength(0);
  });

  test("gives a block without an id the same id on every read", () => {
    const stored = [{ type: "html", html: "a" }, { type: "divider" }];
    expect(ids(resolveLayout(stored))).toEqual(ids(resolveLayout(stored)));
  });

  test("keeps hidden and a valid tier, and nothing it does not know", () => {
    const [block] = resolveLayout([
      { id: "h", type: "html", html: "x", hidden: true, tier: 2, onclick: "x", placement: "banner" },
    ]);
    expect(block).toEqual({ id: "h", type: "html", html: "x", hidden: true, tier: 2 });
  });

  test("ignores a tier that is not a tier", () => {
    for (const tier of [-1, 1.5, "1", null, Number.NaN]) {
      expect(resolveLayout([{ id: "n", type: "note", tier }])[0].tier).toBeUndefined();
    }
  });

  test("gives an HTML block a string, cut to the maximum length", () => {
    expect(resolveLayout([{ id: "h", type: "html" }])[0].html).toBe("");
    expect(resolveLayout([{ id: "h", type: "html", html: 5 }])[0].html).toBe("");
    const long = "a".repeat(MAX_HTML_LENGTH + 10);
    expect(resolveLayout([{ id: "h", type: "html", html: long }])[0].html).toHaveLength(MAX_HTML_LENGTH);
  });

  test("holds at most MAX_BLOCKS blocks", () => {
    const many = Array.from({ length: MAX_BLOCKS + 5 }, (_, i) => ({ id: `d${i}`, type: "divider" }));
    expect(resolveLayout(many)).toHaveLength(MAX_BLOCKS);
  });
});

describe("missingBlocks", () => {
  test("lists the built-in blocks left out, in the standard order", () => {
    const layout = resolveLayout([
      { id: "score", type: "score" },
      { id: "h", type: "html" },
    ]);
    expect(ids(missingBlocks(layout))).toEqual([
      "images-banner",
      "hero",
      "images-afterScore",
      "note",
      "images-beforeActions",
      "actions",
    ]);
    expect(missingBlocks(defaultLayout())).toEqual([]);
  });
});

describe("createBlock", () => {
  test("makes a built-in block under its id", () => {
    expect(createBlock("note")).toEqual({ id: "note", type: "note" });
    expect(createBlock("images", { placement: "banner" })).toEqual({
      id: "images-banner",
      type: "images",
      placement: "banner",
    });
    expect(builtInId("images", "beforeActions")).toBe("images-beforeActions");
  });

  test("makes the author's blocks with fresh ids", () => {
    const a = createBlock("html", { html: "<p>x</p>" });
    const b = createBlock("html");
    expect(a).toMatchObject({ type: "html", html: "<p>x</p>" });
    expect(b.html).toBe("");
    expect(a.id).not.toBe(b.id);
    expect(createBlock("divider")).toMatchObject({ type: "divider" });
  });
});

describe("moveBlock", () => {
  const layout = resolveLayout([
    { id: "a", type: "divider" },
    { id: "b", type: "divider" },
    { id: "c", type: "divider" },
    { id: "d", type: "divider" },
  ]);

  test("puts the block before the one at the target index", () => {
    expect(ids(moveBlock(layout, 0, 2))).toEqual(["b", "a", "c", "d"]);
    expect(ids(moveBlock(layout, 3, 1))).toEqual(["a", "d", "b", "c"]);
    expect(ids(moveBlock(layout, 1, 0))).toEqual(["b", "a", "c", "d"]);
  });

  test("puts the block last at the length", () => {
    expect(ids(moveBlock(layout, 0, 4))).toEqual(["b", "c", "d", "a"]);
  });

  test("returns the same layout when nothing moves", () => {
    expect(moveBlock(layout, 1, 1)).toBe(layout);
    expect(moveBlock(layout, 1, 2)).toBe(layout);
    expect(moveBlock(layout, -1, 2)).toBe(layout);
    expect(moveBlock(layout, 4, 0)).toBe(layout);
    expect(moveBlock(layout, 0, 5)).toBe(layout);
  });

  test("leaves the layout it was given alone", () => {
    moveBlock(layout, 0, 3);
    expect(ids(layout)).toEqual(["a", "b", "c", "d"]);
  });
});

describe("insertBlock", () => {
  const layout = resolveLayout([
    { id: "a", type: "divider" },
    { id: "b", type: "divider" },
  ]);

  test("puts the block at the index, or last", () => {
    const block = { id: "n", type: "divider" } as const;
    expect(ids(insertBlock(layout, block, 1))).toEqual(["a", "n", "b"]);
    expect(ids(insertBlock(layout, block))).toEqual(["a", "b", "n"]);
    expect(ids(insertBlock(layout, block, 99))).toEqual(["a", "b", "n"]);
    expect(ids(insertBlock(layout, block, -3))).toEqual(["n", "a", "b"]);
  });

  test("refuses a block already there", () => {
    expect(insertBlock(layout, { id: "a", type: "divider" })).toBe(layout);
  });

  test("refuses a block into a full layout", () => {
    const full = Array.from({ length: MAX_BLOCKS }, (_, i) => ({ id: `d${i}`, type: "divider" as const }));
    expect(insertBlock(full, { id: "n", type: "divider" })).toBe(full);
  });
});

describe("dropBlock", () => {
  const layout = resolveLayout([
    { id: "a", type: "divider" },
    { id: "b", type: "divider" },
    { id: "c", type: "divider" },
  ]);

  test("moves a dragged block", () => {
    expect(ids(dropBlock(layout, { kind: "move", id: "c" }, 0))).toEqual(["c", "a", "b"]);
    expect(ids(dropBlock(layout, { kind: "move", id: "a" }, 3))).toEqual(["b", "c", "a"]);
  });

  test("adds a block from the palette", () => {
    const block = { id: "n", type: "html", html: "" } as const;
    expect(ids(dropBlock(layout, { kind: "add", block }, 1))).toEqual(["a", "n", "b", "c"]);
  });

  test("ignores a block that is gone", () => {
    expect(dropBlock(layout, { kind: "move", id: "zz" }, 0)).toBe(layout);
  });
});

describe("blockShownFor", () => {
  test("hides a hidden block", () => {
    expect(blockShownFor({ id: "a", type: "note", hidden: true }, 0)).toBe(false);
  });

  test("shows a block without a tier for every result", () => {
    expect(blockShownFor({ id: "a", type: "note" }, 0)).toBe(true);
    expect(blockShownFor({ id: "a", type: "note" }, undefined)).toBe(true);
  });

  test("shows a tier's block only in that tier", () => {
    const block: ResultBlock = { id: "a", type: "html", tier: 1 };
    expect(blockShownFor(block, 1)).toBe(true);
    expect(blockShownFor(block, 0)).toBe(false);
    expect(blockShownFor(block, undefined)).toBe(false);
    expect(blockShownFor({ ...block, tier: 0 }, 0)).toBe(true);
  });
});

describe("htmlBlockName", () => {
  test("is the start of the block's text", () => {
    expect(htmlBlockName("<h3>Next  steps</h3>\n<p>Call <b>us</b></p>")).toBe("Next steps Call us");
    expect(htmlBlockName(`<p>${"x".repeat(50)}</p>`)).toBe(`${"x".repeat(39)}…`);
    expect(htmlBlockName("<p>abcdef</p>", 4)).toBe("abc…");
  });

  test("is empty without text", () => {
    expect(htmlBlockName(undefined)).toBe("");
    expect(htmlBlockName('<img src="a.png"><br>')).toBe("");
  });
});
