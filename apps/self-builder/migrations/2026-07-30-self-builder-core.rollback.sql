-- Rollback for 2026-07-30-self-builder-core.sql.
-- Drops exactly what that migration created, nothing else. Functions first (they depend on
-- the tables), then tables in reverse dependency order.
DROP FUNCTION IF EXISTS public.claim_sb_lease(uuid, text, integer);
DROP FUNCTION IF EXISTS public.claim_sb_issue_transition(uuid, text, text, text, text, jsonb);
DROP TRIGGER IF EXISTS sb_signals_append_only ON public.sb_signals;
DROP TRIGGER IF EXISTS sb_audit_append_only ON public.sb_audit;
DROP FUNCTION IF EXISTS public.reject_sb_signals_mutation();
DROP FUNCTION IF EXISTS public.reject_sb_audit_mutation();

DROP TABLE IF EXISTS public.sb_audit;
DROP TABLE IF EXISTS public.sb_leases;
DROP TABLE IF EXISTS public.sb_issues;
DROP TABLE IF EXISTS public.sb_clusters;
DROP TABLE IF EXISTS public.sb_signals;
DROP TABLE IF EXISTS public.sb_transitions;
