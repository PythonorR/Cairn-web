// Pure helpers (no DOM, no state). Tested with `node --test tests/`.
// Days are local "YYYY-MM-DD" strings, so string comparison is date comparison.

import { t } from "./i18n.js";

// ---------- dates ----------
const pad = (n) => String(n).padStart(2, "0");

export const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseKey = (k) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const todayKey = (now = new Date()) => keyOf(now);

export const addDays = (k, n) => {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return keyOf(d);
};

export const addMonths = (k, n) => {
  const d = parseKey(k);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return keyOf(d);
};

/** Whole days from a to b. */
export const between = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);

/** 0 = Sunday … 6 = Saturday */
export const weekdayOf = (k) => parseKey(k).getDay();

/** The locale's first weekday (0 = Sunday). Falls back to Sunday. */
export function firstWeekday(locale = globalThis.navigator?.language) {
  try {
    const l = new Intl.Locale(locale || "en-US");
    const info = typeof l.getWeekInfo === "function" ? l.getWeekInfo() : l.weekInfo;
    if (info && info.firstDay) return info.firstDay % 7;
  } catch {}
  return 0;
}

export function weekOf(k, first = 0) {
  const start = addDays(k, -((weekdayOf(k) - first + 7) % 7));
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Month grid: leading nulls, every day, trailing nulls to fill the last row. */
export function monthGrid(k, first = 0) {
  const d = parseKey(k);
  const start = keyOf(new Date(d.getFullYear(), d.getMonth(), 1));
  const count = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const cells = Array((weekdayOf(start) - first + 7) % 7).fill(null);
  for (let i = 0; i < count; i++) cells.push(addDays(start, i));
  while (cells.length % 7) cells.push(null);
  return cells;
}

// ---------- repeat ----------
/** Days a repeating task is created on, start..end inclusive, capped at 90 days. Never empty. */
export function occurrences(start, rule, end) {
  if (rule === "never") return [start];
  const last = [end, addDays(start, 89)].sort()[0];
  const out = [];
  for (let day = start, i = 0; day <= last; day = addDays(day, 1), i++) {
    const wd = weekdayOf(day);
    if (rule === "daily") out.push(day);
    else if (rule === "weekdays" && wd !== 0 && wd !== 6) out.push(day);
    else if (rule === "weekly" && i % 7 === 0) out.push(day);
  }
  return out.length ? out : [start];
}

// ---------- rollover ----------
/** Moves unfinished tasks dated before today onto today. Returns { items, changed }. */
export function rollover(items, today) {
  let changed = false;
  const next = items.map((it) => {
    if (it.kind !== "task" || it.done || it.date >= today) return it;
    changed = true;
    return { ...it, rolledFrom: it.rolledFrom ?? it.date, date: today };
  });
  return { items: changed ? next : items, changed };
}

// ---------- counting ----------
export const counts = (it) => it.kind !== "event";

/** Tasks and due items; events are excluded. */
export function tally(items) {
  const c = items.filter(counts);
  const done = c.filter((i) => i.done).length;
  return { done, total: c.length, fraction: c.length ? done / c.length : 0 };
}

/** Undone due items dated today or tomorrow, earliest first. */
export function dueSoon(items, today) {
  const tomorrow = addDays(today, 1);
  return items
    .filter((i) => i.kind === "due" && !i.done && (i.date === today || i.date === tomorrow))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? -1) - (b.time ?? -1) || a.title.localeCompare(b.title));
}

// ---------- ribbon segments ----------
/** One segment per task: subject order, then done first. */
export function segments(items, subjects, limit = 7) {
  const order = new Map(subjects.map((s, i) => [s.id, i]));
  const rank = (it) => (order.has(it.subjectId) ? order.get(it.subjectId) : Infinity);
  return items
    .map((it, index) => ({ it, index }))
    .filter(({ it }) => it.kind === "task")
    .sort((a, b) => rank(a.it) - rank(b.it) || (b.it.done - a.it.done) || a.index - b.index)
    .slice(0, limit)
    .map(({ it }) => ({ color: order.has(it.subjectId) ? subjects[order.get(it.subjectId)].color : null, done: !!it.done }));
}

// ---------- day grouping ----------
export const itemsOn = (planner, day) => planner.items.filter((i) => i.date === day);
export const subjectOf = (planner, id) => planner.subjects.find((s) => s.id === id) || null;
export const displayName = (p) => (p.name || "").trim() || t("untitled");

/** "Due & events" by time, then each subject in order, then "No subject". */
export function groups(planner, day) {
  const all = itemsOn(planner, day);
  const out = [];
  const dueEvents = all
    .filter((i) => i.kind !== "task")
    .sort((a, b) => (a.time ?? -1) - (b.time ?? -1) || a.title.localeCompare(b.title));
  if (dueEvents.length) out.push({ key: "due", kind: "due", title: t("dueEvents"), color: null, items: dueEvents });

  const tasks = all.filter((i) => i.kind === "task");
  for (const s of planner.subjects) {
    const t = tasks.filter((i) => i.subjectId === s.id);
    if (t.length) out.push({ key: s.id, kind: "subject", title: s.name.trim() || t("untitledSubject"), color: s.color, items: t });
  }
  const known = new Set(planner.subjects.map((s) => s.id));
  const rest = tasks.filter((i) => !i.subjectId || !known.has(i.subjectId));
  if (rest.length) out.push({ key: "none", kind: "none", title: t("noSubject"), color: null, items: rest });
  return out;
}

export const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export function newItem(fields) {
  return { id: uid(), kind: "task", title: "", subjectId: null, date: todayKey(), time: null,
           done: false, rolledFrom: null, remind: true, seriesId: null, ...fields };
}

// ---------- habits ----------
/** { total, streak } as of `today`. Streak counts back from today, or from yesterday if today isn't checked yet. */
export function habitStats(days, today) {
  const set = new Set((days || []).filter((d) => d <= today));
  let cursor = set.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (set.has(cursor)) { streak++; cursor = addDays(cursor, -1); }
  return { total: set.size, streak };
}
