-- LM-SB-03 — Self-Builder core schema.
--
-- Spec: docs/loop-engineering/51-life-manager-builds-life-manager.md
--   §4 "Postgresをauthority、GitHub Issue/labelをprojectionとする" + transition contract
--   §5.4 collection policy: no raw identity, no raw content, pseudonymous tenant only
--   §6 data model
--   §16 verification matrix (duplicate delivery, dead worker, done-without-SHA)
--
-- Table naming: this migration uses the sb_* prefix so every Self-Builder table is greppable
-- and droppable as one unit. Mapping to the spec §6 names:
--   sb_signals  = improvement_signals      sb_clusters = failure_clusters
--   sb_issues   = improvement_issues       sb_leases   = worker_leases
--   sb_audit    = audit_events
-- The remaining §6 tables (reproduction_evals, candidate_runs, verification_runs,
-- deployment_canaries, outcome_measurements, learning_receipts, policy_decisions) arrive with
-- the milestones that write them; M1 only creates what M1's code actually uses.
--
-- Additive and idempotent: safe to re-run. Rollback lives in the sibling .rollback.sql.

-- ---------------------------------------------------------------------------
-- sb_signals — append-only observation log (spec §5.2 envelope, one row per delivery)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sb_signals (
  signal_id text PRIMARY KEY,
  signature_hash text NOT NULL CHECK (signature_hash ~ '^sha256:[0-9a-f]{64}$'),
  source text NOT NULL,
  graph_version text NOT NULL DEFAULT 'unknown',
  -- I3: the release axis of the spec §5.4 aggregation unit
  -- (release × graph_version × model × tool × failure_class)
  code_version text,
  node text,
  tool text,
  status text,
  failure_class text,
  latency_ms integer CHECK (latency_ms IS NULL OR latency_ms >= 0),
  effect_id text,
  -- The ONLY tenant column: a stable pseudonym. NULL means a fleet-level signal.
  -- A CHECK is not evaluated for NULL, so this rejects every non-pseudonymous value.
  tenant_ref text CHECK (tenant_ref ~ '^sha256:[0-9a-f]{64}$'),
  observed_at timestamptz NOT NULL,
  ingested_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sb_signals_signature_idx
  ON public.sb_signals (signature_hash, observed_at DESC);

-- ---------------------------------------------------------------------------
-- sb_clusters — deduplicated problem (spec §16 "Same signal delivered twice -> one cluster")
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sb_clusters (
  cluster_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- UNIQUE is the whole dedup mechanism: a second delivery of the same failure signature
  -- collides here instead of opening a rival cluster.
  signature_hash text NOT NULL UNIQUE CHECK (signature_hash ~ '^sha256:[0-9a-f]{64}$'),
  occurrences integer NOT NULL DEFAULT 1 CHECK (occurrences >= 1),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- sb_issues — authoritative state (spec §4). GitHub labels are a projection of this column.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sb_issues (
  issue_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- UNIQUE: one cluster owns exactly one Issue, and one Issue means one PR (spec §7.2).
  cluster_id uuid NOT NULL UNIQUE REFERENCES public.sb_clusters (cluster_id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'OBSERVED' CHECK (state IN ('OBSERVED','CLUSTERED','TRIAGED','REPRODUCED','EVAL_READY','CLAIMED','IMPLEMENTED','VERIFIED','PR_OPEN','CANARY','PROMOTED','MEASURED','LEARNING_RECORDED','DUPLICATE','QUARANTINED','NOT_REPRODUCIBLE','REJECTED','REGRESSION','ROLLED_BACK','RETRY_WAIT','CIRCUIT_OPEN')),
  issue_class text,
  risk text CHECK (risk IS NULL OR risk IN ('low','medium','high')),
  priority numeric,
  candidate_commit_sha text CHECK (candidate_commit_sha IS NULL OR candidate_commit_sha ~ '^[0-9a-f]{7,40}$'),
  github_issue_number integer,
  consecutive_failures integer NOT NULL DEFAULT 0 CHECK (consecutive_failures >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sb_issues_state_idx ON public.sb_issues (state, updated_at DESC);

-- ---------------------------------------------------------------------------
-- sb_leases — worker claim with expiry (spec §16 "Worker dies after claim -> resume")
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sb_leases (
  issue_id uuid PRIMARY KEY REFERENCES public.sb_issues (issue_id) ON DELETE CASCADE,
  worker_id text NOT NULL CHECK (length(worker_id) BETWEEN 1 AND 128),
  claimed_at timestamptz NOT NULL DEFAULT now(),
  heartbeat_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS sb_leases_expiry_idx ON public.sb_leases (expires_at);

-- ---------------------------------------------------------------------------
-- sb_audit — append-only transition history (spec §2 immutable kernel, §3 Lineage Archive)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sb_audit (
  audit_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES public.sb_issues (issue_id) ON DELETE CASCADE,
  from_state text NOT NULL,
  to_state text NOT NULL,
  -- spec §4 idempotency_key: replaying the same transition cannot double-write history.
  idempotency_key text NOT NULL,
  worker_id text,
  receipts jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issue_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS sb_audit_issue_idx ON public.sb_audit (issue_id, created_at);

-- ---------------------------------------------------------------------------
-- sb_transitions — the legal-hop table (review C1).
--
-- This is the SAME data as state/transitions.js TRANSITIONS, row for row (a JS test
-- enforces the parity). Without it, claim_sb_issue_transition trusted the caller's
-- p_from_state and a hostile worker jumped OBSERVED -> PROMOTED in one call.
-- from_state '*' = any ACTIVE state (spec §4 "any active state" failure edges).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sb_transitions (
  from_state text NOT NULL,
  to_state text NOT NULL,
  required_receipts text[] NOT NULL DEFAULT '{}',
  claim_required boolean NOT NULL DEFAULT false,
  PRIMARY KEY (from_state, to_state)
);

INSERT INTO public.sb_transitions (from_state, to_state, required_receipts, claim_required) VALUES
  ('OBSERVED', 'CLUSTERED', '{}', false),
  ('CLUSTERED', 'TRIAGED', '{evidence_packet_result}', false),
  ('TRIAGED', 'REPRODUCED', '{reproduction_baseline_result}', false),
  ('REPRODUCED', 'EVAL_READY', '{grader_sealed_result}', false),
  ('EVAL_READY', 'CLAIMED', '{}', true),
  ('CLAIMED', 'IMPLEMENTED', '{implementation_result}', true),
  ('IMPLEMENTED', 'VERIFIED', '{build_result,unit_result,integration_result,sealed_eval_result,policy_scan_result}', true),
  ('VERIFIED', 'PR_OPEN', '{}', false),
  ('PR_OPEN', 'CANARY', '{policy_decision_result}', false),
  ('CANARY', 'PROMOTED', '{canary_metric_result}', false),
  ('PROMOTED', 'MEASURED', '{outcome_measurement_result}', false),
  ('MEASURED', 'LEARNING_RECORDED', '{}', false),
  ('*', 'DUPLICATE', '{}', false),
  ('*', 'QUARANTINED', '{}', false),
  ('*', 'RETRY_WAIT', '{}', false),
  ('*', 'CIRCUIT_OPEN', '{}', false),
  ('REPRODUCED', 'NOT_REPRODUCIBLE', '{reproduction_baseline_result}', false),
  ('IMPLEMENTED', 'REJECTED', '{checker_result}', false),
  ('VERIFIED', 'REGRESSION', '{regression_result}', false),
  ('CANARY', 'ROLLED_BACK', '{rollback_result}', false)
ON CONFLICT (from_state, to_state) DO UPDATE
  SET required_receipts = EXCLUDED.required_receipts,
      claim_required = EXCLUDED.claim_required;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
ALTER TABLE public.sb_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sb_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sb_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sb_leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sb_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sb_transitions ENABLE ROW LEVEL SECURITY;

-- C2: RLS with ZERO policies is deny-all even for granted roles — the review proved
-- service_role could neither SELECT sb_issues nor INSERT sb_signals. Decision: KEEP RLS
-- (so anon/authenticated stay deny-all with no policy at all) and add ONE explicit
-- service_role policy per table. On hosted Supabase service_role additionally has
-- BYPASSRLS; these policies make the schema behave identically on vanilla Postgres,
-- where the integration script actually proves it. Row filtering stays USING (true)
-- because the worker is trusted at table scope — the guard rails are the grants, the
-- append-only triggers and the SECURITY DEFINER claim functions, not row predicates.
DROP POLICY IF EXISTS sb_signals_service_rw ON public.sb_signals;
CREATE POLICY sb_signals_service_rw ON public.sb_signals
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS sb_clusters_service_rw ON public.sb_clusters;
CREATE POLICY sb_clusters_service_rw ON public.sb_clusters
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS sb_issues_service_rw ON public.sb_issues;
CREATE POLICY sb_issues_service_rw ON public.sb_issues
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS sb_leases_service_rw ON public.sb_leases;
CREATE POLICY sb_leases_service_rw ON public.sb_leases
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS sb_audit_service_rw ON public.sb_audit;
CREATE POLICY sb_audit_service_rw ON public.sb_audit
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS sb_transitions_service_rw ON public.sb_transitions;
CREATE POLICY sb_transitions_service_rw ON public.sb_transitions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- C2: the review also found sb_clusters / sb_issues / sb_leases had no grant at all.
REVOKE ALL ON public.sb_clusters FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.sb_clusters TO service_role;
REVOKE ALL ON public.sb_issues FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.sb_issues TO service_role;
REVOKE ALL ON public.sb_leases FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.sb_leases TO service_role;
REVOKE ALL ON public.sb_transitions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.sb_transitions TO service_role;

-- ---------------------------------------------------------------------------
-- Append-only enforcement (spec §2: append-only audit history is immutable to Self-Builder)
--
-- Rewriting history is exactly how a self-improving agent hides a reward hack, so no role
-- reachable by a worker may UPDATE or DELETE an observation or an audit row. The two
-- SECURITY DEFINER functions below run as the table owner, which is how legitimate
-- transition rows still get written.
-- ---------------------------------------------------------------------------
REVOKE UPDATE, DELETE ON public.sb_signals FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.sb_signals TO service_role;

REVOKE UPDATE, DELETE ON public.sb_audit FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.sb_audit TO service_role;

-- I2: REVOKE does not bind the table OWNER — the review proved an owner UPDATE on
-- sb_audit succeeded. A BEFORE trigger fires for every role including the owner
-- (pattern copied from apps/life-call/migrations/2026-07-22-panel-score-outcomes.sql).
CREATE OR REPLACE FUNCTION public.reject_sb_signals_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $mut$
BEGIN
  RAISE EXCEPTION 'sb_signals is append-only' USING ERRCODE = '55000';
END;
$mut$;

DROP TRIGGER IF EXISTS sb_signals_append_only ON public.sb_signals;
CREATE TRIGGER sb_signals_append_only
BEFORE UPDATE OR DELETE ON public.sb_signals
FOR EACH ROW EXECUTE FUNCTION public.reject_sb_signals_mutation();

CREATE OR REPLACE FUNCTION public.reject_sb_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $mut$
BEGIN
  RAISE EXCEPTION 'sb_audit is append-only' USING ERRCODE = '55000';
END;
$mut$;

DROP TRIGGER IF EXISTS sb_audit_append_only ON public.sb_audit;
CREATE TRIGGER sb_audit_append_only
BEFORE UPDATE OR DELETE ON public.sb_audit
FOR EACH ROW EXECUTE FUNCTION public.reject_sb_audit_mutation();

REVOKE ALL ON FUNCTION public.reject_sb_signals_mutation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reject_sb_audit_mutation() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- claim_sb_issue_transition — spec §4: "全transitionは UPDATE ... WHERE state = expected
-- RETURNING でclaimする。Prisma connection pool上のsession advisory lockは使用しない。"
--
-- The conditional UPDATE is the concurrency primitive: two racing workers issue the same
-- statement and exactly one sees ROW_COUNT = 1.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_sb_issue_transition(
  p_issue_id uuid,
  p_from_state text,
  p_to_state text,
  p_idempotency_key text,
  p_worker_id text,
  p_receipts jsonb DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  claimed_count integer;
  rule public.sb_transitions%ROWTYPE;
  required_key text;
BEGIN
  -- C1: the hop must be DECLARED in sb_transitions (exact from-state first, then the
  -- '*' any-active wildcard). Undeclared = exception, not a caller-trusted UPDATE.
  SELECT t.* INTO rule
    FROM public.sb_transitions t
   WHERE t.to_state = p_to_state
     AND (t.from_state = p_from_state
          OR (t.from_state = '*' AND p_from_state = ANY (ARRAY['OBSERVED', 'CLUSTERED', 'TRIAGED', 'REPRODUCED', 'EVAL_READY', 'CLAIMED', 'IMPLEMENTED', 'VERIFIED', 'PR_OPEN', 'CANARY', 'PROMOTED', 'MEASURED']::text[])))
   ORDER BY (t.from_state = p_from_state) DESC
   LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'illegal transition % -> %', p_from_state, p_to_state USING ERRCODE = '22023';
  END IF;

  -- C1: every receipt the hop requires must be a present key in p_receipts.
  FOREACH required_key IN ARRAY rule.required_receipts LOOP
    IF p_receipts IS NULL OR NOT (p_receipts ? required_key) THEN
      RAISE EXCEPTION 'missing receipt % for transition % -> %', required_key, p_from_state, p_to_state
        USING ERRCODE = '23514';
    END IF;
  END LOOP;

  UPDATE public.sb_issues
     SET state = p_to_state,
         updated_at = now()
   WHERE issue_id = p_issue_id
     AND state = p_from_state;
  GET DIAGNOSTICS claimed_count = ROW_COUNT;

  IF claimed_count = 1 THEN
    INSERT INTO public.sb_audit (issue_id, from_state, to_state, idempotency_key, worker_id, receipts)
    VALUES (p_issue_id, p_from_state, p_to_state, p_idempotency_key, p_worker_id, p_receipts)
    ON CONFLICT (issue_id, idempotency_key) DO NOTHING;
  END IF;

  RETURN claimed_count = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_sb_issue_transition(uuid, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_sb_issue_transition(uuid, text, text, text, text, jsonb) TO service_role;

-- ---------------------------------------------------------------------------
-- claim_sb_lease — claim, re-enter, or take over an EXPIRED lease (spec §6, §16).
-- The conditional DO UPDATE is what makes a dead worker resumable without ever letting a
-- live worker's work be stolen.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_sb_lease(
  p_issue_id uuid,
  p_worker_id text,
  p_ttl_seconds integer DEFAULT 900
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE claimed_count integer;
BEGIN
  -- M1: clamp the TTL — a zero/negative lease is instantly dead, an unbounded one wedges
  -- the Issue for a caller-chosen eternity.
  IF p_ttl_seconds IS NULL OR p_ttl_seconds <= 0 OR p_ttl_seconds > 3600 THEN
    RAISE EXCEPTION 'lease ttl out of range: %', p_ttl_seconds USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.sb_leases AS existing (issue_id, worker_id, claimed_at, heartbeat_at, expires_at)
  VALUES (p_issue_id, p_worker_id, now(), now(), now() + make_interval(secs => p_ttl_seconds))
  ON CONFLICT (issue_id) DO UPDATE
     SET worker_id = EXCLUDED.worker_id,
         claimed_at = EXCLUDED.claimed_at,
         heartbeat_at = EXCLUDED.heartbeat_at,
         expires_at = EXCLUDED.expires_at
   WHERE existing.expires_at <= now()
      OR existing.worker_id = EXCLUDED.worker_id;
  GET DIAGNOSTICS claimed_count = ROW_COUNT;
  RETURN claimed_count = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_sb_lease(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_sb_lease(uuid, text, integer) TO service_role;
