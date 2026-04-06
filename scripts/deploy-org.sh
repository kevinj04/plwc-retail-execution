#!/usr/bin/env bash

set -euo pipefail

DRY_RUN=""

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN="--dry-run"
  shift
fi

TARGET_ORG="${1:-}"

if [[ -z "$TARGET_ORG" ]]; then
  echo "Usage: $0 [--dry-run] <target-org-alias-or-username>" >&2
  exit 1
fi

sf project deploy start \
  --manifest manifest/package.xml \
  --target-org "$TARGET_ORG" \
  --test-level RunLocalTests \
  --wait 30 \
  ${DRY_RUN}
