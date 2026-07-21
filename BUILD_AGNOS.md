# AGNOS 18.4+ fork installer template

The Qt-based `installer_source_agnos.cc` in this repo is **legacy**. The active template is built from **raylib** `selfdrive/ui/installer/installer.cc` in your openpilot fork with `INSTALLER_USE_PLACEHOLDERS=1`.

## 1. Build template on C3 (AGNOS 18.4+)

```bash
cd /data/openpilot
git pull
scons extras -j$(nproc) selfdrive/ui/installer/installers/installer_fork_template
```

Output:

```text
selfdrive/ui/installer/installers/installer_fork_template
```

## 2. Copy template into this PHP project

From your PC (replace IP):

```bash
scp comma@192.168.2.246:/data/openpilot/selfdrive/ui/installer/installers/installer_fork_template \
  E:/openpilot-installer-generator/fork/installer_openpilot_agnos
```

Or on-device:

```bash
cp /data/openpilot/selfdrive/ui/installer/installers/installer_fork_template \
  /path/to/openpilot-installer-generator/fork/installer_openpilot_agnos
```

**Important:** Replace the old Qt template binary. The previous `installer_openpilot_agnos` will not run on AGNOS 18.4.

## 3. Deploy PHP

Host `fork/` on any PHP-capable web server. Example URL during C3 setup:

```text
https://your-host/fork/mouxangithub/master-c3
```

Aliases (see `fork/index.php`):

| Short | Installs |
|-------|----------|
| `mouxan/master-c3` | `github.com/mouxangithub/openpilot` @ `master-c3` |
| `mouxangithub` | default branch `master-c3` |

Device User-Agent must include `AGNOSSetup` (factory setup does this automatically).

## 4. Placeholder slots (must match `installer_config.php`)

| Slot | Length | PHP replaces |
|------|--------|--------------|
| `27182818284590452353602874713526624977572470936999595` | 53 | `{username}/openpilot.git` (NUL padded) |
| `161803398874989484820458683436563811772030917980576286213544862270526046281890244970720720418939113748475408807538689175212663386222353693179318006076672635443338908659593958290563832266131992829026788067520876689250171169620703222104321626954862629631361` | 255 | branch (NUL padded, empty = default branch) |
| `314159265358979323846264338327950288419` | 39 | loading message (space padded) |

Full git URL in binary: `https://github.com/` + username slot.

## 5. Rebuild template when

- AGNOS major version changes
- `installer.cc` or linked libraries change
- `installer_config.php` slot strings change
