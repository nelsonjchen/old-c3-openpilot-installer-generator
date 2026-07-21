# openpilot-installer-generator

PHP site that patches a **prebuilt AGNOS installer ELF** with your fork username, branch, and loading message.

This fork also contains a Cloudflare Workers port. It keeps the original PHP implementation for reference and serves the same prebuilt NEOS/AGNOS binaries from Worker Assets, patching a fresh copy per request.

## Cloudflare Worker

```sh
npm install
npm test
npm run dev
node scripts/verify-endpoint.mjs http://127.0.0.1:8787
npm run deploy
npm run test:deployed
```

Routing remains user-agent dependent:

- `NEOSSetup-*` receives the legacy NEOS/C3 installer.
- `AGNOSSetup-*` and `Wget/*` receive the AGNOS installer.
- Browsers receive a small download page with explicit NEOS and AGNOS links.

The deploy target is configured as the custom domain `c3op.mindflakes.com`. The endpoint test accepts a different base URL as its first argument or through `BASE_URL`.

## AGNOS 18.4+ (comma  four)

The old Qt template in this repo **does not work** on AGNOS 18.4+. Use the raylib template built from openpilot:

1. Build `installer_fork_template` in your openpilot fork (`scons extras`)
2. Copy it to `fork/installer_openpilot_agnos`
3. Deploy `fork/` to PHP hosting

**Full steps:** [BUILD_AGNOS.md](BUILD_AGNOS.md)

Example setup URL:

```text
https://your-host/fork/mouxangithub/master-c3
```

## Legacy (NEOS / old AGNOS)

- [NEOS installer source](/source/installer_source_neos.c)
- [Legacy Qt AGNOS source](/source/installer_source_agnos.cc) (reference only)

## Usage

`https://your-host/fork/[username]/{branch}/{loading_msg}`

During comma  four factory setup, enter the URL under **Custom Software**. The device sends `User-Agent: AGNOSSetup-<version>` and receives a patched ELF.

---

[Idea](https://discord.com/channels/469524606043160576/524594418628558878/827726757201051658) by [nelsonjchen](https://github.com/nelsonjchen) on the [comma.ai community Discord](https://discord.comma.ai/)!
