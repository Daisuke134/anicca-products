'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSession, onAuthChange, signInWithGoogle, signOut } from '@/lib/auth';
import { factoryDestination, factoryRequest, type FactoryAction } from '@/lib/monk-factory-client.mjs';

type Account = {
  subscription_status?: string; trial_end?: string; period_end?: string; period_paid?: boolean;
  cancel_at_period_end?: boolean; billing_paused?: boolean; auto_post?: boolean; auto_post_intent?: boolean;
  instagram_username?: string; connected?: boolean; connected_at?: string; social_checked_at?: string;
  avatar_ready?: boolean; avatar_image_url?: string; next_post_at?: string;
};
type Job = {
  id: string; kind: string; status: string; stage: string; created_at: string;
  image_url?: string; video_url?: string; post_url?: string;
  metrics?: { views?: number | null; likes?: number | null; comments?: number | null; asOf?: string; fetchedAt?: string; fetched_at?: string };
  metrics_at?: string;
};
type Capability = { ready: boolean; reason?: string | null };
type Snapshot = { ready: boolean; readiness?: { generation?: Capability; checkout?: Capability; social?: Capability }; account: Account | null; jobs: Job[]; usage?: { videosRemaining: number | null; attemptsRemaining: number | null; maxSeconds: number | null; periodEnd: string | null; asOf: string } };
type PendingVideo = { occurrence: string; jobId?: string };
const finished = new Set(['completed', 'failed', 'cancelled']);
const date = (value?: string | null) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const number = (value?: number | null) => typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString() : '—';
const media = (value?: string) => { try { const u = new URL(value || ''); return u.protocol === 'https:' && !u.username && !u.password ? u.href : undefined; } catch { return undefined; } };
const messages: Record<string, string> = {
  sign_in_required: 'Please sign in again to continue.', auth_unavailable: 'Sign-in is temporarily unavailable. Please try again.',
  connection_interrupted: 'The connection was interrupted. Your request may still be processing. Check the same request before starting another.',
  quota_exhausted: 'You have used the available video attempts. Choose a plan to continue.', budget_exhausted: 'Generation is paused for this period. Your existing videos remain available.',
  company_budget_exhausted: 'Today’s Factory generation budget is used. It resets at 00:00 UTC; your free videos remain available.',
  spend_cap_setup: 'The daily generation budget guard is not configured yet. Generation stays paused to protect the studio budget.',
  profile_capacity: 'All creator spaces are currently taken. Please check back before starting a subscription.',
  subscription_required: 'Your three free videos are used. Choose a plan to continue.',
  free_quota_remaining: 'Use your three free videos before starting a subscription.',
  avatar_required: 'Create your avatar first.', avatar_exists: 'Your avatar request already exists. Its status is shown below.',
  instagram_required: 'Connect an Instagram Business or Creator account first.', social_not_connected: 'Reconnect Instagram before daily posting can resume.',
  billing_sync_conflict: 'Your billing status is updating. Please check again in a moment.',
  checkout_reconciliation_required: 'We are checking your previous checkout. Please refresh before trying again.',
  generation_unavailable: 'Video generation is not configured yet. Your account and free allowance are safe; please check again later.',
  social_unavailable: 'Instagram connection is not configured yet. Please check again later.',
  checkout_unavailable: 'Checkout is not configured yet. Please check again later.',
  factory_unavailable: 'The studio is temporarily unavailable. No new checkout or generation can start. Please check again later.',
};
const unavailable = (capability?: Capability) => ({
  studio_setup: 'The studio is not enabled yet.', runtime_setup: 'The generation worker is not configured yet.',
  provider_setup: 'The generation services are not ready yet.', social_setup: 'Instagram publishing is not configured yet.',
  spend_cap_setup: 'The daily generation budget guard is not ready yet.',
  company_budget_exhausted: 'The daily generation budget has been reached. It resets at 00:00 UTC.',
  billing_setup: 'Secure checkout is not configured yet.',
}[capability?.reason || ''] || 'This service is temporarily unavailable.');
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
        setSnapshot(null); setError(''); setNotice(''); setBusy(null);
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
  const freeQuotaAvailable = Number(snapshot?.usage?.videosRemaining) > 0 && Number(snapshot?.usage?.attemptsRemaining) > 0;
  const freeQuotaSpent = !freeQuotaAvailable;
  const hasAccess = active || freeQuotaAvailable;
  const avatarReady = account?.avatar_ready === true;
  const hasBilling = !!account?.subscription_status && account.subscription_status !== 'none';
  const image = media(account?.avatar_image_url || avatarJob?.image_url);

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
            <div className="mf-step"><span className="mf-step-number">01</span><div><h3>Your original avatar</h3><p>Connect Instagram and we create your monk automatically. You can also create it now.</p><button className="mf-button mf-button-small" disabled={!!busy || !generationReady || !hasAccess || !!avatarJob || avatarReady} onClick={() => void act('generate_avatar')}>{avatarReady ? 'Avatar ready ✓' : avatarJob ? stage(avatarJob) : busy === 'generate_avatar' ? 'Requesting…' : 'Generate my monk'}</button></div></div>
            <div className="mf-step"><span className="mf-step-number">02</span><div><h3>Something worth sharing</h3><p>Original script, voice, and vertical video. No prompt setup.</p><button className="mf-button mf-button-small" disabled={!!busy || !generationReady || !avatarReady || generating || (!pendingVideo && !hasAccess) || (account?.auto_post && !pendingVideo)} onClick={() => void act('generate_video')}>{busy === 'generate_video' ? 'Requesting…' : generating ? 'Video in progress…' : account?.auto_post ? 'Daily generation is on' : pendingVideo ? 'Check my generation request' : 'Generate a Reel'}</button></div></div>
            <div className="mf-step"><span className="mf-step-number">03</span><div><h3>Your Instagram, on a rhythm</h3><p>{account?.connected ? `Connected${account.instagram_username ? ` · @${account.instagram_username.replace(/^@/, '')}` : ''}` : 'Use an Instagram Business or Creator account.'}</p>
              {!account?.connected && <><p className="mf-fine">Connecting starts daily avatar/video creation and automatic publishing to this account. You can stop at any time. If this account is linked to another Upload-Post workspace, reconnecting may move it here.</p><button className="mf-button mf-button-small mf-button-outline" disabled={!!busy || !socialReady || !hasAccess || account?.auto_post_intent} onClick={() => void act('connect_instagram')}>{account?.auto_post_intent ? 'Waiting for Instagram authorization…' : 'Connect Instagram ↗'}</button></>}
              {account?.connected && <button className={`mf-button mf-button-small ${account.auto_post ? 'mf-button-outline' : ''}`} disabled={!!busy || (!account.auto_post && (!socialReady || !generationReady || !hasAccess))} onClick={() => void act(account.auto_post ? 'stop' : 'autopost')}>{account.auto_post ? 'Stop daily creation and posting' : 'Resume daily creation and posting'}</button>}
              {account?.auto_post && !account.connected && <button className="mf-button mf-button-small mf-button-outline" disabled={!!busy} onClick={() => void act('stop')}>Turn daily posting off</button>}
              <p className="mf-fine">{account?.auto_post ? `Daily creation and posting are on. Next scheduled: ${date(account.next_post_at)}.` : account?.auto_post_intent ? 'Daily creation and posting will start after Instagram confirms the connection. You can stop now.' : account?.connected ? 'Daily creation and posting are off. Resume them whenever you are ready.' : 'Connect once to start daily creation and posting.'} Connection checked: {date(account?.social_checked_at)}.</p>
            </div></div>
          </div>
        </div>
        <div className="mf-usage" aria-label="Your current allowance"><div><span>Videos remaining</span><strong>{number(snapshot.usage?.videosRemaining)}</strong></div><div><span>Attempts remaining</span><strong>{number(snapshot.usage?.attemptsRemaining)}</strong></div><div><span>Video length</span><strong>{snapshot.usage?.maxSeconds ? `Up to ${snapshot.usage.maxSeconds}s` : '—'}</strong></div><div><span>Current period ends</span><strong className="mf-date">{date(snapshot.usage?.periodEnd)}</strong></div></div>
        {snapshot.usage?.asOf && <p className="mf-fine mf-usage-date">Allowance checked {date(snapshot.usage.asOf)}. Failed or unconfirmed attempts can still use your allowance.</p>}
        <section className="mf-library" aria-label="Your videos"><div className="mf-section-heading"><div><p className="mf-eyebrow">Your library</p><h2>Made to be shared.</h2></div><span className="mf-fine">Actual videos. Actual post results.</span></div>
          {videos.length === 0 ? <div className="mf-library-empty"><span aria-hidden="true">↗</span><h3>Your first Reel belongs here.</h3><p>Create your avatar, then generate a video. Preview it here before turning on daily posting.</p></div> : <div className="mf-video-grid">{videos.map(job => <article className="mf-video-card" key={job.id}><div className="mf-video-frame">{media(job.video_url) ? <video controls playsInline preload="metadata" src={media(job.video_url)} aria-label="Your AI-generated monk video" /> : <div className="mf-render-placeholder"><span className="mf-eyebrow">{job.status === 'failed' ? 'Generation stopped' : 'In the making'}</span><p>{stage(job)}</p></div>}</div><div className="mf-video-info"><p className="mf-video-status">{stage(job)}</p><time dateTime={job.created_at}>{date(job.created_at)}</time>{media(job.post_url) && <a href={media(job.post_url)} target="_blank" rel="noreferrer">View Instagram post ↗</a>}{job.post_url && <><dl className="mf-metrics"><div><dt>Views</dt><dd>{number(job.metrics?.views)}</dd></div><div><dt>Likes</dt><dd>{number(job.metrics?.likes)}</dd></div><div><dt>Comments</dt><dd>{number(job.metrics?.comments)}</dd></div></dl><p className="mf-fine">Metrics checked {date(job.metrics_at || job.metrics?.asOf || job.metrics?.fetchedAt || job.metrics?.fetched_at)}. A dash means unavailable.</p></>}</div></article>)}</div>}
        </section>
      </>}
    </section>}

    <section className="mf-plan" aria-labelledby="mf-plan-title"><div><p className="mf-eyebrow">One monk. A daily practice.</p><h2 id="mf-plan-title">Less setup.<br /><em>More creating.</em></h2><p>One original avatar. Research-led scripts. Instagram publishing and post results, together.</p><a href="/ai-monk-database">Start with the free database ↗</a></div><div className="mf-plan-details"><div className="mf-price"><strong>$199</strong><span>USD / month</span></div><p className="mf-trial">Up to 3 free videos, 20 seconds each. No card and no time limit.</p><ul><li>Then up to 30 completed videos per month, 45 seconds each</li><li>Up to 36 generation attempts per paid period</li><li>One original avatar · Instagram connection · daily posting</li><li>Preview your videos and see available post metrics</li></ul>
      {account?.cancel_at_period_end ? <p className="mf-notice">Cancellation is scheduled. New generation and daily posting are stopped.</p> : account?.subscription_status === 'trialing' ? <p className="mf-notice">Your existing trial ends {date(account.trial_end)}. Then $199 USD/month unless you cancel before it ends.</p> : account?.subscription_status === 'active' ? <p className="mf-notice">{account.billing_paused ? 'Billing is paused.' : `Current paid period ends ${date(account.period_end)}.`}</p> : session && freeQuotaAvailable ? <p className="mf-notice">Your free videos are ready. No payment is needed until you use them.</p> : <button className="mf-button mf-button-wide" disabled={!authReady || !!busy || (!!session && !checkoutReady)} onClick={() => session ? void act('checkout') : void login()}>{busy === 'checkout' ? 'Opening Stripe…' : session ? 'Continue with Stripe ↗' : 'Get 3 free videos ↗'}</button>}
      {session && freeQuotaSpent && !active && !checkoutReady && <p className="mf-fine">{unavailable(snapshot?.readiness?.checkout)}</p>}
      {session && hasBilling && <button className="mf-text-button mf-manage" disabled={!!busy} onClick={() => void act('portal')}>{busy === 'portal' ? 'Opening billing…' : 'Manage or cancel subscription ↗'}</button>}
      <p className="mf-fine">No card is required for the first 3 videos. After that, the plan is $199 USD/month and renews automatically until canceled. Failed or unconfirmed attempts may use an attempt. No earnings or audience growth are guaranteed.</p><p className="mf-fine">For creators aged 18 and over. By starting, you confirm you are at least 18 and agree to the <a href="/ai-monk-factory/terms">Factory terms</a> and <a href="/ai-monk-factory/privacy">privacy notice</a>.</p>
    </div></section>

    <footer className="mf-footer"><a className="mf-wordmark" href="/ai-monk-factory">Monk Factory</a><p>A fictional voice. Something useful to say.</p><div><a href="/ai-monk-factory/terms">Terms</a><a href="/ai-monk-factory/privacy">Privacy</a><a href="mailto:keiodaisuke@gmail.com">Support ↗</a></div></footer>
  </main>;
}
