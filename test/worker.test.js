import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import worker from "../src/worker.js";

const fixtures = new Map([
  ["/installer_openpilot_agnos", new URL("../fork/installer_openpilot_agnos", import.meta.url)],
  ["/installer_openpilot_neos", new URL("../fork/installer_openpilot_neos", import.meta.url)],
]);
const env = {
  ASSETS: {
    async fetch(input) {
      const file = fixtures.get(new URL(input.url ?? input).pathname);
      return file ? new Response(await readFile(file)) : new Response("not found", { status: 404 });
    },
  },
};

async function request(userAgent, path = "/optskug/tskm-c3") {
  return worker.fetch(new Request(`https://example.com${path}`, { headers: { "User-Agent": userAgent } }), env);
}

async function bodyText(response) {
  return Buffer.from(await response.arrayBuffer()).toString("latin1");
}

test("NEOSSetup receives the NEOS binary with requested fork and branch", async () => {
  const response = await request("NEOSSetup-8.1");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("X-Installer-Platform"), "neos");
  assert.equal(response.headers.get("Content-Length"), "526624");
  const body = await bodyText(response);
  assert.match(body, /git clone https:\/\/github\.com\/optskug\/openpilot\.git/);
  assert.match(body, /--depth=1 openpilot -b tskm-c3/);
});

test("AGNOSSetup and Wget receive the AGNOS binary", async () => {
  for (const userAgent of ["AGNOSSetup-18.4", "Wget/1.21.4"]) {
    const response = await request(userAgent);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("X-Installer-Platform"), "agnos");
    assert.equal(response.headers.get("Content-Length"), "2050664");
    const body = await bodyText(response);
    assert.match(body, /https:\/\/github\.com\/optskug\/openpilot\.git/);
    assert.ok(body.includes("tskm-c3\0"));
  }
});

test("a browser receives HTML instead of an executable", async () => {
  const response = await request("Mozilla/5.0");
  assert.match(response.headers.get("Content-Type"), /^text\/html/);
  assert.match(await response.text(), /Download NEOS \(C3\)/);
});

test("root device requests use platform-specific stock branches", async () => {
  const neos = await bodyText(await request("NEOSSetup-8.1", "/"));
  const agnos = await bodyText(await request("AGNOSSetup-18.4", "/"));
  assert.match(neos, /--depth=1 openpilot -b release2/);
  assert.ok(agnos.includes("release3\0"));
});
