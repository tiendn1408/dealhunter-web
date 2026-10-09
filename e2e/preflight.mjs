// Refuses to run E2E scripts unless the API under test writes to the test database (never the
// development data in dealdb): one guest is created through the API and looked up in E2E_DB.
import { execSync } from "node:child_process";

export const E2E_DB = process.env.E2E_DB || "dealdb_test";
export const API = process.env.E2E_API || "http://localhost:18080/api/v1";

if (!E2E_DB.endsWith("_test")) throw new Error(`E2E_DB must be a *_test database, got "${E2E_DB}"`);

export const psql = (sql) =>
  execSync(`docker exec dealhunter-postgres psql -U dealuser -d ${E2E_DB} -tAc "${sql.replace(/"/g, '\\"')}"`).toString().trim();

export async function assertApiUsesTestDb() {
  const res = await fetch(`${API}/auth/guest`, { method: "POST", headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error(`preflight: POST ${API}/auth/guest answered ${res.status}`);
  const { user } = await res.json();
  if (!/^[0-9a-f-]{36}$/.test(user?.id ?? "")) throw new Error("preflight: unexpected guest session payload");
  if (psql(`SELECT COUNT(*) FROM users WHERE id = '${user.id}'`) !== "1") {
    throw new Error(
      `preflight: the API at ${API} is not using ${E2E_DB} (guest ${user.id} is not there). ` +
        `Start it with DATABASE_URL=.../${E2E_DB} (see e2e/README.md). Nothing else was run.`
    );
  }
}
