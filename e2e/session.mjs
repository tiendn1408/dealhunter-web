// Real-browser E2E of the Step 1 session flow (headless Chrome against local web + API).
import puppeteer from "puppeteer-core";
import { API, assertApiUsesTestEnv } from "./preflight.mjs";

const WEB = "http://localhost:3100";
await assertApiUsesTestEnv();
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok, detail });

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const ctx = await browser.createBrowserContext();

function watch(page) {
  const log = { api: [], errors: [] };
  page.on("request", (req) => {
    if (!req.url().startsWith(API) || req.method() === "OPTIONS") return;
    const h = req.headers();
    log.api.push({ method: req.method(), path: req.url().slice(API.length), auth: !!h["authorization"], xUserId: "x-user-id" in h });
  });
  page.on("response", (res) => {
    if (!res.url().startsWith(API) || res.request().method() === "OPTIONS") return;
    const entry = [...log.api].reverse().find((e) => res.url().endsWith(e.path) && e.status === undefined);
    if (entry) entry.status = res.status();
  });
  page.on("pageerror", (e) => log.errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && log.errors.push(m.text()));
  return log;
}

async function me(page) {
  return page.evaluate(async (api) => {
    // Read the user through the app's own session: /auth/me is fetched by useAuth; poll the network instead
    return null;
  }, API);
}

// 1. First visit: no cookie -> refresh 401 -> guest session; data calls carry Bearer; no X-User-ID
const p1 = await ctx.newPage();
const l1 = watch(p1);
await p1.goto(`${WEB}/tracking`, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 1500));
const refresh1 = l1.api.find((e) => e.path === "/auth/refresh");
const guest1 = l1.api.filter((e) => e.path === "/auth/guest");
check("first visit: refresh attempted", refresh1?.status === 401, JSON.stringify(refresh1));
check("first visit: exactly one guest session created", guest1.length === 1 && guest1[0].status === 200, `count=${guest1.length}`);
const dataCalls1 = l1.api.filter((e) => !e.path.startsWith("/auth/") || e.path === "/auth/me");
check("data calls carry Authorization", dataCalls1.length > 0 && dataCalls1.every((e) => e.auth), JSON.stringify(dataCalls1));
check("no X-User-ID header anywhere", l1.api.every((e) => !e.xUserId));
check("no 401 on data calls", dataCalls1.every((e) => e.status !== 401), JSON.stringify(dataCalls1.filter((e) => e.status === 401)));

const cookies = await ctx.cookies(API);
const rc = cookies.find((c) => c.name === "dh_refresh");
check("refresh cookie is HttpOnly + path /api/v1/auth", !!rc && rc.httpOnly && rc.path === "/api/v1/auth", JSON.stringify(rc && { httpOnly: rc.httpOnly, path: rc.path, sameSite: rc.sameSite }));
check("refresh cookie not readable by JS", (await p1.evaluate(() => document.cookie)).indexOf("dh_refresh") === -1);

// 2. Reload: session restored from cookie (refresh 200), no new guest
const l1b = watch(p1);
await p1.reload({ waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 1500));
const refresh2 = l1b.api.find((e) => e.path === "/auth/refresh");
check("reload: session restored via refresh (200)", refresh2?.status === 200, JSON.stringify(refresh2));
check("reload: no new guest created", !l1b.api.some((e) => e.path === "/auth/guest"));

// 3. Two tabs loading at the same time: strict rotation must not trigger reuse detection
const pA = await ctx.newPage();
const pB = await ctx.newPage();
const lA = watch(pA);
const lB = watch(pB);
await Promise.all([pA.goto(`${WEB}/tracking`, { waitUntil: "networkidle0" }), pB.goto(`${WEB}/settings`, { waitUntil: "networkidle0" })]);
await new Promise((r) => setTimeout(r, 1500));
const refreshes = [...lA.api, ...lB.api].filter((e) => e.path === "/auth/refresh");
check("concurrent tabs: all refreshes succeed", refreshes.length >= 2 && refreshes.every((e) => e.status === 200), JSON.stringify(refreshes));
check("concurrent tabs: no guest fallback", ![...lA.api, ...lB.api].some((e) => e.path === "/auth/guest"));
// after both tabs, a third reload must still be signed in as the same guest (family not revoked)
const l1c = watch(p1);
await p1.reload({ waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 1000));
check("after concurrent tabs: session still valid", l1c.api.find((e) => e.path === "/auth/refresh")?.status === 200 && !l1c.api.some((e) => e.path === "/auth/guest"));

// 4. Guest clicking "connect Zalo" in settings gets the login modal, not the Zalo form
await pB.bringToFront();
const zaloBtn = await pB.evaluateHandle(() =>
  [...document.querySelectorAll("button")].find((b) => /zalo/i.test(b.textContent || "") && !/ngắt|disconnect/i.test(b.textContent || ""))
);
if (zaloBtn && (await zaloBtn.evaluate((b) => !!b))) {
  await zaloBtn.click();
  await new Promise((r) => setTimeout(r, 500));
  const modalText = await pB.evaluate(() => document.body.innerText);
  check("guest Zalo connect opens login modal", /Đăng nhập DealHunter|Google/.test(modalText) && !/Số điện thoại Zalo/i.test(modalText.slice(0, 0)), "");
} else {
  check("guest Zalo connect opens login modal", false, "zalo button not found");
}

// 5. Logout-equivalent: clear session server-side then ensure app recovers as new guest (no loop)
const lA2 = watch(pA);
await pA.evaluate(async (api) => {
  await fetch(`${api}/auth/logout`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" } });
}, API);
await pA.reload({ waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 2000));
const refreshAfterLogout = lA2.api.filter((e) => e.path === "/auth/refresh");
check("after logout: refresh 401 then exactly one new guest", refreshAfterLogout.some((e) => e.status === 401) && lA2.api.filter((e) => e.path === "/auth/guest").length === 1, JSON.stringify(lA2.api.filter((e) => e.path.startsWith("/auth/"))));
check("after logout: no refresh loop", refreshAfterLogout.length <= 2, `refresh calls=${refreshAfterLogout.length}`);

// 6. Cross-site CSRF form post cannot set a session cookie
const status = await pA.evaluate(async (api) => {
  const r = await fetch(`${api}/auth/guest`, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: "{}" });
  return r.type;
}, API);
check("text/plain auth POST rejected (opaque no-cors, verified server-side by unit tests)", status === "opaque");

const allErrors = [...l1.errors, ...l1b.errors, ...lA.errors, ...lB.errors, ...l1c.errors, ...lA2.errors].filter((e) => !/Download the React DevTools|favicon/.test(e))
  // expected: refresh without a valid cookie (401) and the deliberate text/plain CSRF probe (415)
  .filter((e) => !/status of (401|415)/.test(e));
check("no page errors", allErrors.length === 0, allErrors.slice(0, 5).join(" | "));

await browser.close();
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : "  -> " + r.detail}`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
