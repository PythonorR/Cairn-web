import { html, useState } from "../vendor/preact-htm.js";
import { authMessage } from "./backend.js";
import { Logo } from "./ui.js";
import { lang, setLang, t } from "./i18n.js";

function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (fn) => {
    setBusy(true);
    setError("");
    try { await fn(); } catch (e) { const m = authMessage(e); if (m) setError(m); }
    setBusy(false);
  };
  return { busy, error, setError, run };
}

function GoogleButton({ backend, action }) {
  return html`<button type="button" class="capsule outline" disabled=${action.busy}
    onClick=${() => action.run(() => backend.google())}>${t("google")}</button>`;
}

export function LangSwitch() {
  return html`<span class="lang-switch">
    <button class=${lang === "en" ? "on" : ""} aria-pressed=${lang === "en"} onClick=${() => lang !== "en" && setLang("en")}>English</button>
    <span aria-hidden="true">·</span>
    <button class=${lang === "ko" ? "on" : ""} aria-pressed=${lang === "ko"} onClick=${() => lang !== "ko" && setLang("ko")}>한국어</button>
  </span>`;
}

function Shell({ title, subtitle, children }) {
  return html`<main class="auth">
    <p class="brand"><${Logo} size=${28}/><span>${t("brand")}</span></p>
    <h1 class="title">${title}</h1>
    ${subtitle && html`<p class="muted auth-sub">${subtitle}</p>`}
    ${children}
    <footer class="auth-foot">
      <a class="tour-link" href="#/tour">${t("takeTour")}</a>
      <${LangSwitch}/>
      <p class="credit">${t("madeBy")}</p>
    </footer>
  </main>`;
}

const EmailField = ({ value, onInput }) => html`<label class="line-field"><span>${t("email")}</span>
  <input type="email" autocomplete="email" inputmode="email" required value=${value} onInput=${(e) => onInput(e.target.value)}/></label>`;

export function Login({ backend }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const action = useAction();
  const submit = (e) => {
    e.preventDefault();
    action.run(() => backend.signIn(email.trim(), password));
  };
  return html`<${Shell} title=${t("signIn")} subtitle=${t("signInSub")}>
    <form class="auth-form" onSubmit=${submit} noValidate>
      <${EmailField} value=${email} onInput=${setEmail}/>
      <label class="line-field"><span>${t("password")}</span>
        <input type="password" autocomplete="current-password" required value=${password}
               onInput=${(e) => setPassword(e.target.value)}/></label>
      ${action.error && html`<p class="error" role="alert">${action.error}</p>`}
      <button class="capsule" disabled=${action.busy || !email || !password}>${t("signIn")}</button>
    </form>
    <p class="or"><span>${t("or")}</span></p>
    <${GoogleButton} backend=${backend} action=${action}/>
    <nav class="auth-links">
      <a href="#/signup">${t("createAnAccount")}</a>
      <a href="#/reset">${t("forgot")}</a>
    </nav>
  <//>`;
}

export function Signup({ backend }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const action = useAction();
  const submit = (e) => {
    e.preventDefault();
    if (password.length < 6) return action.setError(t("auth/weak-password"));
    action.run(() => backend.signUp(email.trim(), password, name.trim()));
  };
  return html`<${Shell} title=${t("createAccount")} subtitle=${t("signUpSub")}>
    <form class="auth-form" onSubmit=${submit} noValidate>
      <label class="line-field"><span>${t("name")} <em>${t("optional")}</em></span>
        <input type="text" autocomplete="name" value=${name} onInput=${(e) => setName(e.target.value)}/></label>
      <${EmailField} value=${email} onInput=${setEmail}/>
      <label class="line-field"><span>${t("password")} <em>${t("sixChars")}</em></span>
        <input type="password" autocomplete="new-password" required minlength="6" value=${password}
               onInput=${(e) => setPassword(e.target.value)}/></label>
      ${action.error && html`<p class="error" role="alert">${action.error}</p>`}
      <button class="capsule" disabled=${action.busy || !email || !password}>${t("createAccount")}</button>
    </form>
    <p class="or"><span>${t("or")}</span></p>
    <${GoogleButton} backend=${backend} action=${action}/>
    <nav class="auth-links"><a href="#/login">${t("haveAccount")}</a></nav>
  <//>`;
}

export function Reset({ backend }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const action = useAction();
  const submit = (e) => {
    e.preventDefault();
    action.run(async () => { await backend.reset(email.trim()); setSent(true); });
  };
  return html`<${Shell} title=${t("resetTitle")} subtitle=${t("resetSub")}>
    ${sent
      ? html`<p class="notice" role="status">${t("resetSent", { email: email.trim() })}</p>`
      : html`<form class="auth-form" onSubmit=${submit} noValidate>
          <${EmailField} value=${email} onInput=${setEmail}/>
          ${action.error && html`<p class="error" role="alert">${action.error}</p>`}
          <button class="capsule" disabled=${action.busy || !email}>${t("sendReset")}</button>
        </form>`}
    <nav class="auth-links"><a href="#/login">${t("backToSignIn")}</a></nav>
  <//>`;
}
