import { html, useRef } from "../vendor/preact-htm.js";
import { uid } from "./logic.js";
import { t } from "./i18n.js";
import { colorVar, Icon, PALETTE_NAMES } from "./ui.js";

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
