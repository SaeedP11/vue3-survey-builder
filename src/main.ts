import DemoApp from "./DemoApp.vue";
import { createApp } from "vue";

import "survey-core/survey-core.css";
import "survey-creator-core/survey-creator-core.css";
import "./styles/tailwind.css";
import "./styles/style.css";
import { createI18n } from "vue-i18n";
import formBuilderI18n from "./plugins/form-builder-i18n.ts";

const i18n = createI18n({
  locale: "en",
  messages: {}, // your existing messages
});

const app = createApp(DemoApp);

app.use(i18n);
app.use(formBuilderI18n);

app.mount("#app");
document.querySelector("#app")?.setAttribute("style", "height: 100vh");
