import { html, render, useEffect, useMemo, useState } from "../vendor/preact-htm.js";
import { backendPromise, isConfigured } from "./backend.js";
import { createStore } from "./store.js";
import { Login, Reset, Signup } from "./auth.js";
import { canUseAI, PlannerList } from "./list.js";
import { t } from "./i18n.js";
import { PlannerScreen } from "./planner.js";
import { Guide, markTourDone, Tour, tourDone } from "./guide.js";
import { applyTheme, getTheme, go, useRoute } from "./ui.js";

const AUTH_PAGES = { login: Login, signup: Signup, reset: Reset };

function App() {
  const [backend, setBackend] = useState(null);
  const [user, setUser] = useState(undefined); // undefined = still checking
  const [fatal, setFatal] = useState("");
  const [, redraw] = useState(0);
  const route = useRoute();

  useEffect(() => {
    backendPromise
      .then((b) => { setBackend(b); b.onUser(setUser); })
      .catch((e) => { console.error(e); setFatal(t("loadFailed")); });
  }, []);

  if (fatal) return html`<p class="splash">${fatal}</p>`;
  if (!backend || user === undefined) return html`<p class="splash" aria-busy="true">Cairn</p>`;

  const banner = !isConfigured &&
    html`<p class="demo">${t("previewMode")}</p>`;

  if (!user) {
    const opening = route.name !== "signup" && route.name !== "reset" && !tourDone();
    if (route.name === "tour" || opening) return html`${banner}<${Tour} onDone=${() => redraw((n) => n + 1)}/>`;
    const Page = AUTH_PAGES[route.name] || Login;
    return html`${banner}<${Page} backend=${backend}/>`;
  }
  markTourDone(); // signed in during this visit: after signing out, go straight to sign-in
  return html`${banner}<${SignedIn} key=${user.uid} backend=${backend} user=${user} route=${route}/>`;
}

function SignedIn({ backend, user, route }) {
  const store = useMemo(() => createStore(backend, user.uid), []);
  const [state, setState] = useState(store.get());

  useEffect(() => {
    const unsubscribe = store.subscribe(setState);
    const stop = store.start();
    return () => { unsubscribe(); stop(); };
  }, []);

  useEffect(() => {
    if (AUTH_PAGES[route.name]) go("/");
    else if (state.loaded && route.name === "p" && !store.planner(route.id)) go("/"); // deleted or unknown planner
  }, [route.name, route.id, state.loaded]);

  if (!state.loaded) return html`<p class="splash" aria-busy="true">Cairn</p>`;

  const error = state.error &&
    html`<p class="toast" role="alert" onClick=${() => store.clearError()}>${state.error}</p>`;

  if (route.name === "guide") return html`${error}<${Guide}/>`;

  const planner = route.name === "p" ? store.planner(route.id) : null;
  if (planner) {
    return html`${error}<${PlannerScreen} key=${planner.id} store=${store} state=${state} planner=${planner} canUseAI=${canUseAI(user)}
      onDeleted=${() => { go("/"); store.deletePlanner(planner.id); }}/>`;
  }
  return html`${error}<${PlannerList} store=${store} state=${state} user=${user} backend=${backend}/>`;
}

applyTheme(getTheme());
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => applyTheme(getTheme()));
render(html`<${App}/>`, document.getElementById("app"));
