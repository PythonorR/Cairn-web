import test from "node:test";
import assert from "node:assert/strict";
import { addDays, addMonths, between, dueSoon, groups, monthGrid, occurrences, rollover, segments, tally, weekOf } from "../public/js/logic.js";
import { time, weekdayInitials } from "../public/js/format.js";

const T = (o) => ({ id: Math.random().toString(36), kind: "task", title: "t", subjectId: null, date: "2026-11-01", time: null, done: false, rolledFrom: null, remind: true, seriesId: null, ...o });

test("rollover moves only undone tasks from the past", () => {
  const items = [T({ date: "2026-11-01" }), T({ done: true }), T({ kind: "due" }), T({ kind: "event" }), T({ date: "2026-11-05" })];
  const r = rollover(items, "2026-11-03");
  assert.equal(r.changed, true);
  assert.deepEqual(r.items.map((i) => i.date), ["2026-11-03", "2026-11-01", "2026-11-01", "2026-11-01", "2026-11-05"]);
  assert.equal(r.items[0].rolledFrom, "2026-11-01");
  assert.equal(r.items[1].rolledFrom, null);
});

test("rolledFrom keeps the first day", () => {
  let items = [T({ date: "2026-11-01" })];
  items = rollover(items, "2026-11-02").items;
  items = rollover(items, "2026-11-04").items;
  assert.equal(items[0].date, "2026-11-04");
  assert.equal(items[0].rolledFrom, "2026-11-01");
  assert.equal(rollover(items, "2026-11-04").changed, false);
});

test("repeat expansion", () => {
  assert.deepEqual(occurrences("2026-11-03", "never", "2026-11-10"), ["2026-11-03"]);
  assert.equal(occurrences("2026-11-01", "daily", "2026-11-10").length, 10);
  assert.deepEqual(occurrences("2026-11-01", "weekdays", "2026-11-10"),
    ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-09", "2026-11-10"]);
  assert.deepEqual(occurrences("2026-11-01", "weekly", "2026-11-30"), ["2026-11-01", "2026-11-08", "2026-11-15", "2026-11-22", "2026-11-29"]);
  assert.equal(occurrences("2026-11-01", "daily", "2027-12-01").length, 90);
  assert.deepEqual(occurrences("2026-11-05", "daily", "2026-11-01"), ["2026-11-05"]);
});

test("date helpers", () => {
  assert.equal(addDays("2026-10-31", 1), "2026-11-01");
  assert.equal(addMonths("2026-01-31", 1), "2026-02-28");
  assert.equal(between("2026-11-01", "2026-11-10"), 9);
  assert.deepEqual(weekOf("2026-11-04", 0)[0], "2026-11-01");
  assert.deepEqual(weekOf("2026-11-04", 1)[0], "2026-11-02");
  const g = monthGrid("2026-11-15", 0);
  assert.equal(g[0], "2026-11-01"); assert.equal(g.length % 7, 0);
  assert.equal(monthGrid("2026-11-15", 1)[6], "2026-11-01");
});

test("counts, red bar, segments, groups", () => {
  assert.deepEqual(tally([T({ done: true }), T({ kind: "due" }), T({ kind: "event" })]), { done: 1, total: 2, fraction: 0.5 });
  const due = [T({ kind: "due", title: "y", date: "2026-11-09" }), T({ kind: "due", title: "today", date: "2026-11-10", time: 1020 }),
               T({ kind: "due", title: "tom", date: "2026-11-11" }), T({ kind: "due", title: "done", date: "2026-11-10", done: true })];
  assert.deepEqual(dueSoon(due, "2026-11-10").map((i) => i.title), ["today", "tom"]);
  const subjects = [{ id: "a", name: "A", color: 0 }, { id: "b", name: "B", color: 1 }];
  const segs = segments([T({ subjectId: "b" }), T({ subjectId: "a" }), T({}), T({ subjectId: "a", done: true }), T({ kind: "event" })], subjects);
  assert.deepEqual(segs, [{ color: 0, done: true }, { color: 0, done: false }, { color: 1, done: false }, { color: null, done: false }]);
  const p = { subjects, items: [T({ subjectId: "zzz" }), T({ kind: "event", time: 600 }), T({ subjectId: "b" })] };
  assert.deepEqual(groups(p, "2026-11-01").map((g) => g.kind), ["due", "subject", "none"]);
});

test("format", () => {
  assert.equal(time(1020), "5:00 PM"); assert.equal(time(1020, true), "5 PM"); assert.equal(time(0), "12:00 AM");
  assert.deepEqual(weekdayInitials(0), ["S", "M", "T", "W", "T", "F", "S"]);
});
