import { describe, expect, test } from "vitest";
import {
  compareJalaaliDates,
  formatGregorianDate,
  formatGregorianDateTime,
  formatJalaaliDate,
  formatJalaaliDateTime,
  isLeapJalaaliYear,
  jalaaliDayOfWeek,
  jalaaliMonthLength,
  parseDateOrDateTime,
  toEnglishDigits,
  toGregorian,
  toJalaali,
  toPersianDigits,
  WEEKDAY_NAMES_FA,
  WEEKDAY_SHORT_FA,
  JALAALI_MONTH_NAMES_FA,
} from "../../src/utils/jalaali.ts";

describe("jalaali calendar conversions", () => {
  test("converts Nowruz 1403 to Gregorian 2024-03-20 and back", () => {
    const j = toJalaali(2024, 3, 20);
    expect(j).toEqual({ jy: 1403, jm: 1, jd: 1 });

    const g = toGregorian(1403, 1, 1);
    expect(g).toEqual({ gy: 2024, gm: 3, gd: 20 });
  });

  test("converts date 2026-11-15 to Jalali 1405-08-24 and back", () => {
    const j = toJalaali(2026, 11, 15);
    expect(j).toEqual({ jy: 1405, jm: 8, jd: 24 });

    const g = toGregorian(1405, 8, 24);
    expect(g).toEqual({ gy: 2026, gm: 11, gd: 15 });
  });

  test("identifies leap years correctly", () => {
    expect(isLeapJalaaliYear(1399)).toBe(true);
    expect(isLeapJalaaliYear(1400)).toBe(false);
    expect(isLeapJalaaliYear(1401)).toBe(false);
    expect(isLeapJalaaliYear(1402)).toBe(false);
    expect(isLeapJalaaliYear(1403)).toBe(true);
    expect(isLeapJalaaliYear(1404)).toBe(false);
  });

  test("returns correct month lengths", () => {
    // First 6 months: 31 days
    for (let m = 1; m <= 6; m++) {
      expect(jalaaliMonthLength(1403, m)).toBe(31);
    }
    // Months 7 to 11: 30 days
    for (let m = 7; m <= 11; m++) {
      expect(jalaaliMonthLength(1403, m)).toBe(30);
    }
    // Month 12: 30 in leap year 1403, 29 in non-leap year 1404
    expect(jalaaliMonthLength(1403, 12)).toBe(30);
    expect(jalaaliMonthLength(1404, 12)).toBe(29);
  });

  test("determines day of week correctly (Saturday = 0)", () => {
    // 1403-01-01 was 2024-03-20 (Wednesday = 4 in Jalali: Sat=0, Sun=1, Mon=2, Tue=3, Wed=4)
    expect(jalaaliDayOfWeek(1403, 1, 1)).toBe(4);
    // 2026-11-15 is Sunday = 1 in Jalali
    expect(jalaaliDayOfWeek(1405, 8, 24)).toBe(1);
  });

  test("converts digits between Persian and English", () => {
    expect(toPersianDigits("1403/08/25")).toBe("۱۴۰۳/۰۸/۲۵");
    expect(toEnglishDigits("۱۴۰۳/۰۸/۲۵")).toBe("1403/08/25");
    expect(toEnglishDigits("١٤٠٣/٠٨/٢٥")).toBe("1403/08/25");
  });

  test("formats dates correctly", () => {
    expect(formatJalaaliDate(1403, 8, 5)).toBe("1403/08/05");
    expect(formatJalaaliDateTime(1403, 8, 5, 9, 7)).toBe("1403/08/05 09:07");
    expect(formatGregorianDate(2024, 3, 5)).toBe("2024-03-05");
    expect(formatGregorianDateTime(2024, 3, 5, 9, 7, 0)).toBe(
      "2024-03-05T09:07:00",
    );
  });

  test("parses Jalaali and Gregorian strings seamlessly", () => {
    const fromJalali = parseDateOrDateTime("1403/08/25");
    expect(fromJalali).toMatchObject({
      jy: 1403,
      jm: 8,
      jd: 25,
      hasDate: true,
      hasTime: false,
    });

    const fromGregorian = parseDateOrDateTime("2024-11-15");
    expect(fromGregorian).toMatchObject({
      jy: 1403,
      jm: 8,
      jd: 25,
      hasDate: true,
      hasTime: false,
    });

    const fromDateTime = parseDateOrDateTime("1403/08/25 14:30");
    expect(fromDateTime).toMatchObject({
      jy: 1403,
      jm: 8,
      jd: 25,
      hour: 14,
      minute: 30,
      hasDate: true,
      hasTime: true,
    });

    const fromTimeOnly = parseDateOrDateTime("14:30");
    expect(fromTimeOnly).toMatchObject({
      hour: 14,
      minute: 30,
      hasDate: false,
      hasTime: true,
    });

    expect(parseDateOrDateTime("")).toBeNull();
    expect(parseDateOrDateTime(null)).toBeNull();
  });

  test("compares Jalaali dates correctly", () => {
    expect(compareJalaaliDates(1403, 1, 1, 1403, 1, 2)).toBeLessThan(0);
    expect(compareJalaaliDates(1403, 2, 1, 1403, 1, 30)).toBeGreaterThan(0);
    expect(compareJalaaliDates(1404, 1, 1, 1403, 12, 29)).toBeGreaterThan(0);
    expect(compareJalaaliDates(1403, 5, 10, 1403, 5, 10)).toBe(0);
  });

  test("exports month and weekday names", () => {
    expect(JALAALI_MONTH_NAMES_FA).toHaveLength(12);
    expect(JALAALI_MONTH_NAMES_FA[0]).toBe("فروردین");
    expect(WEEKDAY_NAMES_FA).toHaveLength(7);
    expect(WEEKDAY_NAMES_FA[0]).toBe("شنبه");
    expect(WEEKDAY_SHORT_FA).toHaveLength(7);
    expect(WEEKDAY_SHORT_FA[0]).toBe("ش");
  });
});
