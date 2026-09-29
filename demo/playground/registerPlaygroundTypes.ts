import { ref } from "vue";
import {
  registerAdvancedTextInput,
  registerAsyncDropdown,
  registerCustomLogic,
  type AsyncDropdownHandlers,
  type ItemType,
} from "../../src/index.ts";
import { COUNTRIES } from "./countries.ts";
import { logEvent } from "./eventLog.ts";

const PAGE_SIZE = 6;
const LATENCY_MS = 300;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Handlers backed by a fake paginated search endpoint, with latency, so the
 * components are exercised the way a real server would drive them.
 */
function fakeCountryServer(): AsyncDropdownHandlers {
  const items = ref<ItemType[]>([]);
  const currentPage = ref(1);
  const totalPages = ref(1);
  let query = "";
  let latest = 0;

  async function load(q: string, page: number) {
    const request = ++latest;
    await delay(LATENCY_MS);
    // A newer search or page request superseded this one
    if (request !== latest) return;

    const needle = q.trim().toLowerCase();
    const matches = COUNTRIES.filter((c) =>
      c.text.toLowerCase().includes(needle),
    );
    totalPages.value = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
    currentPage.value = Math.min(Math.max(page, 1), totalPages.value);
    const start = (currentPage.value - 1) * PAGE_SIZE;
    items.value = matches.slice(start, start + PAGE_SIZE);
    query = q;
  }

  load("", 1);

  return {
    items,
    currentPage,
    totalPages,
    handleSearch: (q) => load(q, 1),
    handleNextPage: () => load(query, currentPage.value + 1),
    handlePrevPage: () => load(query, currentPage.value - 1),
  };
}

/**
 * Registers the custom question types and logic trigger the samples use.
 * The question types need a component instance, so call this from setup(),
 * before FormBuilder loads any JSON that uses them.
 */
export default function registerPlaygroundTypes() {
  // Runtime dropdown: the respondent picks from the server-backed list
  registerAsyncDropdown("asyncDropdown", fakeCountryServer());

  // Designer-only picker: a plain text input at runtime, but the designer's
  // type button opens the list, and picking names the question
  registerAdvancedTextInput("countryAsync", {
    ...fakeCountryServer(),
    onSelect: (question, item) => {
      question.name = item.value.toLowerCase();
      question.title = item.text;
    },
  });

  registerCustomLogic({
    type: "reminder",
    locales: {
      en: {
        displayName: "Reminder",
        description: "Send a reminder when the condition is met",
      },
      fa: {
        displayName: "یادآور",
        description: "ارسال یادآور هنگام برقراری شرط",
      },
    },
    onFire: ({ expression, survey }) =>
      logEvent("logic", `reminder fired: ${expression}`, survey.data),
  });
}
