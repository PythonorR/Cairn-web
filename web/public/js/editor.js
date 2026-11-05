import { html, useState } from "../vendor/preact-htm.js";
import { occurrences, subjectOf, uid } from "./logic.js";
import { fromTimeInput, toTimeInput } from "./format.js";
import { Segmented, Sheet, Switch } from "./ui.js";
import { t } from "./i18n.js";

const PLACEHOLDER = { task: "phTask", due: "phDue", event: "phEvent" };

export function ItemEditor({ store, planner, item, isNew, onClose }) {
  const [draft, setDraft] = useState(() => ({
    ...item,
    subjectId: subjectOf(planner, item.subjectId) ? item.subjectId : null, // deleted subject → None
  }));
  const [rule, setRule] = useState("never");
  const [hasTime, setHasTime] = useState(item.time != null || (isNew && item.kind === "due"));
  const [time, setTime] = useState(item.time ?? 17 * 60);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const title = draft.title.trim();

  const changeKind = (kind) => {
    set({ kind, remind: true });
    setHasTime(kind === "due");
    if (kind !== "task") setRule("never");
  };

  const save = () => {
    if (!title) return;
    const it = { ...draft, title, time: draft.kind !== "task" && hasTime ? time : null };
    if (it.kind === "event") it.done = false;
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
    ${isNew && html`<${Segmented} label=${t("type")} value=${draft.kind} onChange=${changeKind}
        options=${[["task", t("task")], ["due", t("dueDateKind")], ["event", t("eventKind")]]}/>`}

    <textarea class="title-input" rows="2" placeholder=${t(PLACEHOLDER[draft.kind])} aria-label=${t("title")}
      value=${draft.title} autofocus=${isNew && !item.title}
      onInput=${(e) => set({ title: e.target.value })}
      onKeyDown=${(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); } }}></textarea>

    <label class="field"><span>${t("subject")}</span>
      <select value=${draft.subjectId || ""} onChange=${(e) => set({ subjectId: e.target.value || null })}>
        <option value="">${t("none")}</option>
        ${planner.subjects.map((s) => html`<option value=${s.id}>${s.name || t("untitledSubject")}</option>`)}
      </select></label>
    <label class="field"><span>${t("date")}</span>
      <input type="date" value=${draft.date} onChange=${(e) => e.target.value && set({ date: e.target.value })}/></label>

    ${draft.kind === "task" && html`
      ${isNew && html`<label class="field"><span>${t("repeat")}</span>
        <select value=${rule} onChange=${(e) => setRule(e.target.value)}>
          <option value="never">${t("never")}</option>
          <option value="daily">${t("everyDay")}</option>
          <option value="weekdays">${t("weekdays")}</option>
          <option value="weekly">${t("everyWeek")}</option>
        </select></label>`}
      <p class="footnote">${t("rolloverNote")}</p>`}

    ${draft.kind !== "task" && html`
      <${Switch} label=${t("time")} checked=${hasTime} onChange=${setHasTime}/>
      ${hasTime && html`<label class="field"><span>${t("time")}</span>
        <input type="time" value=${toTimeInput(time)} onChange=${(e) => e.target.value && setTime(fromTimeInput(e.target.value))}/></label>`}`}

    ${draft.kind === "due" && html`<p class="footnote">${t("dueNote")}</p>`}
    ${draft.kind === "event" && html`<p class="footnote">${t("eventNote")}</p>`}

    ${!isNew && html`<button class="danger-btn" onClick=${remove}>${t("delete")}</button>`}
  <//>`;
}
