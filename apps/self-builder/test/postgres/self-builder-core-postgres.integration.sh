#!/usr/bin/env bash
# LM-SB-03 Postgres integration proof.
#
# The node --test suite proves the STATE MACHINE against an in-memory fixture. This script
# proves the same three spec §16 rows against a REAL Postgres, so a guarantee cannot exist in
# the fixture while being absent from the schema:
#
#   (a) Maker says done without SHA        -> transition denied
#   (b) Same signal delivered twice        -> one cluster, one Issue
#   (c) Worker dies after claim            -> resumable only after lease expiry
#
# Gating: uses DATABASE_URL when set. Otherwise spins up a throwaway cluster — a local one
# when the postgres server binary is present, else a Docker container. With none of the
# three, it SKIPS (exit 0) and says so — it never reports a pass it did not observe.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIGRATION="$ROOT_DIR/migrations/2026-07-30-self-builder-core.sql"
ROLLBACK="$ROOT_DIR/migrations/2026-07-30-self-builder-core.rollback.sql"
TEST_TMP="$(mktemp -d "${TMPDIR:-/tmp}/self-builder-pg.XXXXXX")"
PGDATA_DIR="$TEST_TMP/data"
PGSOCKET_DIR="$TEST_TMP/socket"
PGLOG="$TEST_TMP/postgres.log"
DB_NAME="self_builder_test"
DB_MODE="skip"
DOCKER_NAME="self-builder-pg-$$"

cleanup() {
  if [[ "$DB_MODE" == "docker" ]]; then
    docker stop "$DOCKER_NAME" >/dev/null 2>&1 || true
  elif [[ "$DB_MODE" == "local" && -f "$PGDATA_DIR/postmaster.pid" ]]; then
    pg_ctl -D "$PGDATA_DIR" -m immediate stop >/dev/null 2>&1 || true
  fi
  rm -rf -- "$TEST_TMP"
}
trap cleanup EXIT INT TERM

if [[ -n "${DATABASE_URL:-}" ]]; then
  DB_MODE="url"
  PSQL=(psql -X -v ON_ERROR_STOP=1 "$DATABASE_URL")
elif command -v postgres >/dev/null 2>&1 && command -v initdb >/dev/null 2>&1; then
  DB_MODE="local"
  mkdir -p "$PGSOCKET_DIR"
  initdb -D "$PGDATA_DIR" -A trust --no-locale >/dev/null
  pg_ctl -D "$PGDATA_DIR" -l "$PGLOG" -o "-F -h '' -k $PGSOCKET_DIR" start >/dev/null
  createdb -h "$PGSOCKET_DIR" "$DB_NAME"
  PSQL=(psql -X -v ON_ERROR_STOP=1 -h "$PGSOCKET_DIR" -d "$DB_NAME")
elif command -v docker >/dev/null 2>&1 && command -v psql >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  DB_MODE="docker"
  PGPORT="${PGPORT:-55432}"
  export PGPASSWORD="self-builder-test-only"
  docker run -d --rm --name "$DOCKER_NAME" \
    -e POSTGRES_PASSWORD="$PGPASSWORD" -e POSTGRES_DB="$DB_NAME" \
    -p "$PGPORT:5432" postgres:16-alpine >/dev/null
  PSQL=(psql -X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p "$PGPORT" -U postgres -d "$DB_NAME")
  for _ in $(seq 1 60); do
    if "${PSQL[@]}" -Atqc 'SELECT 1' >/dev/null 2>&1; then break; fi
    sleep 1
  done
  "${PSQL[@]}" -Atqc 'SELECT 1' >/dev/null || { printf '%s\n' 'FAIL docker postgres did not become ready' >&2; exit 1; }
else
  printf '%s\n' 'SKIP self-builder postgres integration: set DATABASE_URL, or install the postgres server, or start Docker'
  exit 0
fi

fail() { printf 'FAIL %s\n' "$1" >&2; exit 1; }
expect() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$expected" != "$actual" ]]; then fail "$label (expected '$expected', got '$actual')"; fi
  printf 'ok %s\n' "$label"
}

# Supabase-style roles the migration grants to. Harmless if they already exist.
"${PSQL[@]}" >/dev/null <<'SQL'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN NOINHERIT; END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SQL

"${PSQL[@]}" -f "$MIGRATION" >/dev/null
printf 'ok migration applied\n'

# Re-applying must be a no-op (additive + idempotent).
"${PSQL[@]}" -f "$MIGRATION" >/dev/null
printf 'ok migration is idempotent\n'

SIG_HASH="sha256:$(printf '%064d' 1 | tr '0' 'a')"

# ---------------------------------------------------------------------------
# (b) same signal delivered twice -> one cluster, one Issue
# ---------------------------------------------------------------------------
COUNTS="$("${PSQL[@]}" -Atq <<SQL
-- two deliveries of the identical signal
INSERT INTO public.sb_signals (signal_id, signature_hash, source, graph_version, failure_class, observed_at)
VALUES ('sig_dup', '$SIG_HASH', 'life_manager.scheduler', 'lm.v1', 'provider_low_balance', now())
ON CONFLICT (signal_id) DO NOTHING;
INSERT INTO public.sb_signals (signal_id, signature_hash, source, graph_version, failure_class, observed_at)
VALUES ('sig_dup', '$SIG_HASH', 'life_manager.scheduler', 'lm.v1', 'provider_low_balance', now())
ON CONFLICT (signal_id) DO NOTHING;

INSERT INTO public.sb_clusters (signature_hash) VALUES ('$SIG_HASH')
ON CONFLICT (signature_hash) DO UPDATE SET occurrences = public.sb_clusters.occurrences + 1, last_seen_at = now();
INSERT INTO public.sb_clusters (signature_hash) VALUES ('$SIG_HASH')
ON CONFLICT (signature_hash) DO UPDATE SET occurrences = public.sb_clusters.occurrences + 1, last_seen_at = now();

INSERT INTO public.sb_issues (cluster_id)
SELECT cluster_id FROM public.sb_clusters WHERE signature_hash = '$SIG_HASH'
ON CONFLICT (cluster_id) DO NOTHING;
INSERT INTO public.sb_issues (cluster_id)
SELECT cluster_id FROM public.sb_clusters WHERE signature_hash = '$SIG_HASH'
ON CONFLICT (cluster_id) DO NOTHING;

SELECT (SELECT count(*) FROM public.sb_signals) || ':' ||
       (SELECT count(*) FROM public.sb_clusters) || ':' ||
       (SELECT count(*) FROM public.sb_issues);
SQL
)"
expect "(b) duplicate delivery yields one signal, one cluster, one Issue" "1:1:1" "$COUNTS"

ISSUE_ID="$("${PSQL[@]}" -Atqc "SELECT issue_id FROM public.sb_issues LIMIT 1;")"

# ---------------------------------------------------------------------------
# (a) done without SHA / out of order -> transition denied
# ---------------------------------------------------------------------------
DENIED="$("${PSQL[@]}" -Atqc \
  "SELECT public.claim_sb_issue_transition('$ISSUE_ID', 'IMPLEMENTED', 'VERIFIED', 'k1', 'worker-1');")"
expect "(a) claiming from the wrong state is denied" "f" "$DENIED"

SHA_PRESENT="$("${PSQL[@]}" -Atqc \
  "SELECT count(*) FROM public.sb_issues WHERE candidate_commit_sha IS NOT NULL;")"
expect "(a) a freshly opened Issue carries no candidate SHA" "0" "$SHA_PRESENT"

SHA_CHECK="$(set +e; "${PSQL[@]}" -Atqc \
  "UPDATE public.sb_issues SET candidate_commit_sha = 'not-a-sha' WHERE issue_id = '$ISSUE_ID';" 2>&1 >/dev/null; set -e)"
case "$SHA_CHECK" in
  *candidate_commit_sha*) printf 'ok (a) a malformed candidate SHA is rejected by the schema\n' ;;
  *) fail "(a) the schema accepted a malformed candidate SHA: $SHA_CHECK" ;;
esac

ALLOWED="$("${PSQL[@]}" -Atqc \
  "SELECT public.claim_sb_issue_transition('$ISSUE_ID', 'OBSERVED', 'CLUSTERED', 'k2', 'worker-1');")"
expect "(a) the legal transition from the expected state wins" "t" "$ALLOWED"

RACE_LOSER="$("${PSQL[@]}" -Atqc \
  "SELECT public.claim_sb_issue_transition('$ISSUE_ID', 'OBSERVED', 'CLUSTERED', 'k2', 'worker-2');")"
expect "(a) a racing second claim on the same expected state loses" "f" "$RACE_LOSER"

AUDIT_ROWS="$("${PSQL[@]}" -Atqc "SELECT count(*) FROM public.sb_audit WHERE issue_id = '$ISSUE_ID';")"
expect "(a) exactly one audit row was appended for the winning claim" "1" "$AUDIT_ROWS"

# ---------------------------------------------------------------------------
# (c) worker dies after claim -> resume after lease expiry
# ---------------------------------------------------------------------------
CLAIM1="$("${PSQL[@]}" -Atqc "SELECT public.claim_sb_lease('$ISSUE_ID', 'worker-1', 900);")"
expect "(c) the first worker claims the lease" "t" "$CLAIM1"

CLAIM2="$("${PSQL[@]}" -Atqc "SELECT public.claim_sb_lease('$ISSUE_ID', 'worker-2', 900);")"
expect "(c) a second worker cannot steal a live lease" "f" "$CLAIM2"

REENTER="$("${PSQL[@]}" -Atqc "SELECT public.claim_sb_lease('$ISSUE_ID', 'worker-1', 900);")"
expect "(c) the holder may re-enter its own lease after a restart" "t" "$REENTER"

"${PSQL[@]}" -Atqc "UPDATE public.sb_leases SET expires_at = now() - interval '1 second' WHERE issue_id = '$ISSUE_ID';" >/dev/null
RESUMED="$("${PSQL[@]}" -Atqc "SELECT public.claim_sb_lease('$ISSUE_ID', 'worker-2', 900);")"
expect "(c) the work resumes for another worker once the lease expires" "t" "$RESUMED"

LEASE_HOLDER="$("${PSQL[@]}" -Atqc "SELECT worker_id FROM public.sb_leases WHERE issue_id = '$ISSUE_ID';")"
expect "(c) resuming replaces the dead lease rather than duplicating it" "worker-2" "$LEASE_HOLDER"

# ---------------------------------------------------------------------------
# append-only enforcement (spec §2)
# NOTE: ::text on a boolean renders "true"/"false", while a bare boolean COLUMN renders
# "t"/"f" — the two comparisons below are deliberately spelled differently for that reason.
# ---------------------------------------------------------------------------
PRIVS="$("${PSQL[@]}" -Atqc "SELECT
  has_table_privilege('service_role','public.sb_signals','UPDATE')::text || ':' ||
  has_table_privilege('service_role','public.sb_signals','DELETE')::text || ':' ||
  has_table_privilege('service_role','public.sb_audit','UPDATE')::text || ':' ||
  has_table_privilege('service_role','public.sb_audit','DELETE')::text || ':' ||
  has_table_privilege('service_role','public.sb_signals','INSERT')::text;")"
expect "append-only: service_role may insert but never update or delete history" "false:false:false:false:true" "$PRIVS"

ANON_PRIVS="$("${PSQL[@]}" -Atqc "SELECT
  has_function_privilege('anon','public.claim_sb_issue_transition(uuid,text,text,text,text,jsonb)','EXECUTE')::text || ':' ||
  has_function_privilege('authenticated','public.claim_sb_lease(uuid,text,integer)','EXECUTE')::text;")"
expect "the claim functions are not reachable by untrusted roles" "false:false" "$ANON_PRIVS"

# ---------------------------------------------------------------------------
# rollback
# ---------------------------------------------------------------------------
"${PSQL[@]}" -f "$ROLLBACK" >/dev/null
REMAINING="$("${PSQL[@]}" -Atqc "SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'sb\_%';")"
expect "rollback removes every sb_ table" "0" "$REMAINING"

printf '\nPASS self-builder core postgres integration (mode=%s)\n' "$DB_MODE"
