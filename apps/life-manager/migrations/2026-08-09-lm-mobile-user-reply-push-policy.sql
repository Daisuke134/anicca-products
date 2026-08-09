-- User-authored chat replies are durable outbox rows, but must not create an
-- APNs job back to the same sender. This follow-up replaces the already
-- deployed append RPC without replaying any provider or Calendar side effect.
CREATE OR REPLACE FUNCTION public.append_lm_mobile_outbox_with_push_job(
  p_uid text,
  p_id text,
  p_key text,
  p_type text,
  p_args jsonb,
  p_user_content jsonb,
  p_question jsonb,
  p_route jsonb,
  p_created_at timestamptz,
  p_mutation_key text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  outbox_row public.lm_mobile_outbox;
  inserted boolean;
BEGIN
  INSERT INTO public.lm_mobile_outbox(
    uid, id, key, type, args, user_content, question, route, created_at, mutation_key
  ) VALUES (
    p_uid, p_id, p_key, p_type, COALESCE(p_args, '{}'::jsonb), p_user_content, p_question, p_route,
    COALESCE(p_created_at, now()), p_mutation_key
  )
  ON CONFLICT (uid, id) DO NOTHING
  RETURNING * INTO outbox_row;

  inserted := FOUND;
  IF NOT inserted THEN
    SELECT * INTO outbox_row
      FROM public.lm_mobile_outbox
     WHERE uid = p_uid AND id = p_id;
  END IF;

  IF COALESCE(p_type, '') <> 'user' THEN
    INSERT INTO public.lm_mobile_push_jobs(uid, message_id)
    VALUES (p_uid, p_id)
    ON CONFLICT (uid, message_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('inserted', inserted, 'row', to_jsonb(outbox_row));
END;
$$;

REVOKE ALL ON FUNCTION public.append_lm_mobile_outbox_with_push_job(text, text, text, text, jsonb, jsonb, jsonb, jsonb, timestamptz, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.append_lm_mobile_outbox_with_push_job(text, text, text, text, jsonb, jsonb, jsonb, jsonb, timestamptz, text) TO service_role;
