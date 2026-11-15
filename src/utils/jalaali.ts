/**
 * Jalaali (Persian / Solar Hijri) calendar conversion and utilities.
 * Based on the astronomical and mathematical algorithm by Kazimierz M. Borkowski.
 * Pure TypeScript, zero external dependencies.
 */

export interface JalaaliDate {
  jy: number;
  jm: number;
  jd: number;
}

export interface GregorianDate {
  gy: number;
  gm: number;
  gd: number;
}

export interface ParsedDateTime extends JalaaliDate {
  hour: number;
  minute: number;
  second: number;
  hasDate: boolean;
  hasTime: boolean;
}

export const JALAALI_MONTH_NAMES_FA = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

export const JALAALI_MONTH_NAMES_EN = [
  "Farvardin",
  "Ordibehesht",
  "Khordad",
  "Tir",
  "Mordad",
  "Shahrivar",
  "Mehr",
  "Aban",
  "Azar",
  "Dey",
  "Bahman",
  "Esfand",
] as const;

export const WEEKDAY_SHORT_FA = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;
export const WEEKDAY_SHORT_EN = ["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"] as const;

export const WEEKDAY_NAMES_FA = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
] as const;

export const WEEKDAY_NAMES_EN = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

/**
 * Converts a Gregorian date to Jalaali.
 */
export function toJalaali(gy: number, gm: number, gd: number): JalaaliDate {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm =
    days < 186
      ? 1 + Math.floor(days / 31)
      : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

/**
 * Converts a Jalaali date to Gregorian.
 */
export function toGregorian(jy: number, jm: number, jd: number): GregorianDate {
  let gy = jy <= 979 ? 621 : 1600;
  jy -= jy <= 979 ? 0 : 979;
  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const isLeapGregorian =
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  const sal_a = [
    0,
    31,
    isLeapGregorian ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let gm = 0;
  for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) {
    gd -= sal_a[gm];
  }
  return { gy, gm, gd };
}

/**
 * Checks if a Jalaali year is a leap year.
 */
export function isLeapJalaaliYear(jy: number): boolean {
  const g = toGregorian(jy, 12, 30);
  const j = toJalaali(g.gy, g.gm, g.gd);
  return j.jy === jy && j.jm === 12 && j.jd === 30;
}

/**
 * Returns the number of days in a Jalaali month (1-12).
 */
export function jalaaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalaaliYear(jy) ? 30 : 29;
}

/**
 * Returns the day of the week for a Jalaali date, where:
 * 0 = Saturday (شنبه), 1 = Sunday, ..., 6 = Friday (جمعه).
 */
export function jalaaliDayOfWeek(jy: number, jm: number, jd: number): number {
  const g = toGregorian(jy, jm, jd);
  const d = new Date(g.gy, g.gm - 1, g.gd);
  const jsDay = d.getDay(); // 0 = Sunday, 6 = Saturday
  return (jsDay + 1) % 7;
}

/**
 * Converts English digits to Persian digits.
 */
export function toPersianDigits(value: string | number): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(value).replace(/[0-9]/g, (d) => persianDigits[Number(d)]);
}

/**
 * Converts Persian and Arabic digits to English digits.
 */
export function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/**
 * Pads a number with a leading zero if < 10.
 */
export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Formats a Jalaali date as YYYY/MM/DD.
 */
export function formatJalaaliDate(
  jy: number,
  jm: number,
  jd: number,
  separator = "/",
): string {
  return `${jy}${separator}${pad2(jm)}${separator}${pad2(jd)}`;
}

/**
 * Formats a Jalaali date and time as YYYY/MM/DD HH:mm.
 */
export function formatJalaaliDateTime(
  jy: number,
  jm: number,
  jd: number,
  hour = 0,
  minute = 0,
): string {
  return `${formatJalaaliDate(jy, jm, jd)} ${pad2(hour)}:${pad2(minute)}`;
}

/**
 * Formats a Gregorian date as YYYY-MM-DD.
 */
export function formatGregorianDate(
  gy: number,
  gm: number,
  gd: number,
): string {
  return `${gy}-${pad2(gm)}-${pad2(gd)}`;
}

/**
 * Formats a Gregorian date and time as ISO YYYY-MM-DDTHH:mm:ss.
 */
export function formatGregorianDateTime(
  gy: number,
  gm: number,
  gd: number,
  hour = 0,
  minute = 0,
  second = 0,
): string {
  return `${formatGregorianDate(gy, gm, gd)}T${pad2(hour)}:${pad2(minute)}:${pad2(second)}`;
}

/**
 * Returns the current date and time in Jalaali.
 */
export function getNowJalaali(): ParsedDateTime {
  const now = new Date();
  const j = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return {
    jy: j.jy,
    jm: j.jm,
    jd: j.jd,
    hour: now.getHours(),
    minute: now.getMinutes(),
    second: now.getSeconds(),
    hasDate: true,
    hasTime: true,
  };
}

/**
 * Parses any date/time string (Jalali, Gregorian ISO, or time-only) into a ParsedDateTime object.
 */
export function parseDateOrDateTime(value: unknown): ParsedDateTime | null {
  if (value === null || value === undefined || value === "") return null;
  const str = toEnglishDigits(String(value)).trim();
  if (!str) return null;

  // Time only: e.g. "14:30" or "14:30:00"
  const timeOnlyMatch = str.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
  if (timeOnlyMatch) {
    const hour = Math.min(23, Math.max(0, parseInt(timeOnlyMatch[1], 10)));
    const minute = Math.min(59, Math.max(0, parseInt(timeOnlyMatch[2], 10)));
    const second = timeOnlyMatch[3]
      ? Math.min(59, Math.max(0, parseInt(timeOnlyMatch[3], 10)))
      : 0;
    const now = getNowJalaali();
    return {
      jy: now.jy,
      jm: now.jm,
      jd: now.jd,
      hour,
      minute,
      second,
      hasDate: false,
      hasTime: true,
    };
  }

  // Date with optional time:
  // e.g. "1403/08/25", "1403-08-25", "2024-11-15", "2024-11-15T14:30:00", "1403/08/25 14:30"
  const match = str.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/,
  );
  if (!match) return null;

  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const d = parseInt(match[3], 10);
  const hasTime = !!(match[4] !== undefined && match[5] !== undefined);
  const hour = hasTime ? parseInt(match[4], 10) : 0;
  const minute = hasTime ? parseInt(match[5], 10) : 0;
  const second = match[6] !== undefined ? parseInt(match[6], 10) : 0;

  if (y >= 1900) {
    // Gregorian: convert to Jalaali
    const j = toJalaali(y, m, d);
    return {
      jy: j.jy,
      jm: j.jm,
      jd: j.jd,
      hour,
      minute,
      second,
      hasDate: true,
      hasTime,
    };
  }

  // Jalaali year
  return {
    jy: y,
    jm: Math.min(12, Math.max(1, m)),
    jd: Math.min(31, Math.max(1, d)),
    hour,
    minute,
    second,
    hasDate: true,
    hasTime,
  };
}

/**
 * Compares two Jalaali dates (jy1, jm1, jd1) and (jy2, jm2, jd2).
 * Returns < 0 if d1 < d2, 0 if d1 == d2, > 0 if d1 > d2.
 */
export function compareJalaaliDates(
  jy1: number,
  jm1: number,
  jd1: number,
  jy2: number,
  jm2: number,
  jd2: number,
): number {
  if (jy1 !== jy2) return jy1 - jy2;
  if (jm1 !== jm2) return jm1 - jm2;
  return jd1 - jd2;
}
