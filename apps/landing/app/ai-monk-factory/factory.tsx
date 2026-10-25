'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSession, onAuthChange, signInWithGoogle, signOut } from '@/lib/auth';
import { factoryDestination, factoryRequest, type FactoryAction } from '@/lib/monk-factory-client.mjs';
import { factoryActionReady, factoryCapabilityUnavailable, factoryQuotaState, requestFactoryAction } from './action-readiness.mjs';
import { FactoryActionNotice } from './factory-action-notice.mjs';

type Account = {
  subscription_status?: string; trial_end?: string; period_end?: string; period_paid?: boolean;
  cancel_at_period_end?: boolean; billing_paused?: boolean; auto_post?: boolean; auto_post_intent?: boolean;
  instagram_username?: string; connected?: boolean; instagram_reauth_required?: boolean; connected_at?: string; social_checked_at?: string;
  avatar_ready?: boolean; avatar_image_url?: string; next_post_at?: string;
};
type Job = {
  id: string; kind: string; status: string; stage: string; created_at: string;
  script?: string; caption?: string;
  free_video_postable?: boolean; image_url?: string; video_url?: string; post_url?: string;
  metrics?: { views?: number | null; likes?: number | null; comments?: number | null; asOf?: string; fetchedAt?: string; fetched_at?: string };
  metrics_at?: string;
};
type Capability = { ready: boolean; reason?: string | null };
type Snapshot = { ready: boolean; readiness?: { generation?: Capability; checkout?: Capability; social?: Capability }; account: Account | null; jobs: Job[]; usage?: { videosRemaining: number | null; attemptsRemaining: number | null; completedVideos?: number | null; attemptsUsed?: number | null; maxAttempts?: number | null; maxSeconds: number | null; periodEnd: string | null; asOf: string } };
type PendingVideo = { occurrence: string; jobId?: string };
const finished = new Set(['completed', 'failed', 'cancelled']);
const date = (value?: string | null) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const number = (value?: number | null) => typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString() : '—';
const media = (value?: string) => { try { const u = new URL(value || ''); return u.protocol === 'https:' && !u.username && !u.password ? u.href : undefined; } catch { return undefined; } };
const messages: Record<string, string> = {
  sign_in_required: 'Please sign in again to continue.', auth_unavailable: 'Sign-in is temporarily unavailable. Please try again.',
  connection_interrupted: 'The connection was interrupted. Your request may still be processing. Check the same request before starting another.',
  quota_exhausted: 'The generation limit was reached. Your completed videos remain available.', free_generation_incomplete: 'The free attempt limit was reached before all three videos were completed. No charge started; contact support to finish the free offer.', budget_exhausted: 'Generation is paused for this period. Your existing videos remain available.',
  company_budget_exhausted: 'Today’s Factory generation budget is used. It resets at 00:00 UTC; your free videos remain available.',
  spend_cap_setup: 'The daily generation budget guard is not configured yet. Generation stays paused to protect the studio budget.',
  profile_capacity: 'All creator spaces are currently taken. Please check back before starting a subscription.',
  subscription_required: 'An active monthly plan is required to generate additional videos.',
  free_quota_remaining: 'Complete your three free videos before starting a subscription.',
  avatar_required: 'Create your avatar first.', avatar_exists: 'Your avatar request already exists. Its status is shown below.',
  video_required: 'Generate one full video before connecting Instagram.',
  instagram_required: 'Connect an Instagram Business or Creator account first.', social_not_connected: 'Reconnect Instagram before daily posting can resume.',
  instagram_reconnect_required: 'Reconnect Instagram to resume daily posting.',
  instagram_publish_permission_required: 'Reconnect Instagram and allow content publishing to resume daily posting.',
  instagram_insights_permission_required: 'Reconnect Instagram and allow Insights to verify your post results.',
  billing_sync_conflict: 'Your billing status is updating. Please check again in a moment.',
  checkout_reconciliation_required: 'We are checking your previous checkout. Please refresh before trying again.',
  generation_unavailable: 'Video generation is not configured yet. Your account and free allowance are safe; please check again later.',
  social_unavailable: 'Instagram connection is not configured yet. Please check again later.',
  checkout_unavailable: 'Checkout is not configured yet. Please check again later.',
  factory_unavailable: 'The studio is temporarily unavailable. No new checkout or generation can start. Please check again later.',
};
const unavailable = (capability?: Capability) => factoryCapabilityUnavailable(capability);
function errorMessage(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  return messages[code] || 'This action could not finish. Refresh to check its status before trying again.';
}
function stage(job: Job) {
  if (job.status === 'effect_unknown') return 'Checking provider confirmation';
  if (job.status === 'failed') return 'Could not finish · attempt retained';
  if (job.post_url) return 'Published to Instagram';
  if (job.status === 'completed') return job.kind === 'avatar' ? 'Avatar ready' : 'Video ready';
  if (/image/.test(job.stage)) return 'Creating your portrait';
  if (/avatar/.test(job.stage)) return 'Preparing your avatar';
  if (/script/.test(job.stage)) return 'Writing an original script';
  if (/speech/.test(job.stage)) return 'Creating the voice';
  if (/post|publish/.test(job.stage)) return 'Publishing to Instagram';
  if (/video|render/.test(job.stage)) return 'Rendering your video';
  return 'Waiting to start';
}
function readPending(userId: string): PendingVideo | null {
  try { const p = JSON.parse(localStorage.getItem(`monk-factory-video:${userId}`) || 'null'); return p && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(p.occurrence) ? p : null; } catch { return null; }
}
function VideoCopy({ job }: { job: Job }) {
  if (!job.script && !job.caption) return null;
  return <details className="mf-copy-details"><summary>Show full script and caption</summary>
    {job.script && <div><span className="mf-copy-label">Spoken script</span><p>{job.script}</p></div>}
    {job.caption && <div><span className="mf-copy-label">Instagram caption</span><p>{job.caption}</p></div>}
  </details>;
}
function writePending(userId: string, pending: PendingVideo | null) {
  try { if (pending) localStorage.setItem(`monk-factory-video:${userId}`, JSON.stringify(pending)); else localStorage.removeItem(`monk-factory-video:${userId}`); } catch { /* In-memory occurrence still prevents this tab from starting another request. */ }
}

export default function Factory() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState<FactoryAction | 'login' | 'logout' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionNotice, setActionNotice] = useState<{ action: FactoryAction; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingVideo, setPendingVideo] = useState<PendingVideo | null>(null);
  const token = useRef<string | null>(null);
  const owner = useRef<string | null>(null);
  const videoRequest = useRef<PendingVideo | null>(null);

  useEffect(() => {
    let alive = true, changed = false;
    const apply = (s: Session | null) => {
      if (!alive) return;
      token.current = s?.access_token || null;
      if (owner.current !== (s?.user.id || null)) {
        owner.current = s?.user.id || null;
        setSnapshot(null); setError(''); setNotice(''); setActionNotice(null); setBusy(null);
        videoRequest.current = s ? readPending(s.user.id) : null;
        setPendingVideo(videoRequest.current);
      }
      setSession(s); setAuthReady(true);
    };
    const unsubscribe = onAuthChange(s => { changed = true; apply(s); });
    getSession().then(s => { if (!changed) apply(s); }).catch(() => { if (alive) { setAuthReady(true); setError(messages.auth_unavailable); } });
    return () => { alive = false; unsubscribe(); token.current = null; };
  }, []);

  const load = useCallback(async (accessToken: string, signal?: AbortSignal) => {
    const result = await factoryRequest(accessToken, undefined, { signal }) as unknown as Snapshot;
    if (token.current !== accessToken || signal?.aborted) return;
    if (!Array.isArray(result.jobs) || typeof result.ready !== 'boolean') throw new Error('invalid snapshot');
    setSnapshot(result);
    const pending = videoRequest.current;
    if (pending?.jobId && result.jobs.some(job => job.id === pending.jobId)) {
      if (owner.current) writePending(owner.current, null);
      videoRequest.current = null; setPendingVideo(null);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    const accessToken = session.access_token;
    const controller = new AbortController();
    let inFlight = false;
    const refresh = async (initial = false) => {
      if (inFlight || controller.signal.aborted) return;
      inFlight = true;
      if (initial) setLoading(true);
      try { await load(accessToken, controller.signal); }
      catch (e) { if (!controller.signal.aborted && token.current === accessToken) setError(errorMessage(e)); }
      finally { inFlight = false; if (!controller.signal.aborted) setLoading(false); }
    };
    void refresh(true);
    const interval = setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 15000);
    const visible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', visible);
    return () => { controller.abort(); clearInterval(interval); document.removeEventListener('visibilitychange', visible); };
  }, [session?.access_token, load]);

  const login = async () => {
    setBusy('login'); setError('');
    try { await signInWithGoogle(); } catch { setError(messages.auth_unavailable); setBusy(null); }
  };
  const logout = async () => {
    setBusy('logout'); setError('');
    try { await signOut(); } catch { setError('Sign-out could not finish. Please try again.'); } finally { setBusy(null); }
  };
  const act = async (action: FactoryAction) => {
    const s = session;
    if (!s || busy) return;
    setBusy(action); setError(''); setNotice('');
    let pending = videoRequest.current;
    if (action === 'generate_video' && !pending) {
      pending = { occurrence: crypto.randomUUID() };
      videoRequest.current = pending; setPendingVideo(pending); writePending(s.user.id, pending);
    }
    try {
      const result = await factoryRequest(s.access_token, action, { idempotencyKey: pending?.occurrence });
      if (token.current !== s.access_token) return;
      if (action === 'checkout' || action === 'portal' || action === 'connect_instagram') {
        const destination = factoryDestination(result, action);
        if (destination) { window.location.assign(destination); return; }
      }
      if (action === 'generate_video' && typeof result.jobId === 'string' && pending) {
        pending = { ...pending, jobId: result.jobId };
        videoRequest.current = pending; setPendingVideo(pending); writePending(s.user.id, pending);
      }
      setNotice(action === 'stop' ? 'Daily posting is off. No new automatic generation or publishing will start.' : action === 'autopost' ? 'Daily posting is on. Your next scheduled post is shown below.' : 'Request received. Progress appears below.');
      await load(s.access_token);
    } catch (e) { if (token.current === s.access_token) setError(errorMessage(e)); }
    finally { if (token.current === s.access_token) setBusy(null); }
  };

  const account = snapshot?.account;
  const jobs = snapshot?.jobs || [];
  const avatarJob = jobs.find(j => j.kind === 'avatar');
  const videos = jobs.filter(j => j.kind === 'video');
  const active = !!account && !account.cancel_at_period_end && !account.billing_paused && ((account.subscription_status === 'trialing' && Date.parse(account.trial_end || '') > Date.now()) || (account.subscription_status === 'active' && account.period_paid && Date.parse(account.period_end || '') > Date.now()));
  const generating = videos.some(j => !finished.has(j.status));
  const generationReady = snapshot?.readiness?.generation?.ready ?? snapshot?.ready === true;
  const socialReady = snapshot?.readiness?.social?.ready ?? snapshot?.ready === true;
  const checkoutReady = snapshot?.readiness?.checkout?.ready === true;
  const quota = factoryQuotaState(snapshot?.usage);
  const freeQuotaAvailable = quota.available;
  const freeQuotaSpent = quota.exhausted;
  const freeGenerationBlocked = !active && quota.known && quota.attemptsExhausted && !quota.exhausted;
  const completedFreeVideos = Number.isSafeInteger(snapshot?.usage?.completedVideos)
    ? snapshot?.usage?.completedVideos ?? 0
    : Math.max(0, 3 - (snapshot?.usage?.videosRemaining || 0));
  const hasAccess = active || freeQuotaAvailable;
  const avatarReady = account?.avatar_ready === true;
  const completedVideoReady = videos.some(j => j.status === 'completed' && !!j.video_url);
  const postableVideoReady = videos.some(j => j.free_video_postable === true);
  const freeVideosRemaining = !active && quota.known ? Math.min(3, Math.max(0, snapshot?.usage?.videosRemaining || 0)) : null;
  const hasBilling = !!account?.subscription_status && account.subscription_status !== 'none';
  const image = media(account?.avatar_image_url || avatarJob?.image_url);
  const actionReadiness = {
    generation: snapshot?.readiness?.generation || { ready: generationReady },
    social: snapshot?.readiness?.social || { ready: socialReady },
    checkout: snapshot?.readiness?.checkout || { ready: checkoutReady },
  };
  const avatarActionDisabled = !factoryActionReady('generate_avatar', actionReadiness) || !!busy || !!avatarJob || avatarReady;
  const videoActionDisabled = !factoryActionReady('generate_video', actionReadiness)
    || (!pendingVideo && (!avatarReady || !quota.known || !hasAccess))
    || !!busy || generating || (account?.auto_post && !pendingVideo);
  const connectActionDisabled = !factoryActionReady('connect_instagram', actionReadiness)
    || !!busy
    || (!account?.instagram_reauth_required && (!avatarReady || !completedVideoReady))
    || (!!account?.auto_post_intent && !account?.instagram_reauth_required);
  const autopostActionDisabled = !!busy || (freeGenerationBlocked && !postableVideoReady)
    || (!account?.auto_post && !factoryActionReady('autopost', actionReadiness));
  const requestAction = (action: FactoryAction) => {
    setActionNotice(null);
    return requestFactoryAction(action, actionReadiness, avatarReady, act, message => setActionNotice({ action, message }), {
      hasAccess, quotaKnown: quota.known, videosRemaining: snapshot?.usage?.videosRemaining,
      attemptsRemaining: snapshot?.usage?.attemptsRemaining, completedVideos: snapshot?.usage?.completedVideos,
      pendingVideo: !!pendingVideo, completedVideoReady, postableVideoReady,
    });
  };
  const actionStatus = (action: FactoryAction) => <FactoryActionNotice notice={actionNotice} action={action} />;

  return <main className="mf-shell">
    <nav className="mf-nav" aria-label="Main navigation">
      <a className="mf-wordmark" href="/ai-monk-factory"><span aria-hidden="true" className="mf-mark">m.</span> Monk Factory</a>
      <div className="mf-nav-links"><a href="/ai-monk-database">The database <span aria-hidden="true">↗</span></a>{session ? <button className="mf-text-button" disabled={!!busy} onClick={() => void logout()}>Sign out</button> : <button className="mf-text-button" disabled={!authReady || !!busy} onClick={() => void login()}>Sign in</button>}</div>
    </nav>

    <header className={`mf-hero ${session ? 'mf-hero-compact' : ''}`}>
      <div><p className="mf-eyebrow">Research. Create. Publish.</p><h1>Your monk.<br /><em>Your next Reel.</em></h1>
        <p className="mf-lead">An original AI monk, thoughtful scripts, and videos for your Instagram. One calm place to create and keep going.</p>
        {!session && <div className="mf-hero-action"><button className="mf-button" onClick={() => void login()} disabled={!authReady || !!busy}>{busy === 'login' ? 'Opening sign-in…' : 'Make 3 Reels free'} <span aria-hidden="true">↗</span></button><span>No card. No time-limited trial.</span></div>}
      </div>
      {!session && <aside className="mf-process" aria-label="How it works"><p className="mf-eyebrow">From an idea to a daily practice</p><ol><li><span>01</span><div><h2>Meet your monk</h2><p>We create one original, fictional avatar for you.</p></div></li><li><span>02</span><div><h2>Make something useful</h2><p>Research-led scripts become narrated Reels.</p></div></li><li><span>03</span><div><h2>Let it flow</h2><p>Connect Instagram once. Daily creation and posting start automatically; stop any time.</p></div></li></ol><a href="/ai-monk-database">Explore the research behind it <span aria-hidden="true">↗</span></a></aside>}
    </header>

    <div className="mf-announcements" aria-live="polite">{error && <p className="mf-error" role="alert">{error}</p>}{notice && <p className="mf-notice">{notice}</p>}</div>

    {session && <section className="mf-studio" aria-label="Your studio">
      <div className="mf-section-heading"><div><p className="mf-eyebrow">Your studio</p><h2>A little more presence.</h2></div><div className="mf-studio-actions">{(!snapshot || account?.auto_post || account?.auto_post_intent) && <button className="mf-text-button" disabled={!!busy} onClick={() => void act('stop')}>Stop daily creation and posting</button>}<button className="mf-text-button" disabled={loading || !!busy} onClick={() => { setError(''); setLoading(true); void load(session.access_token).catch(e => setError(errorMessage(e))).finally(() => setLoading(false)); }}>{loading ? 'Checking…' : 'Refresh status ↻'}</button></div></div>
      {snapshot && !generationReady && <p className="mf-notice">{unavailable(snapshot.readiness?.generation)} Existing content and the Stop control remain available.</p>}
      {snapshot && !socialReady && !account?.connected && <p className="mf-notice">{unavailable(snapshot.readiness?.social)}</p>}
      {!snapshot ? <p className="mf-loading">{loading ? 'Opening your studio…' : 'Refresh to load your studio.'}</p> : <>
        <div className="mf-workspace">
          <div className="mf-avatar">
            {image ? <img src={image} alt="Your fictional AI-generated monk avatar" referrerPolicy="no-referrer" /> : <div className="mf-empty-portrait"><span className="mf-portrait-orbit" aria-hidden="true" /><span className="mf-eyebrow">A fresh beginning</span><p>Your monk<br />starts here.</p><span>No avatar generated yet</span></div>}
            <span className="mf-media-label">Fictional · AI-generated</span>
          </div>
          <div className="mf-steps">
            <div className="mf-step"><span className="mf-step-number">01</span><div><h3>Generate your monk avatar</h3><p>Create one original, fictional monk to appear in every video.</p><button className="mf-button mf-button-small" disabled={avatarActionDisabled} onClick={() => requestAction('generate_avatar')}>{avatarReady ? 'Avatar ready' : avatarJob ? stage(avatarJob) : busy === 'generate_avatar' ? 'Requesting…' : 'Generate Monk Avatar'}</button>{actionStatus('generate_avatar')}</div></div>
            <div className="mf-step"><span className="mf-step-number">02</span><div><h3>Generate the full video</h3><p>Complete script, HeyGen voice, and vertical Reel. Three completed videos are free; each script and caption invites viewers to The Art of AI Monks, our sourced English ebook. No prompt setup.</p><button className="mf-button mf-button-small" disabled={videoActionDisabled} onClick={() => requestAction('generate_video')}>{busy === 'generate_video' ? 'Requesting…' : generating ? 'Video in progress…' : account?.auto_post ? 'Daily generation is on' : pendingVideo ? 'Check my generation request' : !avatarReady ? 'Generate your monk first' : !quota.known ? 'Check free allowance' : freeGenerationBlocked ? 'Free generation paused' : !hasAccess ? 'Choose a plan to continue' : freeVideosRemaining === null ? 'Generate The Full Video' : `Generate The Full Video · ${freeVideosRemaining} free`}</button>{actionStatus('generate_video')}{!avatarReady && <p className="mf-fine">Generate your monk first, then make a full video.</p>}</div></div>
            <div className="mf-step"><span className="mf-step-number">03</span><div><h3>Connect your IG to auto post</h3><p>{account?.instagram_reauth_required ? 'Instagram needs to be reconnected.' : account?.connected ? `Connected${account.instagram_username ? ` · @${account.instagram_username.replace(/^@/, '')}` : ''}` : 'Use an Instagram Business or Creator account.'}</p>
              {!account?.connected && <><p className="mf-fine">{account?.instagram_reauth_required ? 'Reconnect Instagram to resume posting. Your saved videos remain available.' : 'Generate your monk and at least one full video first. Connect once: finished videos post first, then new videos are generated daily while free videos remain or a subscription is active. Captions link to The Art of AI Monks, our sourced English ebook. Stop any time.'}</p><button className="mf-button mf-button-small mf-button-outline" disabled={connectActionDisabled} onClick={() => requestAction('connect_instagram')}>{account?.instagram_reauth_required ? 'Reconnect Instagram ↗' : account?.auto_post_intent ? 'Waiting for Instagram authorization…' : !avatarReady ? 'Generate your monk first' : !completedVideoReady ? 'Generate your first full video' : 'Connect your IG to auto post ↗'}</button>{actionStatus('connect_instagram')}</>}
              {account?.connected && <><button className={`mf-button mf-button-small ${account.auto_post ? 'mf-button-outline' : ''}`} disabled={autopostActionDisabled} onClick={() => requestAction(account.auto_post ? 'stop' : 'autopost')}>{account.auto_post ? 'Stop daily auto posting' : freeGenerationBlocked && !postableVideoReady ? 'Free generation paused' : !socialReady ? 'Check Instagram setup' : !hasAccess && !postableVideoReady ? 'Choose a plan to continue' : 'Start daily auto posting'}</button>{actionStatus('autopost')}</>}
              {account?.auto_post && !account.connected && <button className="mf-button mf-button-small mf-button-outline" disabled={!!busy} onClick={() => void act('stop')}>Turn daily posting off</button>}
              <p className="mf-fine">{account?.instagram_reauth_required ? 'Daily posting is waiting for Instagram reconnection.' : account?.auto_post ? `${hasAccess ? 'Daily creation and posting are on. Finished videos post first.' : 'Daily posting is on for finished videos. New generation waits for a subscription.'} Next scheduled: ${date(account.next_post_at)}.` : account?.auto_post_intent ? 'Instagram is connected. Finished videos post first; new daily generation waits for free allowance or an active subscription.' : account?.connected ? 'Instagram is connected. Daily posting is off until you start it.' : 'Connect once to start daily creation and posting.'} Connection checked: {date(account?.social_checked_at)}.</p>
            </div></div>
          </div>
        </div>
        <div className="mf-usage" aria-label="Your current allowance"><div><span>Videos remaining</span><strong>{number(snapshot.usage?.videosRemaining)}</strong></div><div><span>Attempts remaining</span><strong>{number(snapshot.usage?.attemptsRemaining)}</strong></div><div><span>Video length</span><strong>{snapshot.usage?.maxSeconds ? `Up to ${snapshot.usage.maxSeconds}s` : '—'}</strong></div><div><span>Current period ends</span><strong className="mf-date">{date(snapshot.usage?.periodEnd)}</strong></div></div>
        {snapshot.usage?.asOf && <p className="mf-fine mf-usage-date">Allowance checked {date(snapshot.usage.asOf)}. Failed generations use one of {snapshot.usage.maxAttempts ?? 'a limited number of'} attempts, but do not reduce the number of completed free videos.</p>}
        <section className="mf-library" aria-label="Your videos"><div className="mf-section-heading"><div><p className="mf-eyebrow">Your library</p><h2>Made to be shared.</h2></div><span className="mf-fine">Actual videos. Actual post results.</span></div>
          {videos.length === 0 ? <div className="mf-library-empty"><span aria-hidden="true">↗</span><h3>Your first Reel belongs here.</h3><p>Create your avatar, then generate a video. Preview it here before turning on daily posting.</p></div> : <div className="mf-video-grid">{videos.map(job => <article className="mf-video-card" key={job.id}><div className="mf-video-frame">{media(job.video_url) ? <video controls playsInline preload="metadata" src={media(job.video_url)} aria-label="Your AI-generated monk video" /> : <div className="mf-render-placeholder"><span className="mf-eyebrow">{job.status === 'failed' ? 'Generation stopped' : 'In the making'}</span><p>{stage(job)}</p></div>}</div><div className="mf-video-info"><p className="mf-video-status">{stage(job)}</p><time dateTime={job.created_at}>{date(job.created_at)}</time>{media(job.post_url) && <a href={media(job.post_url)} target="_blank" rel="noreferrer">View Instagram post ↗</a>}{job.post_url && <><dl className="mf-metrics"><div><dt>Views</dt><dd>{number(job.metrics?.views)}</dd></div><div><dt>Likes</dt><dd>{number(job.metrics?.likes)}</dd></div><div><dt>Comments</dt><dd>{number(job.metrics?.comments)}</dd></div></dl><p className="mf-fine">Metrics checked {date(job.metrics_at || job.metrics?.asOf || job.metrics?.fetchedAt || job.metrics?.fetched_at)}. A dash means unavailable.</p></>}<VideoCopy job={job} /></div></article>)}</div>}
        </section>
      </>}
    </section>}

    <section className="mf-plan" aria-labelledby="mf-plan-title"><div><p className="mf-eyebrow">One monk. A daily practice.</p><h2 id="mf-plan-title">Less setup.<br /><em>More creating.</em></h2><p>One original avatar. Research-led scripts that point viewers to The Art of AI Monks, our sourced English ebook. Instagram publishing and post results, together.</p><a href="/ai-monk-database">Start with the free database ↗</a></div><div className="mf-plan-details"><div className="mf-price"><strong>$199</strong><span>USD / month</span></div><p className="mf-trial">Three completed videos, up to 20 seconds each. No card, no time limit, and no three-day trial. Failed generations use one of up to six safety attempts but do not consume a completed video.</p><ul><li>Then up to 30 completed videos per month, 45 seconds each</li><li>Up to 36 generation attempts per paid period</li><li>One original avatar · Instagram connection · daily posting</li><li>Preview your videos and see available post metrics</li></ul>
      {account?.cancel_at_period_end ? <p className="mf-notice">Cancellation is scheduled. New generation and daily posting are stopped.</p> : account?.subscription_status === 'trialing' ? <p className="mf-notice">Your existing trial ends {date(account.trial_end)}. Then $199 USD/month unless you cancel before it ends.</p> : account?.subscription_status === 'active' ? <p className="mf-notice">{account.billing_paused ? 'Billing is paused.' : `Current paid period ends ${date(account.period_end)}.`}</p> : session && !quota.known ? <p className="mf-notice">Your free-video allowance could not be confirmed. Refresh status to check it; payment will not start until the allowance is confirmed.</p> : session && freeGenerationBlocked ? <p className="mf-notice">The safety limit was reached after {completedFreeVideos} of 3 completed free videos. No payment will start. <a href="mailto:keiodaisuke@gmail.com">Contact support</a> to finish the free offer.</p> : session && freeQuotaAvailable ? <p className="mf-notice">Your free videos are ready. No payment is needed until all three are complete.</p> : <button className="mf-button mf-button-wide" disabled={!authReady || !!busy} onClick={() => session ? requestAction('checkout') : void login()}>{busy === 'checkout' ? 'Opening Stripe…' : session ? checkoutReady ? 'Continue with Stripe ↗' : 'Check checkout setup' : 'Get 3 free videos ↗'}</button>}
      {actionStatus('checkout')}
      {session && freeQuotaSpent && !active && !checkoutReady && <p className="mf-fine">{unavailable(snapshot?.readiness?.checkout)}</p>}
      {session && hasBilling && <button className="mf-text-button mf-manage" disabled={!!busy} onClick={() => void act('portal')}>{busy === 'portal' ? 'Opening billing…' : 'Manage or cancel subscription ↗'}</button>}
      <p className="mf-fine">No card is required for the first 3 completed videos. We allow up to 6 generation attempts to make them. If the safety limit is reached early, we do not start a charge and will help complete the free offer. After all 3 videos, the $199 USD/month plan renews until canceled. No earnings or audience growth are guaranteed.</p><p className="mf-fine">For creators aged 18 and over. By starting, you confirm you are at least 18 and agree to the <a href="/ai-monk-factory/terms">Factory terms</a> and <a href="/ai-monk-factory/privacy">privacy notice</a>.</p>
    </div></section>

    <footer className="mf-footer"><a className="mf-wordmark" href="/ai-monk-factory">Monk Factory</a><p>A fictional voice. Something useful to say.</p><div><a href="/ai-monk-factory/terms">Terms</a><a href="/ai-monk-factory/privacy">Privacy</a><a href="mailto:keiodaisuke@gmail.com">Support ↗</a></div></footer>
  </main>;
}
