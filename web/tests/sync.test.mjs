// Reproduces the lost-edits bug: a device with an old cached copy opens the app the next day.
import test from "node:test";
import assert from "node:assert/strict";

globalThis.document = { visibilityState: "visible", addEventListener() {}, removeEventListener() {} };
globalThis.window = { addEventListener() {}, removeEventListener() {} };

const { createStore } = await import("../public/js/store.js");
const { addDays, todayKey } = await import("../public/js/logic.js");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const yesterday = addDays(todayKey(), -1);
const item = (id, title, extra = {}) => ({ id, kind: "task", title, subjectId: null, date: yesterday, time: null,
  done: false, rolledFrom: null, remind: true, seriesId: null, ...extra });

// The copy this device cached before yesterday's edits (no updatedAt, like old data).
const stale = { id: "p1", name: "Midterm Sprint", start: yesterday, end: yesterday, subjects: [], createdAt: 1,
  items: [item("a", "Old title A"), item("b", "Old title B")] };
// What the server holds after editing on another device yesterday.
const edited = { ...stale, updatedAt: Date.now() - 3600_000,
  items: [item("a", "New title A", { done: true }), item("b", "New title B"), item("c", "Added task")] };

function fakeBackend() {
  const server = { p1: structuredClone(edited) };
  return {
    server,
    watch(_u, name, cb) {
      if (name !== "planners") { setTimeout(() => cb([], { fromCache: false })); return () => {}; }
      setTimeout(() => cb([structuredClone(stale)], { fromCache: true }), 0);     // cache first
      setTimeout(() => cb([structuredClone(server.p1)], { fromCache: false }), 50); // then the server
      return () => {};
    },
    save: async (_u, name, p) => { if (name === "planners") server[p.id] = structuredClone(p); },
    remove: async () => {},
  };
}

test("an old cached copy never overwrites newer edits", async () => {
  const backend = fakeBackend();
  const store = createStore(backend, "u1");
  const stop = store.start();
  await wait(1000); // longer than the save delay
  stop();
  const titles = backend.server.p1.items.map((i) => i.title).sort();
  assert.deepEqual(titles, ["Added task", "New title A", "New title B"]);
  assert.equal(backend.server.p1.items.find((i) => i.id === "a").done, true);
  // Unfinished tasks still roll over to today, from the newer copy.
  const b = backend.server.p1.items.find((i) => i.id === "b");
  assert.equal(b.date, todayKey());
  assert.equal(b.rolledFrom, yesterday);
});

test("a local edit made after the server copy is saved", async () => {
  const backend = fakeBackend();
  const store = createStore(backend, "u1");
  const stop = store.start();
  await wait(100);
  store.save("p1", { ...store.planner("p1").items[0], title: "Edited today" });
  await wait(600);
  stop();
  assert.ok(backend.server.p1.items.some((i) => i.title === "Edited today"));
  assert.ok(backend.server.p1.items.some((i) => i.title === "Added task"));
});

test("habits: toggle, stats, and newer server copy wins", async () => {
  const { habitStats } = await import("../public/js/logic.js");
  const today = todayKey();
  assert.deepEqual(habitStats([addDays(today, -2), addDays(today, -1), today], today), { total: 3, streak: 3 });
  assert.deepEqual(habitStats([addDays(today, -3), addDays(today, -1)], today), { total: 2, streak: 1 });
  assert.deepEqual(habitStats([addDays(today, -5)], today), { total: 1, streak: 0 });
  assert.deepEqual(habitStats([addDays(today, 3)], today), { total: 0, streak: 0 });

  const saved = {};
  let habitsCb;
  const backend = {
    watch(_u, name, cb) { if (name === "habits") habitsCb = cb; setTimeout(() => cb([], { fromCache: false })); return () => {}; },
    save: async (_u, name, d) => { saved[d.id] = structuredClone(d); },
    remove: async () => {},
  };
  const store = createStore(backend, "u1");
  const stop = store.start();
  await wait(20);
  store.addHabit("Library");
  const id = store.get().habits[0].id;
  store.toggleHabit(id, today);
  await wait(600);
  assert.deepEqual(saved[id].days, [today]);
  // Another device checks yesterday later; its newer copy arrives and is kept.
  habitsCb([{ ...saved[id], days: [addDays(today, -1), today], updatedAt: Date.now() + 1000 }], { fromCache: false });
  assert.deepEqual(store.get().habits[0].days, [addDays(today, -1), today]);
  stop();
});

test("delete + undo, move to tomorrow, reorder, backup round trip", async () => {
  const today = todayKey();
  const saved = {};
  const backend = {
    watch(_u, name, cb) {
      const p = { id: "p1", name: "P", start: today, end: today, subjects: [], createdAt: 1, updatedAt: 1,
        items: [item("a", "A", { date: today }), item("b", "B", { date: today }), item("c", "C", { date: today })] };
      setTimeout(() => cb(name === "planners" ? [p] : [], { fromCache: false }));
      return () => {};
    },
    save: async (_u, name, d) => { saved[d.id] = structuredClone(d); },
    remove: async () => {},
  };
  const store = createStore(backend, "u1");
  const stop = store.start();
  await wait(30);
  const titles = () => store.planner("p1").items.map((i) => i.title).join("");

  store.remove("p1", "b");
  assert.equal(titles(), "AC");
  assert.match(store.get().toast.text, /B/);
  store.get().toast.undo();
  assert.equal(titles(), "ABC", "undo puts it back in the same place");

  store.postpone("p1", "a");
  assert.equal(store.planner("p1").items.find((i) => i.id === "a").date, addDays(today, 1));
  store.get().toast.undo();
  assert.equal(store.planner("p1").items.find((i) => i.id === "a").date, today);

  store.moveItem("p1", "c", "a");          // C before A
  assert.equal(titles(), "CAB");
  store.moveItem("p1", "c", "b", true);    // C after B
  assert.equal(titles(), "ABC");

  const backup = JSON.parse(JSON.stringify(store.exportData()));
  store.deletePlanner("p1");
  assert.equal(store.get().planners.length, 0);
  const result = store.importData(backup);
  assert.deepEqual(result, { planners: 1, habits: 0 });
  assert.equal(titles(), "ABC");
  stop();
});
