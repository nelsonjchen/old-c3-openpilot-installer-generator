const AGNOS_TEMPLATE = "/installer_openpilot_agnos";
const NEOS_TEMPLATE = "/installer_openpilot_neos";

const AGNOS_USERNAME_SLOT = "27182818284590452353602874713526624977572470936999595";
const AGNOS_BRANCH_SLOT = "161803398874989484820458683436563811772030917980576286213544862270526046281890244970720720418939113748475408807538689175212663386222353693179318006076672635443338908659593958290563832266131992829026788067520876689250171169620703222104321626954862629631361";
const AGNOS_LOADING_SLOT = "314159265358979323846264338327950288419";
const NEOS_USERNAME_SLOT = "271828182845904523536028747135266249775724709369995957496696762772407663035354759457138217852516642742746639193200305992181741359662904357290033429526059563073813232862794349076323382988075319525101901157383418793070215408914993488416750924476146066808226";
const NEOS_LOADING_SLOT = "314159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196442881097566593344612847564823378678316527120190914564";
const NEOS_BRANCH_MARKER = "--depth=1 openpilot";

const encoder = new TextEncoder();
const aliases = new Map([
  ["dragonpilot", ["dragonpilot-community", "release3", "dragonpilot"]],
  ["dp", ["dragonpilot-community", "release3", "dragonpilot"]],
  ["stock", ["commaai", null, "openpilot"]],
  ["commaai", ["commaai", null, "openpilot"]],
  ["shane", ["sshane", "SA-master", "Stock Additions"]],
  ["smiskol", ["sshane", "SA-master", "Stock Additions"]],
  ["sa", ["sshane", "SA-master", "Stock Additions"]],
  ["sshane", ["sshane", "SA-master", "Stock Additions"]],
  ["sunnypilot", ["sunnyhaibin", "prod-c3", "sunnypilot"]],
  ["sp", ["sunnyhaibin", "prod-c3", "sunnypilot"]],
  ["sunnyhaibin", ["sunnyhaibin", "prod-c3", "sunnypilot"]],
]);

function bytes(value) {
  return encoder.encode(value);
}

function indexOf(haystack, needle, from = 0) {
  outer: for (let i = from; i <= haystack.length - needle.length; i += 1) {
    for (let j = 0; j < needle.length; j += 1) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

function replaceFixed(buffer, placeholder, value, padding) {
  const needle = bytes(placeholder);
  const replacement = bytes(value);
  if (replacement.length > needle.length) throw new Error("replacement is too long");
  const offset = indexOf(buffer, needle);
  if (offset < 0) throw new Error("installer placeholder is missing");
  buffer.set(replacement, offset);
  buffer.fill(padding, offset + replacement.length, offset + needle.length);
}

function splice(buffer, start, deleteCount, insertion) {
  const result = new Uint8Array(buffer.length - deleteCount + insertion.length);
  result.set(buffer.subarray(0, start));
  result.set(insertion, start);
  result.set(buffer.subarray(start + deleteCount), start + insertion.length);
  return result;
}

function patchAgnos(template, config) {
  const result = new Uint8Array(template);
  replaceFixed(result, AGNOS_USERNAME_SLOT, `${config.username}/openpilot.git`, 0);
  replaceFixed(result, AGNOS_BRANCH_SLOT, config.branch, 0);
  replaceFixed(result, AGNOS_LOADING_SLOT, config.loadingMessage, 0x20);
  return result;
}

function patchNeos(template, config) {
  let result = new Uint8Array(template);
  const usernameSlot = bytes(NEOS_USERNAME_SLOT);
  const usernameOffset = indexOf(result, usernameSlot);
  if (usernameOffset < 0) throw new Error("NEOS username placeholder is missing");
  result = splice(result, usernameOffset, usernameSlot.length, bytes(config.username));

  const branchMarker = bytes(NEOS_BRANCH_MARKER);
  const branchOffset = indexOf(result, branchMarker);
  if (branchOffset < 0) throw new Error("NEOS branch marker is missing");
  const argumentOffset = branchOffset + branchMarker.length;
  const paddingLength = usernameSlot.length - bytes(config.username).length;
  result = splice(result, argumentOffset, 0, new Uint8Array(paddingLength).fill(0x20));
  if (config.branch) {
    const argument = bytes(` -b ${config.branch}`);
    result.set(argument, argumentOffset);
  }

  replaceFixed(result, NEOS_LOADING_SLOT, config.loadingMessage, 0);
  return result;
}

function classifyUserAgent(userAgent) {
  if (userAgent.includes("NEOSSetup")) return "neos";
  if (userAgent.includes("AGNOSSetup") || userAgent.includes("Wget")) return "agnos";
  return "browser";
}

function parsePath(pathname) {
  return pathname.split("/").filter(Boolean).map((part) => decodeURIComponent(part));
}

function validateConfig(username, branch, loadingMessage) {
  if (!/^[a-z\d](?:[a-z\d-]{0,38})$/.test(username)) throw new Error("invalid GitHub username");
  if (branch.length > 255 || (branch && !/^[A-Za-z0-9._/-]+$/.test(branch))) throw new Error("invalid branch");
  if (branch.includes("..") || branch.includes("//") || branch.includes("@{") || branch.startsWith("-") || branch.endsWith("/") || branch.endsWith(".") || branch.endsWith(".lock")) throw new Error("invalid branch");
  if (bytes(loadingMessage).length > 39) throw new Error("loading message is too long");
}

function resolveConfig(parts, platform) {
  let [username = "", branch = "", loadingMessage = ""] = parts;
  username = username.toLowerCase().slice(0, 39);
  branch = branch.trim() === "_" ? "" : branch.trim();
  const suppliedLoadingMessage = loadingMessage.trim() !== "";
  loadingMessage = loadingMessage.trim();

  if (!username) {
    username = "commaai";
    branch = platform === "neos" ? "release2" : "release3";
    loadingMessage = "openpilot";
  } else if (aliases.has(username)) {
    const [canonicalUsername, defaultBranch, defaultMessage] = aliases.get(username);
    username = canonicalUsername;
    branch ||= defaultBranch ?? (platform === "neos" ? "release2" : "release3");
    loadingMessage ||= defaultMessage;
  }
  loadingMessage ||= username;
  validateConfig(username, branch, loadingMessage);
  return { username, branch, loadingMessage, suppliedLoadingMessage };
}

async function loadTemplate(env, requestUrl, platform) {
  const url = new URL(platform === "neos" ? NEOS_TEMPLATE : AGNOS_TEMPLATE, requestUrl);
  const response = await env.ASSETS.fetch(url);
  if (!response.ok) throw new Error(`missing ${platform.toUpperCase()} installer template`);
  return new Uint8Array(await response.arrayBuffer());
}

async function installerResponse(request, env, platform, config) {
  const template = await loadTemplate(env, request.url, platform);
  const installer = platform === "neos" ? patchNeos(template, config) : patchAgnos(template, config);
  return new Response(installer, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": "attachment; filename=installer_openpilot",
      "Content-Length": String(installer.length),
      "Content-Type": "application/octet-stream",
      "X-Installer-Platform": platform,
    },
  });
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function pageResponse(request, config, originalParts) {
  const base = new URL(request.url).origin;
  const path = originalParts.map(encodeURIComponent).join("/");
  const title = originalParts.length ? `${config.username}/${config.branch || "default branch"}` : "openpilot fork installer generator";
  const details = originalParts.length
    ? `<p>Fork: <a href="https://github.com/${escapeHtml(config.username)}/openpilot">${escapeHtml(config.username)}/openpilot</a></p><p>Branch: ${escapeHtml(config.branch || "repository default")}</p>`
    : `<p>Enter a URL in the format <code>${base}/username/branch</code> on the device setup screen.</p>`;
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title><style>body{max-width:760px;margin:12vh auto;padding:0 24px;font:18px system-ui;background:linear-gradient(135deg,#f9dec9,#99b2dd);min-height:76vh;color:#30323d}main{background:#ffffffb8;padding:32px;border-radius:18px}a{color:#4b50b8}a.button{display:inline-block;margin:8px;padding:12px 16px;background:#6369d1;color:#fff;border-radius:8px;text-decoration:none}code{overflow-wrap:anywhere}</style></head><body><main><h1>🍴 openpilot fork installer generator</h1>${details}${originalParts.length ? `<p><a class="button" href="/build/neos/${path}">Download NEOS (C3)</a><a class="button" href="/build/agnos/${path}">Download AGNOS</a></p>` : ""}<p>Device requests are selected automatically from the NEOSSetup or AGNOSSetup user agent.</p></main></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export default {
  async fetch(request, env) {
    try {
      if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
      const url = new URL(request.url);
      let parts = parsePath(url.pathname);
      let platform = classifyUserAgent(request.headers.get("User-Agent") ?? "");

      if (parts[0] === "build" && (parts[1] === "neos" || parts[1] === "agnos")) {
        platform = parts[1];
        parts = parts.slice(2);
      } else if (parts[0] === "build_neos.php" || parts[0] === "build_agnos.php") {
        platform = parts[0] === "build_neos.php" ? "neos" : "agnos";
        parts = [url.searchParams.get("username") ?? "", url.searchParams.get("branch") ?? "", url.searchParams.get("loading_msg") ?? ""];
      }

      const config = resolveConfig(parts, platform === "browser" ? "agnos" : platform);
      if (platform === "browser") return pageResponse(request, config, parts);
      return await installerResponse(request, env, platform, config);
    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
  },
};

export { classifyUserAgent, patchAgnos, patchNeos, resolveConfig };
