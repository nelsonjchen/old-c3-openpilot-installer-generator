# C3 openpilot installer generator

A Cloudflare Workers service that generates openpilot fork installers for comma three (NEOS), as well as newer AGNOS devices. It patches a fresh copy of a prebuilt installer ELF for each request with the requested GitHub username, branch, and optional loading message.

The original PHP implementation remains in [`fork/`](fork/) for reference. This repository is based on [mouxangithub/openpilot-installer-generator](https://github.com/mouxangithub/openpilot-installer-generator).

## Live service

The public deployment is available at:

```text
https://c3op.mindflakes.com
```

Use a setup URL in this format:

```text
https://c3op.mindflakes.com/<github-username>/<branch>/<optional-loading-message>
```

For example:

```text
https://c3op.mindflakes.com/optskug/tskm-c3
```

Enter the URL under **Custom Software** during device setup. The response depends on the requesting user agent:

- `NEOSSetup-*` receives the legacy NEOS/comma three installer.
- `AGNOSSetup-*` receives the AGNOS installer.
- `Wget/*` receives the AGNOS installer, matching the upstream behavior.
- A normal browser receives a page with explicit NEOS and AGNOS download links.

The service recognizes the upstream `stock`, `commaai`, `dragonpilot`, `dp`, `sunnypilot`, `sp`, `sshane`, `shane`, `smiskol`, and `sa` aliases. Use `_` as the branch to let Git use the repository's default branch.

Only install software from repositories and branches you trust. The generated executable downloads and installs code from the URL embedded in it.

## Development

Requires a current Node.js release.

```sh
npm install
npm test
npm run dev
```

In another terminal, verify every user-agent path against the local Worker:

```sh
node scripts/verify-endpoint.mjs http://127.0.0.1:8787
```

The test verifies that NEOS, AGNOS, Wget, and browser requests receive the expected response, binary size, repository, and branch.

## Deployment

[`wrangler.jsonc`](wrangler.jsonc) configures the `c3op.mindflakes.com` custom domain and stores the two installer templates as Cloudflare Worker Assets.

```sh
npm run deploy
npm run test:deployed
```

`npm run deploy` copies the installer templates into the ignored `.worker-assets/` staging directory before invoking Wrangler.

## Installer templates

- [`fork/installer_openpilot_neos`](fork/installer_openpilot_neos) is the legacy NEOS/comma three template.
- [`fork/installer_openpilot_agnos`](fork/installer_openpilot_agnos) is the AGNOS template.
- [`source/installer_source_neos.c`](source/installer_source_neos.c) contains the legacy NEOS source.
- [`source/installer_source_agnos.cc`](source/installer_source_agnos.cc) contains the legacy Qt AGNOS source for reference only.

AGNOS 18.4 and newer require the raylib template built from openpilot; the old Qt template does not work. See [`BUILD_AGNOS.md`](BUILD_AGNOS.md) for build and replacement instructions.

## Credits

Based on the installer generator maintained by [mouxangithub](https://github.com/mouxangithub) and the original concept by [nelsonjchen](https://github.com/nelsonjchen), shared in the [comma.ai community Discord](https://discord.comma.ai/).
