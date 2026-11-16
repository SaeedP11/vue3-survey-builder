<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { ChatSurvey } from "../../src/index.ts";
import { logEvent } from "./eventLog.ts";
import {
  Code,
  Copy,
  Check,
  Clock,
  Monitor,
  RotateCcw,
  Sliders,
  Smartphone,
  Sparkles,
  Tablet,
  Volume2,
  VolumeX,
} from "lucide-vue-next";

const props = defineProps<{
  json: object;
}>();

const emit = defineEmits<{
  restart: [];
  editInDesigner: [];
  loadSample: [id: string];
}>();

// Viewport Framing: mobile (smartphone mockup), tablet, desktop
const viewMode = ref<"mobile" | "tablet" | "desktop">("mobile");

// Simulated typing delay
const typingSpeed = ref<number>(200);

// Sound effects state (Web Audio API synth)
const soundEnabled = ref<boolean>(true);

// Persona presets
interface Persona {
  id: string;
  name: string;
  avatar: string;
  subtitle: string;
}

const PERSONAS: Persona[] = [
  {
    id: "assistant",
    name: "Survey Assistant",
    avatar: "🤖",
    subtitle: "AI Questionnaire Companion",
  },
  {
    id: "support",
    name: "Customer Care",
    avatar: "👩‍💼",
    subtitle: "Support Representative",
  },
  {
    id: "health",
    name: "Dr. Sarah",
    avatar: "🩺",
    subtitle: "Clinical Health Guide",
  },
  {
    id: "minimal",
    name: "SurveyBot",
    avatar: "💬",
    subtitle: "Conversational Form",
  },
];

const selectedPersonaId = ref<string>("assistant");
const activePersona = computed(
  () => PERSONAS.find((p) => p.id === selectedPersonaId.value) ?? PERSONAS[0],
);

// Feature toggles
const showProgressBar = ref<boolean>(true);
const allowEdit = ref<boolean>(true);
const allowSkip = ref<boolean>(true);
const showSettings = ref<boolean>(false);

// Inspector panel toggle
const showInspector = ref<boolean>(true);

// Live survey answers & status
const liveAnswers = ref<Record<string, unknown>>({});
const isCompleted = ref<boolean>(false);
const completedResult = ref<Record<string, unknown> | null>(null);
const currentQuestionName = ref<string>("");
const answeredKeys = computed(() => Object.keys(liveAnswers.value));
const copied = ref<boolean>(false);

// Mobile clock simulation
const currentTime = ref<string>("9:41");
let timeTimer: any = null;
function updateClock() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  currentTime.value = `${hours}:${minutes}`;
}

onMounted(() => {
  updateClock();
  timeTimer = setInterval(updateClock, 30000);
});

onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer);
});

// Synthesized audio feedback using Web Audio API
function playTone(type: "send" | "receive" | "complete") {
  if (!soundEnabled.value || typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === "send") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === "receive") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === "complete") {
      // Pleasant victory chord
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        const start = ctx.currentTime + idx * 0.06;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.07, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    }
  } catch {
    // Audio context may be restricted before user gesture
  }
}

// Handlers
function onComplete(data: Record<string, unknown>) {
  completedResult.value = data;
  liveAnswers.value = { ...data };
  isCompleted.value = true;
  playTone("complete");
  logEvent("complete", "chat survey completed", data);
}

function onChange(data: Record<string, unknown>, question: any) {
  liveAnswers.value = { ...data };
  logEvent("logic", `answered "${question.name}"`, { value: question.value });
}

function onAnswer(question: any, value: any) {
  playTone("send");
  liveAnswers.value = {
    ...liveAnswers.value,
    [question.name]: value,
  };
}

function onQuestionChange(question: any) {
  currentQuestionName.value = question?.name || "";
  playTone("receive");
}

function onRestartClick() {
  liveAnswers.value = {};
  isCompleted.value = false;
  completedResult.value = null;
  currentQuestionName.value = "";
  emit("restart");
}

async function copyAnswers() {
  try {
    await navigator.clipboard.writeText(
      JSON.stringify(liveAnswers.value, null, 2),
    );
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    // Clipboard permission fallback
  }
}

// Reset state when json changes
watch(
  () => props.json,
  () => {
    liveAnswers.value = {};
    isCompleted.value = false;
    completedResult.value = null;
    currentQuestionName.value = "";
  },
  { deep: true },
);
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden bg-slate-100/70 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
    <!-- Top Studio Toolbar -->
    <header
      class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2 shadow-xs dark:border-slate-800 dark:bg-slate-900 shrink-0 select-none"
      dir="ltr"
    >
      <!-- Left: Viewport Switcher & Speed -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Device Framing Switcher -->
        <div class="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800">
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            :class="
              viewMode === 'mobile'
                ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            "
            title="Mobile Phone View"
            @click="viewMode = 'mobile'"
          >
            <Smartphone class="h-3.5 w-3.5" />
            <span>Mobile</span>
          </button>

          <button
            type="button"
            class="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            :class="
              viewMode === 'tablet'
                ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            "
            title="Tablet View"
            @click="viewMode = 'tablet'"
          >
            <Tablet class="h-3.5 w-3.5" />
            <span>Tablet</span>
          </button>

          <button
            type="button"
            class="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            :class="
              viewMode === 'desktop'
                ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            "
            title="Desktop / Full Width"
            @click="viewMode = 'desktop'"
          >
            <Monitor class="h-3.5 w-3.5" />
            <span>Full</span>
          </button>
        </div>

        <!-- Typing Speed -->
        <div class="flex items-center gap-1 text-xs">
          <Clock class="h-3.5 w-3.5 text-slate-400" />
          <span class="text-slate-500 font-medium">Delay:</span>
          <select
            v-model.number="typingSpeed"
            class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            aria-label="Bot typing delay"
          >
            <option :value="0">Instant (0ms)</option>
            <option :value="150">Fast (150ms)</option>
            <option :value="300">Normal (300ms)</option>
            <option :value="600">Realistic (600ms)</option>
          </select>
        </div>

        <!-- Sound Effects -->
        <button
          type="button"
          class="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium transition-colors dark:border-slate-700 dark:bg-slate-800"
          :class="
            soundEnabled
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 hover:text-slate-600'
          "
          :title="soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'"
          @click="soundEnabled = !soundEnabled"
        >
          <Volume2 v-if="soundEnabled" class="h-3.5 w-3.5" />
          <VolumeX v-else class="h-3.5 w-3.5" />
          <span>{{ soundEnabled ? "Sound ON" : "Muted" }}</span>
        </button>

        <!-- Persona Preset -->
        <div class="flex items-center gap-1 text-xs">
          <select
            v-model="selectedPersonaId"
            class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            aria-label="Bot Persona"
          >
            <option v-for="p in PERSONAS" :key="p.id" :value="p.id">
              {{ p.avatar }} {{ p.name }}
            </option>
          </select>
        </div>

        <!-- Settings toggle -->
        <div class="relative">
          <button
            type="button"
            class="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            title="Chat Options"
            @click="showSettings = !showSettings"
          >
            <Sliders class="h-3.5 w-3.5" />
            <span>Options</span>
          </button>

          <!-- Settings Dropdown Popover -->
          <div
            v-if="showSettings"
            class="absolute left-0 top-full mt-1.5 z-30 w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900"
          >
            <h4 class="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
              Conversational Options
            </h4>
            <div class="space-y-2 text-xs">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="showProgressBar" type="checkbox" class="rounded text-indigo-600" />
                <span>Show Progress Bar</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="allowEdit" type="checkbox" class="rounded text-indigo-600" />
                <span>Allow Rewind & Edit</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="allowSkip" type="checkbox" class="rounded text-indigo-600" />
                <span>Allow Skip (Optional)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Inspector Toggle, Restart & Designer Shortcut -->
      <div class="flex items-center gap-2">
        <!-- Live Inspector Toggle -->
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
          :class="
            showInspector
              ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
          "
          @click="showInspector = !showInspector"
        >
          <Code class="h-3.5 w-3.5" />
          <span>Live Inspector</span>
          <span
            v-if="answeredKeys.length > 0"
            class="rounded-full bg-indigo-600 px-1.5 py-0.2 text-[10px] font-bold text-white"
          >
            {{ answeredKeys.length }}
          </span>
        </button>

        <!-- Restart -->
        <button
          type="button"
          class="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          title="Restart Chat Survey"
          @click="onRestartClick"
        >
          <RotateCcw class="h-3.5 w-3.5 text-slate-500" />
          <span>Restart</span>
        </button>

        <!-- Edit in Designer Shortcut -->
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 transition-colors cursor-pointer"
          title="Return to visual designer"
          @click="emit('editInDesigner')"
        >
          <Sparkles class="h-3.5 w-3.5" />
          <span>Edit Questions</span>
        </button>
      </div>
    </header>

    <!-- Main Studio Workspace: Center Preview + Side Inspector -->
    <div class="flex flex-1 min-h-0 min-w-0 overflow-hidden">
      <!-- Center: Simulated Environment Area -->
      <main
        class="flex-1 min-w-0 h-full overflow-auto p-4 sm:p-6 flex items-center justify-center transition-all"
        @click="showSettings = false"
      >
        <!-- MOBILE FRAME MOCKUP -->
        <div
          v-if="viewMode === 'mobile'"
          class="w-full max-w-[390px] h-[660px] max-h-[100%] rounded-[3rem] border-[8px] border-slate-900 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 flex flex-col relative overflow-hidden ring-1 ring-slate-900/10"
        >
          <!-- Dynamic Island / Speaker cutout -->
          <div
            class="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 h-5 w-28 rounded-full bg-slate-900 dark:bg-slate-800 flex items-center justify-between px-3 shadow-xs"
          >
            <div class="h-2.5 w-2.5 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center">
              <div class="h-1 w-1 rounded-full bg-indigo-400/40"></div>
            </div>
            <div class="h-1.5 w-10 rounded-full bg-slate-800"></div>
          </div>

          <!-- Mobile Status Bar (Clock, Wi-Fi, Battery) -->
          <div
            class="h-8 w-full shrink-0 flex items-center justify-between px-6 pt-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200 select-none z-20"
            dir="ltr"
          >
            <span>{{ currentTime }}</span>
            <div class="flex items-center gap-1.5">
              <!-- Signal bars -->
              <svg class="h-2.5 w-3" viewBox="0 0 12 10" fill="currentColor">
                <rect x="0" y="7" width="2" height="3" rx="0.5" />
                <rect x="3" y="5" width="2" height="5" rx="0.5" />
                <rect x="6" y="2.5" width="2" height="7.5" rx="0.5" />
                <rect x="9" y="0" width="2" height="10" rx="0.5" />
              </svg>
              <!-- 5G text -->
              <span class="text-[9px] font-bold">5G</span>
              <!-- Battery icon -->
              <div class="flex items-center">
                <div class="h-2.5 w-4 rounded-xs border border-current p-0.5 flex items-center">
                  <div class="h-full w-full rounded-xs bg-current"></div>
                </div>
                <div class="h-1 w-0.5 rounded-e-xs bg-current"></div>
              </div>
            </div>
          </div>

          <!-- ChatSurvey inside Phone Frame -->
          <div class="flex-1 min-h-0">
            <ChatSurvey
              :json="json"
              :bot-name="activePersona.name"
              :bot-avatar="activePersona.avatar"
              :description="activePersona.subtitle"
              :typing-delay="typingSpeed"
              :show-progress-bar="showProgressBar"
              :allow-edit="allowEdit"
              :allow-skip="allowSkip"
              @complete="onComplete"
              @change="onChange"
              @answer="onAnswer"
              @question-change="onQuestionChange"
              @restart="onRestartClick"
            />
          </div>

          <!-- Bottom Home Indicator Bar -->
          <div
            class="h-5 w-full shrink-0 bg-white dark:bg-slate-900 flex items-center justify-center select-none"
          >
            <div class="h-1 w-32 rounded-full bg-slate-300 dark:bg-slate-700"></div>
          </div>
        </div>

        <!-- TABLET FRAME MOCKUP -->
        <div
          v-else-if="viewMode === 'tablet'"
          class="w-full max-w-[700px] h-[680px] max-h-[100%] rounded-2xl border-4 border-slate-800 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 flex flex-col overflow-hidden"
        >
          <div class="flex-1 min-h-0">
            <ChatSurvey
              :json="json"
              :bot-name="activePersona.name"
              :bot-avatar="activePersona.avatar"
              :description="activePersona.subtitle"
              :typing-delay="typingSpeed"
              :show-progress-bar="showProgressBar"
              :allow-edit="allowEdit"
              :allow-skip="allowSkip"
              @complete="onComplete"
              @change="onChange"
              @answer="onAnswer"
              @question-change="onQuestionChange"
              @restart="onRestartClick"
            />
          </div>
        </div>

        <!-- DESKTOP / FULL WIDTH VIEW -->
        <div
          v-else
          class="w-full h-full max-w-4xl rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden flex flex-col"
        >
          <div class="flex-1 min-h-0">
            <ChatSurvey
              :json="json"
              :bot-name="activePersona.name"
              :bot-avatar="activePersona.avatar"
              :description="activePersona.subtitle"
              :typing-delay="typingSpeed"
              :show-progress-bar="showProgressBar"
              :allow-edit="allowEdit"
              :allow-skip="allowSkip"
              @complete="onComplete"
              @change="onChange"
              @answer="onAnswer"
              @question-change="onQuestionChange"
              @restart="onRestartClick"
            />
          </div>
        </div>
      </main>

      <!-- Right: Live Response Inspector (Split Screen) -->
      <aside
        v-if="showInspector"
        class="w-88 shrink-0 border-s border-slate-200 bg-white flex flex-col shadow-xs dark:border-slate-800 dark:bg-slate-900"
        dir="ltr"
      >
        <!-- Inspector Header -->
        <div
          class="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60"
        >
          <div class="flex items-center gap-2">
            <Code class="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 class="text-xs font-bold text-slate-800 dark:text-slate-100">
              Live Data Inspector
            </h3>
          </div>
          <!-- Status pill -->
          <span
            class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            :class="
              isCompleted
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
            "
          >
            {{ isCompleted ? "Completed" : "In Progress" }}
          </span>
        </div>

        <!-- Inspector Content -->
        <div class="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          <!-- Active question & answered stats -->
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <div class="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Active Question</span>
              <span class="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {{ currentQuestionName || "None" }}
              </span>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-500">
              <span>Answers Collected</span>
              <span class="font-bold text-indigo-600 dark:text-indigo-400">
                {{ answeredKeys.length }}
              </span>
            </div>
          </div>

          <!-- Live Answer Items List -->
          <div>
            <h4 class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Collected Answers
            </h4>
            <div v-if="answeredKeys.length === 0" class="text-xs text-slate-400 italic py-2">
              No answers submitted yet. Click options in the chat to see answers stream in!
            </div>
            <div v-else class="space-y-1.5 max-h-56 overflow-y-auto">
              <div
                v-for="key in answeredKeys"
                :key="key"
                class="flex items-start justify-between gap-2 rounded-md border border-slate-200 bg-white p-2 text-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <span class="font-mono font-medium text-slate-700 dark:text-slate-300 truncate">
                  {{ key }}
                </span>
                <span
                  class="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 shrink-0 max-w-[120px] truncate"
                >
                  {{ JSON.stringify(liveAnswers[key]) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Raw JSON Viewer -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <h4 class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                JSON Payload (survey.data)
              </h4>
              <button
                type="button"
                class="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 cursor-pointer"
                @click="copyAnswers"
              >
                <Check v-if="copied" class="h-3 w-3 text-emerald-500" />
                <Copy v-else class="h-3 w-3" />
                <span>{{ copied ? "Copied!" : "Copy" }}</span>
              </button>
            </div>
            <pre
              class="max-h-64 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] font-mono text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >{{ JSON.stringify(liveAnswers, null, 2) }}</pre>
          </div>
        </div>

        <!-- Inspector Footer -->
        <div class="border-t border-slate-200 p-3 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60 shrink-0 flex items-center justify-between">
          <span class="text-[11px] text-slate-500">
            Updates in real-time
          </span>
          <button
            type="button"
            class="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 cursor-pointer"
            @click="onRestartClick"
          >
            Clear & Reset
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>
