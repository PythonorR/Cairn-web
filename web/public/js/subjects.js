import { html, useRef, useState } from "../vendor/preact-htm.js";
import { uid } from "./logic.js";
import { t } from "./i18n.js";
import { colorVar, Icon, PALETTE_NAMES, Sheet } from "./ui.js";

/** Next unused palette colour. */
export function nextColor(subjects) {
  const used = new Set(subjects.map((s) => s.color));
  return [0, 1, 2, 3, 4, 5].find((c) => !used.has(c)) ?? subjects.length % 6;
}

export const newSubject = (subjects) => ({ id: uid(), name: "", color: nextColor(subjects) });

/** Editable list of subjects: name, colour, remove, add. New subjects start empty and focused. */
export function SubjectsEditor({ subjects, onChange }) {
  const listRef = useRef(null);

  const add = () => {
    const s = newSubject(subjects);
    onChange([...subjects, s]);
    // Focus the new name field once it has rendered.
    const focus = (tries) => {
      const input = listRef.current?.querySelector(`[data-subject="${s.id}"] input.plain-input`);
      if (input) input.focus();
      else if (tries > 0) setTimeout(() => focus(tries - 1), 16);
    };
    setTimeout(() => focus(10), 0);
  };

  const edit = (id, patch) => onChange(subjects.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  return html`<div ref=${listRef}>
    ${subjects.map((s) => html`<div class="subject-edit" key=${s.id} data-subject=${s.id}>
      <div class="subject-line">
        <span class="dot" style=${`background:${colorVar(s.color)}`}></span>
        <input class="grow plain-input" value=${s.name} aria-label=${t("subjectName")} placeholder=${t("subjectName")}
               onInput=${(e) => edit(s.id, { name: e.target.value })}/>
        <button type="button" class="icon" aria-label=${t("deleteSubject", { name: s.name || t("subject") })}
                onClick=${() => onChange(subjects.filter((x) => x.id !== s.id))}><${Icon.trash}/></button>
      </div>
      <div class="swatches" role="radiogroup" aria-label=${t("colour")}>
        ${[0, 1, 2, 3, 4, 5].map((c) => html`<button type="button" role="radio" aria-checked=${s.color === c} aria-label=${PALETTE_NAMES[c]}
            class=${`swatch${s.color === c ? " on" : ""}`} style=${`--c:${colorVar(c)}`}
            onClick=${() => edit(s.id, { color: c })}><i></i></button>`)}
      </div>
    </div>`)}
    <button type="button" class="add-row" onClick=${add}>
      <${Icon.plus}/> ${t("addSubject")}</button>
  </div>`;
}

/** Quick "new subject" sheet used from the Day view and the quick-add bar. */
export function NewSubjectSheet({ subjects, onAdd, onClose }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(nextColor(subjects));
  const trimmed = name.trim();
  const save = () => { if (!trimmed) return; onAdd({ id: uid(), name: trimmed, color }); onClose(); };
  return html`<${Sheet} title=${t("addSubject")} onClose=${onClose}
      left=${html`<button class="text-btn" onClick=${onClose}>${t("cancel")}</button>`}
      right=${html`<button class="text-btn strong" disabled=${!trimmed} onClick=${save}>${t("save")}</button>`}>
    <label class="field big"><span class="label-text">${t("subjectName")}</span>
      <input value=${name} placeholder="STAT 134" autofocus onInput=${(e) => setName(e.target.value)}
             onKeyDown=${(e) => e.key === "Enter" && save()}/></label>
    <div class="swatches new-subject-swatches" role="radiogroup" aria-label=${t("colour")}>
      ${[0, 1, 2, 3, 4, 5].map((c) => html`<button type="button" role="radio" aria-checked=${color === c} aria-label=${PALETTE_NAMES[c]}
          class=${`swatch${color === c ? " on" : ""}`} style=${`--c:${colorVar(c)}`} onClick=${() => setColor(c)}><i></i></button>`)}
    </div>
    <p class="footnote">${t("subjectsLater")}</p>
  <//>`;
}
