import { html, useState } from "../vendor/preact-htm.js";
import { occurrences, subjectOf, todayKey, uid } from "./logic.js";
import { fromTimeInput, toTimeInput, weekdayMonthDay } from "./format.js";
import { Segmented, Sheet, Switch } from "./ui.js";
import { t } from "./i18n.js";

// Two kinds to choose from: Task and Event.
// A task with "Has a deadline" switched on is stored as a due item (kind "due"),
// so the red bar and the "Due & events" section keep working as before.
// New items go on the day you were looking at (no date field); existing ones can be moved.
// Tasks and deadlines can't go on past days; events can (eventOnly = opened from a past day).

export function ItemEditor({ store, planner, item, isNew, eventOnly = false, onClose }) {
  const [draft, setDraft] = useState(() => ({
    ...item,
    kind: eventOnly ? "event" : item.kind,
    subjectId: subjectOf(planner, item.subjectId) ? item.subjectId : null, // deleted subject → None
  }));
  const [rule, setRule] = useState("never");
  const [hasTime, setHasTime] = useState(item.time != null || (isNew && item.kind === "due"));
  const [time, setTime] = useState(item.time ?? 17 * 60);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const title = draft.title.trim();
  const isEvent = draft.kind === "event";
  const hasDeadline = draft.kind === "due";
  const today = todayKey();

  const pickType = (type) => {
    set({ kind: type === "event" ? "event" : "task", remind: true });
    setHasTime(false);
    if (type === "event") setRule("never");
  };
  const toggleDeadline = (on) => {
    set({ kind: on ? "due" : "task", remind: true });
    setHasTime(on);
    if (on) setRule("never");
  };

  const save = () => {
    if (!title) return;
    const it = { ...draft, title, time: draft.kind !== "task" && hasTime ? time : null };
    if (it.kind === "event") { it.done = false; it.subjectId = null; }
    if (isNew) {
      const dates = it.kind === "task" ? occurrences(it.date, rule, planner.end) : [it.date];
      const seriesId = dates.length > 1 ? uid() : null;
      store.add(planner.id, dates.map((date) => ({ ...it, id: uid(), date, seriesId })));
    } else {
      if (it.date !== item.date) it.rolledFrom = null;
      store.save(planner.id, it);
    }
    onClose();
  };

  const remove = () => { store.remove(planner.id, item.id); onClose(); };

  return html`<${Sheet} title=${isNew ? t("new") : t("edit")} onClose=${onClose}
      left=${html`<button class="text-btn" onClick=${onClose}>${t("cancel")}</button>`}
      right=${html`<button class="text-btn strong" disabled=${!title} onClick=${save}>${t("save")}</button>`}>
    ${isNew && !eventOnly && html`<${Segmented} label=${t("type")} value=${isEvent ? "event" : "task"} onChange=${pickType}
        options=${[["task", t("task")], ["event", t("eventKind")]]}/>`}

    <textarea class="title-input" rows="2" placeholder=${t(isEvent ? "phEvent" : hasDeadline ? "phDue" : "phTask")} aria-label=${t("title")}
      value=${draft.title} autofocus=${isNew && !item.title}
      onInput=${(e) => set({ title: e.target.value })}
      onKeyDown=${(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); } }}></textarea>

    ${isNew
      ? html`<p class="adding-on">${t("addingOn", { day: weekdayMonthDay(draft.date) })}</p>`
      : html`<label class="field"><span>${t("date")}</span>
          <input type="date" value=${draft.date} min=${isEvent ? undefined : (item.date < today ? item.date : today)}
                 onChange=${(e) => e.target.value && set({ date: e.target.value })}/></label>`}

    ${!isEvent && html`<label class="field"><span>${t("subject")}</span>
      <select value=${draft.subjectId || ""} onChange=${(e) => set({ subjectId: e.target.value || null })}>
        <option value="">${t("none")}</option>
        ${planner.subjects.map((s) => html`<option value=${s.id}>${s.name || t("untitledSubject")}</option>`)}
      </select></label>`}

    ${!isEvent && html`
      <${Switch} label=${t("hasDeadline")} checked=${hasDeadline} onChange=${toggleDeadline}/>
      ${hasDeadline && html`
        <${Switch} label=${t("dueTime")} checked=${hasTime} onChange=${setHasTime}/>
        ${hasTime && html`<label class="field"><span>${t("time")}</span>
          <input type="time" value=${toTimeInput(time)} onChange=${(e) => e.target.value && setTime(fromTimeInput(e.target.value))}/></label>`}
        <p class="footnote">${t("dueNote")}</p>`}
      ${!hasDeadline && isNew && html`<label class="field"><span>${t("repeat")}</span>
        <select value=${rule} onChange=${(e) => setRule(e.target.value)}>
          <option value="never">${t("never")}</option>
          <option value="daily">${t("everyDay")}</option>
          <option value="weekdays">${t("weekdays")}</option>
          <option value="weekly">${t("everyWeek")}</option>
        </select></label>`}
      ${!hasDeadline && html`<p class="footnote">${t("rolloverNote")}</p>`}`}

    ${isEvent && html`
      <${Switch} label=${t("time")} checked=${hasTime} onChange=${setHasTime}/>
      ${hasTime && html`<label class="field"><span>${t("time")}</span>
        <input type="time" value=${toTimeInput(time)} onChange=${(e) => e.target.value && setTime(fromTimeInput(e.target.value))}/></label>`}
      <p class="footnote">${t("eventNote")}</p>`}

    ${!isNew && html`<button class="danger-btn" onClick=${remove}>${t("delete")}</button>`}
  <//>`;
}
