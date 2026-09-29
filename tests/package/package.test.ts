import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, expect, test } from "vitest";
import viteConfig from "../../vite.config.ts";
import { OWN_EXPORTS } from "../publicApi.ts";

const ROOT = join(__dirname, "../..");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

const peers = Object.keys(pkg.peerDependencies);
const deps = Object.keys(pkg.dependencies ?? {});

/** The package a specifier belongs to: "survey-core/themes" -> "survey-core". */
const packageOf = (specifier: string) =>
  specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0];

/** Bare (non-relative) module specifiers imported by an ES module's source. */
const bareImports = (source: string) =>
  [
    ...source.matchAll(/(?:^|[\s;}])(?:import|export)\s[^"'`]*?from\s*["']([^"'./][^"']*)["']/g),
    ...source.matchAll(/(?:^|[\s;])import\s*["']([^"'./][^"']*)["']/g),
  ].map((m) => m[1]);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

describe("package.json", () => {
  test("main, module, types and every export point at files that exist", () => {
    const targets = [
      pkg.main,
      pkg.module,
      pkg.types,
      ...Object.values(pkg.exports).flatMap((entry) =>
        typeof entry === "string" ? [entry] : Object.values(entry as Record<string, string>),
      ),
    ];
    for (const target of targets) {
      expect(existsSync(join(ROOT, target)), target).toBe(true);
    }
  });

  test("exports style.css and tailwind.css", () => {
    expect(pkg.exports["./style.css"]).toBe("./dist/form-builder.css");
    expect(pkg.exports["./tailwind.css"]).toBe("./src/styles/tailwind.css");
  });

  test("every peer dependency is also a dev dependency, so the build and tests have it", () => {
    for (const peer of peers) expect(pkg.devDependencies, peer).toHaveProperty(peer);
  });

  test("every package the source imports is declared", () => {
    const declared = new Set([...peers, ...deps]);
    const sources = files(join(ROOT, "src")).filter((f) => /\.(ts|vue)$/.test(f));
    for (const file of sources) {
      for (const specifier of bareImports(read(relative(ROOT, file)))) {
        expect(declared.has(packageOf(specifier)), `${relative(ROOT, file)}: ${specifier}`).toBe(true);
      }
    }
  });
});

describe("the bundle", () => {
  const external = viteConfig.build!.rollupOptions!.external as (id: string) => boolean;

  test("leaves every peer dependency and its subpaths to the host", () => {
    for (const peer of peers.filter((p) => p !== "tailwindcss")) {
      expect(external(peer), peer).toBe(true);
      expect(external(`${peer}/anything`), `${peer}/anything`).toBe(true);
    }
  });

  test("bundles the peers' stylesheets and everything else", () => {
    expect(external("survey-core/survey-core.css")).toBe(false);
    expect(external("lucide-vue-next")).toBe(false);
    expect(external("./components/FormBuilder.vue")).toBe(false);
  });

  test("the ES build imports only peer dependencies", () => {
    const imports = bareImports(read("dist/form-builder.mjs"));
    expect(imports.length).toBeGreaterThan(0);
    for (const specifier of imports) {
      expect(peers, specifier).toContain(packageOf(specifier));
    }
    for (const needed of ["vue", "vue-i18n", "survey-core", "survey-creator-core"]) {
      expect(imports.map(packageOf), needed).toContain(needed);
    }
  });

  test("the UMD build requires only peer dependencies", () => {
    const required = [...read("dist/form-builder.umd.js").matchAll(/require\(["'`]([^"'`]+)["'`]\)/g)].map(
      (m) => m[1],
    );
    expect(required.length).toBeGreaterThan(0);
    for (const specifier of required) expect(peers, specifier).toContain(packageOf(specifier));
  });

  test("does not contain a copy of SurveyJS or Vue", () => {
    const bundle = read("dist/form-builder.mjs");
    expect(bundle).not.toMatch(/Devsoft Baltic/);
    expect(bundle).not.toMatch(/@vue\/runtime-core/);
    // With the SurveyJS packages external it is under 1.5 MB; bundled, over 4 MB
    expect(bundle.length).toBeLessThan(1.5 * 1024 * 1024);
  });

  test("loads SurveyJS's Persian strings for the designer and the survey", () => {
    const imports = bareImports(read("dist/form-builder.mjs"));
    expect(imports).toContain("survey-core/i18n/persian");
    expect(imports).toContain("survey-creator-core/i18n/persian");
  });
});

describe("style.css", () => {
  const css = read("dist/form-builder.css");

  test("carries SurveyJS's stylesheets", () => {
    expect(css).toContain(".sd-root-modern");
    expect(css).toContain(".svc-creator");
  });

  test("carries the bridge from the --color-formbilder-* variables", () => {
    expect(css).toContain("--color-formbilder-primary");
    expect(css).toContain("--color-formbilder-background");
  });
});

describe("tailwind.css", () => {
  const entry = read("src/styles/tailwind.css");

  test("points Tailwind at the library's sources", () => {
    const source = entry.match(/@source\s+["']([^"']+)["']/)?.[1];
    expect(source).toBeDefined();
    const dir = join(ROOT, "src/styles", source!);
    expect(existsSync(join(dir, "components/FormBuilder.vue"))).toBe(true);
  });

  test("defines every fb-* colour the components use", () => {
    const defined = new Set([...entry.matchAll(/--color-(fb-[a-z-]+):/g)].map((m) => m[1]));
    const used = new Set(
      files(join(ROOT, "src/components"))
        .filter((f) => f.endsWith(".vue"))
        .flatMap((f) => [...readFileSync(f, "utf8").matchAll(/\b(?:bg|text|border|ring|divide|outline|fill|stroke)-(fb-[a-z-]+?)(?=[\s"'/:])/g)])
        .map((m) => m[1]),
    );
    expect(used.size).toBeGreaterThan(5);
    for (const colour of used) expect(defined, colour).toContain(colour);
  });
});

describe("type declarations", () => {
  /*
   * A consumer's TypeScript, strict, importing the package by name: every
   * public export and type must resolve and type-check in use, and the types
   * must be real (the @ts-expect-error lines fail if they were `any`).
   */
  test("type-check a consumer that uses the public API", () => {
    const dir = join(ROOT, "node_modules/.tmp/consumer");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          noEmit: true,
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "bundler",
          lib: ["ES2022", "DOM"],
          types: [],
          skipLibCheck: true,
          paths: { "@yonus_amire01/form-builder": ["../../../dist/types/index.d.ts"] },
        },
        files: ["consumer.ts"],
      }),
    );
    writeFileSync(
      join(dir, "consumer.ts"),
      `import { ref } from "vue";
import {
  ${OWN_EXPORTS.join(",\n  ")},
  Model,
  type AsyncDropdownHandlers,
  type ItemType,
  type RegisterCustomLogicOptions,
  type SurveyAiAssitantConfig,
  type SurveyResultProps,
  type TemplateDefinition,
} from "@yonus_amire01/form-builder";

const components = [FormBuilder, SurveyComponent, SurveyResultEditor, SurveyResultEditorModal];
const item: ItemType = { value: "IR", text: "Iran" };
const handlers: AsyncDropdownHandlers = {
  items: ref([item]),
  currentPage: ref(1),
  totalPages: ref(1),
  handleSearch: (query: string) => void query,
  handleNextPage() {},
  handlePrevPage() {},
};
const ai: SurveyAiAssitantConfig = { onSubmit: async (prompt) => ({ title: prompt }) };

export function setup() {
  registerAsyncDropdown("a", handlers);
  registerAdvancedTextInput("b", {
    ...handlers,
    onSelect: (question, picked) => {
      question.title = picked.text;
    },
  });
  provideAiAssistantConfig(ai);
  // @ts-expect-error onSubmit takes the prompt string
  provideAiAssistantConfig({ onSubmit: (n: number) => n });
  const survey = useSurveyModel({});
  useScrollToError(survey);
  const creatorTitle: string = useSurveyCreator().survey.title;
  const template: TemplateDefinition = useSurveyResultTemplate();
  provideSurveyResultTemplate(template);
  const props: SurveyResultProps = { scoreDisplay: "radial", score: "s", statusLabels: ["a"] };
  // @ts-expect-error not a score display
  const wrong: SurveyResultProps = { scoreDisplay: "pie" };
  const logic: RegisterCustomLogicOptions = {
    type: "r",
    locales: { en: { displayName: "R" } },
    onFire: ({ survey, expression }) => [survey.data, expression],
  };
  registerCustomLogic(logic);
  const prompt: string = SurveySchemaPrompt[0].content;
  const config = useSurveyAiAssistantConfig();
  return { components, survey: new Model({}), creatorTitle, props, wrong, prompt, config };
}
`,
    );

    try {
      execFileSync(join(ROOT, "node_modules/.bin/tsc"), ["-p", dir], { encoding: "utf8" });
    } catch (e) {
      throw new Error((e as { stdout?: string }).stdout || String(e));
    }
  });

  test("resolve every file they import", () => {
    const dir = join(ROOT, "dist/types");
    for (const file of files(dir).filter((f) => f.endsWith(".d.ts"))) {
      for (const [, spec] of readFileSync(file, "utf8").matchAll(/from\s+["'](\.[^"']+)["']/g)) {
        const base = join(dirname(file), spec.replace(/\.(ts|vue)$/, ""));
        const candidates = [`${base}.d.ts`, `${base}.vue.d.ts`, join(base, "index.d.ts"), `${join(dirname(file), spec)}.d.ts`];
        expect(candidates.some(existsSync), `${relative(dir, file)}: ${spec}`).toBe(true);
      }
    }
  });
});

describe("the published files", () => {
  const packed: string[] = JSON.parse(
    execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: ROOT, encoding: "utf8" }),
  )[0].files.map((f: { path: string }) => f.path);

  test("include the builds, types, styles and sources", () => {
    for (const path of [
      "package.json",
      "README.md",
      "dist/form-builder.mjs",
      "dist/form-builder.umd.js",
      "dist/form-builder.css",
      "dist/types/index.d.ts",
      "src/styles/tailwind.css",
      "src/index.ts",
    ]) {
      expect(packed, path).toContain(path);
    }
  });

  test("leave out tests, the demo and local files", () => {
    for (const prefix of ["tests/", "demo/", "coverage/", "node_modules/", ".env", "test-results/"]) {
      expect(packed.filter((p) => p.startsWith(prefix)), prefix).toEqual([]);
    }
  });
});
