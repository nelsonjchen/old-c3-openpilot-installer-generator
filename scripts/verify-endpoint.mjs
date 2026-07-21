import assert from "node:assert/strict";

const baseUrl = (process.argv[2] ?? process.env.BASE_URL ?? "http://127.0.0.1:8787").replace(/\/$/, "");
const path = "/optskug/tskm-c3";

async function check(userAgent, expectedPlatform, expectedLength) {
  const response = await fetch(`${baseUrl}${path}`, { headers: { "User-Agent": userAgent }, redirect: "follow" });
  assert.equal(response.status, 200, `${userAgent}: HTTP ${response.status}`);
  assert.equal(response.headers.get("content-type"), "application/octet-stream", `${userAgent}: content type`);
  assert.equal(response.headers.get("x-installer-platform"), expectedPlatform, `${userAgent}: platform`);
  const body = Buffer.from(await response.arrayBuffer());
  assert.equal(body.length, expectedLength, `${userAgent}: length`);
  assert.ok(body.includes(Buffer.from("https://github.com/optskug/openpilot.git")), `${userAgent}: repository patch`);
  assert.ok(body.includes(Buffer.from("tskm-c3")), `${userAgent}: branch patch`);
  console.log(`ok ${userAgent} -> ${expectedPlatform} (${body.length} bytes)`);
}

await check("NEOSSetup-8.1", "neos", 526624);
await check("AGNOSSetup-18.4", "agnos", 2050664);
await check("Wget/1.21.4", "agnos", 2050664);

const browser = await fetch(`${baseUrl}${path}`, { headers: { "User-Agent": "Mozilla/5.0" } });
assert.match(browser.headers.get("content-type") ?? "", /^text\/html/);
assert.match(await browser.text(), /Download NEOS \(C3\)/);
console.log("ok Mozilla/5.0 -> HTML");
