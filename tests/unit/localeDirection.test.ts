import { describe, expect, test } from "vitest";
import localeDirection from "../../src/utils/localeDirection.ts";

describe("localeDirection", () => {
  test("Persian is right to left, English left to right", () => {
    expect(localeDirection("fa")).toBe("rtl");
    expect(localeDirection("en")).toBe("ltr");
  });

  test("reads the language of a regional locale", () => {
    expect(localeDirection("fa-IR")).toBe("rtl");
    expect(localeDirection("ar_EG")).toBe("rtl");
    expect(localeDirection("en-US")).toBe("ltr");
  });

  test("falls back to left to right for an unknown or empty locale", () => {
    expect(localeDirection("xx")).toBe("ltr");
    expect(localeDirection("")).toBe("ltr");
  });
});
