import { html, useEffect, useRef, useState } from "../vendor/preact-htm.js";
import { colorVar, Diamond, Icon, Logo } from "./ui.js";
import { LangSwitch } from "./auth.js";
import { lang, t } from "./i18n.js";
import { duration, monthDay, weekdayShort } from "./format.js";

// "How it works": each section shows a small looping animation of the real UI.
// Animations start when the section scrolls into view; with reduced motion, the final state shows.

const L = (en, ko) => (lang === "ko" ? ko : en);
const LOOP = 7; // seconds per animation cycle (matches --loop in styles.css)

/** True while the element is on screen, so animations restart each time you reach them. */
function useInView() {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, on];
}

// ---------- small animated pieces ----------
const Check = ({ color = "var(--fg)", square = false, late = false }) => html`
  <span class="check" style=${`--c:${color}`}>
    <span class=${`circle a-circle${square ? " habit" : ""}`}>
      <span class=${`a-fill ${late ? "a-fill-late" : "a-fill-anim"}`}><${Icon.check}/></span>
    </span>
  </span>`;

const Empty = ({ color = "var(--fg)" }) => html`<span class="check" style=${`--c:${color}`}><span class="circle"></span></span>`;

function Row({ title, lead, i = 0 }) {
  return html`<div class="row demo-row a-in" style=${`--i:${i}`} aria-hidden="true">
    ${lead}
    <span class="row-main"><span class="row-title">${title}</span></span>
  </div>`;
}

// 01 — tasks grouped under subjects; one gets checked off
const DemoSubjects = () => html`<div class="guide-demo" aria-hidden="true">
  <p class="label a-in" style="color:var(--s0);--i:0">ECON 139</p>
  <${Row} i=${1} title=${L("Lecture 14 notes", "14강 노트 정리")} lead=${html`<${Check} color="var(--s0)"/>`}/>
  <${Row} i=${2} title=${L("Practice midterm A", "모의 중간고사 A")} lead=${html`<${Empty} color="var(--s0)"/>`}/>
  <p class="label a-in" style="color:var(--s1);margin-top:14px;--i:3">STAT 153</p>
  <${Row} i=${4} title=${L("ARMA identification", "ARMA 모형 식별")} lead=${html`<${Empty} color="var(--s1)"/>`}/>
</div>`;

// 02 — at midnight an unfinished task slides from yesterday to today
const DemoRollover = () => html`<div class="guide-demo demo-roll" aria-hidden="true">
  <div class="roll-col"><span class="wd">${weekdayShort("2026-11-02")}</span><span class="roll-date">${monthDay("2026-11-02")}</span></div>
  <div class="roll-col"><span class="wd">${weekdayShort("2026-11-03")}</span><span class="roll-date">${monthDay("2026-11-03")}</span></div>
  <span class="roll-midnight">${L("12:00 AM", "자정")}</span>
  <div class="roll-chip">
    <${Empty} color="var(--s0)"/>
    <span class="roll-text">
      <span class="row-title">${L("Reread chapter 7", "7장 다시 읽기")}</span>
      <span class="row-detail muted roll-from">${t("movedFrom", { day: monthDay("2026-11-02") })}</span>
    </span>
  </div>
</div>`;

// 03 — "today" walks across the week; the red bar shows only the day before and the day of
function DemoDue() {
  const days = ["2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09"];
  return html`<div class="guide-demo demo-due" aria-hidden="true">
    <div class="due-bars">
      <div class="duebar due-bar-a"><${Diamond} size=${10} kind="plain"/><span class="grow">${t("isDueTomorrow", { title: "PS 3" })} · ${L("5 PM", "오후 5시")}</span></div>
      <div class="duebar due-bar-b"><${Diamond} size=${10} kind="plain"/><span class="grow">${t("isDueToday", { title: "PS 3" })} · ${L("5 PM", "오후 5시")}</span></div>
    </div>
    <div class="due-days">
      ${days.map((d, i) => html`<span class="due-day">
        <span class="wd">${weekdayShort(d)}</span>
        <span class="daynum">${Number(d.slice(-2))}</span>
        ${i === 3 ? html`<${Diamond} size=${8} kind="due"/>` : html`<span class="marker-space" style="width:8px;height:8px"></span>`}
      </span>`)}
      <span class="due-today"></span>
    </div>
    <p class="due-caption muted small">${L("The bar appears only the day before and on the day.", "빨간 바는 마감 전날과 당일에만 나타나요.")}</p>
  </div>`;
}

// 04 — the week ribbon fills up; blocks turn solid as tasks get done
function DemoWeek() {
  const cols = [[[0, 1], [1, 1], [2, 1]], [[0, 1], [0, 1], [1, 0], [2, 0]], [[0, 0], [1, 0], [2, 0]],
                [[0, 0], [1, 0], [1, 0], [2, 0], [2, 0]], [[1, 0], [2, 0]], [[0, 0], [1, 0], [2, 0]], []];
  return html`<div class="ribbon demo-ribbon" aria-hidden="true">
    ${cols.map((segs, c) => html`<span class="rcol">
      <span class="wd">${weekdayShort(`2026-11-0${c + 1}`)}</span>
      <span class="stack" style="width:22px;height:48px">
        ${segs.length === 0 ? html`<i class="stack-empty" style="height:3px"></i>`
          : html`<span class="stack-inner" style="gap:1px">${[...segs].reverse().map(([color, done], k) => html`
              <i class=${`a-seg${done ? " a-seg-done" : ""}`} style=${`height:7px;background:${colorVar(color)};--d:${(c * 0.12 + k * 0.05).toFixed(2)}s`}></i>`)}</span>`}
      </span>
      <span class=${`daynum${c === 1 ? " sel" : ""}`} style="width:28px;height:28px">${c + 1}</span>
      ${c === 2 ? html`<${Diamond} size=${8} kind="due"/>` : c === 4 ? html`<${Diamond} size=${8} kind="event"/>` : html`<span class="marker-space" style="width:8px;height:8px"></span>`}
    </span>`)}
  </div>`;
}

// 05 — type, press return, it lands in the list
const DemoQuick = () => html`<div class="guide-demo demo-quick-wrap" aria-hidden="true">
  <div class="quick-drop row demo-row">
    <${Empty} color="var(--s2)"/>
    <span class="row-main"><span class="row-title">${L("Ch 6 exercises", "6장 연습문제")}</span></span>
  </div>
  <div class="quick-bar demo-quick">
    <span class="quick-dot" style="--c:var(--s2)"><span class="dot"></span></span>
    <span class="grow demo-typing"><span class="type-text">${L("Ch 6 exercises", "6장 연습문제")}</span><i class="caret"></i></span>
    <span class="return-key">↵</span>
  </div>
</div>`;

// 06 — a habit gets checked; the counters tick up
const DemoHabit = () => html`<div class="guide-demo" aria-hidden="true">
  <p class="label muted">${t("habits")}</p>
  <div class="row demo-row">
    <${Check} square/>
    <span class="row-main">
      <span class="row-title">${L("Go to the library", "도서관 가기")}</span>
      <span class="row-detail muted swap">
        <span class="swap-a">${t("habitDay", { n: 11 })} · ${t("habitStreak", { n: 4 })}</span>
        <span class="swap-b">${t("habitDay", { n: 12 })} · ${t("habitStreak", { n: 5 })}</span>
      </span>
    </span>
  </div>
</div>`;

// 07 — a PDF goes in, Claude reads it, tasks spread over three days by difficulty
function DemoAI() {
  const days = [
    ["2026-11-04", [[L("Ch 4 reading", "4장 읽기"), "easy", 40], [L("4.3 proofs", "4.3 증명"), "hard", 70]]],
    ["2026-11-05", [[L("5.1–5.2 + exercises", "5.1–5.2 + 연습문제"), "hard", 90]]],
    ["2026-11-06", [[L("Review sheet", "요약 노트 복습"), "medium", 45]]],
  ];
  return html`<div class="guide-demo demo-ai" aria-hidden="true">
    <div class="ai-stage">
      <span class="ai-pdf"><${Icon.file}/> ${L("lecture-12.pdf", "12강-자료.pdf")}</span>
      <span class="ai-spark"><${Icon.sparkle}/></span>
    </div>
    <div class="ai-days">
      ${days.map(([d, tasks], i) => html`<div class="ai-col">
        <span class="wd">${weekdayShort(d)} ${Number(d.slice(-2))}</span>
        ${tasks.map(([title, diff, min], k) => html`<span class="ai-pill" style=${`--d:${(i * 0.25 + k * 0.15).toFixed(2)}s`}>
          <span class=${`diff diff-${diff}`}></span><span class="ai-pill-text">${title}</span><span class="muted small">${duration(min)}</span>
        </span>`)}
      </div>`)}
    </div>
  </div>`;
}

// 08 — progress counts up, bars grow
function DemoProgress({ play }) {
  const [n, setN] = useState(74);
  useEffect(() => {
    if (!play || matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(74); return; }
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = ((now - start) / 1000) % LOOP;
      setN(Math.round(74 * Math.min(1, Math.max(0, (p - 0.4) / 1.6))));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [play]);
  return html`<div class="guide-demo demo-progress" aria-hidden="true">
    <p class="demo-percent">${n}<span>%</span></p>
    ${[["ECON 139", 0, 0.8], ["STAT 153", 1, 0.7], ["STAT 134", 2, 0.72]].map(([name, c, f], i) => html`
      <div class="demo-bar-row">
        <span class="dot" style=${`background:${colorVar(c)}`}></span>
        <span class="grow">${name}</span>
        <span class="bar" style="height:6px;width:45%"><i class="a-grow" style=${`width:${f * 100}%;background:${colorVar(c)};--d:${i * 0.15}s`}></i></span>
      </div>`)}
  </div>`;
}

// 09 — check it on the phone, it appears on the laptop
const DemoSync = () => html`<div class="guide-demo demo-sync" aria-hidden="true">
  <div class="dev phone">
    <div class="row demo-row"><${Check} color="var(--s1)"/><span class="row-title small-title">${L("HW 4 review", "과제 4 복습")}</span></div>
  </div>
  <span class="sync-dots"><i></i><i></i><i></i></span>
  <div class="dev laptop">
    <div class="row demo-row"><${Check} color="var(--s1)" late/><span class="row-title small-title">${L("HW 4 review", "과제 4 복습")}</span></div>
  </div>
</div>`;

const SECTIONS = [
  { Demo: DemoSubjects,
    title: L("Plan each day by subject", "과목별로 하루를 계획"),
    text: L("Tasks sit under their subject, so you see at a glance what each class needs today. Add a subject right from the dot in the bar at the bottom (＋ New subject).",
            "할 일이 과목 아래에 모여 있어서, 오늘 과목마다 무엇을 해야 하는지 한눈에 보여요. 과목은 아래 입력창의 점을 눌러 ‘＋ 새 과목’으로 바로 추가해요.") },
  { Demo: DemoRollover,
    title: L("Unfinished? It moves on by itself.", "못 끝냈다면? 저절로 다음 날로."),
    text: L("Whatever you don't finish today is waiting for you tomorrow, marked with the day you first planned it. No button to press, nothing lost — and since the past takes care of itself, new tasks go on today or later.",
            "오늘 못 끝낸 일은 자정이 지나면 내일 목록으로 넘어가요. 처음 계획한 날짜도 함께 표시돼요. 누를 버튼도, 잃어버리는 일도 없어요. 그래서 새 할 일은 오늘 이후에만 추가해요.") },
  { Demo: DemoDue,
    title: L("Deadlines stay separate", "마감은 따로"),
    text: L("“Quiz 1 review” is something you study, not a deadline. For a real deadline, tap ••• in the bar at the bottom and switch on “Has a deadline”. For something at a set time, like an exam, choose Event. A red bar shows up only the day before and on the day — then it gets out of your way.",
            "‘퀴즈 1 복습’은 공부할 일이지 마감이 아니에요. 진짜 마감이면 아래 입력창의 •••를 누르고 ‘마감 있음’을 켜세요. 시험처럼 정해진 시간에 있는 일은 ‘일정’을 고르세요. 빨간 바는 마감 전날과 당일에만 나타나요.") },
  { Demo: DemoWeek,
    title: L("Your week at a glance", "일주일을 한눈에"),
    text: L("Every day gets a small stack — one block per task, solid when done. A red diamond marks a deadline. Tap a day to open it, swipe to change the week.",
            "날마다 작은 블록 탑이 있어요. 할 일 하나에 블록 하나, 끝내면 진하게 채워져요. 빨간 마름모는 마감이에요. 날짜를 누르면 그날로, 옆으로 밀면 다른 주로 가요.") },
  { Demo: DemoQuick,
    title: L("Add in a second", "1초 만에 추가"),
    text: L("Type in the bar at the bottom and press return — it lands on the day you're looking at. Tap the dot (or press Tab) to pick a subject, or ••• for a deadline, an event, or repeats (every day, weekdays, every week).",
            "아래 입력창에 쓰고 엔터를 누르면 지금 보고 있는 날에 들어가요. 점을 누르거나 Tab을 누르면 과목 선택, •••를 누르면 마감·일정·반복(매일, 평일, 매주)을 정할 수 있어요.") },
  { Demo: DemoHabit,
    title: L("Daily habits", "매일의 습관"),
    text: L("Things you do every day, like going to the library, aren't part of a plan, so they live on the first screen: check today, add new ones, and see your last 14 days. “Day 12” counts every day you've done it, and “5 in a row” shows your current run.",
            "도서관 가기처럼 매일 하는 일은 계획의 일부가 아니라서 첫 화면에 있어요. 거기서 오늘 체크하고, 새 습관을 추가하고, 최근 14일 기록을 봐요. ‘12일째’는 지금까지 한 날의 합계, ‘연속 5일’은 지금 이어지고 있는 날 수예요.") },
  { Demo: DemoAI,
    title: L("Let AI spread the work", "AI가 알맞게 나눠 줘요"),
    text: L("Tap ✦ at the top of a planner and add lecture slides or textbook chapters. Claude reads them, judges which parts are hard, and spreads study tasks across your days within your daily time.",
            "플래너 위쪽의 ✦를 누르고 강의 자료나 교과서 챕터를 올리세요. Claude가 읽고 어려운 부분을 판단해서, 하루 공부 시간 안에서 날짜별로 할 일을 나눠 줘요.") },
  { Demo: DemoProgress,
    title: L("See the bigger picture", "큰 그림 보기"),
    text: L("Week shows every day in one list — tap a day to open it right there. Month is a calendar; tap a date to see and edit its plan below. Progress shows how far along you are, subject by subject.",
            "주간은 일주일을 한 목록으로 보여 주고, 날짜를 누르면 그 자리에서 펼쳐져요. 월간은 달력이고, 날짜를 누르면 아래에서 그날 계획을 보고 고칠 수 있어요. 진행률은 과목별로 얼마나 했는지 보여줘요.") },
  { Demo: DemoSync,
    title: L("Yours, on every device", "어느 기기에서든 내 것"),
    text: L("Sign in on your phone or laptop and your planners follow you. Only you can see them. On iPhone, tap Share → Add to Home Screen to use it like an app. Tap your initial (top right) for language and light / dark mode.",
            "휴대폰이든 노트북이든 로그인하면 내 플래너가 따라와요. 나만 볼 수 있어요. 아이폰에서는 공유 → 홈 화면에 추가를 누르면 앱처럼 쓸 수 있어요. 오른쪽 위 이니셜을 누르면 언어와 라이트/다크 모드를 바꿀 수 있어요.") },
];

// ---------- the tour: one page per section ----------
// Shown each time the site is opened (or reloaded) while signed out. Once finished or skipped,
// it stays out of the way until the next load. Signing in during a visit also counts as done.
let doneThisVisit = false;
export const tourDone = () => doneThisVisit;
export const markTourDone = () => { doneThisVisit = true; };
const markSeen = markTourDone;

function Welcome() {
  return html`<div class="ob-welcome">
    <span class="ob-logo"><${Logo} size=${96}/></span>
    <h1 class="ob-brand">${t("brand")}</h1>
    <p class="ob-tag">${t("guideTitle")}</p>
    <p class="ob-sub muted">${t("tourSub")}</p>
    <p class="ob-swipe muted" aria-hidden="true"><span class="hint-touch">${t("swipeHint")}</span><span class="hint-mouse">${t("clickHint")}</span> <span class="ob-arrow"><${Icon.right}/></span></p>
    <${LangSwitch}/>
  </div>`;
}

function Finish({ signedIn, done }) {
  return html`<div class="ob-finish">
    <span class="ob-logo small"><${Logo} size=${64}/></span>
    <h2 class="ob-title">${t("readyTitle")}</h2>
    <p class="ob-text muted">${signedIn ? t("readyTextIn") : t("readyText")}</p>
    ${signedIn
      ? html`<a class="capsule" href="#/" onClick=${done}>${t("startPlanning")}</a>`
      : html`<a class="capsule" href="#/signup" onClick=${done}>${t("createAccount")}</a>
             <a class="capsule outline" href="#/login" onClick=${done}>${t("signIn")}</a>`}
  </div>`;
}

/**
 * Full-screen tour: a welcome page, one page per section (with its animation), and a finish page.
 * Shown before sign-in on a first visit, and from "How it works" afterwards.
 */
export function Tour({ signedIn = false, onDone }) {
  const pages = ["welcome", ...SECTIONS.map((_, i) => i), "finish"];
  const last = pages.length - 1;
  const [index, setIndex] = useState(0);
  const drag = useRef(null);
  const go = (i) => setIndex(Math.max(0, Math.min(last, i)));
  const done = () => { markSeen(); onDone?.(); };
  const leave = () => { location.hash = signedIn ? "/" : "/login"; done(); };

  useEffect(() => {
    const end = () => { if (drag.current) { drag.current = null; setDx(0); } };
    addEventListener("blur", end);
    return () => removeEventListener("blur", end);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === "Escape") leave();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [index]);

  // Phone: the page follows your finger and snaps to the next or previous page.
  // Computer: click to go forward (click near the left edge to go back), or use ← →.
  const [dx, setDx] = useState(0);
  const down = (e) => {
    if (e.target.closest("a, button, input, select, textarea, label")) return;
    drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), type: e.pointerType, moved: false, horizontal: null };
  };
  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    if (d.type === "mouse" && e.buttons === 0) { drag.current = null; setDx(0); return; }
    const mx = e.clientX - d.x, my = e.clientY - d.y;
    if (d.horizontal === null && Math.hypot(mx, my) > 8) {
      d.horizontal = Math.abs(mx) > Math.abs(my);
      if (d.horizontal) { try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} }
    }
    if (d.horizontal) {
      d.moved = true;
      const atEdge = (index === 0 && mx > 0) || (index === last && mx < 0);
      setDx(atEdge ? mx / 3 : mx);
    }
  };
  const up = (e) => {
    const d = drag.current;
    drag.current = null;
    setDx(0);
    if (!d) return;
    const mx = e.clientX - d.x;
    const fast = Math.abs(mx) > 24 && performance.now() - d.t < 280; // a quick flick counts too
    if (d.moved && (fast || Math.abs(mx) > Math.min(70, innerWidth * 0.16))) { go(index + (mx < 0 ? 1 : -1)); return; }
    if (!d.moved && d.type === "mouse" && Math.abs(mx) < 6) {
      const rect = e.currentTarget.getBoundingClientRect();
      go(index + (e.clientX - rect.left < rect.width * 0.22 ? -1 : 1));
    }
  };

  const step = index > 0 && index < last ? `${String(index).padStart(2, "0")} / ${String(SECTIONS.length).padStart(2, "0")}` : "";

  return html`<div class="ob" role="region" aria-roledescription="carousel" aria-label=${t("howItWorks")}>
    <header class="ob-top">
      <span class="ob-step muted" aria-live="polite">${step}</span>
      ${index < last && html`<button class="text-btn ob-skip" onClick=${leave}>${t("skip")}</button>`}
    </header>

    <div class=${`ob-viewport${dx ? " dragging" : ""}`} onPointerDown=${down} onPointerMove=${move} onPointerUp=${up}
        onPointerCancel=${() => { drag.current = null; setDx(0); }}>
      <div class="ob-track" style=${`transform:translateX(calc(${-index * 100}% + ${dx}px))`}>
        ${pages.map((p, i) => {
          const active = i === index;
          const s = typeof p === "number" ? SECTIONS[p] : null;
          return html`<section key=${i} class=${`ob-page${active ? " play" : ""}`} aria-hidden=${!active} inert=${!active}
              aria-roledescription="slide">
            ${p === "welcome" ? html`<${Welcome}/>`
              : p === "finish" ? html`<${Finish} signedIn=${signedIn} done=${done}/>`
              : html`<div class="ob-section">
                  <h2 class="ob-title">${s.title}</h2>
                  <p class="ob-text muted">${s.text}</p>
                  <div class="ob-stage"><${s.Demo} play=${active}/></div>
                </div>`}
          </section>`;
        })}
      </div>
    </div>

    <footer class="ob-bottom">
      <div class="ob-dots" role="tablist" aria-label=${t("howItWorks")}>
        ${pages.map((_, i) => html`<button key=${i} role="tab" aria-selected=${i === index} aria-label=${`${i + 1} / ${pages.length}`}
            class=${i === index ? "on" : i < index ? "past" : ""} onClick=${() => go(i)}><i></i></button>`)}
      </div>
    </footer>
  </div>`;
}

/** One section of the scrolling guide; its animation plays while it is on screen. */
function Section({ s, i }) {
  const [ref, play] = useInView();
  return html`<li ref=${ref} class=${`guide-item${play ? " play" : ""}`}>
    <span class="guide-num">${String(i + 1).padStart(2, "0")}</span>
    <h2>${s.title}</h2>
    <p class="muted">${s.text}</p>
    <${s.Demo} play=${play}/>
  </li>`;
}

/** "How it works" after sign-in: one scrolling page. */
export function Guide() {
  useEffect(() => { scrollTo(0, 0); }, []);
  return html`<div class="screen">
    <header class="nav">
      <a class="back" href="#/" aria-label=${t("back")}><${Icon.left}/><span>${t("brand")}</span></a>
      <span></span><span></span>
    </header>
    <main class="pad grow guide">
      <p class="label muted">${t("guideKicker")}</p>
      <h1 class="title guide-title">${t("guideTitle")}</h1>
      <ol class="guide-list">${SECTIONS.map((s, i) => html`<${Section} key=${i} s=${s} i=${i}/>`)}</ol>
      <p class="guide-tips muted">${t("guideTips")}</p>
    </main>
    <footer class="bottom">
      <a class="capsule" href="#/">${t("startPlanning")}</a>
    </footer>
  </div>`;
}
