import { parseKey } from "./logic.js";
import { lang, locale } from "./i18n.js";

// Dates and times in the chosen UI language, in the device time zone.
const fmt = (opts) => new Intl.DateTimeFormat(locale, opts);
const F = {
  monthDay: fmt({ month: "short", day: "numeric" }),
  weekdayMonthDay: fmt({ weekday: "short", month: "short", day: "numeric" }),
  fullDay: fmt({ weekday: "long", month: "long", day: "numeric" }),
  weekdayShort: fmt({ weekday: "short" }),
  weekdayNarrow: fmt({ weekday: "narrow" }),
  month: fmt({ month: "long" }),
  year: fmt({ year: "numeric" }),
};

export const monthDay = (k) => F.monthDay.format(parseKey(k));                   // Nov 1 · 11월 1일
export const weekdayMonthDay = (k) => F.weekdayMonthDay.format(parseKey(k));     // Sun, Nov 1 · 11월 1일 (일)
export const fullDay = (k) => F.fullDay.format(parseKey(k));                     // Sunday, November 1 · 11월 1일 일요일
export const weekdayShort = (k) => F.weekdayShort.format(parseKey(k)).toUpperCase(); // SUN · 일
export const monthName = (k) => F.month.format(parseKey(k));
export const year = (k) => F.year.format(parseKey(k));
export const range = (a, b) => `${monthDay(a)} – ${monthDay(b)}`;
export const dayNumber = (k) => String(parseKey(k).getDate());

/** 5:00 PM / 오후 5:00, or "5 PM" / "오후 5시" when compact and on the hour. */
export function time(minutes, compact = false, language = lang) {
  const h = Math.floor(minutes / 60) % 24, m = minutes % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(m).padStart(2, "0");
  if (language === "ko") {
    const ap = h < 12 ? "오전" : "오후";
    return compact && m === 0 ? `${ap} ${h12}시` : `${ap} ${h12}:${mm}`;
  }
  const ap = h < 12 ? "AM" : "PM";
  return compact && m === 0 ? `${h12} ${ap}` : `${h12}:${mm} ${ap}`;
}

/** S M T W T F S (일 월 화 …) rotated to the first weekday. */
export function weekdayInitials(first = 0) {
  // Nov 1, 2026 is a Sunday.
  return Array.from({ length: 7 }, (_, i) => F.weekdayNarrow.format(new Date(2026, 10, 1 + ((first + i) % 7))));
}

export const toTimeInput = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export const fromTimeInput = (s) => {
  const [h, m] = (s || "17:00").split(":").map(Number);
  return h * 60 + m;
};

/** 90 → "1 h 30 min" / "1시간 30분" */
export function duration(min, language = lang) {
  const h = Math.floor(min / 60), m = min % 60;
  if (language === "ko") return [h && `${h}시간`, m && `${m}분`].filter(Boolean).join(" ") || "0분";
  return [h && `${h} h`, m && `${m} min`].filter(Boolean).join(" ") || "0 min";
}

/** "11월 셋째 주" / "3rd week of November" — the week belongs to the month of its middle day. */
export function weekOfMonth(days, language = lang) {
  const mid = parseKey(days[3]);
  const n = Math.floor((mid.getDate() - 1) / 7) + 1;
  const month = F.month.format(mid);
  if (language === "ko") return `${month} ${["첫째", "둘째", "셋째", "넷째", "다섯째"][n - 1]} 주`;
  const ord = ["1st", "2nd", "3rd", "4th", "5th"][n - 1];
  return `${ord} week of ${month}`;
}
