#!/usr/bin/env bash
# Sends today's Leaneo logs to POST /rest/analysis-bulk, one analysis per log titled with today's date.
set -euo pipefail

TODAY="$(date +%F)"
API_URL="${API_URL:-http://localhost:3001}"
BRANCH="${BRANCH:-}"
LOG_DIR="${LOG_DIR:-.}"

usage() {
  cat <<EOF
Usage: BRANCH=<branch> [VAR=value...] $(basename "$0") [-n]

Environment:
  BRANCH                    branch name or slug, created if missing (required)
  API_URL                   API base url (default: http://localhost:3001)
  LOG_DIR                   folder of the logs (default: .)
  SLOW_API_LOG              API log       (default: \$LOG_DIR/slow_api-$TODAY.log, else \$LOG_DIR/slow_api.log)
  EXCEPTIONS_LOG            BUG log       (default: \$LOG_DIR/exceptions-$TODAY.log, else \$LOG_DIR/exceptions.log)
  FRONTEND_PERFORMANCE_LOG  FRONTEND log  (default: \$LOG_DIR/frontend_performance-$TODAY.log, else ….log)

Options:
  -n, --dry-run  list the analyses without sending them
  -h, --help
EOF
}

die() {
  echo "error: $*" >&2
  exit 2
}

is_dry_run=false
case "${1:-}" in
  "") ;;
  -n | --dry-run) is_dry_run=true ;;
  -h | --help) usage; exit 0 ;;
  *) usage >&2; exit 2 ;;
esac

[[ -n "$BRANCH" ]] || die "BRANCH is required"
$is_dry_run || command -v curl >/dev/null || die "curl is required"

# Today's rotated log, else the plain one
default_log() {
  local dated="$LOG_DIR/$1-$TODAY.log"
  if [[ -f "$dated" ]]; then echo "$dated"; else echo "$LOG_DIR/$1.log"; fi
}

# "<schema> <file field> <path>" per log
logs=(
  "API api_metric ${SLOW_API_LOG:-$(default_log slow_api)}"
  "BUG bug_log ${EXCEPTIONS_LOG:-$(default_log exceptions)}"
  "FRONTEND frontend_metric ${FRONTEND_PERFORMANCE_LOG:-$(default_log frontend_performance)}"
)

count=0
form=()
for log in "${logs[@]}"; do
  read -r schema field path <<<"$log"
  if [[ ! -s "$path" ]]; then
    echo "skip $schema: $path is missing or empty" >&2
    continue
  fi
  item="analyses[$count]"
  form+=(
    --form-string "$item[branch]=$BRANCH"
    --form-string "$item[schema]=$schema"
    --form-string "$item[title]=$TODAY"
    --form-string "$item[addOn]=leaneo"
    -F "$item[$field]=@\"$path\""
  )
  echo "$schema  $path"
  count=$((count + 1))
done

[[ $count -gt 0 ]] || die "no log to send for $TODAY"
if $is_dry_run; then
  echo "[dry-run] $count analyses for $BRANCH, title $TODAY"
  exit 0
fi

response="$(curl -sS -X POST "$API_URL/rest/analysis-bulk" "${form[@]}" -w $'\n%{http_code}')" || die "cannot reach $API_URL"
status="${response##*$'\n'}"
if [[ "$status" != "201" ]]; then
  echo "fail: HTTP $status ${response%$'\n'*}" >&2
  exit 1
fi
echo "ok: $count analyses for $BRANCH, title $TODAY"
