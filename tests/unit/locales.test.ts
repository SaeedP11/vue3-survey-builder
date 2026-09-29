import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, test } from "vitest";
import * as groups from "../../src/locales/index.ts";
import type { ScoreDisplayVariant } from "../../src/types/index.ts";

type Messages = Record<string, unknown>;

const SRC = join(__dirname, "../../src");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

/** Dotted paths of every leaf message. */
function leaves(messages: Messages, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === "object" && !Array.isArray(value)
      ? leaves(value as Messages, path)
      : [path];
  });
}

function lookup(messages: Messages, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((node, key) => (node as Messages | undefined)?.[key], messages);
}

describe("en and fa have the same keys", () => {
  for (const [name, group] of Object.entries(groups)) {
    test(name, () => {
      const { en, fa } = group as { en: Messages; fa: Messages };
      expect(leaves(fa).sort()).toEqual(leaves(en).sort());
    });
  }
});

test("no message is empty", () => {
  for (const [name, group] of Object.entries(groups)) {
    for (const [locale, messages] of Object.entries(group as Record<string, Messages>)) {
      for (const path of leaves(messages)) {
        const value = lookup(messages, path);
        const empty = Array.isArray(value) ? value.length === 0 : !value;
        expect(empty, `${name}.${locale}: ${path}`).toBe(false);
      }
    }
  }
});

/*
 * Every t("key") a component calls must exist, in both languages, in the
 * group it loads with useLocalI18n(group). A missing key renders as the key.
 */
describe("every key a component translates exists", () => {
  const vueFiles = files(SRC).filter((f) => f.endsWith(".vue"));
  const usingI18n = vueFiles.filter((f) => /useLocalI18n\(/.test(readFileSync(f, "utf8")));

  test("the scan finds the components", () => {
    expect(usingI18n.length).toBeGreaterThanOrEqual(9);
  });

  for (const file of usingI18n) {
    test(relative(SRC, file), () => {
      const source = readFileSync(file, "utf8");
      const groupName = source.match(/useLocalI18n\((\w+)\)/)?.[1];
      const group = (groups as Record<string, { en: Messages; fa: Messages }>)[groupName!];
      expect(group, `unknown locale group ${groupName}`).toBeDefined();

      const keys = [...source.matchAll(/\bt\(\s*(["'`])((?:(?!\1).)+)\1/g)].map((m) => m[2]);
      expect(keys.length, "no t() calls found").toBeGreaterThan(0);

      for (const key of keys) {
        for (const locale of ["en", "fa"] as const) {
          if (key.includes("${")) {
            // A computed key: its fixed prefix must name a group of messages
            const prefix = key.slice(0, key.indexOf("${")).replace(/\.$/, "");
            const node = lookup(group[locale], prefix);
            expect(typeof node, `${locale}: ${prefix}.*`).toBe("object");
          } else {
            expect(lookup(group[locale], key), `${locale}: ${key}`).toBeDefined();
          }
        }
      }
    });
  }
});

test("every score display has a label", () => {
  const variants: ScoreDisplayVariant[] = [
    "default",
    "linear",
    "radial",
    "temperature",
    "donut",
    "bullet",
    "thermometer",
    "pills",
    "table",
  ];
  for (const locale of ["en", "fa"] as const) {
    for (const v of variants) {
      expect(
        lookup(groups.surveyResultEditor[locale], `options.scoreDisplay.${v}`),
        `${locale}: ${v}`,
      ).toBeTruthy();
    }
  }
});

test("status labels are a non-empty list in every language", () => {
  for (const locale of ["en", "fa"] as const) {
    const labels = groups.surveyResult[locale].statusLabels;
    expect(Array.isArray(labels) && labels.length > 0).toBe(true);
  }
});
