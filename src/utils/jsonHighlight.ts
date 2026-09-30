import { SurveyJSON5 } from "survey-creator-core";

export type JsonTokenType =
  | "key"
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "punctuation"
  | "comment";

// One alternative per token type, in the order `highlightJson` reads the
// groups. Unterminated strings and comments run to the end of the line or
// text, so a half-typed value colours as the value it is becoming. Bare
// identifiers cover JSON5 keys, which the creator's parser accepts.
const TOKEN =
  /("(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?)|(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\b|\b(true|false)\b|\b(null)\b|([{}[\],:])|([A-Za-z_$][\w$]*)/g;

const KEY_FOLLOWS = /^\s*:/;

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const span = (type: JsonTokenType, text: string) =>
  `<span class="fb-json-${type}">${escapeHtml(text)}</span>`;

/**
 * The JSON (or JSON5) `text` as HTML, each token wrapped in a
 * `fb-json-<type>` span. Anything the tokenizer does not recognise passes
 * through escaped, so the output always holds the text unchanged.
 */
export function highlightJson(text: string): string {
  let html = "";
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    const [token, str, comment, num, bool, nul, punct, ident] = match;
    const at = match.index;
    html += escapeHtml(text.slice(last, at));
    last = at + token.length;
    const isKey = KEY_FOLLOWS.test(text.slice(last, last + 64));
    if (str !== undefined) html += span(isKey ? "key" : "string", token);
    else if (comment !== undefined) html += span("comment", token);
    else if (num !== undefined) html += span("number", token);
    else if (bool !== undefined) html += span("boolean", token);
    else if (nul !== undefined) html += span("null", token);
    else if (punct !== undefined) html += span("punctuation", token);
    else if (ident !== undefined && isKey) html += span("key", token);
    else html += escapeHtml(token);
  }
  return html + escapeHtml(text.slice(last));
}

/**
 * `text` re-indented by `indent` spaces, or null when it does not parse.
 * Parses as the creator does (JSON5: comments, unquoted keys, trailing
 * commas) and writes strict JSON.
 */
export function formatJson(text: string, indent = 2): string | null {
  try {
    // Blank text parses to undefined, which stringifies to undefined
    return JSON.stringify(new SurveyJSON5().parse(text), null, indent) ?? null;
  } catch {
    return null;
  }
}
