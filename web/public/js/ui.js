import { html, useEffect, useState } from "../vendor/preact-htm.js";
import { dayNumber } from "./format.js";

// ---------- routing ----------
export function useRoute() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const f = () => setHash(location.hash);
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);
  const [name = "", id = ""] = hash.replace(/^#\/?/, "").split("/");
  return { name, id };
}
export const go = (path) => { location.hash = path; };

// ---------- theme ----------
export function getTheme() {
  try { return localStorage.getItem("theme") || "auto"; } catch { return "auto"; }
}
export function setTheme(t) {
  try { localStorage.setItem("theme", t); } catch {}
  applyTheme(t);
}
export function applyTheme(t) {
  const root = document.documentElement;
  if (t === "light" || t === "dark") root.dataset.theme = t;
  else delete root.dataset.theme;
  const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg || "#F6F7F9");
}

// ---------- colours ----------
export const colorVar = (c) => (c === null || c === undefined ? "var(--fg)" : `var(--s${((c % 6) + 6) % 6})`);
export const PALETTE_NAMES = ["Teal", "Indigo", "Orange", "Rose", "Green", "Blue"];

export const haptic = () => { try { navigator.vibrate?.(8); } catch {} };

// ---------- icons ----------
const svg = (body, size = 20, label) => html`
  <svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden=${label ? undefined : "true"}>${body}</svg>`;
export const Icon = {
  sliders: () => svg(html`<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="17" x2="20" y2="17"/><circle cx="9" cy="7" r="2.2" fill="var(--bg)"/><circle cx="15" cy="17" r="2.2" fill="var(--bg)"/>`),
  left: () => svg(html`<polyline points="15 5 8 12 15 19"/>`),
  right: () => svg(html`<polyline points="9 5 16 12 9 19"/>`),
  check: () => svg(html`<polyline points="5 12.5 10 17 19 7.5"/>`, 15),
  trash: () => svg(html`<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>`, 18),
  more: () => svg(html`<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>`),
  plus: () => svg(html`<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`, 18),
  sparkle: () => svg(html`<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z"/>`),
  file: () => svg(html`<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><polyline points="14 3 14 8 19 8"/>`, 18),
  grip: () => svg(html`<circle cx="9" cy="7" r="1.3" fill="currentColor"/><circle cx="15" cy="7" r="1.3" fill="currentColor"/><circle cx="9" cy="12" r="1.3" fill="currentColor"/><circle cx="15" cy="12" r="1.3" fill="currentColor"/><circle cx="9" cy="17" r="1.3" fill="currentColor"/><circle cx="15" cy="17" r="1.3" fill="currentColor"/>`, 18),
  close: () => svg(html`<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>`, 16),
};

// ---------- small pieces ----------
/** A square rotated 45°: filled red for due dates, outlined for events. */
export function Diamond({ size = 8, kind = "due" }) {
  return html`<svg class="diamond" width=${size} height=${size} viewBox="0 0 10 10" aria-hidden="true">
    ${kind === "due"
      ? html`<path d="M5 0L10 5L5 10L0 5Z" fill="var(--due)"/>`
      : kind === "event"
        ? html`<path d="M5 1L9 5L5 9L1 5Z" fill="none" stroke="var(--fg)" stroke-width="1.4"/>`
        : html`<path d="M5 0L10 5L5 10L0 5Z" fill="currentColor"/>`}
  </svg>`;
}

export function Marker({ hasDue, hasEvent, size = 8 }) {
  if (hasDue) return html`<${Diamond} size=${size} kind="due"/>`;
  if (hasEvent) return html`<${Diamond} size=${size} kind="event"/>`;
  return html`<span class="marker-space" style=${`width:${size}px;height:${size}px`}></span>`;
}

export function DayNum({ day, selected, today, size = 30 }) {
  return html`<span class=${`daynum${selected ? " sel" : ""}${today && !selected ? " today" : ""}`}
    style=${`width:${size}px;height:${size}px`}>${dayNumber(day)}</span>`;
}

/** Vertical stack of task segments, first one at the bottom. */
export function Stack({ segs, width, height, seg, gap = 1, emptyLine = 3, dim = 0.25 }) {
  return html`<span class="stack" style=${`width:${width}px;height:${height}px`} aria-hidden="true">
    ${segs.length === 0
      ? emptyLine > 0 && html`<i class="stack-empty" style=${`height:${emptyLine}px`}></i>`
      : html`<span class="stack-inner" style=${`gap:${gap}px`}>
          ${[...segs].reverse().map((s, i) => html`<i key=${i}
              style=${`height:${seg}px;background:${colorVar(s.color)};opacity:${s.done ? 1 : dim}`}></i>`)}
        </span>`}
  </span>`;
}

export function Bar({ fraction, color = "var(--fg)", height = 3 }) {
  return html`<span class="bar" style=${`height:${height}px`} aria-hidden="true">
    <i style=${`width:${Math.round(Math.min(Math.max(fraction, 0), 1) * 100)}%;background:${color}`}></i>
  </span>`;
}

export function Chevrons({ prevLabel, nextLabel, onPrev, onNext }) {
  return html`<span class="chevrons">
    <button class="icon" aria-label=${prevLabel} onClick=${onPrev}><${Icon.left}/></button>
    <button class="icon" aria-label=${nextLabel} onClick=${onNext}><${Icon.right}/></button>
  </span>`;
}

export function Segmented({ options, value, onChange, label }) {
  return html`<div class="segmented" role="radiogroup" aria-label=${label}>
    ${options.map(([v, text]) => html`<button type="button" role="radio" aria-checked=${value === v}
        class=${value === v ? "on" : ""} onClick=${() => onChange(v)}>${text}</button>`)}
  </div>`;
}

export function Switch({ checked, onChange, label }) {
  return html`<label class="field switch-row">
    <span>${label}</span>
    <input type="checkbox" role="switch" class="switch" checked=${checked} onChange=${(e) => onChange(e.target.checked)}/>
  </label>`;
}

/** Bottom sheet on phones, centred dialog on wide screens. */
export function Sheet({ title, onClose, left, right, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    document.body.classList.add("locked");
    return () => {
      removeEventListener("keydown", onKey);
      document.body.classList.remove("locked");
    };
  }, []);
  return html`<div class="overlay" onMouseDown=${(e) => e.target === e.currentTarget && onClose()}>
    <div class="sheet" role="dialog" aria-modal="true" aria-label=${title}>
      <header class="sheet-bar">
        <span class="sheet-side">${left}</span>
        <h2>${title}</h2>
        <span class="sheet-side end">${right}</span>
      </header>
      <div class="sheet-body">${children}</div>
    </div>
  </div>`;
}

/** App mark: three study blocks stacked on a dark tile (same as the home-screen icon). */
export function Logo({ size = 32 }) {
  return html`<svg class="logo" width=${size} height=${size} viewBox="0 0 64 64" aria-hidden="true">
    <rect width="64" height="64" rx="15" fill="#0E1116"/>
    <rect class="logo-block b1" x="22" y="15.5" width="20" height="9.5" rx="4.75" fill="#FB923C"/>
    <rect class="logo-block b2" x="22" y="27.25" width="20" height="9.5" rx="4.75" fill="#8B87FF"/>
    <rect class="logo-block b3" x="22" y="39" width="20" height="9.5" rx="4.75" fill="#2DD4BF"/>
  </svg>`;
}
