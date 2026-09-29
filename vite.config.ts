import { defineConfig } from "vite";
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

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      fileName: "form-builder",
      entry: "src/index.ts",
      name: "FormBuilder",
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
