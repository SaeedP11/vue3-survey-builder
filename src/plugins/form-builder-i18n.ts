import type { App } from "vue";
import type { I18n } from "vue-i18n";
import { locales } from "../locales";

export default {
  install(app: App) {
    const symbol = (app as unknown as { __VUE_I18N_SYMBOL__?: symbol })
      .__VUE_I18N_SYMBOL__;
    const i18n = symbol
      ? (app._context.provides[symbol] as I18n | undefined)
      : undefined;

    if (!i18n?.global) {
      console.error(
        "[form-builder] No vue-i18n instance found. Install vue-i18n before this plugin.",
      );
      return;
    }

    for (const [locale, messages] of Object.entries(locales)) {
      i18n.global.mergeLocaleMessage(locale, {formBuilder: messages});
    }
  },
};
