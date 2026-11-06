import { html, useEffect, useMemo, useRef, useState } from "../vendor/preact-htm.js";
import {
  addDays, addMonths, between, displayName, dueSoon, firstWeekday, groups, itemsOn, monthGrid,
  newItem, segments, subjectOf, tally, weekOf,
} from "./logic.js";
import * as F from "./format.js";
import { Bar, Chevrons, colorVar, DayNum, Diamond, haptic, Icon, Marker, Stack } from "./ui.js";
import { t } from "./i18n.js";
import { ItemEditor } from "./editor.js";
import { Settings } from "./settings.js";
import { AIPlanner } from "./ai.js";
import { NewSubjectSheet } from "./subjects.js";

const TABS = [["day", "tabDay"], ["week", "tabWeek"], ["month", "tabMonth"], ["progress", "tabProgress"]];

export function PlannerScreen({ store, state, planner, canUseAI, onDeleted }) {
  const today = state.today;
  const [tab, setTab] = useState("day");
  const [sel, setSel] = useState(today);
  const [quickSubject, setQuickSubject] = useState(planner.subjects[0]?.id ?? null);
  const [editor, setEditor] = useState(null);   // { item, isNew }
  const [settings, setSettings] = useState(false);
  const [ai, setAI] = useState(false);
  const [subjectSheet, setSubjectSheet] = useState(false);
  const first = useMemo(() => firstWeekday(), []);
  const id = planner.id;

  const openDay = (d) => { setSel(d); setTab("day"); scrollTo(0, 0); };
  const validSubject = subjectOf(planner, quickSubject)?.id ?? null;

  const addSubject = (sub) => {
    store.update(id, { subjects: [...planner.subjects, sub] });
    setQuickSubject(sub.id);
  };
  const isPast = sel < today;

  const actions = {
    onEdit: (item) => setEditor({ item, isNew: false }),
    onToggle: (itemId) => { haptic(); store.toggle(id, itemId); },
    onDelete: (itemId) => store.remove(id, itemId),
  };

  return html`<div class="screen">
    <header class="nav">
      <a class="back" href="#/" aria-label=${t("back")}><${Icon.left}/><span>${t("brand")}</span></a>
      <h1 class="nav-title">${displayName(planner)}</h1>
      <span class="nav-actions">
        ${canUseAI && html`<button class="icon" aria-label=${t("planWithAI")} title=${t("planWithAI")} onClick=${() => setAI(true)}><${Icon.sparkle}/></button>`}
        <button class="icon" aria-label=${t("plannerSettings")} onClick=${() => setSettings(true)}><${Icon.sliders}/></button>
      </span>
    </header>

    <nav class="tabs" role="tablist">
      ${TABS.map(([k, label]) => html`<button role="tab" aria-selected=${tab === k}
          class=${tab === k ? "on" : ""} onClick=${() => setTab(k)}>${t(label)}</button>`)}
      <span class="grow"></span>
      ${tab !== "progress" && sel !== today &&
        html`<button class="pill" onClick=${() => setSel(today)} aria-label=${t("goToday")}>${t("today")}</button>`}
    </nav>

    <main class="grow">
      ${tab === "day" && html`<${DayTab} planner=${planner} onNewSubject=${() => setSubjectSheet(true)} sel=${sel} setSel=${setSel} today=${today} first=${first} actions=${actions}/>`}
      ${tab === "week" && html`<${WeekTab} planner=${planner} sel=${sel} setSel=${setSel} today=${today} first=${first} actions=${actions}/>`}
      ${tab === "month" && html`<${MonthTab} planner=${planner} sel=${sel} setSel=${setSel} today=${today} first=${first} actions=${actions}/>`}
      ${tab === "progress" && html`<${ProgressTab} planner=${planner} today=${today}/>`}
    </main>

    ${tab !== "progress" && html`<${QuickAdd} planner=${planner} date=${sel} today=${today}
        subjectId=${validSubject} setSubjectId=${setQuickSubject} past=${isPast}
        onNewSubject=${() => setSubjectSheet(true)} onToday=${() => setSel(today)}
        onAdd=${(title) => store.add(id, [newItem({ title, subjectId: validSubject, date: sel })])}
        onMore=${(title) => setEditor(isPast
          ? { item: newItem({ title, kind: "event", date: sel }), isNew: true, eventOnly: true }
          : { item: newItem({ title, subjectId: validSubject, date: sel }), isNew: true })}/>`}

    ${subjectSheet && html`<${NewSubjectSheet} subjects=${planner.subjects} onAdd=${addSubject} onClose=${() => setSubjectSheet(false)}/>`}
    ${editor && html`<${ItemEditor} store=${store} planner=${planner} item=${editor.item} isNew=${editor.isNew} eventOnly=${!!editor.eventOnly}
        onClose=${() => setEditor(null)}/>`}
    ${settings && html`<${Settings} store=${store} planner=${planner} onClose=${() => setSettings(false)} onDeleted=${onDeleted}/>`}
    ${ai && html`<${AIPlanner} store=${store} planner=${planner} today=${today} defaultSubject=${validSubject}
        onClose=${() => setAI(false)} onAdded=${(firstDay) => { setAI(false); openDay(firstDay); }}/>`}
  </div>`;
}

// ---------- quick add ----------
function QuickAdd({ planner, date, today, subjectId, setSubjectId, past, onNewSubject, onToday, onAdd, onMore }) {
  const [text, setText] = useState("");
  const [flash, setFlash] = useState(0); // bumps on Tab so the subject name pops up briefly
  const subject = subjectOf(planner, subjectId);

  // Tab cycles the subject: each subject in order, then "No subject", then back to the first.
  const onKeyDown = (e) => {
    if (e.key !== "Tab" || e.shiftKey || e.altKey || e.metaKey || e.ctrlKey || e.isComposing) return;
    e.preventDefault();
    const order = [...planner.subjects.map((s) => s.id), null];
    const next = order[(order.indexOf(subject?.id ?? null) + 1) % order.length];
    setSubjectId(next);
    setFlash((n) => n + 1);
  };

  const submit = (e) => {
    e.preventDefault();
    const title = text.trim();
    if (!title) return;
    onAdd(title);
    setText("");
  };
  if (past) {
    return html`<div class="bottom quick">
      <div class="quick-bar past" role="status">
        <span class="grow past-note">${t("pastNoAdd")}</span>
        <button type="button" class="pill" onClick=${onToday}>${t("goTodayShort")}</button>
        <button type="button" class="icon" aria-label=${t("addEvent")} title=${t("addEvent")} onClick=${() => onMore("")}><${Icon.more}/></button>
      </div>
    </div>`;
  }
  return html`<form class="bottom quick" onSubmit=${submit}>
    <div class="quick-bar">
      <label class="quick-dot" style=${`--c:${colorVar(subject?.color)}`} title=${t("subject")}>
        <span class="dot"></span>
        <select aria-label=${`${t("subject")}: ${subject?.name || t("noSubject")}`} value=${subject?.id || ""}
                onChange=${(e) => { if (e.target.value === "__new") { e.target.value = subject?.id || ""; onNewSubject(); } else setSubjectId(e.target.value || null); }}>
          <option value="">${t("noSubject")}</option>
          ${planner.subjects.map((s) => html`<option value=${s.id}>${s.name || t("untitledSubject")}</option>`)}
          <option value="__new">${t("newSubjectOption")}</option>
        </select>
      </label>
      ${flash > 0 && html`<span key=${flash} class="subject-flash" style=${`--c:${colorVar(subject?.color)}`} role="status">
        ${subject?.name || t("noSubject")}</span>`}
      <input class="quick-input" value=${text} onInput=${(e) => setText(e.target.value)} onKeyDown=${onKeyDown}
             aria-label=${t("newTask")} aria-description=${t("tabHint")}
             placeholder=${date === today ? t("addForToday") : t("addFor", { day: F.weekdayMonthDay(date) })}/>
      <button type="button" class="icon" aria-label=${t("moreOptions")}
              onClick=${() => { onMore(text.trim()); setText(""); }}><${Icon.more}/></button>
    </div>
  </form>`;
}

// ---------- day ----------
function DayTab({ planner, onNewSubject, sel, setSel, today, first, actions }) {
  const tl = tally(itemsOn(planner, sel));
  return html`<div>
    <${DueBar} items=${dueSoon(planner.items, today)} today=${today}/>
    <${Ribbon} planner=${planner} sel=${sel} setSel=${setSel} today=${today} first=${first}/>
    <div class="pad day-head">
      <h2 class="title">${sel === today ? t("today") : F.weekdayMonthDay(sel)}</h2>
      <p class="muted">${F.fullDay(sel)} · ${t("ofDone", { done: tl.done, total: tl.total })}</p>
    </div>

    ${planner.subjects.length === 0 && html`<div class="pad subject-prompt">
      <p class="muted">${t("noSubjectsYet")}</p>
      <button class="add-inline" onClick=${onNewSubject}><${Icon.plus}/> ${t("addSubject")}</button>
    </div>`}

    <${DayList} planner=${planner} day=${sel} empty=${t("nothingPlanned")} ...${actions}/>
  </div>`;
}

/** A day's plan grouped by subject; used by Day, and inline in Week and Month. */
function DayList({ planner, day, empty, onEdit, onToggle, onDelete }) {
  const gs = groups(planner, day);
  if (!gs.length) return html`<p class="pad muted empty-day">${empty}</p>`;
  return gs.map((g) => html`<section class="pad group" key=${g.key}>
    <h3 class="label" style=${`color:${g.kind === "due" ? "var(--due)" : g.kind === "none" ? "var(--muted)" : colorVar(g.color)}`}>${g.title}</h3>
    ${g.items.map((it) => html`<${ItemRow} key=${it.id} item=${it} subject=${subjectOf(planner, it.subjectId)}
        onToggle=${() => onToggle(it.id)} onEdit=${() => onEdit(it)} onDelete=${() => onDelete(it.id)}/>`)}
  </section>`);
}

/** Remembers which way the period moved, for the slide-in motion (Week, Month). */
function useSlide(key) {
  const prev = useRef(key);
  const cls = useRef("");
  if (prev.current !== key) { cls.current = key > prev.current ? "slide-next" : "slide-prev"; prev.current = key; }
  return cls.current;
}

/** Due today or tomorrow. Informational only: it ignores taps. */
function DueBar({ items, today }) {
  if (!items.length) return null;
  const it = items[0];
  const time = it.time != null ? ` · ${F.time(it.time, true)}` : "";
  const text = t(it.date === today ? "isDueToday" : "isDueTomorrow", { title: it.title });
  return html`<div class="duebar" role="status">
    <${Diamond} size=${10} kind="plain"/>
    <span class="grow">${text}${time}</span>
    ${items.length > 1 && html`<span class="more">${t("more", { n: items.length - 1 })}</span>`}
  </div>`;
}

function Ribbon({ planner, sel, setSel, today, first }) {
  const days = weekOf(sel, first);
  const weeks = [-7, 0, 7].map((n) => weekOf(addDays(days[0], n), first));
  const [dx, setDx] = useState(0);
  const [moving, setMoving] = useState(0);   // -1 / 1 while sliding to the previous / next week
  const [instant, setInstant] = useState(false);
  const drag = useRef(null);
  const swiped = useRef(false);

  const down = (e) => { drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), h: null }; swiped.current = false; };
  const move = (e) => {
    const d = drag.current;
    if (!d || moving) return;
    if (e.pointerType === "mouse" && e.buttons === 0) { up(); return; } // released somewhere we didn't hear
    const mx = e.clientX - d.x, my = e.clientY - d.y;
    if (d.h === null && Math.hypot(mx, my) > 8) {
      d.h = Math.abs(mx) > Math.abs(my);
      if (d.h) { try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} } // keep getting events until release
    }
    if (d.h) setDx(mx);
  };
  const up = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.h) { setDx(0); return; }
    swiped.current = true;
    const fast = Math.abs(dx) > 24 && performance.now() - d.t < 280; // a quick flick counts too
    if (!fast && Math.abs(dx) < 50) { setDx(0); return; }
    const dir = dx < 0 ? 1 : -1;
    setDx(0);
    setMoving(dir);
    setTimeout(() => {
      setInstant(true);
      setMoving(0);
      setSel(addDays(sel, 7 * dir));
      requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
    }, 330);
  };

  const column = (d) => {
    const items = itemsOn(planner, d);
    const tl = tally(items);
    const hasDue = items.some((i) => i.kind === "due" && !i.done);
    const hasEvent = items.some((i) => i.kind === "event");
    const label = `${F.fullDay(d)}, ${t("ofDone", { done: tl.done, total: tl.total })}${hasDue ? `, ${t("dueDate")}` : ""}${hasEvent ? `, ${t("event")}` : ""}`;
    return html`<button key=${d} class="rcol" aria-label=${label} aria-pressed=${d === sel}
        onClick=${() => { if (swiped.current) { swiped.current = false; return; } setSel(d); }}>
      <span class="wd">${F.weekdayShort(d)}</span>
      <${Stack} segs=${segments(items, planner.subjects)} width=${26} height=${66} seg=${8}/>
      <${DayNum} day=${d} selected=${d === sel} today=${d === today}/>
      <${Marker} hasDue=${hasDue} hasEvent=${hasEvent}/>
    </button>`;
  };

  useEffect(() => {
    const end = () => { if (drag.current) up(); };
    addEventListener("pointerup", end);
    addEventListener("blur", end);
    return () => { removeEventListener("pointerup", end); removeEventListener("blur", end); };
  });

  const offset = -100 - moving * 100;
  const style = `transform:translateX(calc(${offset}% + ${dx}px));transition:${dx || instant ? "none" : "transform 0.33s var(--ease)"}`;
  return html`<div class="ribbon-viewport" onPointerDown=${down} onPointerMove=${move} onPointerUp=${up}
      onPointerCancel=${() => { drag.current = null; setDx(0); }}>
    <div class="ribbon-track" style=${style}>
      ${weeks.map((w, i) => html`<div key=${w[0]} class="ribbon" aria-hidden=${i !== 1} inert=${i !== 1}>${w.map(column)}</div>`)}
    </div>
  </div>`;
}

function ItemRow({ item, subject, onToggle, onEdit, onDelete }) {
  const [menu, setMenu] = useState(false);
  const press = useRef(null);
  const long = useRef(false);
  const tint = item.kind === "due" ? "var(--due)" : colorVar(subject?.color);

  let detail = null;
  if (item.kind === "due") detail = { text: `${t("due")}${item.time != null ? ` · ${F.time(item.time)}` : ""}`, color: "var(--due)" };
  else if (item.kind === "event" && item.time != null) detail = { text: F.time(item.time), color: "var(--muted)" };
  else if (item.kind === "task" && !item.done && item.rolledFrom) detail = { text: t("movedFrom", { day: F.monthDay(item.rolledFrom) }), color: "var(--muted)" };
  else if (item.kind === "task" && item.minutes) detail = { text: `≈ ${F.duration(item.minutes)}`, color: "var(--muted)" };

  const a11y = [item.title, subject?.name, detail?.text.replace("↩ ", ""),
    item.kind === "event" ? t("event") : item.done ? t("isDone") : t("notDone")].filter(Boolean).join(", ");

  const startPress = (e) => {
    long.current = false;
    const x = e.clientX, y = e.clientY;
    press.current = { x, y, timer: setTimeout(() => { long.current = true; haptic(); setMenu(true); }, 550) };
  };
  const cancelPress = (e) => {
    const p = press.current;
    if (!p) return;
    if (e && e.type === "pointermove" && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 10) return;
    clearTimeout(p.timer);
    press.current = null;
  };

  return html`<div class="row">
    ${item.kind === "event"
      ? html`<span class="row-lead"><${Diamond} size=${12} kind="event"/></span>`
      : html`<button class="check" style=${`--c:${tint}`} aria-label=${t(item.done ? "markNotDone" : "markDone", { title: item.title })}
            aria-pressed=${!!item.done} onClick=${onToggle}>
          <span class=${`circle${item.done ? " on" : ""}`}>${item.done && html`<${Icon.check}/>`}</span>
        </button>`}
    <div class="row-main" role="button" tabindex="0" aria-label=${a11y}
         onClick=${() => { if (long.current) { long.current = false; return; } onEdit(); }}
         onKeyDown=${(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onEdit(); } if (e.key === "Delete") onDelete(); }}
         onContextMenu=${(e) => { e.preventDefault(); setMenu(true); }}
         onPointerDown=${startPress} onPointerUp=${cancelPress} onPointerLeave=${cancelPress} onPointerMove=${cancelPress}>
      <span class=${`row-title${item.done ? " done" : ""}`}>${item.title}</span>
      ${detail && html`<span class="row-detail" style=${`color:${detail.color}`}>${detail.text}</span>`}
    </div>
    ${menu && html`
      <div class="scrim" onClick=${() => setMenu(false)}></div>
      <div class="popover row-menu" role="menu">
        <button role="menuitem" class="popover-item danger" onClick=${() => { setMenu(false); onDelete(); }}>${t("delete")}</button>
      </div>`}
  </div>`;
}

// ---------- week ----------
function WeekTab({ planner, sel, setSel, today, first, actions }) {
  const days = weekOf(sel, first);
  const thisWeek = days.includes(today);
  const [open, setOpen] = useState(sel);
  useEffect(() => { setOpen(sel); }, [sel]); // follow "Today" and the chevrons
  const slide = useSlide(days[0]);
  const pick = (d) => { setSel(d); setOpen(open === d ? null : d); };
  return html`<div class="pad">
    <div class="head-row">
      <div>
        <h2 class="title">${F.weekOfMonth(days)}</h2>
        <p class="muted">${thisWeek ? `${t("thisWeek")} · ` : ""}${F.range(days[0], days[6])}</p>
      </div>
      <${Chevrons} prevLabel=${t("prevWeek")} nextLabel=${t("nextWeek")}
          onPrev=${() => setSel(addDays(sel, -7))} onNext=${() => setSel(addDays(sel, 7))}/>
    </div>
    <ul class=${`week ${slide}`} key=${days[0]}>
      ${days.map((d) => {
        const items = groups(planner, d).flatMap((g) => g.items);
        const tl = tally(items);
        const segs = segments(items, planner.subjects, 10);
        const titles = items.map((i) => (i.kind === "task" ? i.title : `◆ ${i.title}`)).join(" · ");
        const expanded = open === d;
        return html`<li key=${d} class=${expanded ? "open" : ""}><button class="week-row" aria-expanded=${expanded}
            aria-label=${`${F.fullDay(d)}, ${t("ofDone", { done: tl.done, total: tl.total })}. ${titles.replaceAll("◆ ", "")}`}
            onClick=${() => pick(d)}>
          <span class="week-day"><span class="wd">${F.weekdayShort(d)}</span><${DayNum} day=${d} selected=${d === sel} today=${d === today}/></span>
          <span class="week-main">
            <span class="caps">
              ${segs.length === 0
                ? html`<i class="cap-empty"></i>`
                : segs.map((sg, i) => html`<i key=${i} style=${`background:${colorVar(sg.color)};opacity:${sg.done ? 1 : 0.3}`}></i>`)}
            </span>
            ${!expanded && html`<span class="week-titles muted">${titles || t("nothingPlannedShort")}</span>`}
          </span>
          <span class="week-count">${tl.total ? `${tl.done}/${tl.total}` : ""}</span>
          <span class="week-chev" aria-hidden="true"><${Icon.right}/></span>
        </button>
        ${expanded && html`<div class="week-day-list">
          <${DayList} planner=${planner} day=${d} empty=${t("nothingPlannedHere")} ...${actions}/>
        </div>`}
        </li>`;
      })}
    </ul>
  </div>`;
}

// ---------- month ----------
function MonthTab({ planner, sel, setSel, today, first, actions }) {
  const cells = monthGrid(sel, first);
  const slide = useSlide(sel.slice(0, 7));
  const tl = tally(itemsOn(planner, sel));
  return html`<div>
    <div class="pad">
      <div class="head-row">
        <h2 class="title month-title">${F.monthName(sel)} <span class="muted year">${F.year(sel)}</span></h2>
        <${Chevrons} prevLabel=${t("prevMonth")} nextLabel=${t("nextMonth")}
            onPrev=${() => setSel(addMonths(sel, -1))} onNext=${() => setSel(addMonths(sel, 1))}/>
      </div>
      <div class="month-week" aria-hidden="true">${F.weekdayInitials(first).map((l, i) => html`<span key=${i}>${l}</span>`)}</div>
      <div class=${`month-grid ${slide}`} key=${sel.slice(0, 7)}>
        ${cells.map((d, i) => {
          if (!d) return html`<span key=${i} class="mcell blank"></span>`;
          const items = itemsOn(planner, d);
          const ctl = tally(items);
          const hasDue = items.some((x) => x.kind === "due" && !x.done);
          const hasEvent = items.some((x) => x.kind === "event");
          return html`<button key=${i} class="mcell" onClick=${() => setSel(d)} aria-pressed=${d === sel}
              aria-label=${`${F.fullDay(d)}, ${t("ofDone", { done: ctl.done, total: ctl.total })}${hasDue ? `, ${t("dueDate")}` : ""}${hasEvent ? `, ${t("event")}` : ""}`}>
            <${DayNum} day=${d} selected=${d === sel} today=${d === today} size=${28}/>
            <${Stack} segs=${segments(items, planner.subjects)} width=${14} height=${20} seg=${2} emptyLine=${0}/>
            <${Marker} hasDue=${hasDue} hasEvent=${hasEvent}/>
          </button>`;
        })}
      </div>
      <p class="legend muted">
        <${Diamond} size=${8} kind="due"/> ${t("legendDue")}
        <span class="legend-gap"></span>
        <${Diamond} size=${8} kind="event"/> ${t("legendEvent")}
      </p>
    </div>
    <div class="month-day" key=${sel}>
      <div class="pad month-day-head">
        <h3>${sel === today ? t("today") : F.weekdayMonthDay(sel)}</h3>
        <span class="muted">${t("ofDone", { done: tl.done, total: tl.total })}</span>
      </div>
      <${DayList} planner=${planner} day=${sel} empty=${t("nothingPlannedHere")} ...${actions}/>
    </div>
  </div>`;
}

// ---------- progress ----------
function ProgressTab({ planner, today }) {
  const tl = tally(planner.items);
  const percent = Math.round(tl.fraction * 100);
  const dayCount = between(planner.start, planner.end) + 1;
  const k = between(planner.start, today) + 1;
  const dayLabel = k < 1 ? t("startsOn", { day: F.monthDay(planner.start).toUpperCase() })
    : k > dayCount ? t("ended", { n: dayCount }) : t("dayOf", { k, n: dayCount });

  const rows = planner.subjects.map((s) => ({
    key: s.id, name: s.name || t("untitledSubject"), color: colorVar(s.color),
    t: tally(planner.items.filter((i) => i.subjectId === s.id)),
  }));
  const known = new Set(planner.subjects.map((s) => s.id));
  const orphan = tally(planner.items.filter((i) => !i.subjectId || !known.has(i.subjectId)));
  if (orphan.total) rows.push({ key: "none", name: t("noSubject"), color: "var(--muted)", t: orphan });

  const leftToday = planner.items.filter((i) => i.kind !== "event" && !i.done && i.date === today).length;
  const rolled = planner.items.filter((i) => i.kind === "task" && !i.done && i.rolledFrom).length;
  const perDay = (tl.total / Math.max(dayCount, 1)).toFixed(1);

  return html`<div class="pad progress">
    <p class="label muted">${dayLabel}</p>
    <p class="big-percent" aria-label=${t("percentDone", { n: percent })}>${percent}<span>%</span></p>
    <p class="muted done-line">${t("ofDone", { done: tl.done, total: tl.total })}</p>
    ${rows.map((r) => html`<div class="subject-block" key=${r.key} aria-label=${`${r.name}, ${t("ofDone", { done: r.t.done, total: r.t.total })}`}>
      <div class="subject-line">
        <span class="dot" style=${`background:${r.color}`}></span>
        <span class="grow strong">${r.name}</span>
        <span class="muted num">${r.t.done} / ${r.t.total}</span>
      </div>
      <${Bar} fraction=${r.t.fraction} color=${r.color} height=${8}/>
    </div>`)}
    <div class="stats">
      <div><b>${leftToday}</b><span class="muted">${t("leftToday")}</span></div>
      <div><b>${rolled}</b><span class="muted">${t("rolledOver")}</span></div>
      <div><b>${perDay}</b><span class="muted">${t("perDay")}</span></div>
    </div>
  </div>`;
}
