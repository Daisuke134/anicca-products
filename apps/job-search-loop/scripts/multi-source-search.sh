#!/bin/zsh
set -euo pipefail

APP_ROOT="/Users/anicca/anicca-job-search-loop/apps/job-search-loop"
export PYTHONPATH="$APP_ROOT"
exec /opt/homebrew/bin/python3 -m job_search_loop.discovery "$@"
