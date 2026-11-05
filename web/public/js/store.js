// All state for the signed-in user (planners + habits): live sync, rollover and every mutation.
//
// Sync rules (to never overwrite newer work with an older copy):
// - Every user edit stamps the document with `updatedAt`.
// - Rollover (moving unfinished tasks to today) is shown right away but only SAVED once the
//   server's latest copy has arrived, and it never bumps `updatedAt`.
// - When the server sends a newer copy than one we were about to save, the server copy wins.
import { rollover, todayKey, uid } from "./logic.js";
import { t } from "./i18n.js";

const SAVE_DELAY = 400; // ms; batches fast typing into one write
const COLLECTIONS = ["planners", "habits"];

export function createStore(backend, userId) {
  let state = { planners: [], habits: [], today: todayKey(), loaded: false, error: null };
  const listeners = new Set();
  const pending = { planners: new Map(), habits: new Map() }; // id -> timer (changes not yet written)
  const loaded = { planners: false, habits: false };
  let serverSeen = false; // true once planners came from the server, not the cache

  const emit = () => listeners.forEach((fn) => fn(state));
  const set = (patch) => { state = { ...state, ...patch }; emit(); };
  const byCreated = (list) => [...list].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  // ---------- writing ----------
  function write(name, d) {
    clearTimeout(pending[name].get(d.id));
    pending[name].set(d.id, setTimeout(() => flushOne(name, d.id), SAVE_DELAY));
  }

  function flushOne(name, id) {
    clearTimeout(pending[name].get(id));
    pending[name].delete(id);
    const d = state[name].find((x) => x.id === id);
    if (!d) return;
    backend.save(userId, name, d).catch((e) => {
      console.error(e);
      set({ error: t("saveFailed") });
    });
  }

  function flush() { for (const name of COLLECTIONS) [...pending[name].keys()].forEach((id) => flushOne(name, id)); }

  // ---------- reading ----------
  /** Server copy, unless we hold a newer unsaved local copy. */
  function merge(name, remote) {
    const merged = remote.map((r) => {
      if (!pending[name].has(r.id)) return r;
      const local = state[name].find((x) => x.id === r.id);
      if (local && (local.updatedAt || 0) >= (r.updatedAt || 0)) return local;
      clearTimeout(pending[name].get(r.id));
      pending[name].delete(r.id);
      return r;
    });
    for (const id of pending[name].keys()) {
      if (!merged.some((d) => d.id === id)) {
        const local = state[name].find((x) => x.id === id);
        if (local) merged.push(local);
      }
    }
    return byCreated(merged);
  }

  /** Applies rollover to every planner. Saves the result only when `persist` is true. */
  function withRollover(planners, today, persist) {
    return planners.map((p) => {
      const r = rollover(p.items || [], today);
      if (!r.changed) return p;
      const next = { ...p, items: r.items };
      if (persist) setTimeout(() => write("planners", next));
      return next;
    });
  }

  function onPlanners(remote, meta) {
    if (!meta.fromCache) serverSeen = true;
    loaded.planners = true;
    const today = todayKey();
    set({ planners: withRollover(merge("planners", remote), today, serverSeen), today,
          loaded: loaded.planners, error: null });
  }

  function onHabits(remote) {
    loaded.habits = true;
    set({ habits: merge("habits", remote) });
  }

  function start() {
    const onError = (err) => { console.error(err); set({ loaded: true, error: t("loadFailed") }); };
    const stops = [
      backend.watch(userId, "planners", onPlanners, onError),
      backend.watch(userId, "habits", onHabits, (err) => console.error(err)),
    ];
    const onHide = () => { if (document.visibilityState === "hidden") flush(); else refreshDay(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    const timer = setInterval(() => { if (todayKey() !== state.today) refreshDay(); }, 60000);
    return () => {
      flush(); stops.forEach((stop) => stop());
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      clearInterval(timer);
    };
  }

  /** On return to the tab and after midnight. */
  function refreshDay() {
    const today = todayKey();
    set({ today, planners: withRollover(state.planners, today, serverSeen) });
  }

  // ---------- planner mutations ----------
  function mutate(id, fn) {
    const today = todayKey();
    let changed = null;
    const planners = state.planners.map((p) => {
      if (p.id !== id) return p;
      const copy = structuredClone(p);
      fn(copy);
      copy.items = rollover(copy.items, today).items;
      copy.updatedAt = Date.now();
      changed = copy;
      return copy;
    });
    if (!changed) return;
    set({ planners, today });
    write("planners", changed);
  }

  // ---------- habit mutations ----------
  function mutateHabit(id, fn) {
    let changed = null;
    const habits = state.habits.map((h) => {
      if (h.id !== id) return h;
      const copy = structuredClone(h);
      fn(copy);
      copy.updatedAt = Date.now();
      changed = copy;
      return copy;
    });
    if (!changed) return;
    set({ habits });
    write("habits", changed);
  }

  const find = (p, itemId) => p.items.findIndex((i) => i.id === itemId);

  const api = {
    get: () => state,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    start,
    refreshDay,
    flush,
    planner: (id) => state.planners.find((p) => p.id === id) || null,

    /** Name, dates and subjects from settings. Items are left alone. */
    update(id, meta) {
      mutate(id, (p) => {
        Object.assign(p, meta);
        if (p.end < p.start) p.end = p.start;
      });
    },
    add(id, items) { mutate(id, (p) => { p.items.push(...items); }); },
    save(id, item) { mutate(id, (p) => { const i = find(p, item.id); if (i >= 0) p.items[i] = item; }); },
    remove(id, itemId) { mutate(id, (p) => { p.items = p.items.filter((i) => i.id !== itemId); }); },
    toggle(id, itemId) {
      mutate(id, (p) => {
        const i = find(p, itemId);
        if (i >= 0 && p.items[i].kind !== "event") p.items[i].done = !p.items[i].done;
      });
    },
    createPlanner({ name, start, end, subjects = [], items = [], source = null }) {
      const today = todayKey();
      const now = Date.now();
      const p = { id: uid(), name, start, end: end < start ? start : end, subjects, items: rollover(items, today).items,
                  source, createdAt: now, updatedAt: now };
      set({ planners: byCreated([...state.planners, p]) });
      write("planners", p);
      return p.id;
    },
    deletePlanner(id) {
      clearTimeout(pending.planners.get(id));
      pending.planners.delete(id);
      set({ planners: state.planners.filter((p) => p.id !== id) });
      backend.remove(userId, "planners", id).catch((e) => console.error(e));
    },

    addHabit(name) {
      const now = Date.now();
      const h = { id: uid(), name, days: [], createdAt: now, updatedAt: now };
      set({ habits: byCreated([...state.habits, h]) });
      write("habits", h);
    },
    renameHabit(id, name) { mutateHabit(id, (h) => { h.name = name; }); },
    toggleHabit(id, day) {
      mutateHabit(id, (h) => {
        const days = new Set(h.days || []);
        if (days.has(day)) days.delete(day); else days.add(day);
        h.days = [...days].sort();
      });
    },
    deleteHabit(id) {
      clearTimeout(pending.habits.get(id));
      pending.habits.delete(id);
      set({ habits: state.habits.filter((h) => h.id !== id) });
      backend.remove(userId, "habits", id).catch((e) => console.error(e));
    },

    /** Firebase sign-in token for the AI proxy. */
    idToken: () => backend.idToken(),
    clearError() { set({ error: null }); },
  };
  return api;
}
