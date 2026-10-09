// Refuses to run E2E scripts unless the API under test uses the test database AND the test Redis DB (never
// the development data in dealdb / Redis DB 0).
//
// 1. Postgres, without writing anything through the API: a throwaway guest and refresh token are inserted
//    directly into E2E_DB, then POST /auth/refresh is sent with that token. Only an API on E2E_DB knows it
//    (200). Any other database does not have the token: the API answers 401 after a read-only lookup, and
//    the script stops before anything else is sent.
// 2. Redis (only once Postgres is proven): creating a guest is the one request that makes the API write to
//    Redis — a member in the rate-limit sorted set `dh:rl:guest:<client ip>`. That entry must appear in
//    E2E_REDIS_DB (15) and not in DB 0. Both DBs are only read here (SCAN / ZRANGE). If the API does use
//    DB 0, that single entry is unavoidably written there: the error names the key and member and how to
//    remove it (it also expires by itself after the 10-minute rate-limit window).
// Everything inserted into E2E_DB by the preflight (the throwaway user and the guest) is deleted again.
import { execSync, execFileSync } from "node:child_process";
import crypto from "node:crypto";

export const E2E_DB = process.env.E2E_DB || "dealdb_test";
export const E2E_REDIS_DB = process.env.E2E_REDIS_DB || "15";
export const API = process.env.E2E_API || "http://localhost:18080/api/v1";
const REDIS_CONTAINER = "dealhunter-redis";
const GUEST_RL_PATTERN = "dh:rl:guest:*";

if (!E2E_DB.endsWith("_test")) throw new Error(`E2E_DB must be a *_test database, got "${E2E_DB}"`);
if (!/^\d+$/.test(E2E_REDIS_DB) || E2E_REDIS_DB === "0") {
  throw new Error(`E2E_REDIS_DB must be a Redis DB number other than 0 (the dev DB), got "${E2E_REDIS_DB}"`);
}

export const psql = (sql) =>
  execSync(`docker exec dealhunter-postgres psql -U dealuser -d ${E2E_DB} -tAc "${sql.replace(/"/g, '\\"')}"`).toString().trim();

/** Read-only redis-cli call against one DB of the local Redis container. */
const redis = (db, ...args) =>
  execFileSync("docker", ["exec", REDIS_CONTAINER, "redis-cli", "-n", String(db), ...args]).toString().trim();

/** Every guest rate-limit key in `db` with its members (read-only: SCAN + ZRANGE). */
function guestRateLimitEntries(db) {
  const entries = new Map();
  const keys = redis(db, "--scan", "--pattern", GUEST_RL_PATTERN).split("\n").filter(Boolean);
  for (const key of keys) entries.set(key, new Set(redis(db, "ZRANGE", key, "0", "-1").split("\n").filter(Boolean)));
  return entries;
}

/** Entries in `after` that were not in `before`, as [key, member]. */
function newEntries(before, after) {
  const added = [];
  for (const [key, members] of after) {
    for (const m of members) if (!before.get(key)?.has(m)) added.push([key, m]);
  }
  return added;
}

async function post(path, headers = {}) {
  return fetch(`${API}${path}`, { method: "POST", headers: { "Content-Type": "application/json", ...headers } });
}

/** Step 1: proves the API reads and writes E2E_DB, without the API writing anywhere else. */
async function assertApiUsesTestPostgres() {
  const userId = crypto.randomUUID();
  const raw = crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  psql(
    `INSERT INTO users (id, auth_provider) VALUES ('${userId}', 'guest'); ` +
      `INSERT INTO refresh_tokens (id, user_id, family_id, token_hash, expires_at) ` +
      `VALUES ('${crypto.randomUUID()}', '${userId}', '${userId}', '${hash}', NOW() + INTERVAL '10 minutes')`
  );
  try {
    const res = await post("/auth/refresh", { Cookie: `dh_refresh=${raw}` });
    if (res.status === 401) {
      throw new Error(
        `preflight: the API at ${API} is not using ${E2E_DB} (it does not know a refresh token stored there). ` +
          `Nothing was written through the API (a refresh with an unknown token is only a lookup). ` +
          `Start it with DATABASE_URL=.../${E2E_DB} (see e2e/README.md). Nothing else was run.`
      );
    }
    if (!res.ok) throw new Error(`preflight: POST ${API}/auth/refresh answered ${res.status}. Nothing else was run.`);
    const { user } = await res.json();
    if (user?.id !== userId) throw new Error("preflight: unexpected refresh session payload. Nothing else was run.");
  } finally {
    psql(`DELETE FROM users WHERE id = '${userId}'`); // its refresh tokens are deleted with it (ON DELETE CASCADE)
  }
}

/** Step 2: proves the API's Redis is E2E_REDIS_DB, not DB 0 (see the header comment). */
async function assertApiUsesTestRedis() {
  const before = { test: guestRateLimitEntries(E2E_REDIS_DB), dev: guestRateLimitEntries(0) };
  const res = await post("/auth/guest");
  if (!res.ok) throw new Error(`preflight: POST ${API}/auth/guest answered ${res.status}. Nothing else was run.`);
  const { user } = await res.json();
  if (/^[0-9a-f-]{36}$/.test(user?.id ?? "")) psql(`DELETE FROM users WHERE id = '${user.id}'`);
  const addedDev = newEntries(before.dev, guestRateLimitEntries(0));
  const addedTest = newEntries(before.test, guestRateLimitEntries(E2E_REDIS_DB));
  if (addedDev.length > 0 || addedTest.length === 0) {
    const written = addedDev
      .map(([key, m]) => `  ${key} member ${m} — remove: docker exec ${REDIS_CONTAINER} redis-cli -n 0 ZREM ${key} ${m}`)
      .join("\n");
    throw new Error(
      `preflight: the API at ${API} does not use Redis DB ${E2E_REDIS_DB} ` +
        `(its guest rate-limit entry ${addedTest.length ? "was also" : "did not"} appear in DB ${E2E_REDIS_DB}). ` +
        (addedDev.length
          ? `Creating the preflight guest wrote this to Redis DB 0 (it expires by itself after 10 minutes):\n${written}\n`
          : `Nothing new appeared in DB 0 either: the API uses another Redis DB or server. `) +
        `Start it with REDIS_URL=redis://localhost:6380/${E2E_REDIS_DB} (see e2e/README.md). Nothing else was run.`
    );
  }
}

/** Throws (before any E2E step runs) unless the API uses the test database and the test Redis DB. */
export async function assertApiUsesTestEnv() {
  await assertApiUsesTestPostgres();
  await assertApiUsesTestRedis();
}
