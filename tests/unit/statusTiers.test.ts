import { describe, expect, test } from "vitest";
import {
  labelCount,
  pickColor,
  pickLabel,
  tierIndex,
} from "../../src/utils/statusTiers.ts";

describe("tierIndex", () => {
  test("splits the range into equal tiers", () => {
    expect(tierIndex(0, 0, 100, 4)).toBe(0);
    expect(tierIndex(24, 0, 100, 4)).toBe(0);
    expect(tierIndex(25, 0, 100, 4)).toBe(1);
    expect(tierIndex(50, 0, 100, 4)).toBe(2);
    expect(tierIndex(99, 0, 100, 4)).toBe(3);
  });

  test("puts the maximum in the last tier, not one past it", () => {
    expect(tierIndex(100, 0, 100, 4)).toBe(3);
  });

  test("clamps values outside the range", () => {
    expect(tierIndex(-50, 0, 100, 4)).toBe(0);
    expect(tierIndex(500, 0, 100, 4)).toBe(3);
  });

  test("works with a range that does not start at zero", () => {
    expect(tierIndex(60, 50, 150, 2)).toBe(0);
    expect(tierIndex(100, 50, 150, 2)).toBe(1);
  });

  test("returns 0 for one tier or an empty range", () => {
    expect(tierIndex(70, 0, 100, 1)).toBe(0);
    expect(tierIndex(70, 0, 100, 0)).toBe(0);
    expect(tierIndex(70, 50, 50, 4)).toBe(0);
    expect(tierIndex(70, 100, 0, 4)).toBe(0);
  });
});

describe("pickLabel", () => {
  const labels = ["Low", "Mid", "High"];

  test("picks the label at the index", () => {
    expect(pickLabel(labels, 1, "—")).toBe("Mid");
  });

  test("uses the last label past the end", () => {
    expect(pickLabel(labels, 7, "—")).toBe("High");
  });

  test("falls back on empty, missing or non-array labels", () => {
    expect(pickLabel([], 0, "—")).toBe("—");
    expect(pickLabel(undefined, 0, "—")).toBe("—");
    expect(pickLabel("Low", 0, "—")).toBe("—");
  });

  test("falls back on an empty or non-string label", () => {
    expect(pickLabel(["Low", ""], 1, "—")).toBe("—");
    expect(pickLabel(["Low", 3], 1, "—")).toBe("—");
    expect(pickLabel(["Low", ""], 5, "—")).toBe("—");
  });
});

describe("pickColor", () => {
  test("picks by index and clamps to the last colour", () => {
    expect(pickColor(["a", "b"], 0)).toBe("a");
    expect(pickColor(["a", "b"], 5)).toBe("b");
  });

  test("returns an empty string for an empty palette", () => {
    expect(pickColor([], 0)).toBe("");
  });
});

describe("labelCount", () => {
  test("counts array entries and treats anything else as none", () => {
    expect(labelCount(["a", "b"])).toBe(2);
    expect(labelCount(undefined)).toBe(0);
    expect(labelCount("ab")).toBe(0);
  });
});
