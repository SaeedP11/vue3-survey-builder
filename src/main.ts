import DemoApp from "./DemoApp.vue";
import { createApp } from "vue";

import "survey-core/survey-core.css";
import "survey-creator-core/survey-creator-core.css";
import "./styles/tailwind.css";
import "./styles/style.css";

createApp(DemoApp).mount("#app");
document.querySelector("#app")?.setAttribute("style", "height: 100vh");
