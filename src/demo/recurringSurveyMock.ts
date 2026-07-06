import { ref, type Ref } from "vue";
import type {
  RecurringSurveyRow,
  RecurringSurveyTableHandlers,
} from "../types/index.ts";

const PAGE_SIZE = 10;

function daysAgo(days: number, hour = 9, minute = 0): number {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

const sleepLabels = ["بد", "ضعیف", "متوسط", "خوب", "عالی"];
const moodLabels = ["خیلی پایین", "پایین", "متوسط", "خوب", "عالی"];
const energyLabels = ["خسته", "کم‌انرژی", "معمولی", "پرانرژی", "بسیار بالا"];

function buildSeedRows(): RecurringSurveyRow[] {
  const rows: RecurringSurveyRow[] = [];
  for (let i = 0; i < 25; i++) {
    const sleep = (i % 5) + 1;
    const mood = ((i * 2) % 5) + 1;
    const energy = ((i * 3) % 5) + 1;
    rows.push({
      id: 1000 - i,
      submittedAt: daysAgo(i, 8 + (i % 12), (i * 7) % 60),
      sleep: sleepLabels[sleep - 1],
      mood: moodLabels[mood - 1],
      energy: energyLabels[energy - 1],
      notes:
        i % 4 === 0
          ? "خواب کافی داشتم و احساس شادی می‌کنم."
          : i % 3 === 0
            ? "روز پرفشاری بود."
            : "",
    });
  }
  return rows;
}

const allRows = buildSeedRows();
const totalPages = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));

const rows: Ref<RecurringSurveyRow[]> = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const totalPagesRef = ref(totalPages);

function slice(): RecurringSurveyRow[] {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return allRows.slice(start, start + PAGE_SIZE);
}

rows.value = slice();

export const recurringSurveyMockHandlers: RecurringSurveyTableHandlers = {
  rows,
  loading,
  currentPage,
  totalPages: totalPagesRef,
  handleNextPage() {
    if (currentPage.value >= totalPagesRef.value) return;
    currentPage.value = currentPage.value + 1;
    rows.value = slice();
  },
  handlePrevPage() {
    if (currentPage.value <= 1) return;
    currentPage.value = currentPage.value - 1;
    rows.value = slice();
  },
  refresh() {
    const newId =
      allRows.length === 0 ? 1 : (allRows[0].id as number) + 1;
    allRows.unshift({
      id: newId,
      submittedAt: Date.now(),
      sleep: sleepLabels[3],
      mood: moodLabels[3],
      energy: energyLabels[3],
      notes: "ارسال تازه",
    });
    currentPage.value = 1;
    totalPagesRef.value = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));
    rows.value = slice();
  },
};