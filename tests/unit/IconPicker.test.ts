import type { SurveyModel } from "survey-core";
import { describe, expect, test } from "vitest";
import { nextTick } from "vue";
import IconPicker from "../../src/components/IconPicker.vue";
import { general } from "../../src/locales/index.ts";
import "../../src/utils/serilizers.ts";
import { flush, mountWithCreator, newCreator } from "./helpers.ts";

/**
 * The survey header as SurveyJS renders it in the designer: the logo picker
 * is its second child, holding a file input and the logo placeholder.
 */
function renderHeader(survey: SurveyModel) {
  const header = document.createElement("div");
  header.innerHTML =
    '<div class="title"></div><div class="logo"><input type="file"><span class="placeholder"></span></div>';
  document.body.append(header);
  survey.onAfterRenderHeader.fire(survey, { htmlElement: header });
  return header.querySelector(".logo") as HTMLElement;
}

function setup(json: object = {}, locale = "en") {
  const creator = newCreator(json);
  const mounted = mountWithCreator(IconPicker, { creator, locale });
  const search = () => mounted.child.find("input.search-input");
  const icons = () => mounted.child.findAll("button.icon-button");
  return { ...mounted, search, icons };
}

describe("IconPicker", () => {
  test("replaces the logo's file upload with the icon picker", async () => {
    const { creator, search } = setup();
    const logo = renderHeader(creator.survey);
    expect(logo.querySelector("input[type=file]")).toBeNull();

    logo.click();
    await nextTick();
    expect(search().exists()).toBe(true);
  });

  test("filters icons by name, showing at most 80", async () => {
    const { creator, search, icons } = setup();
    renderHeader(creator.survey).click();
    await nextTick();
    expect(icons().length).toBe(80);

    await search().setValue("heartpulse");
    expect(icons().length).toBeGreaterThan(0);
    expect(icons().every((b) => b.attributes("title")!.toLowerCase().includes("heartpulse"))).toBe(true);
  });

  test("picking an icon saves its name on the survey and draws it", async () => {
    const { creator, search, icons, child } = setup();
    const logo = renderHeader(creator.survey);
    logo.click();
    await nextTick();
    await search().setValue("heartpulse");
    const name = icons()[0].attributes("title")!;
    await icons()[0].trigger("click");

    expect(creator.survey.icon).toBe(name);
    expect(creator.JSON.icon).toBe(name);
    expect(logo.querySelector(".placeholder svg")).not.toBeNull();
    expect(child.find("input.search-input").exists()).toBe(false);
  });

  test("draws the icon saved in the JSON when the header renders", () => {
    const { creator } = setup({ icon: "HeartPulse" });
    const logo = renderHeader(creator.survey);
    expect(logo.querySelector(".placeholder svg")).not.toBeNull();
  });

  test("ignores an unknown saved icon", () => {
    const { creator } = setup({ icon: "NoSuchIcon" });
    expect(() => renderHeader(creator.survey)).not.toThrow();
  });

  test("keeps working after the designer's survey is replaced", async () => {
    const { creator, search } = setup();
    creator.JSON = { icon: "HeartPulse", elements: [{ type: "text", name: "q" }] };
    await flush();

    const logo = renderHeader(creator.survey);
    expect(logo.querySelector(".placeholder svg")).not.toBeNull();
    logo.click();
    await nextTick();
    expect(search().exists()).toBe(true);
  });

  test("its search box is translated", async () => {
    const { creator, search } = setup({}, "fa");
    renderHeader(creator.survey).click();
    await nextTick();
    expect(search().attributes("placeholder")).toBe(general.fa.iconSearchPlaceholder);
  });

  test("stops listening when unmounted", async () => {
    const { creator, wrapper, search } = setup();
    wrapper.unmount();
    const logo = renderHeader(creator.survey);
    expect(logo.querySelector("input[type=file]")).not.toBeNull();
    expect(search().exists()).toBe(false);
  });
});
