ALTER TABLE public.lm_panel_sessions
  ADD COLUMN IF NOT EXISTS family_id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS idle_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS absolute_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS rotated_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS pending_child_hash text,
  ADD COLUMN IF NOT EXISTS rotation_grace_until timestamptz;

UPDATE public.lm_panel_sessions SET revoked_at = COALESCE(revoked_at, now()) WHERE idle_expires_at IS NULL OR absolute_expires_at IS NULL;
ALTER TABLE public.lm_panel_sessions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.resolve_lm_panel_session(p_session_hash text, p_child_hash text)
RETURNS TABLE(uid text, chat_id text, rotated boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.lm_panel_sessions%ROWTYPE; bound_chat text;
BEGIN
  SELECT * INTO s FROM public.lm_panel_sessions WHERE session_hash = p_session_hash FOR UPDATE;
  IF NOT FOUND OR s.idle_expires_at <= now() OR s.absolute_expires_at <= now() THEN RETURN; END IF;
  SELECT telegram_chat_id::text INTO bound_chat FROM public.lm_users WHERE lm_users.uid = s.uid;
  IF bound_chat IS DISTINCT FROM s.chat_id THEN
    UPDATE public.lm_panel_sessions SET revoked_at = now(), pending_child_hash = NULL, rotation_grace_until = NULL WHERE family_id = s.family_id;
    RETURN;
  END IF;
  IF s.revoked_at IS NOT NULL AND s.rotation_grace_until > now() AND s.pending_child_hash IS NOT NULL THEN
    DELETE FROM public.lm_panel_sessions WHERE session_hash = s.pending_child_hash;
    UPDATE public.lm_panel_sessions SET pending_child_hash = p_child_hash, rotation_grace_until = now() + interval '2 minutes' WHERE session_hash = p_session_hash;
    INSERT INTO public.lm_panel_sessions(session_hash, uid, chat_id, family_id, expires_at, idle_expires_at, absolute_expires_at)
      VALUES (p_child_hash, s.uid, s.chat_id, s.family_id, LEAST(now() + interval '30 days', s.absolute_expires_at), LEAST(now() + interval '30 days', s.absolute_expires_at), s.absolute_expires_at);
    RETURN QUERY SELECT s.uid, s.chat_id, true; RETURN;
  END IF;
  IF s.revoked_at IS NOT NULL THEN RETURN; END IF;
  IF s.rotated_at IS NULL AND s.created_at <= now() - interval '12 hours' THEN
    UPDATE public.lm_panel_sessions SET rotated_at = now(), revoked_at = now(), pending_child_hash = p_child_hash, rotation_grace_until = now() + interval '2 minutes' WHERE session_hash = p_session_hash;
    INSERT INTO public.lm_panel_sessions(session_hash, uid, chat_id, family_id, expires_at, idle_expires_at, absolute_expires_at)
      VALUES (p_child_hash, s.uid, s.chat_id, s.family_id, LEAST(now() + interval '30 days', s.absolute_expires_at), LEAST(now() + interval '30 days', s.absolute_expires_at), s.absolute_expires_at);
    RETURN QUERY SELECT s.uid, s.chat_id, true; RETURN;
  END IF;
  RETURN QUERY SELECT s.uid, s.chat_id, false;
END $$;

CREATE OR REPLACE FUNCTION public.revoke_lm_panel_session(p_session_hash text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN UPDATE public.lm_panel_sessions SET revoked_at = now(), pending_child_hash = NULL, rotation_grace_until = NULL WHERE session_hash = p_session_hash; RETURN FOUND; END $$;

CREATE OR REPLACE FUNCTION public.revoke_lm_panel_sessions_for_tenant(p_uid text, p_chat_id text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN UPDATE public.lm_panel_sessions SET revoked_at = now(), pending_child_hash = NULL, rotation_grace_until = NULL WHERE uid = p_uid AND chat_id = p_chat_id; RETURN FOUND; END $$;

REVOKE ALL ON FUNCTION public.resolve_lm_panel_session(text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.revoke_lm_panel_session(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.revoke_lm_panel_sessions_for_tenant(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_lm_panel_session(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.revoke_lm_panel_session(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.revoke_lm_panel_sessions_for_tenant(text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.mutate_lm_panel_preferences(p_uid text, p_chat_id text, p_patch jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.lm_users WHERE uid = p_uid AND telegram_chat_id::text = p_chat_id) THEN RAISE EXCEPTION 'scope_mismatch'; END IF;
  INSERT INTO public.lm_panel_preferences(uid) VALUES (p_uid) ON CONFLICT (uid) DO NOTHING;
  UPDATE public.lm_panel_preferences SET
    call_enabled = COALESCE((p_patch->>'call_enabled')::boolean, call_enabled),
    notifications_enabled = COALESCE((p_patch->>'notifications_enabled')::boolean, notifications_enabled),
    daily_automation_enabled = COALESCE((p_patch->>'daily_automation_enabled')::boolean, daily_automation_enabled),
    call_time_zone = COALESCE(p_patch->>'call_time_zone', call_time_zone), updated_at = now()
  WHERE uid = p_uid RETURNING to_jsonb(lm_panel_preferences.*) INTO result;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.mutate_lm_panel_user(p_uid text, p_chat_id text, p_patch jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  UPDATE public.lm_users SET call_language = COALESCE(p_patch->>'call_language', call_language), wake_policy = COALESCE(p_patch->>'wake_policy', wake_policy)
  WHERE uid = p_uid AND telegram_chat_id::text = p_chat_id RETURNING to_jsonb(lm_users.*) INTO result;
  IF result IS NULL THEN RAISE EXCEPTION 'scope_mismatch'; END IF; RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.mutate_lm_panel_preferences(text,text,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mutate_lm_panel_user(text,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mutate_lm_panel_preferences(text,text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.mutate_lm_panel_user(text,text,jsonb) TO service_role;
