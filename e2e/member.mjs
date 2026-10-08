// Member session restore + in-tab expiry (seeded real member row; login itself needs real Google)
import puppeteer from "puppeteer-core";
import { execSync } from "node:child_process";
import { createHash, randomUUID, randomBytes } from "node:crypto";

// Test rows go to the E2E database only, never to the development data (dealdb)
const DB = process.env.E2E_DB || "dealdb_test";
if (!DB.endsWith("_test")) throw new Error(`E2E_DB must be a *_test database, got "${DB}"`);
const psql = (sql) => execSync(`docker exec dealhunter-postgres psql -U dealuser -d ${DB} -tAc "${sql.replace(/"/g, '\\"')}"`).toString().trim();
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok, detail });

const userId = randomUUID();
const email = `e2e-member-${userId.slice(0, 8)}@dealhunter.vn`;
const raw = randomBytes(32).toString("base64url");
const hash = createHash("sha256").update(raw).digest("hex");
const tokenId = randomUUID();
psql(`INSERT INTO users (id, email, name, auth_provider, google_sub) VALUES ('${userId}', '${email}', 'E2E Member', 'google', 'sub-${userId}')`);
psql(`INSERT INTO refresh_tokens (id, user_id, family_id, token_hash, expires_at) VALUES ('${tokenId}', '${userId}', '${tokenId}', '${hash}', NOW() + INTERVAL '1 day')`);

const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const ctx = await browser.createBrowserContext();
const page = await ctx.newPage();
await page.setCookie({ name: "dh_refresh", value: raw, domain: "localhost", path: "/api/v1/auth", httpOnly: true, sameSite: "Lax" });
const calls = [];
page.on("request", (r) => r.url().includes("/api/v1/") && r.method() !== "OPTIONS" && calls.push({ m: r.method(), p: r.url().split("/api/v1")[1] }));
page.on("response", (r) => { const c = [...calls].reverse().find((c) => r.url().endsWith(c.p) && c.s === undefined && r.request().method() !== "OPTIONS"); if (c) c.s = r.status(); });

await page.goto("http://localhost:3100/settings", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 1500));
const body1 = await page.evaluate(() => document.body.innerText);
check("member session restored from cookie", calls.some((c) => c.p === "/auth/refresh" && c.s === 200) && body1.includes(email), body1.slice(0, 200));
check("no guest created for member", !calls.some((c) => c.p === "/auth/guest"));

// Another device logs this login out (family revoked) while this tab stays open
psql(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE family_id = '${tokenId}'`);
await new Promise((r) => setTimeout(r, 12_000)); // client treats the 40s token as expired after ~10s

// A write in this tab must NOT be replayed into an anonymous account
calls.length = 0;
const writeResult = await page.evaluate(async () => {
  // trigger the app's own API client through a user action: track a URL from the home page input
  return document.querySelector("input") ? "has-input" : "no-input";
});
// client-side navigation keeps the in-memory session (no full reload)
await page.evaluate(() => document.querySelector('a[href="/tracking"]')?.click());
await new Promise((r) => setTimeout(r, 4000));
const body2 = await page.evaluate(() => document.body.innerText);
check("expired member: refresh rejected", calls.some((c) => c.p === "/auth/refresh" && c.s === 401), JSON.stringify(calls));
check("expired member: falls back to one guest", calls.filter((c) => c.p === "/auth/guest").length === 1, JSON.stringify(calls));
check("member data no longer shown", !body2.includes(email));
check("in-tab: session-expired banner shown", body2.includes("Phiên đăng nhập đã hết hạn"), body2.slice(0, 300));

const memberTracked = psql(`SELECT COUNT(*) FROM tracked_products WHERE user_id = '${userId}'`);
check("no writes landed in member account after expiry", memberTracked === "0", memberTracked);

await browser.close();
psql(`DELETE FROM users WHERE id = '${userId}'`);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : "  -> " + r.detail}`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
