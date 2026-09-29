import DemoApp from "./DemoApp.vue";
import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import "./style.css";

// The library's components translate themselves with vue-i18n, so the host
// installs it; the playground's locale switch drives this instance.
const i18n = createI18n({
  locale: "fa",
  legacy: false,
  messages: {},
});

createApp(DemoApp).use(i18n).mount("#app");
