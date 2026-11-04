/**
 * Migrates an HTML block written with a fixed font and neutral (slate/white)
 * colours to the host's theme: the font declarations go, so the text inherits
 * `--font-formbilder-family`, and the neutral colours become SurveyJS theme
 * variables, which follow the host and dark mode. Status colours (greens,
 * reds, ...) and anything else are left as written.
 */

const NEUTRAL_TO_VARIABLE: Record<string, string> = {
  "#ffffff": "--sjs-general-backcolor",
  "#fff": "--sjs-general-backcolor",
  "#f8fafc": "--sjs-general-backcolor-dim-light",
  "#e2e8f0": "--sjs-border-inside",
  "#64748b": "--sjs-general-forecolor-light",
  "#475569": "--sjs-general-forecolor-light",
  "#334155": "--sjs-general-forecolor",
  "#0f172a": "--sjs-general-forecolor",
};

const HEX = /#[0-9a-f]{3}(?:[0-9a-f]{3})?\b/gi;

const mapColors = (css: string) =>
  css.replace(HEX, (hex) => {
    const name = NEUTRAL_TO_VARIABLE[hex.toLowerCase()];
    return name ? `var(${name})` : hex;
  });

/** `font-family` declarations dropped, except a monospace one (code keeps its font). */
const dropFonts = (css: string) =>
  css.replace(/(^|;)\s*font-family\s*:([^;]*)(?=;|$)/gi, (match, lead: string, value: string) =>
    /mono|consolas|courier/i.test(value) ? match : lead,
  );

const migrateStyle = (css: string) => mapColors(dropFonts(css)).replace(/^\s*;+/, "").replace(/;{2,}/g, ";");

const STYLE_ATTR = /(\bstyle\s*=\s*)(?:"([^"]*)"|'([^']*)')/i;
const PAINT_ATTR = /\s(fill|stroke)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

function migrateTag(tag: string): string {
  const paint: string[] = [];
  // A presentation attribute cannot hold var(); a style declaration can
  let out = tag.replace(PAINT_ATTR, (match, prop: string, dq?: string, sq?: string) => {
    const name = NEUTRAL_TO_VARIABLE[(dq ?? sq ?? "").trim().toLowerCase()];
    if (!name) return match;
    paint.push(`${prop}:var(${name})`);
    return "";
  });
  const extra = paint.join(";");
  if (STYLE_ATTR.test(out)) {
    out = out.replace(STYLE_ATTR, (_, lead: string, dq?: string, sq?: string) => {
      const quote = dq !== undefined ? '"' : "'";
      const css = migrateStyle(dq ?? sq ?? "");
      return `${lead}${quote}${extra ? `${css.replace(/;\s*$/, "")};${extra}` : css}${quote}`;
    });
  } else if (extra) {
    out = out.replace(/\s*\/?>$/, (end) => ` style="${extra}"${end.trim()}`);
  }
  return out;
}

/**
 * `html` with its inline fonts removed and neutral colours turned into theme
 * variables. Only tags' `style`, `fill` and `stroke` attributes are touched,
 * never the text. Markup already using variables comes back unchanged.
 */
export function migrateResultHtmlTheme(html: string): string {
  if (!html) return html;
  return html.replace(/<[a-z][^>]*>/gi, migrateTag);
}
