import { html, useState } from "../vendor/preact-htm.js";
import { addDays, displayName, tally, uid } from "./logic.js";
import { colorVar } from "./ui.js";
import { fullDay, range } from "./format.js";
import { getTheme, Icon, Logo, Segmented, setTheme, Sheet } from "./ui.js";
import { HabitsOverview } from "./habits.js";
import { lang, setLang, t } from "./i18n.js";
import { newSubject, SubjectsEditor } from "./subjects.js";
import { AI_EMAILS } from "../config.js";

/** Accounts that see "Plan with AI" (the AI proxy also checks the account itself). */
export const canUseAI = (user) => AI_EMAILS.map((e) => e.toLowerCase()).includes((user.email || "").toLowerCase());

/** Root screen. Exactly one add control: the "New planner" capsule at the bottom. */
export function PlannerList({ store, state, user, backend }) {
  const [showNew, setShowNew] = useState(false);
  const [menu, setMenu] = useState(false);
  const [theme, setThemeState] = useState(getTheme());
  const [showPast, setShowPast] = useState(false);
  const [notice, setNotice] = useState("");
  const active = state.planners.filter((p) => p.end >= state.today);
  const past = state.planners.filter((p) => p.end < state.today).sort((a, b) => b.end.localeCompare(a.end));

  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify(store.exportData(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cairn-backup-${state.today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setMenu(false);
  };
  const restoreBackup = async (file) => {
    setMenu(false);
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const n = { p: (data.planners || []).length, h: (data.habits || []).length };
      if (!confirm(t("restoreConfirm", { p: n.p, h: n.h }))) return;
      const done = store.importData(data);
      setNotice(t("restored", { p: done.planners, h: done.habits }));
    } catch { setNotice(t("restoreFailed")); }
  };
  const deleteAccount = async () => {
    setMenu(false);
    if (!confirm(t("deleteAccountConfirm"))) return;
    try { await store.deleteAccount(); }
    catch (e) {
      if (e?.code === "auth/requires-recent-login") { alert(t("deleteAccountReauth")); backend.signOut(); }
      else setNotice(t("authUnknown"));
    }
  };
  // Always the email's first letter, so it never changes between sign-ins.
  const initial = (user.email || user.name || "?").trim().charAt(0).toUpperCase();

  return html`<div class="screen">
    <main class="pad grow">
      <header class="list-head">
        <div class="grow">
          <h1 class="title brand-title"><${Logo} size=${40}/><span>${t("brand")}</span></h1>
          <p class="today-line muted">${fullDay(state.today)}</p>
        </div>
        <a class="guide-link" href="#/guide">${t("howItWorks")}</a>
        <button class="avatar" aria-label=${t("account")} aria-expanded=${menu} onClick=${() => setMenu(!menu)}>${initial}</button>
        ${menu && html`
          <div class="scrim" onClick=${() => setMenu(false)}></div>
          <div class="popover" role="menu">
            <p class="muted small">${user.email}</p>
            <p class="popover-label">${t("theme")}</p>
            <div class="popover-seg">
              <${Segmented} label=${t("theme")} value=${theme} onChange=${(v) => { setThemeState(v); setTheme(v); }}
                  options=${[["auto", t("auto")], ["light", t("light")], ["dark", t("dark")]]}/>
            </div>
            <p class="popover-label">${t("language")}</p>
            <div class="popover-seg">
              <${Segmented} label=${t("language")} value=${lang} onChange=${(l) => l !== lang && setLang(l)}
                  options=${[["en", "English"], ["ko", "한국어"]]}/>
            </div>
            <div class="popover-sep"></div>
            <button role="menuitem" class="popover-item" onClick=${downloadBackup}>${t("downloadBackup")}</button>
            <label role="menuitem" class="popover-item file-item">${t("restoreBackup")}
              <input type="file" accept="application/json,.json" onChange=${(e) => restoreBackup(e.target.files[0])}/></label>
            <div class="popover-sep"></div>
            <button role="menuitem" class="popover-item" onClick=${() => { setMenu(false); backend.signOut(); }}>${t("signOut")}</button>
            <button role="menuitem" class="popover-item danger small-item" onClick=${deleteAccount}>${t("deleteAccount")}</button>
          </div>`}
      </header>

      <${HabitsOverview} store=${store} habits=${state.habits} today=${state.today}/>

      ${notice && html`<p class="notice-line" role="status" onClick=${() => setNotice("")}>${notice}</p>`}

      ${active.length === 0
        ? html`<section class="empty-state">
            <h2>${past.length ? t("noActivePlanners") : t("noPlanners")}</h2>
            <p class="muted">${t("noPlannersHelp")}</p>
            ${!past.length && html`<a class="guide-cta" href="#/guide">${t("newHere")} <${Icon.right}/></a>`}
          </section>`
        : html`<ul class="planners">
            ${active.map((p) => html`<li key=${p.id}><${PlannerRow} planner=${p}/></li>`)}
          </ul>`}

      ${past.length > 0 && html`<section class="past-planners">
        <button class="past-toggle" aria-expanded=${showPast} onClick=${() => setShowPast(!showPast)}>
          <span>${t("pastPlanners", { n: past.length })}</span><span class="past-chev"><${Icon.right}/></span>
        </button>
        ${showPast && html`<ul class="planners past-list">
          ${past.map((p) => html`<li key=${p.id}><${PlannerRow} planner=${p}/></li>`)}
        </ul>`}
      </section>`}
    </main>

    <footer class="bottom">
      <button class="capsule" onClick=${() => setShowNew(true)}>${t("newPlannerBtn")}</button>
    </footer>

    ${showNew && html`<${NewPlanner} store=${store} state=${state} onClose=${() => setShowNew(false)}/>`}
  </div>`;
}

function PlannerRow({ planner }) {
  const tl = tally(planner.items);
  const done = t("ofDone", { done: tl.done, total: tl.total });
  // Progress line made of each subject's finished share, in its own colour.
  const known = new Set(planner.subjects.map((s) => s.id));
  const parts = [
    ...planner.subjects.map((s) => ({ key: s.id, color: colorVar(s.color),
      n: planner.items.filter((i) => i.subjectId === s.id && i.kind !== "event" && i.done).length })),
    { key: "none", color: "var(--muted)",
      n: planner.items.filter((i) => (!i.subjectId || !known.has(i.subjectId)) && i.kind !== "event" && i.done).length },
  ].filter((p) => p.n > 0);
  return html`<a class="planner-row" href=${`#/p/${planner.id}`}
      aria-label=${`${displayName(planner)}, ${range(planner.start, planner.end)}, ${done}`}>
    <span class="planner-name">${displayName(planner)}</span>
    <span class="chev" aria-hidden="true"><${Icon.right}/></span>
    <span class="subj-bar" aria-hidden="true">
      ${parts.map((p) => html`<i key=${p.key} style=${`width:${(p.n / Math.max(tl.total, 1)) * 100}%;background:${p.color}`}></i>`)}
    </span>
    <span class="planner-meta"><span>${range(planner.start, planner.end)}</span><span>${done}</span></span>
    ${planner.subjects.length > 0 && html`<span class="planner-subjects">
      ${planner.subjects.map((s) => html`<span key=${s.id}><i style=${`background:${colorVar(s.color)}`}></i>${s.name || t("untitledSubject")}</span>`)}
    </span>`}
  </a>`;
}

function NewPlanner({ store, state, onClose }) {
  const [name, setName] = useState("");
  const [start, setStart] = useState(state.today);
  const [end, setEnd] = useState(addDays(state.today, 9));
  const [source, setSource] = useState("blank");
  const [subjects, setSubjects] = useState(() => [newSubject([])]);
  const canCreate = name.trim().length > 0;

  const pick = (s) => {
    setSource(s);
    if (s.startsWith("copy:")) {
      const from = store.planner(s.slice(5));
      setSubjects((from?.subjects || []).map((x) => ({ ...x, id: uid() })));
    } else setSubjects([newSubject([])]);
  };
  const changeStart = (v) => { if (!v) return; setStart(v); if (end < v) setEnd(v); };

  const create = () => {
    const e = end < start ? start : end;
    store.createPlanner({ name: name.trim(), start, end: e, subjects: subjects.filter((s) => s.name.trim()) });
    onClose();
  };

  const options = [["blank", t("blank")]];
  state.planners.forEach((p) => options.push([`copy:${p.id}`, t("subjectsFrom", { name: displayName(p) })]));

  return html`<${Sheet} title=${t("newPlanner")} onClose=${onClose}
      left=${html`<button class="text-btn" onClick=${onClose}>${t("cancel")}</button>`}
      right=${html`<button class="text-btn strong" disabled=${!canCreate} onClick=${create}>${t("create")}</button>`}>
    <label class="field big"><span class="label-text">${t("name")}</span>
      <input value=${name} placeholder=${t("namePlaceholder")} onInput=${(e) => setName(e.target.value)} autofocus/></label>
    <label class="field"><span>${t("start")}</span><input type="date" value=${start} onChange=${(e) => changeStart(e.target.value)}/></label>
    <label class="field"><span>${t("end")}</span><input type="date" value=${end} min=${start} onChange=${(e) => e.target.value && setEnd(e.target.value)}/></label>

    ${options.length > 1 && html`
      <p class="section-label">${t("startFrom")}</p>
      <div class="choices" role="radiogroup" aria-label=${t("startFrom")}>
        ${options.map(([v, label]) => html`<label class="choice">
          <input type="radio" name="source" checked=${source === v} onChange=${() => pick(v)}/>
          <span>${label}</span></label>`)}
      </div>`}

    <p class="section-label">${t("subjects")}</p>
    <${SubjectsEditor} subjects=${subjects} onChange=${setSubjects}/>
    <p class="footnote">${t("subjectsHelp")}</p>
  <//>`;
}
