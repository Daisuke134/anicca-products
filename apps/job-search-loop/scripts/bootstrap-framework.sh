#!/bin/zsh
set -euo pipefail

FRAMEWORK_ROOT="${XDG_DATA_HOME:-$HOME/.local/share}/anicca/job-search/framework"
PINNED_SHA="82a60300b65e3f9357c6b8910dbdbdab2241f7e1"
REPOSITORY="https://github.com/Daisuke134/ai-job-search.git"

mkdir -p "${FRAMEWORK_ROOT:h}"
chmod 700 "${FRAMEWORK_ROOT:h}"
if [[ ! -d "$FRAMEWORK_ROOT/.git" ]]; then
  git clone "$REPOSITORY" "$FRAMEWORK_ROOT"
fi
git -C "$FRAMEWORK_ROOT" fetch origin
git -C "$FRAMEWORK_ROOT" checkout --detach "$PINNED_SHA"
test "$(git -C "$FRAMEWORK_ROOT" rev-parse HEAD)" = "$PINNED_SHA"

