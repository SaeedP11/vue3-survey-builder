import { defineConfig, type Plugin, type Rolldown } from "vite";
import vue from "@vitejs/plugin-vue";

// Peer dependencies, left for the host app to provide. survey-core and
// survey-creator-core keep global registries (Serializer, ElementFactory,
// editorLocalization): a bundled copy would not see the host's registrations,
// nor the host this library's. Their stylesheets stay bundled into
// form-builder.css, so consumers still only import style.css.
const peers = [
  "vue",
  "vue-i18n",
  "survey-core",
  "survey-creator-core",
  "survey-creator-vue",
  "survey-vue3-ui",
];

const globals: Record<string, string> = {
  vue: "Vue",
  "vue-i18n": "VueI18n",
  "survey-core": "Survey",
  "survey-core/themes": "SurveyTheme",
  "survey-creator-core": "SurveyCreatorCore",
  "survey-creator-core/themes": "SurveyCreatorTheme",
  "survey-creator-core/i18n/persian": "SurveyCreatorCore",
  "survey-creator-vue": "SurveyCreatorVue",
  "survey-vue3-ui": "SurveyVue3UI",
};

// Two passes (`pnpm build`). The ES build holds both entries, the full one and
// the respondent's `runtime`, so the code they share, the chart question's
// registration among it, is one chunk an app loads once; each entry gets its
// own stylesheet. UMD cannot hold two entries, so `BUILD_UMD=1` builds the
// full entry alone in that format, and with it the complete form-builder.css.
const umd = !!process.env.BUILD_UMD;

/**
 * Split CSS puts the styles both entries use (survey-core's) in the shared
 * chunk's stylesheet, which nothing references in a library build. Each entry
 * gets one complete stylesheet instead, `<entry>.css`: the CSS of the chunks
 * it imports, then its own.
 */
function stylesheetPerEntry(): Plugin {
  return {
    name: "stylesheet-per-entry",
    apply: "build",
    enforce: "post",
    generateBundle(_, bundle) {
      const sheets = new Map<string, string>();
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== "chunk" || !chunk.isEntry) continue;
        const css: string[] = [];
        const seen = new Set<string>();
        const visit = (c: Rolldown.OutputChunk) => {
          for (const imported of c.imports) {
            const next = bundle[imported];
            if (next?.type === "chunk") visit(next);
          }
          for (const file of c.viteMetadata?.importedCss ?? []) {
            if (seen.has(file)) continue;
            seen.add(file);
            const asset = bundle[file];
            if (asset?.type === "asset") css.push(asset.source.toString());
          }
        };
        visit(chunk);
        sheets.set(`${chunk.name}.css`, css.join("\n"));
      }
      for (const [file, output] of Object.entries(bundle)) {
        if (output.type === "asset" && file.endsWith(".css")) delete bundle[file];
      }
      for (const [fileName, source] of sheets) {
        this.emitFile({ type: "asset", fileName, source });
      }
    },
  };
}

export default defineConfig({
  plugins: umd ? [vue()] : [vue(), stylesheetPerEntry()],
  build: {
    emptyOutDir: !umd,
    cssCodeSplit: !umd,
    lib: umd
      ? {
          fileName: "form-builder",
          entry: "src/index.ts",
          name: "FormBuilder",
          formats: ["umd"],
        }
      : {
          fileName: (_format, name) => `${name}.mjs`,
          entry: { "form-builder": "src/index.ts", runtime: "src/runtime.ts" },
          formats: ["es"],
        },
    rollupOptions: {
      external: (id) =>
        !id.endsWith(".css") &&
        peers.some((peer) => id === peer || id.startsWith(`${peer}/`)),
      output: {
        globals,
      },
    },
  },
});
