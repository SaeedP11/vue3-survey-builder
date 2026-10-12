import { describe, expect, test } from "vitest";
import DOMPurify from "dompurify";
import {
  fillHtmlPlaceholders,
  isTemplateVariable,
  sanitizeResultHtml,
} from "../../src/utils/resultHtml.ts";

/** The sanitized markup, parsed back for inspection. */
function parse(html: string) {
  const host = document.createElement("div");
  host.innerHTML = sanitizeResultHtml(html);
  return host;
}

describe("sanitizeResultHtml", () => {
  test("keeps ordinary content and inline styles", () => {
    const html =
      '<h3 style="color: red">Title</h3><p>Some <strong>bold</strong> and <em>em</em>.</p><ul><li>one</li></ul><table><tr><td>1</td></tr></table><hr><blockquote>q</blockquote>';
    const host = parse(html);
    expect(host.querySelector("h3")?.getAttribute("style")).toContain("color: red");
    for (const tag of ["p", "strong", "em", "ul", "li", "table", "td", "hr", "blockquote"]) {
      expect(host.querySelector(tag), tag).not.toBeNull();
    }
  });

  test("gives nothing for empty or blank markup", () => {
    expect(sanitizeResultHtml(undefined)).toBe("");
    expect(sanitizeResultHtml("")).toBe("");
    expect(sanitizeResultHtml("   \n ")).toBe("");
  });

  test.each([
    ["a script", "<script>alert(1)</script><p>ok</p>"],
    ["an event handler", '<img src="https://x.test/a.png" onerror="alert(1)"><p onclick="alert(1)">ok</p>'],
    ["a javascript: link", '<a href="javascript:alert(1)">x</a><p>ok</p>'],
    ["an obfuscated javascript: link", '<a href="jav&#x09;ascript:alert(1)">x</a><p>ok</p>'],
    ["an SVG script", '<svg><script>alert(1)</script><a href="javascript:alert(1)"><text>x</text></a></svg><p>ok</p>'],
    ["an SVG onload", '<svg onload="alert(1)"></svg><p>ok</p>'],
    ["an iframe", '<iframe src="https://evil.test"></iframe><p>ok</p>'],
    ["an object", '<object data="https://evil.test/x.swf"></object><embed src="x"><p>ok</p>'],
    ["a style tag", "<style>body{display:none}</style><p>ok</p>"],
    ["a base tag", '<base href="https://evil.test/"><p>ok</p>'],
    ["a meta refresh", '<meta http-equiv="refresh" content="0;url=https://evil.test"><p>ok</p>'],
    ["a template", "<template><img src=x onerror=alert(1)></template><p>ok</p>"],
  ])("strips %s", (_, html) => {
    const out = sanitizeResultHtml(html);
    expect(out).toContain("<p>ok</p>");
    expect(out).not.toMatch(/script|onerror|onclick|onload|javascript:|iframe|<object|<embed|<style|<base|<meta|<template/i);
  });

  test("strips form controls, which would submit a host's form", () => {
    const host = parse(
      '<form action="https://evil.test"><input name="x"><button>Send</button><select><option>a</option></select><textarea></textarea></form><p>ok</p>',
    );
    expect(host.querySelector("form, input, button, select, option, textarea")).toBeNull();
    expect(host.textContent).toContain("ok");
  });

  test("keeps safe links and drops the others' addresses", () => {
    const host = parse(
      '<a href="https://ok.test/a">1</a><a href="mailto:a@b.test">2</a><a href="tel:+1">3</a><a href="/relative">4</a><a href="data:text/html,x">5</a><a href="vbscript:x">6</a>',
    );
    const hrefs = [...host.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["https://ok.test/a", "mailto:a@b.test", "tel:+1", "/relative", null, null]);
  });

  test("opens a link only in a new tab, never the host's window", () => {
    const host = parse(
      '<a href="https://a.test" target="_blank">new</a><a href="https://a.test" target="_top">top</a><a href="https://a.test" target="_parent">parent</a>',
    );
    const [blank, top, parent] = host.querySelectorAll("a");
    expect(blank.getAttribute("target")).toBe("_blank");
    expect(blank.getAttribute("rel")).toBe("noopener noreferrer");
    expect(top.hasAttribute("target")).toBe(false);
    expect(parent.hasAttribute("target")).toBe(false);
  });

  test("keeps raster images and drops unsafe image addresses", () => {
    const host = parse(
      '<img src="https://ok.test/a.png" alt="a"><img src="data:image/png;base64,AAAA" alt="b"><img src="data:image/svg+xml,<svg/>" alt="c"><img src="javascript:alert(1)" alt="d"><img src="x.png" srcset="https://evil.test/1x.png 1x" alt="e">',
    );
    const srcs = [...host.querySelectorAll("img")].map((img) => img.getAttribute("src"));
    expect(srcs).toEqual(["https://ok.test/a.png", "data:image/png;base64,AAAA", null, null, "x.png"]);
    expect(host.querySelector("[srcset]")).toBeNull();
  });

  test("prefixes ids and names, so they cannot shadow the page's globals", () => {
    const host = parse('<p id="creator">a</p><a name="location">b</a>');
    expect(host.querySelector("p")?.id).not.toBe("creator");
    expect(host.querySelector("p")?.id).toContain("creator");
  });

  test("drops data- attributes and autofocus", () => {
    const host = parse('<p data-x="1" autofocus>a</p>');
    expect(host.querySelector("p")?.hasAttribute("data-x")).toBe(false);
    expect(host.querySelector("p")?.hasAttribute("autofocus")).toBe(false);
  });

  test("leaves a host's own DOMPurify untouched", () => {
    sanitizeResultHtml('<a href="https://a.test" target="_top">x</a>');
    // Our hooks live on our own instance: the shared one still keeps the target
    expect(DOMPurify.sanitize('<a href="https://a.test" target="_top">x</a>', { ADD_ATTR: ["target"] })).toContain(
      'target="_top"',
    );
  });
});

describe("fillHtmlPlaceholders", () => {
  test("puts each answer in as text", () => {
    expect(fillHtmlPlaceholders("<p>{name} is {age}</p>", { name: "Ann", age: 42 })).toBe("<p>Ann is 42</p>");
    expect(fillHtmlPlaceholders("<p>{ name }</p>", { name: "Ann" })).toBe("<p>Ann</p>");
  });

  test("escapes an answer, so it never adds markup", () => {
    const filled = fillHtmlPlaceholders('<p title="{x}">{x}</p>', {
      x: `<img src=x onerror=alert(1)> " ' &`,
    });
    expect(filled).toBe(
      '<p title="&lt;img src=x onerror=alert(1)&gt; &quot; &#39; &amp;">&lt;img src=x onerror=alert(1)&gt; &quot; &#39; &amp;</p>',
    );
    // And it reads back as the text it was
    const host = document.createElement("div");
    host.innerHTML = sanitizeResultHtml(filled);
    expect(host.querySelector("img")).toBeNull();
    expect(host.textContent).toBe(`<img src=x onerror=alert(1)> " ' &`);
  });

  test("lists an array and writes an object as JSON", () => {
    expect(fillHtmlPlaceholders("{a}|{o}", { a: ["x", "y"], o: { k: 1 } })).toBe(
      'x, y|{&quot;k&quot;:1}',
    );
  });

  test("empties a placeholder without a value", () => {
    expect(fillHtmlPlaceholders("[{gone}][{nil}]", { nil: null })).toBe("[][]");
  });

  test("fills only the names picked, leaving the rest as written", () => {
    const html = "{age} {$score}";
    expect(fillHtmlPlaceholders(html, { age: 3 }, (n) => !isTemplateVariable(n))).toBe("3 {$score}");
    expect(fillHtmlPlaceholders(html, { $score: "9" }, isTemplateVariable)).toBe("{age} 9");
  });

  test("leaves braces that are not placeholders", () => {
    expect(fillHtmlPlaceholders("{not a name} {}", { not: 1 })).toBe("{not a name} {}");
  });

  test("tells the template's own variables apart", () => {
    expect(isTemplateVariable("$score")).toBe(true);
    expect(isTemplateVariable("score")).toBe(false);
  });
});
