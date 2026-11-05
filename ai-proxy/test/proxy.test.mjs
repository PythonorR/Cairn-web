import test from "node:test";
import assert from "node:assert/strict";
import { handle, resetKeyCache, verifyFirebaseToken } from "../src/index.js";

const PROJECT = "planner-web-5bc9e";
const ORIGIN = "https://planner-web-5bc9e.web.app";
const enc = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

const { publicKey, privateKey } = await crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
  true, ["sign", "verify"]);
const jwk = { ...(await crypto.subtle.exportKey("jwk", publicKey)), kid: "k1", alg: "RS256", use: "sig" };

async function token(claims = {}, kid = "k1", key = privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const h = enc({ alg: "RS256", kid, typ: "JWT" });
  const p = enc({ aud: PROJECT, iss: `https://securetoken.google.com/${PROJECT}`, sub: "uid-owner",
                  iat: now - 10, auth_time: now - 10, exp: now + 3000, ...claims });
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${Buffer.from(sig).toString("base64url")}`;
}

function fakeFetch(calls) {
  return async (url, init) => {
    calls.push({ url, init });
    if (url.startsWith("https://www.googleapis.com")) {
      return new Response(JSON.stringify({ keys: [jwk] }), { headers: { "cache-control": "max-age=600" } });
    }
    return new Response('{"ok":true}', { status: 200, headers: { "content-type": "application/json", "request-id": "r1" } });
  };
}

const env = { FIREBASE_PROJECT_ID: PROJECT, ALLOWED_ORIGINS: ORIGIN, ALLOWED_UIDS: "uid-owner", ANTHROPIC_API_KEY: "sk-real" };
const req = async (headers = {}, path = "/v1/messages?beta=true") =>
  new Request(`https://planner-ai.example.workers.dev${path}`, {
    method: "POST", body: "{}", headers: { Origin: ORIGIN, "x-api-key": await token(), "anthropic-version": "2023-06-01",
      "anthropic-beta": "server-side-fallback-2026-07-01", "anthropic-dangerous-direct-browser-access": "true", ...headers },
  });

test("verifies a valid token and rejects tampered or foreign ones", async () => {
  resetKeyCache();
  const calls = [];
  const claims = await verifyFirebaseToken(await token(), PROJECT, { fetchImpl: fakeFetch(calls) });
  assert.equal(claims.sub, "uid-owner");
  const other = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign"]);
  await assert.rejects(verifyFirebaseToken(await token({}, "k1", other.privateKey), PROJECT, { fetchImpl: fakeFetch(calls) }));
  await assert.rejects(verifyFirebaseToken(await token({ aud: "someone-else" }), PROJECT, { fetchImpl: fakeFetch(calls) }));
  await assert.rejects(verifyFirebaseToken(await token({ exp: 1 }), PROJECT, { fetchImpl: fakeFetch(calls) }));
  await assert.rejects(verifyFirebaseToken("not-a-token", PROJECT, { fetchImpl: fakeFetch(calls) }));
});

test("forwards an allowed user's request with the real key", async () => {
  resetKeyCache();
  const calls = [];
  const res = await handle(await req(), env, fakeFetch(calls));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("access-control-allow-origin"), ORIGIN);
  const upstream = calls.find((c) => c.url.startsWith("https://api.anthropic.com"));
  assert.equal(upstream.url, "https://api.anthropic.com/v1/messages?beta=true");
  assert.equal(upstream.init.headers.get("x-api-key"), "sk-real");
  assert.equal(upstream.init.headers.get("anthropic-beta"), "server-side-fallback-2026-07-01");
  assert.equal(upstream.init.headers.get("anthropic-dangerous-direct-browser-access"), null);
});

test("accepts the token as Authorization: Bearer (what the SDK sends)", async () => {
  resetKeyCache();
  const calls = [];
  const r = await req({ "x-api-key": "", Authorization: `Bearer ${await token()}` });
  const res = await handle(r, env, fakeFetch(calls));
  assert.equal(res.status, 200);
  const upstream = calls.find((c) => c.url.startsWith("https://api.anthropic.com"));
  assert.equal(upstream.init.headers.get("authorization"), null, "the Firebase token is not forwarded");
  assert.equal(upstream.init.headers.get("x-api-key"), "sk-real");
});

test("blocks other users, other sites, bad tokens and other paths", async () => {
  resetKeyCache();
  const calls = [];
  const f = fakeFetch(calls);
  assert.equal((await handle(await req({ "x-api-key": await token({ sub: "friend" }) }), env, f)).status, 403);
  assert.equal((await handle(await req({ Origin: "https://evil.example" }), env, f)).status, 403);
  assert.equal((await handle(await req({ "x-api-key": "sk-ant-guess" }), env, f)).status, 401);
  assert.equal((await handle(await req({}, "/v1/models"), env, f)).status, 404);
  assert.ok(!calls.some((c) => c.url.startsWith("https://api.anthropic.com")), "nothing reached Anthropic");
});

test("answers CORS preflight only for the site", async () => {
  const pre = (origin) => new Request("https://x.workers.dev/v1/messages", {
    method: "OPTIONS", headers: { Origin: origin, "Access-Control-Request-Headers": "x-api-key,content-type,anthropic-version" } });
  const ok = await handle(pre(ORIGIN), env);
  assert.equal(ok.status, 204);
  assert.equal(ok.headers.get("access-control-allow-headers"), "x-api-key,content-type,anthropic-version");
  assert.equal((await handle(pre("https://evil.example"), env)).status, 403);
});
