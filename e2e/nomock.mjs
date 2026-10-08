import puppeteer from "puppeteer-core";
const WEB = "http://localhost:3100";
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok, detail });
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await (await browser.createBrowserContext()).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
const FAKE = /mock\.dealhunter|6\.190\.000|7\.090\.000|6\.050\.000|Mock Store|Sandbox|thử nghiệm|Giả lập|Simulate|sample/i;

for (const path of ["/", "/tracking", "/notifications", "/settings"]) {
  await page.goto(WEB + path, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));
  const html = await page.content();
  const m = html.match(FAKE);
  check(`${path}: no mock/sample/fake data rendered`, !m, m ? m[0] : "");
}

await page.goto(WEB + "/", { waitUntil: "networkidle0" });
const home = await page.evaluate(() => document.body.innerText);
check("home: empty-state hero (no invented product)", home.includes("Bạn chưa theo dõi sản phẩm nào"), home.slice(0, 200));
check("home: how-to-copy-link guidance shown", home.includes("Sao chép liên kết"));

await page.goto(WEB + "/settings", { waitUntil: "networkidle0" });
const settings = await page.evaluate(() => document.body.innerText);
check("settings: scan interval is real (no trackings yet)", settings.includes("Chưa có sản phẩm theo dõi"), settings.slice(0, 300));

// Track a real (blocked from here) Shopee product: must show an honest error, not a fake product
await page.goto(WEB + "/?url=" + encodeURIComponent("https://shopee.vn/Tai-nghe-Sony-WH-1000XM5-i.88201679.22731853609"), { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 800));
let trackStatus = null;
page.on("response", (r) => { if (r.url().endsWith("/tracked-products") && r.request().method() === "POST") trackStatus = r.status(); });
const submitted = await page.evaluate(() => {
  const input = [...document.querySelectorAll('input[type="url"]')].find((i) => i.value.includes("shopee.vn"));
  if (!input) return false;
  input.closest("form").requestSubmit();
  return true;
});
check("blocked real product: link pre-filled from ?url= and submitted", submitted);
await new Promise((r) => setTimeout(r, 25000));
const after = await page.evaluate(() => document.body.innerText);
check("blocked real product: API answers 502", trackStatus === 502, `status=${trackStatus}`);
check("blocked real product: honest error shown to user", after.includes("Không đọc được thông tin sản phẩm từ sàn"), after.slice(0, 300));
check("blocked real product: no success screen", !after.includes("Đã thêm sản phẩm"));
await page.goto(WEB + "/tracking", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 800));
const trackingText = await page.evaluate(() => document.body.innerText);
check("blocked real product: nothing added to tracking list", !/Sony WH-1000XM5|San pham/i.test(trackingText));

check("no page errors", errors.length === 0, errors.join(" | "));
await browser.close();
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : "  -> " + r.detail}`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
