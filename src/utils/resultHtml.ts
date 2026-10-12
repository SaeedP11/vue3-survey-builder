/**
 * An HTML block's markup made safe to show: answers put into `{name}`
 * placeholders as text, then everything that could run script, submit the
 * host's form or reach outside the block stripped out.
 */
import DOMPurify, { type Config } from "dompurify";
import { safeImageSrc, safeLinkUrl } from "./resultContent.ts";

/** `{name}` and `{ name }`, as in link addresses. */
const PLACEHOLDER = /\{\s*([^{}\s]+)\s*\}/g;

/** Placeholders the template fills itself, from the score: `{$score}`, `{$status}`, `{$min}`, `{$max}`. */
export const isTemplateVariable = (name: string) => name.startsWith("$");

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function asText(value: unknown): string {
  if (Array.isArray(value)) return value.map(asText).join(", ");
  if (value !== null && typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * `{name}` in `html` replaced with that value, escaped as text, so an answer
 * never adds markup. `fill` picks the names to fill; a picked name without a
 * value becomes empty, and the others stay as they are.
 */
export function fillHtmlPlaceholders(
  html: string,
  values: Record<string, unknown>,
  fill: (name: string) => boolean = () => true,
): string {
  return html.replace(PLACEHOLDER, (match, name: string) => {
    if (!fill(name)) return match;
    const value = values[name];
    if (value === undefined || value === null) return "";
    return escapeHtml(asText(value));
  });
}

// Inside a host's form, a button or input would submit it; frames, styles and
// document-level tags reach outside the block.
const FORBID_TAGS = [
  "style",
  "link",
  "meta",
  "base",
  "form",
  "input",
  "button",
  "select",
  "option",
  "textarea",
  "iframe",
  "frame",
  "frameset",
  "object",
  "embed",
  "dialog",
  "template",
  "slot",
];

const CONFIG: Config = {
  USE_PROFILES: { html: true, svg: true },
  FORBID_TAGS,
  // Allowed so a link can open a new tab; the hook below keeps only `_blank`
  ADD_ATTR: ["target"],
  FORBID_ATTR: ["autofocus", "srcset", "formaction", "action"],
  ALLOW_DATA_ATTR: false,
  // An id or name could shadow the host page's globals (DOM clobbering)
  SANITIZE_NAMED_PROPS: true,
};

type Purifier = ReturnType<typeof DOMPurify>;
let purifier: Purifier | undefined;

/** A DOMPurify of our own, so the hooks never touch a host's instance. */
function getPurifier(): Purifier | undefined {
  if (purifier) return purifier;
  if (typeof window === "undefined") return undefined;
  purifier = DOMPurify(window);
  purifier.addHook("afterSanitizeAttributes", (node) => {
    const el = node as Element;
    // SVG elements report a lowercase tagName
    const tag = el.tagName.toLowerCase();
    if (tag === "a" && el.hasAttribute("href")) {
      const href = safeLinkUrl(el.getAttribute("href") ?? "");
      if (href) el.setAttribute("href", href);
      else el.removeAttribute("href");
    }
    if (tag === "img" && el.hasAttribute("src")) {
      const src = safeImageSrc(el.getAttribute("src") ?? "");
      if (src) el.setAttribute("src", src);
      else el.removeAttribute("src");
    }
    if (el.hasAttribute("target")) {
      // A new tab only, never the host's own window or frames
      if (el.getAttribute("target") === "_blank") {
        el.setAttribute("rel", "noopener noreferrer");
      } else {
        el.removeAttribute("target");
      }
    }
  });
  return purifier;
}

/** `html` with only safe markup left; empty where there is no DOM to sanitize with. */
export function sanitizeResultHtml(html: string | undefined): string {
  if (!html || !html.trim()) return "";
  const p = getPurifier();
  return p ? (p.sanitize(html, CONFIG) as string) : "";
}
