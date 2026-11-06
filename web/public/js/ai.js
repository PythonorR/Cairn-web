import { html, useState } from "../vendor/preact-htm.js";
import { addDays, itemsOn, newItem, subjectOf } from "./logic.js";
import * as F from "./format.js";
import { colorVar, Icon, Sheet } from "./ui.js";
import { lang, t } from "./i18n.js";

// "Plan with AI": Gemini (through Firebase AI Logic) reads the uploaded materials, judges how
// hard each part is, and spreads study tasks across the days. See gemini.js for the request.

const MAX_TOTAL_BYTES = 14 * 1024 * 1024;  // inline files must stay under Gemini's ~20 MB request limit after base64
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const DAILY_OPTIONS = [30, 60, 90, 120, 150, 180, 240, 300, 360];

const readBase64 = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(",")[1] || "");
  r.onerror = () => reject(r.error);
  r.readAsDataURL(file);
});

function aiError(e) {
  const code = String(e?.code || "");
  if (code.includes("api-not-enabled")) return t("aiNotSetUp");
  if (/quota|429|resource-exhausted/i.test(code + " " + (e?.message || ""))) return t("aiBusy");
  if (/too large|413|payload/i.test(e?.message || "")) return t("aiTooBig");
  if (/load failed|failed to fetch|network/i.test(e?.message || "")) return t("aiNetwork");
  return t("aiFailed");
}

export function AIPlanner({ store, planner, today, defaultSubject, onClose, onAdded }) {
  const [files, setFiles] = useState([]);
  const [scope, setScope] = useState("");
  const [subjectId, setSubjectId] = useState(defaultSubject);
  const [start, setStart] = useState(today > planner.start ? today : planner.start);
  const [finish, setFinish] = useState(planner.end >= today ? planner.end : addDays(today, 6));
  const [daily, setDaily] = useState(120);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(""); // Google's own message, small, to help find the cause
  const [plan, setPlan] = useState(null); // { summary, tasks }

  const totalBytes = files.reduce((n, f) => n + f.size, 0);
  const subject = subjectOf(planner, subjectId);

  const addFiles = (list) => {
    setError("");
    const next = [...files];
    for (const f of list) {
      const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
      if (!isPdf && !IMAGE_TYPES.includes(f.type)) { setError(t("badFile", { name: f.name })); continue; }
      if (!isPdf && f.size > MAX_IMAGE_BYTES) { setError(t("imageTooBig", { name: f.name })); continue; }
      next.push(f);
    }
    setFiles(next);
  };

  const makePlan = async () => {
    setError("");
    setDetail("");
    if (!files.length && !scope.trim()) return setError(t("aiNeedsInput"));
    if (totalBytes > MAX_TOTAL_BYTES) return setError(t("aiTooBig"));
    setBusy(true);
    try {
      const encoded = [];
      for (const f of files) {
        const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
        encoded.push({ mimeType: isPdf ? "application/pdf" : f.type, data: await readBase64(f) });
      }
      const load = [];
      for (let d = start; d <= finish; d = addDays(d, 1)) {
        const n = itemsOn(planner, d).filter((i) => i.kind === "task" && !i.done).length;
        if (n) load.push(`${d}: ${n}`);
      }
      const text = [
        `Language for titles and summary: ${lang === "ko" ? "Korean" : "English"}`,
        `Subject: ${subject?.name || "(none)"}`,
        `Start date: ${start} (${new Date(start + "T12:00").toLocaleDateString("en-US", { weekday: "long" })})`,
        `Finish by (inclusive): ${finish} (${new Date(finish + "T12:00").toLocaleDateString("en-US", { weekday: "long" })})`,
        `Study time per day: ${daily} minutes`,
        `Already planned (unfinished tasks per day): ${load.length ? load.join(", ") : "none"}`,
        `What to cover / notes: ${scope.trim() || "Everything in the attached materials."}`,
      ].join("\n");

      const parsed = await store.aiPlan({ files: encoded, text, start, finish });
      const tasks = (parsed.tasks || [])
        .filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.date) && x.date >= start && x.date <= finish && x.title?.trim())
        .map((x) => ({ ...x, title: x.title.trim(), minutes: Math.max(5, Math.min(600, Math.round(x.minutes) || 30)) }))
        .sort((a, b) => a.date.localeCompare(b.date));
      if (!tasks.length) throw new Error("empty plan");
      setPlan({ summary: parsed.summary || "", tasks });
    } catch (e) {
      console.error(e);
      setError(e?.refusal ? t("aiRefused") : aiError(e));
      setDetail(String(e?.message || e || "").replace(/\s+/g, " ").slice(0, 400));
    }
    setBusy(false);
  };

  const addAll = () => {
    store.add(planner.id, plan.tasks.map((x) =>
      newItem({ title: x.title, subjectId: subject?.id ?? null, date: x.date, minutes: x.minutes, difficulty: x.difficulty })));
    onAdded(plan.tasks[0].date);
  };

  if (plan) {
    const days = [...new Set(plan.tasks.map((x) => x.date))];
    return html`<${Sheet} title=${t("aiTitle")} onClose=${onClose}
        left=${html`<button class="text-btn" onClick=${() => setPlan(null)}>${t("tryAgain")}</button>`}
        right=${html`<button class="text-btn strong" onClick=${addAll}>${t("addTasks", { n: plan.tasks.length })}</button>`}>
      <p class="ai-count">${t("aiPreview", { n: plan.tasks.length, d: days.length })}</p>
      ${plan.summary && html`<p class="muted ai-summary">${plan.summary}</p>`}
      ${days.map((d) => {
        const list = plan.tasks.filter((x) => x.date === d);
        const mins = list.reduce((n, x) => n + x.minutes, 0);
        return html`<section class="ai-day" key=${d}>
          <p class="section-label ai-day-head"><span>${F.weekdayMonthDay(d)}</span><span>${F.duration(mins)}</span></p>
          ${list.map((x, i) => html`<div class="ai-task" key=${i}>
            <span class=${`diff diff-${x.difficulty}`} title=${t(x.difficulty)}></span>
            <span class="grow">${x.title}</span>
            <span class="muted small nowrap">${F.duration(x.minutes)} · ${t(x.difficulty)}</span>
          </div>`)}
        </section>`;
      })}
      <button class="capsule ai-add" onClick=${addAll}>${t("addTasks", { n: plan.tasks.length })}</button>
    <//>`;
  }

  return html`<${Sheet} title=${t("aiTitle")} onClose=${busy ? () => {} : onClose}
      left=${html`<button class="text-btn" disabled=${busy} onClick=${onClose}>${t("cancel")}</button>`}>
    <p class="muted ai-intro">${t("aiIntro")}</p>

    <p class="section-label">${t("materials")}</p>
    ${files.map((f, i) => html`<div class="ai-file" key=${i}>
      <${Icon.file}/><span class="grow ellipsis">${f.name}</span>
      <span class="muted small">${(f.size / 1024 / 1024).toFixed(1)} MB</span>
      <button class="icon" aria-label=${`${t("remove")} ${f.name}`} disabled=${busy}
              onClick=${() => setFiles(files.filter((_, j) => j !== i))}><${Icon.close}/></button>
    </div>`)}
    <label class="add-row file-pick">
      <${Icon.plus}/> ${t("addFiles")}
      <input type="file" multiple accept="application/pdf,.pdf,image/png,image/jpeg,image/gif,image/webp" disabled=${busy}
             onChange=${(e) => { addFiles([...e.target.files]); e.target.value = ""; }}/>
    </label>
    <p class="footnote">${t("filesHelp")}</p>

    <p class="section-label">${t("scope")}</p>
    <textarea class="scope-input" rows="3" placeholder=${t("scopePh")} value=${scope} disabled=${busy}
              onInput=${(e) => setScope(e.target.value)}></textarea>

    <label class="field"><span>${t("subject")}</span>
      <select value=${subjectId || ""} disabled=${busy} onChange=${(e) => setSubjectId(e.target.value || null)}>
        <option value="">${t("none")}</option>
        ${planner.subjects.map((s) => html`<option value=${s.id}>${s.name || t("untitledSubject")}</option>`)}
      </select></label>
    <label class="field"><span>${t("start")}</span>
      <input type="date" value=${start} min=${today} disabled=${busy} onChange=${(e) => { const v = e.target.value; if (v) { setStart(v); if (finish < v) setFinish(v); } }}/></label>
    <label class="field"><span>${t("finishBy")}</span>
      <input type="date" value=${finish} min=${start} disabled=${busy} onChange=${(e) => e.target.value && setFinish(e.target.value)}/></label>
    <label class="field"><span>${t("dailyTime")}</span>
      <select value=${daily} disabled=${busy} onChange=${(e) => setDaily(Number(e.target.value))}>
        ${DAILY_OPTIONS.map((m) => html`<option value=${m}>${F.duration(m)}</option>`)}
      </select></label>

    ${error && html`<p class="error" role="alert">${error}</p>`}
    ${detail && html`<p class="error-detail">${detail}</p>`}
    <button class="capsule ai-go" disabled=${busy} onClick=${makePlan} style=${subject ? `--c:${colorVar(subject.color)}` : ""}>
      ${busy ? html`<span class="spinner" aria-hidden="true"></span>` : html`<${Icon.sparkle}/>`}
      <span>${busy ? t("thinking") : t("makePlan")}</span>
    </button>
    <p class="footnote center">${F.range(start, finish)}</p>
  <//>`;
}
