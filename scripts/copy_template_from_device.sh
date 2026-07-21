#!/usr/bin/env bash
# Copy raylib installer_fork_template from a comma  four device into this repo.
set -euo pipefail

DEVICE="${1:-comma@192.168.2.246}"
REMOTE="${2:-/data/openpilot/selfdrive/ui/installer/installers/installer_fork_template}"
DEST="$(cd "$(dirname "$0")/.." && pwd)/fork/installer_openpilot_agnos"

echo "Copying ${DEVICE}:${REMOTE} -> ${DEST}"
scp "${DEVICE}:${REMOTE}" "${DEST}"
chmod +x "${DEST}"
file "${DEST}"
echo "Done. Deploy fork/ to your PHP host and use https://your-host/fork/mouxangithub/master-c3"
