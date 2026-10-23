ALTER TABLE public.monk_factory_accounts
  ADD COLUMN social_checked_at timestamptz,
  ADD COLUMN social_stage text,
  ADD COLUMN social_submit_started_at timestamptz,
  ADD COLUMN social_lease_id uuid,
  ADD COLUMN social_lease_until timestamptz,
  ADD COLUMN auto_job_id uuid;
CREATE UNIQUE INDEX monk_factory_instagram_owner ON public.monk_factory_accounts(instagram_account_id)
  WHERE instagram_account_id IS NOT NULL;
ALTER TABLE public.monk_factory_jobs
  ADD COLUMN origin text NOT NULL DEFAULT 'manual' CHECK (origin IN ('manual','auto')),
  ADD COLUMN autopost_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN image_nonce uuid,
  ADD COLUMN image_ticket_until timestamptz,
  ADD COLUMN image_blob_key text,
  ADD COLUMN image_receipt_id text,
  ADD COLUMN avatar_provider_id text,
  ADD COLUMN script_receipt_id text,
  ADD COLUMN source_ids jsonb,
  ADD COLUMN speech_receipt_id text,
  ADD COLUMN video_provider_id text,
  ADD COLUMN post_provider_id text,
  ADD COLUMN post_id text,
  ADD COLUMN metrics_at timestamptz;

-- RLS ownership alone does not make internal receipt/nonce columns public.
REVOKE SELECT ON public.monk_factory_accounts, public.monk_factory_jobs FROM authenticated;
GRANT SELECT(user_id,subscription_status,trial_end,period_end,period_paid,cancel_at_period_end,
  billing_paused,auto_post,instagram_username,connected_at,avatar_image_url,next_post_at,social_checked_at)
  ON public.monk_factory_accounts TO authenticated;
GRANT SELECT(id,user_id,kind,status,stage,max_seconds,video_url,image_url,post_url,metrics,metrics_at,error_class,created_at)
  ON public.monk_factory_jobs TO authenticated;

CREATE FUNCTION public.monk_factory_start_job(p_user_id uuid,p_occurrence_id text,p_kind text,p_origin text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE job public.monk_factory_jobs;
BEGIN
  IF p_origin NOT IN ('manual','auto') THEN RAISE EXCEPTION 'invalid_job'; END IF;
  PERFORM public.monk_factory_reserve_job(p_user_id,p_occurrence_id,p_kind);
  UPDATE public.monk_factory_jobs SET origin=p_origin
    WHERE user_id=p_user_id AND occurrence_id=p_occurrence_id AND stage='reserved'
    RETURNING * INTO job;
  IF NOT FOUND THEN SELECT * INTO job FROM public.monk_factory_jobs WHERE user_id=p_user_id AND occurrence_id=p_occurrence_id; END IF;
  RETURN to_jsonb(job);
END; $$;

CREATE FUNCTION public.monk_factory_claim_job(p_job_id uuid,p_image boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE job public.monk_factory_jobs;
BEGIN
  SELECT * INTO job FROM public.monk_factory_jobs
    WHERE (p_job_id IS NULL OR id=p_job_id) AND (p_image OR next_run_at<=now())
      AND (lease_until IS NULL OR lease_until<now())
      AND status IN ('reserved','processing','effect_unknown')
      AND (NOT p_image OR stage='image_pending')
    ORDER BY next_run_at,created_at LIMIT 1 FOR UPDATE SKIP LOCKED;
  IF NOT FOUND THEN RETURN NULL; END IF;
  UPDATE public.monk_factory_jobs SET lease_id=gen_random_uuid(),
    lease_until=now()+CASE WHEN p_image THEN interval '6 minutes' ELSE interval '50 seconds' END,
    updated_at=now() WHERE id=job.id RETURNING * INTO job;
  RETURN to_jsonb(job);
END; $$;

CREATE FUNCTION public.monk_factory_advance_job(p_job_id uuid,p_lease_id uuid,p_stage text,p_patch jsonb,p_keep_lease boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE job public.monk_factory_jobs; next_stage text; allowed text[];
BEGIN
  SELECT * INTO job FROM public.monk_factory_jobs WHERE id=p_job_id AND lease_id=p_lease_id
    AND lease_until>now() AND stage=p_stage FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF jsonb_typeof(p_patch) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'invalid_job_transition'; END IF;
  next_stage:=coalesce(p_patch->>'stage',job.stage);
  allowed:=CASE job.stage
    WHEN 'reserved' THEN ARRAY['image_pending','script_submitting']
    WHEN 'image_pending' THEN ARRAY['image_submitting']
    WHEN 'image_submitting' THEN ARRAY['image_ready']
    WHEN 'image_ready' THEN ARRAY['avatar_submitting']
    WHEN 'avatar_submitting' THEN ARRAY['avatar_pending']
    WHEN 'avatar_pending' THEN ARRAY['completed']
    WHEN 'script_submitting' THEN ARRAY['script_ready']
    WHEN 'script_ready' THEN ARRAY['speech_submitting']
    WHEN 'speech_submitting' THEN ARRAY['speech_ready']
    WHEN 'speech_ready' THEN ARRAY['video_submitting']
    WHEN 'video_submitting' THEN ARRAY['video_pending']
    WHEN 'video_pending' THEN ARRAY['completed']
    WHEN 'completed' THEN ARRAY['post_ready']
    WHEN 'post_ready' THEN ARRAY['post_submitting']
    WHEN 'post_submitting' THEN ARRAY['post_pending']
    WHEN 'post_pending' THEN ARRAY['published']
    ELSE ARRAY[]::text[] END;
  IF next_stage<>job.stage AND next_stage<>'failed' AND NOT next_stage=ANY(allowed) THEN
    RAISE EXCEPTION 'invalid_job_transition';
  END IF;
  IF next_stage LIKE '%\_submitting' ESCAPE '\' AND p_patch->>'status' IS DISTINCT FROM 'effect_unknown' THEN
    RAISE EXCEPTION 'invalid_job_transition';
  END IF;
  UPDATE public.monk_factory_jobs SET
    status=coalesce(p_patch->>'status',status),stage=next_stage,
    provider_id=coalesce(p_patch->>'provider_id',provider_id),
    script=coalesce(p_patch->>'script',script),caption=coalesce(p_patch->>'caption',caption),
    source_ids=coalesce(p_patch->'source_ids',source_ids),
    image_blob_key=coalesce(p_patch->>'image_blob_key',image_blob_key),
    image_receipt_id=coalesce(p_patch->>'image_receipt_id',image_receipt_id),
    avatar_provider_id=coalesce(p_patch->>'avatar_provider_id',avatar_provider_id),
    script_receipt_id=coalesce(p_patch->>'script_receipt_id',script_receipt_id),
    speech_receipt_id=coalesce(p_patch->>'speech_receipt_id',speech_receipt_id),
    video_provider_id=coalesce(p_patch->>'video_provider_id',video_provider_id),
    post_provider_id=coalesce(p_patch->>'post_provider_id',post_provider_id),post_id=coalesce(p_patch->>'post_id',post_id),
    image_url=coalesce(p_patch->>'image_url',image_url),audio_url=coalesce(p_patch->>'audio_url',audio_url),
    audio_seconds=coalesce((p_patch->>'audio_seconds')::numeric,audio_seconds),
    video_url=coalesce(p_patch->>'video_url',video_url),post_url=coalesce(p_patch->>'post_url',post_url),
    video_completed_at=coalesce((p_patch->>'video_completed_at')::timestamptz,video_completed_at),
    metrics=coalesce(p_patch->'metrics',metrics),metrics_at=coalesce((p_patch->>'metrics_at')::timestamptz,metrics_at),
    evidence=evidence||coalesce(p_patch->'evidence','{}'::jsonb),error_class=p_patch->>'error_class',
    image_nonce=CASE WHEN next_stage='image_pending' THEN coalesce(image_nonce,gen_random_uuid()) ELSE image_nonce END,
    image_ticket_until=CASE WHEN next_stage='image_pending' THEN now()+interval '5 minutes' ELSE image_ticket_until END,
    next_run_at=coalesce((p_patch->>'next_run_at')::timestamptz,now()+interval '30 seconds'),
    lease_id=CASE WHEN p_keep_lease THEN lease_id ELSE NULL END,
    lease_until=CASE WHEN p_keep_lease THEN lease_until ELSE NULL END,updated_at=now()
    WHERE id=p_job_id RETURNING * INTO job;
  IF job.kind='avatar' AND next_stage='completed' THEN
    IF job.avatar_provider_id IS NULL OR job.image_url IS NULL THEN RAISE EXCEPTION 'invalid_job_transition'; END IF;
    UPDATE public.monk_factory_accounts SET avatar_id=job.avatar_provider_id,avatar_image_url=job.image_url WHERE user_id=job.user_id;
  END IF;
  RETURN to_jsonb(job);
END; $$;

CREATE FUNCTION public.monk_factory_set_autopost(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE account public.monk_factory_accounts;
BEGIN
  UPDATE public.monk_factory_accounts SET auto_post=true,
    next_post_at=CASE WHEN auto_post THEN coalesce(next_post_at,now()) ELSE now() END
    WHERE user_id=p_user_id AND avatar_id IS NOT NULL AND instagram_account_id IS NOT NULL
      AND connected_at IS NOT NULL AND social_checked_at>now()-interval '1 minute'
    RETURNING * INTO account;
  IF NOT FOUND THEN RAISE EXCEPTION 'instagram_required'; END IF;
  RETURN jsonb_build_object('auto_post',account.auto_post);
END; $$;

CREATE FUNCTION public.monk_factory_schedule_auto(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE account public.monk_factory_accounts; job public.monk_factory_jobs;
BEGIN
  SELECT * INTO account FROM public.monk_factory_accounts WHERE user_id=p_user_id FOR UPDATE;
  IF NOT FOUND OR NOT account.auto_post OR account.next_post_at IS NULL OR account.next_post_at>now()
    OR account.avatar_id IS NULL OR account.instagram_account_id IS NULL THEN RETURN NULL; END IF;
  IF EXISTS (SELECT 1 FROM public.monk_factory_jobs WHERE id=account.auto_job_id AND post_url IS NULL AND status<>'failed') THEN RETURN NULL; END IF;
  SELECT * INTO job FROM public.monk_factory_jobs WHERE user_id=p_user_id AND kind='video'
    AND status='completed' AND video_url IS NOT NULL AND post_url IS NULL AND post_provider_id IS NULL
    ORDER BY video_completed_at,created_at LIMIT 1 FOR UPDATE;
  IF FOUND THEN
    UPDATE public.monk_factory_jobs SET status='processing',stage='post_ready',autopost_requested=true,next_run_at=now()
      WHERE id=job.id RETURNING * INTO job;
  ELSE
    IF EXISTS (SELECT 1 FROM public.monk_factory_jobs WHERE user_id=p_user_id AND kind='video' AND status IN ('reserved','processing','effect_unknown')) THEN RETURN NULL; END IF;
    PERFORM public.monk_factory_reserve_job(p_user_id,'auto:'||account.next_post_at::text,'video');
    UPDATE public.monk_factory_jobs SET origin='auto',autopost_requested=true WHERE user_id=p_user_id
      AND occurrence_id='auto:'||account.next_post_at::text RETURNING * INTO job;
  END IF;
  UPDATE public.monk_factory_accounts SET auto_job_id=job.id,next_post_at=now()+interval '24 hours' WHERE user_id=p_user_id;
  RETURN to_jsonb(job);
END; $$;

CREATE FUNCTION public.monk_factory_usage(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE account public.monk_factory_accounts; trial boolean; quota_period text; attempts bigint; outputs bigint;
BEGIN
  SELECT * INTO account FROM public.monk_factory_accounts WHERE user_id=p_user_id;
  trial:=account.subscription_status='trialing';
  IF NOT FOUND OR account.stripe_subscription_id IS NULL OR account.cancel_at_period_end OR account.billing_paused OR (
    (trial AND now()>=account.trial_start AND now()<account.trial_end) OR
    (account.subscription_status='active' AND account.period_paid AND now()>=account.period_start AND now()<account.period_end)
    ) IS NOT TRUE THEN
    RETURN jsonb_build_object('videosRemaining',NULL,'attemptsRemaining',NULL,'maxSeconds',NULL,'periodEnd',NULL,'asOf',now());
  END IF;
  quota_period:=CASE WHEN trial THEN 'trial:'||account.stripe_subscription_id ELSE 'paid:'||account.stripe_subscription_id||':'||extract(epoch FROM account.period_start)::text END;
  SELECT count(*),count(*) FILTER(WHERE status<>'failed' OR video_completed_at IS NOT NULL) INTO attempts,outputs
    FROM public.monk_factory_jobs WHERE user_id=p_user_id AND period_key=quota_period AND kind='video';
  RETURN jsonb_build_object('videosRemaining',greatest(0,(CASE WHEN trial THEN 3 ELSE 30 END)-outputs),
    'attemptsRemaining',greatest(0,(CASE WHEN trial THEN 3 ELSE 36 END)-attempts),
    'maxSeconds',CASE WHEN trial THEN 20 ELSE 45 END,'periodEnd',CASE WHEN trial THEN account.trial_end ELSE account.period_end END,'asOf',now());
END; $$;

CREATE FUNCTION public.monk_factory_claim_social(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE account public.monk_factory_accounts;
BEGIN
  UPDATE public.monk_factory_accounts SET social_lease_id=gen_random_uuid(),social_lease_until=now()+interval '45 seconds'
    WHERE user_id=p_user_id AND profile_reserved_at IS NOT NULL AND (social_lease_until IS NULL OR social_lease_until<now())
    RETURNING * INTO account;
  RETURN CASE WHEN FOUND THEN to_jsonb(account) ELSE NULL END;
END; $$;
CREATE FUNCTION public.monk_factory_fence_social(p_user_id uuid,p_lease_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
  UPDATE public.monk_factory_accounts SET social_submit_started_at=now(),social_stage='effect_unknown'
    WHERE user_id=p_user_id AND social_lease_id=p_lease_id AND social_lease_until>now()
      AND social_profile IS NULL AND social_submit_started_at IS NULL;
  RETURN FOUND;
END; $$;
CREATE FUNCTION public.monk_factory_save_social(p_user_id uuid,p_lease_id uuid,p_state jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE account public.monk_factory_accounts;
BEGIN
  IF p_state->>'profile' IS DISTINCT FROM 'factory_'||p_user_id::text OR jsonb_typeof(p_state->'connected') IS DISTINCT FROM 'boolean'
    OR ((p_state->>'connected')::boolean AND (nullif(p_state->>'accountId','') IS NULL OR coalesce((p_state->>'reauthRequired')::boolean,false))) THEN
    RAISE EXCEPTION 'social_mismatch';
  END IF;
  UPDATE public.monk_factory_accounts SET social_profile=p_state->>'profile',social_stage='ready',social_checked_at=now(),
    instagram_account_id=CASE WHEN (p_state->>'connected')::boolean THEN p_state->>'accountId' ELSE NULL END,
    instagram_username=p_state->>'handle',connected_at=CASE WHEN (p_state->>'connected')::boolean THEN coalesce(connected_at,now()) ELSE NULL END,
    auto_post=auto_post AND (p_state->>'connected')::boolean,social_lease_id=NULL,social_lease_until=NULL
    WHERE user_id=p_user_id AND social_lease_id=p_lease_id AND social_lease_until>now() RETURNING * INTO account;
  RETURN CASE WHEN FOUND THEN to_jsonb(account) ELSE NULL END;
END; $$;

REVOKE EXECUTE ON FUNCTION public.monk_factory_start_job(uuid,text,text,text),public.monk_factory_claim_job(uuid,boolean),
  public.monk_factory_advance_job(uuid,uuid,text,jsonb,boolean),public.monk_factory_set_autopost(uuid),
  public.monk_factory_schedule_auto(uuid),public.monk_factory_usage(uuid),public.monk_factory_claim_social(uuid),
  public.monk_factory_fence_social(uuid,uuid),public.monk_factory_save_social(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.monk_factory_start_job(uuid,text,text,text),public.monk_factory_claim_job(uuid,boolean),
  public.monk_factory_advance_job(uuid,uuid,text,jsonb,boolean),public.monk_factory_set_autopost(uuid),
  public.monk_factory_schedule_auto(uuid),public.monk_factory_usage(uuid),public.monk_factory_claim_social(uuid),
  public.monk_factory_fence_social(uuid,uuid),public.monk_factory_save_social(uuid,uuid,jsonb) TO service_role;
