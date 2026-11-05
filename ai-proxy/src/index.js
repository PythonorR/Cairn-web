// Planner AI proxy (Cloudflare Worker).
//
// The website uses Anthropic's JavaScript SDK with this Worker as its base URL and the
// person's Firebase ID token in place of an API key (sent as `Authorization: Bearer`). For each request the Worker:
//   1. accepts only POST /v1/messages from the allowed site origins,
//   2. verifies the Firebase ID token (signature, project, expiry) and that the user's UID
//      is on ALLOWED_UIDS,
//   3. swaps the token for the real ANTHROPIC_API_KEY (a Worker secret) and streams the
//      request to api.anthropic.com and the response back, without buffering it.
// The API key never reaches the browser.

const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const MAX_BODY = 32 * 1024 * 1024; // the Messages API request limit

let keyCache = { keys: null, expires: 0 };

const list = (v) => (v || "").split(",").map((s) => s.trim()).filter(Boolean);

function b64urlBytes(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const b64urlJson = (s) => JSON.parse(new TextDecoder().decode(b64urlBytes(s)));

async function signingKeys(fetchImpl, now) {
  if (keyCache.keys && keyCache.expires > now) return keyCache.keys;
  const res = await fetchImpl(JWKS_URL);
  if (!res.ok) throw new Error(`key fetch failed: ${res.status}`);
  const { keys } = await res.json();
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get("cache-control") || "")?.[1] || 3600);
  keyCache = { keys, expires: now + Math.min(maxAge, 6 * 3600) };
  return keys;
}

/** Verifies a Firebase Auth ID token. Returns its claims or throws. */
export async function verifyFirebaseToken(token, projectId, { fetchImpl = fetch, now = Date.now() / 1000 } = {}) {
  const parts = (token || "").split(".");
  if (parts.length !== 3) throw new Error("malformed token");
  const [h, p, sig] = parts;
  const header = b64urlJson(h);
  const claims = b64urlJson(p);
  if (header.alg !== "RS256" || !header.kid) throw new Error("bad header");
  if (claims.aud !== projectId || claims.iss !== `https://securetoken.google.com/${projectId}`) throw new Error("wrong project");
  if (!(claims.exp > now) || !(claims.iat <= now + 300) || !(claims.auth_time <= now + 300)) throw new Error("expired");
  if (typeof claims.sub !== "string" || !claims.sub) throw new Error("no subject");

  const jwk = (await signingKeys(fetchImpl, now)).find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("unknown key");
  const key = await crypto.subtle.importKey("jwk", { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlBytes(sig), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) throw new Error("bad signature");
  return claims;
}

/** For tests. */
export function resetKeyCache() { keyCache = { keys: null, expires: 0 }; }

function apiError(status, type, message, cors) {
  return new Response(JSON.stringify({ type: "error", error: { type, message } }), {
    status, headers: { "content-type": "application/json", ...cors },
  });
}

export async function handle(request, env, fetchImpl = fetch) {
  const origins = list(env.ALLOWED_ORIGINS);
  const origin = request.headers.get("Origin") || "";
  const okOrigin = origins.includes(origin);
  const cors = okOrigin ? { "Access-Control-Allow-Origin": origin, "Vary": "Origin" } : { "Vary": "Origin" };

  if (request.method === "OPTIONS") {
    if (!okOrigin) return new Response(null, { status: 403 });
    return new Response(null, {
      status: 204,
      headers: {
        ...cors,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "content-type, x-api-key",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const url = new URL(request.url);
  if (request.method !== "POST" || url.pathname !== "/v1/messages") return apiError(404, "not_found_error", "Not found.", cors);
  if (!okOrigin) return apiError(403, "permission_error", "This site isn't allowed to use the proxy.", cors);
  if (Number(request.headers.get("content-length") || 0) > MAX_BODY) {
    return apiError(413, "request_too_large", "The files are too large.", cors);
  }
  if (!env.ANTHROPIC_API_KEY) return apiError(500, "api_error", "The proxy has no API key yet.", cors);

  let claims;
  try {
    const bearer = /^Bearer\s+(.+)$/i.exec(request.headers.get("authorization") || "")?.[1];
    claims = await verifyFirebaseToken(bearer || request.headers.get("x-api-key"), env.FIREBASE_PROJECT_ID, { fetchImpl });
  } catch {
    return apiError(401, "authentication_error", "Please sign in again.", cors);
  }
  if (!list(env.ALLOWED_UIDS).includes(claims.sub)) {
    return apiError(403, "permission_error", "AI planning isn't turned on for this account.", cors);
  }

  const headers = new Headers({ "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY });
  for (const [k, v] of request.headers) {
    if (k.startsWith("anthropic-") && k !== "anthropic-dangerous-direct-browser-access") headers.set(k, v);
  }
  const upstream = await fetchImpl(`https://api.anthropic.com/v1/messages${url.search}`, {
    method: "POST", headers, body: request.body,
  });
  const out = new Headers(upstream.headers);
  for (const [k, v] of Object.entries(cors)) out.set(k, v);
  out.set("Access-Control-Expose-Headers", "request-id, retry-after");
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

export default { fetch: (request, env) => handle(request, env) };
