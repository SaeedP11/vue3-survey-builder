import DemoApp from "./DemoApp.vue";
import { createApp } from "vue";

import "survey-core/survey-core.css";
import "survey-creator-core/survey-creator-core.css";

import { createI18n } from "vue-i18n";
import "../src/styles/style.css";
import "./style.css";

const i18n = createI18n({
  locale: "fa",
  legacy: false,
  messages: {},
});

const app = createApp(DemoApp);

app.use(i18n);

app.mount("#app");
document.querySelector("#app")?.setAttribute("style", "height: 100vh");
