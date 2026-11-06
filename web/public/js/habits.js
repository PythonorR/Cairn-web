import { html, useState } from "../vendor/preact-htm.js";
import { haptic, Icon, Sheet } from "./ui.js";
import { addDays, habitStats } from "./logic.js";
import { weekdayShort } from "./format.js";
import { t } from "./i18n.js";

// Habits belong to the account, not to a planner.
// They are checked inside a planner (top of the Day view) and shown as an overview on the first screen.

/** Add a new habit (habit = null) or rename / delete an existing one. */
export function HabitSheet({ store, habit, onClose }) {
  const [name, setName] = useState(habit?.name || "");
  const trimmed = name.trim();

  const save = () => {
    if (!trimmed) return;
    if (habit) store.renameHabit(habit.id, trimmed);
    else store.addHabit(trimmed);
    onClose();
  };
  const remove = () => {
    if (!confirm(t("deleteHabitConfirm", { name: habit.name }))) return;
    store.deleteHabit(habit.id);
    onClose();
  };

  return html`<${Sheet} title=${habit ? t("editHabit") : t("newHabit")} onClose=${onClose}
      left=${html`<button class="text-btn" onClick=${onClose}>${t("cancel")}</button>`}
      right=${html`<button class="text-btn strong" disabled=${!trimmed} onClick=${save}>${t("save")}</button>`}>
    <label class="field big"><span class="label-text">${t("habitName")}</span>
      <input value=${name} placeholder=${t("habitPh")} autofocus
             onInput=${(e) => setName(e.target.value)} onKeyDown=${(e) => e.key === "Enter" && save()}/></label>
    <p class="footnote">${t("habitNote")}</p>
    ${habit && html`<button class="danger-btn" onClick=${remove}>${t("deleteHabit")}</button>`}
  <//>`;
}

/** First screen: check today's habits, add new ones, and see each one's last 14 days. */
export function HabitsOverview({ store, habits, today }) {
  const [sheet, setSheet] = useState(null); // habit, "new", or null
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  return html`<section class="habits-home" aria-label=${t("habits")}>
    <h2 class="label muted">${t("habitsToday")}</h2>
    ${habits.map((h) => {
      const set = new Set(h.days || []);
      const on = set.has(today);
      const s = habitStats(h.days, today);
      return html`<div key=${h.id} class=${`habit-card${on ? " is-on" : ""}`}>
        <span class="habit-card-top">
          <button class="habit-check" aria-pressed=${on}
              aria-label=${on ? t("unmarkHabit", { title: h.name }) : t("markHabit", { title: h.name })}
              onClick=${() => { haptic(); store.toggleHabit(h.id, today); }}>
            <span class=${`circle habit${on ? " on" : ""}`}>${on && html`<${Icon.check}/>`}</span>
          </button>
          <button class="habit-name" onClick=${() => setSheet(h)} aria-label=${`${h.name}, ${t("editHabit")}`}>${h.name}</button>
          <span class="habit-count"><b>${s.total}</b><small>${t("daysUnit")}</small></span>
        </span>
        <span class="habit-dots" aria-hidden="true">
          ${days.map((d) => html`<i key=${d} class=${`${set.has(d) ? "on" : ""}${d === today ? " today" : ""}`} title=${weekdayShort(d)}></i>`)}
        </span>
        <span class="habit-meta muted">
          <span>${s.streak >= 2 ? t("habitStreak", { n: s.streak }) : s.total ? t("habitKeepGoing") : t("habitNotStarted")}</span>
          <span>${t("last14")}</span>
        </span>
      </div>`;
    })}
    <button class="add-inline habit-add" onClick=${() => setSheet("new")}><${Icon.plus}/> ${habits.length ? t("addHabit") : t("addFirstHabit")}</button>
    ${sheet && html`<${HabitSheet} store=${store} habit=${sheet === "new" ? null : sheet} onClose=${() => setSheet(null)}/>`}
  </section>`;
}
