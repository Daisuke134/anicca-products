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
-- Row level security
-- ---------------------------------------------------------------------------
ALTER TABLE public.sb_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sb_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sb_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sb_leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sb_audit ENABLE ROW LEVEL SECURITY;

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
DECLARE claimed_count integer;
BEGIN
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
