import { html, useState } from "../vendor/preact-htm.js";
import { displayName } from "./logic.js";
import { Sheet } from "./ui.js";
import { t } from "./i18n.js";
import { SubjectsEditor } from "./subjects.js";

/** Planner settings. Every change is saved right away. */
export function Settings({ store, planner, onClose, onDeleted }) {
  const [name, setName] = useState(planner.name);
  const id = planner.id;

  const deletePlanner = () => {
    if (!confirm(t("deletePlannerConfirm", { name: displayName(planner) }))) return;
    onClose();
    onDeleted();
  };

  return html`<${Sheet} title=${t("settings")} onClose=${onClose}
      right=${html`<button class="text-btn strong" onClick=${onClose}>${t("done")}</button>`}>
    <p class="section-label">${t("planner")}</p>
    <label class="field big"><span class="label-text">${t("name")}</span>
      <input value=${name} placeholder=${t("plannerName")}
             onInput=${(e) => { setName(e.target.value); store.update(id, { name: e.target.value }); }}/></label>
    <label class="field"><span>${t("start")}</span>
      <input type="date" value=${planner.start} onChange=${(e) => e.target.value && store.update(id, { start: e.target.value })}/></label>
    <label class="field"><span>${t("end")}</span>
      <input type="date" value=${planner.end} min=${planner.start}
             onChange=${(e) => e.target.value && store.update(id, { end: e.target.value })}/></label>

    <p class="section-label">${t("subjects")}</p>
    <${SubjectsEditor} subjects=${planner.subjects} onChange=${(list) => store.update(id, { subjects: list })}/>
    <p class="footnote">${t("deleteSubjectNote")}</p>

    <button class="danger-btn" onClick=${deletePlanner}>${t("deletePlanner")}</button>
  <//>`;
}
