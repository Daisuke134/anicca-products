const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync, execFile } = require('node:child_process');
const { promisify } = require('node:util');

// Only a newly initialized local fixture is accepted; never infer a production PGHOST.
const socket = process.env.MONK_FACTORY_TEST_SOCKET;
const options = { skip: !socket };
const uid = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
function args() {
  assert.ok(socket?.startsWith('/tmp/monk-factory-pg-'));
  assert.ok(fs.existsSync(path.join(socket, '.monk-factory-fixture')));
  return ['-X', '-q', '-v', 'ON_ERROR_STOP=1', '-A', '-t', '-h', socket, '-p', '5432', '-U', os.userInfo().username, '-d', 'postgres'];
}
function sql(text) { return execFileSync('psql', [...args(), '-c', text], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
function reserve(userId, occurrence, kind = 'video') {
  return 'SET ROLE service_role; SELECT monk_factory_reserve_job(\'' + userId + '\',\'' + occurrence + '\',\'' + kind + '\')';
}
function account(n, status = 'trialing') {
  sql('SET ROLE service_role; SELECT monk_factory_reserve_profile(\'' + uid(n) + '\')');
  sql('UPDATE monk_factory_accounts SET stripe_subscription_id=\'sub_fixture' + n + '\', subscription_status=\'' + status + '\', trial_start=now()-interval \'1 hour\',trial_end=now()+interval \'3 days\',period_start=now()-interval \'1 hour\',period_end=now()+interval \'30 days\',period_paid=true WHERE user_id=\'' + uid(n) + '\'');
}

before(() => {
  if (!socket) return;
  assert.ok(fs.existsSync(path.resolve(__dirname, '../ai-monk-index/index.mjs')), 'Build the canonical research input first: node packages/ai-monk-index/scripts/build.mjs --netlify');
  sql('CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting(\'request.jwt.claim.sub\',true),\'\')::uuid $$; GRANT USAGE ON SCHEMA auth TO authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated; INSERT INTO auth.users SELECT (\'00000000-0000-4000-8000-\'||lpad(n::text,12,\'0\'))::uuid FROM generate_series(1,30) n;');
  const dir = path.resolve(__dirname, '../../../../supabase/migrations');
  const migrations = fs.readdirSync(dir).filter(x => /_monk_factory(?:_(?:jobs|capacity))?\.sql$/.test(x)).sort();
  for (const migration of migrations) execFileSync('psql', [...args(), '-f', path.join(dir, migration)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
});

test('trial reservation is idempotent, bounded by three attempts, and keeps unknown effects reserved', options, () => {
  account(1);
  const avatar = JSON.parse(sql(reserve(uid(1), 'avatar', 'avatar')));
  assert.equal(avatar.kind, 'avatar');
  const first = JSON.parse(sql(reserve(uid(1), 'video-1')));
  assert.equal(first.id, JSON.parse(sql(reserve(uid(1), 'video-1'))).id);
  sql('UPDATE monk_factory_jobs SET status=\'effect_unknown\' WHERE id=\'' + first.id + '\'');
  sql(reserve(uid(1), 'video-2'));
  sql(reserve(uid(1), 'video-3'));
  assert.throws(() => sql(reserve(uid(1), 'video-4')), /quota_exhausted/);
  assert.equal(sql('SELECT count(*) FROM monk_factory_jobs WHERE user_id=\'' + uid(1) + '\''), '4');
  assert.equal(sql('SELECT sum(reserved_micro_usd) FROM monk_factory_jobs WHERE user_id=\'' + uid(1) + '\''), '4180000');
});

test('concurrent paid requests cannot reserve more than thirty successful-or-pending videos', options, async () => {
  account(2, 'active');
  const run = promisify(execFile);
  const results = await Promise.allSettled(Array.from({ length: 36 }, (_, n) => run('psql', [...args(), '-c', reserve(uid(2), 'parallel-' + n)], { encoding: 'utf8' })));
  const ok = results.filter(x => x.status === 'fulfilled');
  const rejected = results.filter(x => x.status === 'rejected');
  assert.equal(ok.length, 30);
  assert.equal(rejected.length, 6);
  assert.ok(rejected.every(x => /quota_exhausted/.test(x.reason.stderr)));
  assert.equal(new Set(ok.map(x => JSON.parse(x.value.stdout.trim()).id)).size, 30);
  assert.equal(sql('SELECT count(*) FROM monk_factory_jobs WHERE user_id=\'' + uid(2) + '\''), '30');
});

test('row security hides other users and prevents clients changing billing or invoking service RPCs', options, () => {
  const own = sql('BEGIN; SET LOCAL ROLE authenticated; SET LOCAL "request.jwt.claim.sub"=\'' + uid(1) + '\'; SELECT count(*) FROM monk_factory_accounts; ROLLBACK;');
  assert.equal(own, '1');
  assert.equal(sql('BEGIN; SET LOCAL ROLE authenticated; SET LOCAL "request.jwt.claim.sub"=\'' + uid(3) + '\'; SELECT count(*) FROM monk_factory_jobs; ROLLBACK;'), '0');
  assert.throws(() => sql('SET ROLE authenticated; UPDATE monk_factory_accounts SET subscription_status=\'active\''), /permission denied/);
  assert.throws(() => sql('SET ROLE anon; SELECT monk_factory_reserve_profile(\'' + uid(3) + '\')'), /permission denied/);
  assert.throws(() => sql('SET ROLE authenticated; SELECT monk_factory_reserve_job(\'' + uid(1) + '\',\'forged\',\'video\')'), /permission denied/);
});

test('profile capacity includes trial and retained profiles before another checkout can start', options, () => {
  for (let n = 3; n <= 25; n++) sql('SET ROLE service_role; SELECT monk_factory_reserve_profile(\'' + uid(n) + '\')');
  assert.equal(sql('SELECT count(*) FROM monk_factory_accounts WHERE profile_reserved_at IS NOT NULL'), '25');
  assert.throws(() => sql('SET ROLE service_role; SELECT monk_factory_reserve_profile(\'' + uid(26) + '\')'), /profile_capacity/);
  assert.equal(JSON.parse(sql('SET ROLE service_role; SELECT monk_factory_reserve_profile(\'' + uid(1) + '\')')).user_id, uid(1));
});

test('trial and paid periods are separate, but failed paid renders still consume the thirty-six-attempt limit', options, () => {
  account(3);
  for (let n = 0; n < 3; n++) sql(reserve(uid(3), 'trial-' + n));
  account(3, 'active');
  for (let n = 0; n < 6; n++) {
    const failed = JSON.parse(sql(reserve(uid(3), 'failed-' + n)));
    sql('UPDATE monk_factory_jobs SET status=\'failed\' WHERE id=\'' + failed.id + '\'');
  }
  for (let n = 0; n < 30; n++) {
    assert.equal(JSON.parse(sql(reserve(uid(3), 'paid-' + n))).max_seconds, 45);
  }
  assert.throws(() => sql(reserve(uid(3), 'paid-overflow')), /quota_exhausted/);
});

test('budget and incomplete or expired subscription boundaries stop another reservation', options, () => {
  account(4);
  const first = JSON.parse(sql(reserve(uid(4), 'budget-first')));
  sql('UPDATE monk_factory_jobs SET reserved_micro_usd=4250000 WHERE id=\'' + first.id + '\'');
  assert.throws(() => sql(reserve(uid(4), 'over-budget')), /budget_exhausted/);
  sql('UPDATE monk_factory_accounts SET trial_end=NULL WHERE user_id=\'' + uid(4) + '\'');
  assert.throws(() => sql(reserve(uid(4), 'missing-boundary')), /subscription_required/);
  sql('UPDATE monk_factory_accounts SET trial_end=now()-interval \'1 second\' WHERE user_id=\'' + uid(4) + '\'');
  assert.throws(() => sql(reserve(uid(4), 'expired')), /subscription_required/);
  account(4, 'active');
  sql('UPDATE monk_factory_accounts SET cancel_at_period_end=true WHERE user_id=\'' + uid(4) + '\'');
  assert.throws(() => sql(reserve(uid(4), 'cancellation-scheduled')), /subscription_required/);
});

test('parallel checkout requests retain one immutable context and stale billing responses cannot overwrite a newer lease', options, async () => {
  const run = promisify(execFile);
  const checkout = 'SET ROLE service_role; SELECT monk_factory_checkout_context(\'' + uid(5) + '\',\'price_fixture\',\'fixture@example.com\')';
  const requests = await Promise.all(Array.from({ length: 8 }, () => run('psql', [...args(), '-c', checkout], { encoding: 'utf8' })));
  const contexts = requests.map(x => JSON.parse(x.stdout.trim()));
  assert.equal(new Set(contexts.map(x => x.checkout_nonce)).size, 1);
  assert.equal(contexts[0].checkout_trial, true);
  const claim = () => JSON.parse(sql('SET ROLE service_role; SELECT coalesce(monk_factory_claim_billing(\'' + uid(5) + '\'),\'null\'::jsonb)'));
  const first = claim();
  assert.equal(claim(), null);
  sql('UPDATE monk_factory_accounts SET billing_sync_until=now()-interval \'1 second\' WHERE user_id=\'' + uid(5) + '\'');
  const next = claim();
  assert.notEqual(next.billing_sync_nonce, first.billing_sync_nonce);
  const state = { stripe_subscription_id: 'sub_fixture5', stripe_customer_id: 'cus_fixture5', subscription_status: 'trialing', trial_used: true,
    trial_start: new Date(Date.now()-1000).toISOString(), trial_end: new Date(Date.now()+86400000).toISOString(),
    period_start: new Date().toISOString(), period_end: new Date(Date.now()+86400000).toISOString(), period_paid: false,
    cancel_at_period_end: false, billing_paused: false };
  const apply = (lease, value) => 'SET ROLE service_role; SELECT monk_factory_apply_billing(\'' + uid(5) + '\',\'' + lease + '\',\'' + JSON.stringify(value) + '\'::jsonb)';
  assert.throws(() => sql(apply(first.billing_sync_nonce, state)), /billing_sync_conflict/);
  assert.equal(JSON.parse(sql(apply(next.billing_sync_nonce, state))).trial_used, true);
  const later = claim();
  assert.equal(JSON.parse(sql(apply(later.billing_sync_nonce, { ...state, trial_used: false }))).trial_used, true);
  assert.throws(() => sql('SET ROLE authenticated; SELECT monk_factory_claim_billing(\'' + uid(5) + '\')'), /permission denied/);
});

test('duplicate Stripe receipts are persisted once and clients cannot inspect their queue', options, () => {
  const insert = "SET ROLE service_role; INSERT INTO monk_factory_stripe_events(id,event_type,stripe_object_id,stripe_subscription_id) VALUES ('evt_fixture','invoice.paid','in_fixture','sub_fixture') ON CONFLICT (id) DO NOTHING;";
  sql(insert); sql(insert);
  assert.equal(sql('SELECT count(*) FROM monk_factory_stripe_events'), '1');
  sql("SET ROLE service_role; INSERT INTO monk_factory_stripe_events(id,event_type,stripe_object_id,stripe_subscription_id) VALUES ('evt_expired','checkout.session.expired','cs_expired',NULL)");
  assert.throws(() => sql('SET ROLE authenticated; SELECT * FROM monk_factory_stripe_events'), /permission denied/);
});

test('parallel workers claim one lease and a stale worker cannot cross the submit fence', options, async () => {
  account(6);
  const job = JSON.parse(sql(reserve(uid(6), 'lease-fixture')));
  const run = promisify(execFile);
  const claim = 'SET ROLE service_role; SELECT monk_factory_claim_job(\'' + job.id + '\',false)';
  const replies = await Promise.all(Array.from({ length: 8 }, () => run('psql', [...args(), '-c', claim], { encoding: 'utf8' })));
  const rows = replies.map(x => JSON.parse(x.stdout.trim() || 'null')).filter(Boolean);
  assert.equal(rows.length, 1);
  const first = rows[0];
  const advance = (lease, stage, patch) => 'SET ROLE service_role; SELECT monk_factory_advance_job(\'' + job.id + '\',\'' + lease + '\',\'' + stage + '\',\'' + JSON.stringify(patch) + '\'::jsonb,true)';
  const fenced = JSON.parse(sql(advance(first.lease_id, 'reserved', { stage: 'script_submitting', status: 'effect_unknown' })));
  assert.equal(fenced.status, 'effect_unknown');
  sql('UPDATE monk_factory_jobs SET lease_until=now()-interval \'1 second\',next_run_at=now() WHERE id=\'' + job.id + '\'');
  const next = JSON.parse(sql(claim));
  assert.notEqual(next.lease_id, first.lease_id);
  assert.equal(next.stage, 'script_submitting');
  assert.equal(sql(advance(first.lease_id, 'script_submitting', { stage: 'script_ready', status: 'processing', script_receipt_id: 'old' })), '');
  assert.throws(() => sql(advance(next.lease_id, 'script_submitting', { stage: 'reserved', status: 'reserved' })), /invalid_job_transition/);
  assert.throws(() => sql('SET ROLE authenticated; SELECT monk_factory_claim_job(\'' + job.id + '\',false)'), /permission denied/);
});

test('daily ON consumes an existing preview once and OFF cannot schedule another effect', options, async () => {
  account(7);
  sql('UPDATE monk_factory_accounts SET avatar_id=\'avatar7\',social_profile=\'factory_' + uid(7) + '\',instagram_account_id=\'opaque7\',connected_at=now(),social_checked_at=now() WHERE user_id=\'' + uid(7) + '\'');
  const job = JSON.parse(sql(reserve(uid(7), 'existing-preview')));
  sql('UPDATE monk_factory_jobs SET status=\'completed\',stage=\'completed\',video_url=\'https://fixture.example/video.mp4\',video_completed_at=now() WHERE id=\'' + job.id + '\'');
  sql('SET ROLE service_role; SELECT monk_factory_set_autopost(\'' + uid(7) + '\')');
  const schedule = 'SET ROLE service_role; SELECT monk_factory_schedule_auto(\'' + uid(7) + '\')';
  const run = promisify(execFile);
  const results = await Promise.all(Array.from({ length: 4 }, () => run('psql', [...args(), '-c', schedule], { encoding: 'utf8' })));
  const scheduled = results.map(x => JSON.parse(x.stdout.trim() || 'null')).filter(Boolean);
  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0].id, job.id);
  assert.equal(scheduled[0].stage, 'post_ready');
  assert.equal(sql('SELECT count(*) FROM monk_factory_jobs WHERE user_id=\'' + uid(7) + '\''), '1');
  sql('UPDATE monk_factory_accounts SET auto_post=false,next_post_at=now()-interval \'1 day\' WHERE user_id=\'' + uid(7) + '\'');
  assert.equal(sql(schedule), '');
});

test('server usage counts unknown reservations and hides internal account and job columns from clients', options, () => {
  const usage = JSON.parse(sql('SET ROLE service_role; SELECT monk_factory_usage(\'' + uid(6) + '\')'));
  assert.equal(usage.videosRemaining, 2);
  assert.equal(usage.attemptsRemaining, 2);
  assert.equal(usage.maxSeconds, 20);
  assert.throws(() => sql('SET ROLE authenticated; SELECT stripe_customer_id,checkout_nonce FROM monk_factory_accounts'), /permission denied/);
  assert.throws(() => sql('SET ROLE authenticated; SELECT evidence,image_blob_key FROM monk_factory_jobs'), /permission denied/);
});

const quoted = value => "'" + String(value).replaceAll("'", "''") + "'";
function jobStore() {
  return {
    account: async id => JSON.parse(sql('SELECT to_jsonb(a) FROM monk_factory_accounts a WHERE user_id=' + quoted(id))),
    job: async id => JSON.parse(sql('SELECT to_jsonb(j) FROM monk_factory_jobs j WHERE id=' + quoted(id)) || 'null'),
    advanceJob: async (job, patch, keep = false) => JSON.parse(sql('SET ROLE service_role; SELECT monk_factory_advance_job(' + [job.id, job.lease_id, job.stage, JSON.stringify(patch)].map(quoted).join(',') + '::jsonb,' + keep + ')') || 'null'),
    claimJob: async (id, image = false) => JSON.parse(sql('SET ROLE service_role; SELECT monk_factory_claim_job(' + quoted(id) + ',' + image + ')') || 'null'),
    claimSocial: async id => JSON.parse(sql('SET ROLE service_role; SELECT monk_factory_claim_social(' + quoted(id) + ')') || 'null'),
    saveSocial: async (id, lease, state) => JSON.parse(sql('SET ROLE service_role; SELECT monk_factory_save_social(' + [id,lease,JSON.stringify(state)].map(quoted).join(',') + '::jsonb)') || 'null'),
    releaseSocial: async (id, lease) => sql('UPDATE monk_factory_accounts SET social_lease_id=NULL,social_lease_until=NULL WHERE user_id=' + quoted(id) + ' AND social_lease_id=' + quoted(lease)),
  };
}
function claimJob(id) { return JSON.parse(sql('SET ROLE service_role; SELECT monk_factory_claim_job(' + quoted(id) + ',false)') || 'null'); }

function billingStore() {
  const rpc = (name, values) => JSON.parse(sql('SET ROLE service_role; SELECT ' + name + '(' + values.map(value => value == null ? 'NULL' : quoted(value)).join(',') + ')') || 'null');
  return { ...jobStore(),
    reserveProfile: async id => rpc('monk_factory_reserve_profile', [id]),
    checkoutContext: async (id, price, email) => rpc('monk_factory_checkout_context', [id, price, email]),
    claimBilling: async id => rpc('monk_factory_claim_billing', [id]),
    applyBilling: async (id, nonce, state) => rpc('monk_factory_apply_billing', [id, nonce, JSON.stringify(state)]),
    releaseBilling: async (id, nonce) => sql('UPDATE monk_factory_accounts SET billing_sync_nonce=NULL,billing_sync_until=NULL WHERE user_id=' + quoted(id) + ' AND billing_sync_nonce=' + quoted(nonce)),
    saveCheckout: async (id, nonce, session) => sql('UPDATE monk_factory_accounts SET checkout_session_id=' + quoted(session) + ' WHERE user_id=' + quoted(id) + ' AND checkout_nonce=' + quoted(nonce)),
    releaseUnusedProfile: async (id, nonce, session, subscription) => rpc('monk_factory_release_unused_profile', [id, nonce, session, subscription]),
  };
}

const billingEnv = { MONK_FACTORY_STRIPE_PRICE_ID: 'price_capacity', MONK_FACTORY_STRIPE_LIVE: 'false' };
const capacityPrice = { id: 'price_capacity', livemode: false, active: true, currency: 'usd', unit_amount: 19900,
  metadata: { product: 'ai_monk_factory' }, recurring: { interval: 'month', interval_count: 1 } };
function capacitySubscription(account, status = 'trialing') {
  const start = Math.floor(Date.now()/1000)-3600;
  return { id: 'sub_capacity' + account.user_id.slice(-2), customer: 'cus_capacity' + account.user_id.slice(-2),
    livemode: false, status, metadata: { product: 'ai_monk_factory', user_id: account.user_id, checkout_nonce: account.checkout_nonce },
    trial_start: start, trial_end: start+3*86400, cancel_at_period_end: false,
    items: { has_more: false, data: [{ id: 'si_capacity', quantity: 1, price: capacityPrice, current_period_start: start, current_period_end: start+30*86400 }] },
    latest_invoice: null };
}

test('a provider timeout leaves its pre-POST fence and an expired lease never submits again', options, async () => {
  const { advanceFactoryJob } = require('../monk-factory-jobs.js');
  account(8);
  sql('UPDATE monk_factory_accounts SET avatar_id=\'avatar8\' WHERE user_id=' + quoted(uid(8)));
  const reserved = JSON.parse(sql(reserve(uid(8), 'unknown-script')));
  const store = jobStore();
  let submits = 0;
  const providers = { readiness: () => ({ ready: true }), createScript: async () => { submits++; throw Object.assign(new Error('provider_effect_unknown'), { code: 'provider_effect_unknown', effect: 'unknown' }); } };
  const dependencies = { store, providers, env: { MONK_FACTORY_ENABLED: 'true' }, loadPlaybooks: async () => [{ id: 'fixture-source' }], syncBilling: async () => store.account(uid(8)) };
  await advanceFactoryJob({ ...dependencies, job: claimJob(reserved.id) });
  const after = JSON.parse(sql('SELECT to_jsonb(j) FROM monk_factory_jobs j WHERE id=' + quoted(reserved.id)));
  assert.equal(after.stage, 'script_submitting');
  assert.equal(after.status, 'effect_unknown');
  assert.equal(after.reserved_micro_usd, 860000);
  sql('UPDATE monk_factory_jobs SET lease_until=now()-interval \'1 second\',next_run_at=now() WHERE id=' + quoted(reserved.id));
  await advanceFactoryJob({ ...dependencies, job: claimJob(reserved.id) });
  assert.equal(submits, 1);
  assert.equal(sql('SELECT stage FROM monk_factory_jobs WHERE id=' + quoted(reserved.id)), 'script_submitting');
});

test('official over-limit speech and OFF after reservation both stop the render POST', options, async () => {
  const { advanceFactoryJob } = require('../monk-factory-jobs.js');
  account(9);
  sql('UPDATE monk_factory_accounts SET avatar_id=\'avatar9\' WHERE user_id=' + quoted(uid(9)));
  const reserved = JSON.parse(sql(reserve(uid(9), 'duration-limit')));
  sql('UPDATE monk_factory_jobs SET stage=\'speech_ready\',audio_seconds=21,audio_url=\'https://fixture.example/audio.mp3\' WHERE id=' + quoted(reserved.id));
  const store = jobStore();
  const dependencies = { store, env: { MONK_FACTORY_ENABLED: 'true' }, providers: { readiness: () => ({ ready: true }), createVideo: () => assert.fail('invalid duration reached render') }, syncBilling: async () => store.account(uid(9)) };
  await advanceFactoryJob({ ...dependencies, job: claimJob(reserved.id) });
  assert.equal(sql('SELECT error_class FROM monk_factory_jobs WHERE id=' + quoted(reserved.id)), 'invalid_audio_duration');
  const auto = JSON.parse(sql(reserve(uid(9), 'auto-off')));
  sql('UPDATE monk_factory_jobs SET origin=\'auto\',stage=\'speech_ready\',audio_seconds=19,audio_url=\'https://fixture.example/audio.mp3\' WHERE id=' + quoted(auto.id));
  await advanceFactoryJob({ ...dependencies, job: claimJob(auto.id) });
  assert.equal(sql('SELECT error_class FROM monk_factory_jobs WHERE id=' + quoted(auto.id)), 'autopost_stopped');
});

test('a social profile POST fence survives lease expiry and official readback cannot attach another profile', options, () => {
  account(10);
  const claim = () => JSON.parse(sql('SET ROLE service_role; SELECT monk_factory_claim_social(' + quoted(uid(10)) + ')') || 'null');
  const first = claim();
  assert.equal(sql('SET ROLE service_role; SELECT monk_factory_fence_social(' + quoted(uid(10)) + ',' + quoted(first.social_lease_id) + ')'), 't');
  sql('UPDATE monk_factory_accounts SET social_lease_until=now()-interval \'1 second\' WHERE user_id=' + quoted(uid(10)));
  const later = claim();
  assert.equal(sql('SET ROLE service_role; SELECT monk_factory_fence_social(' + quoted(uid(10)) + ',' + quoted(later.social_lease_id) + ')'), 'f');
  const state = { profile: 'factory_' + uid(11), connected: true, accountId: 'opaque11', handle: 'fixture', reauthRequired: false };
  const save = value => 'SET ROLE service_role; SELECT monk_factory_save_social(' + quoted(uid(10)) + ',' + quoted(later.social_lease_id) + ',' + quoted(JSON.stringify(value)) + '::jsonb)';
  assert.throws(() => sql(save(state)), /social_mismatch/);
  assert.equal(JSON.parse(sql(save({ ...state, profile: 'factory_' + uid(10), accountId: 'opaque10' }))).instagram_account_id, 'opaque10');
});

const providerEnv = { MONK_FACTORY_ENABLED: 'true', MONK_FACTORY_JOB_SECRET: 'synthetic-fixture-secret-32-bytes-long',
  MONK_FACTORY_OPENAI_API_KEY: 'synthetic-openai', MONK_FACTORY_HEYGEN_API_KEY: 'synthetic-heygen', MONK_FACTORY_HEYGEN_VOICE_ID: 'synthetic-voice', MONK_FACTORY_UPLOAD_POST_API_KEY: 'synthetic-upload',
  MONK_FACTORY_OPENAI_BILLING_VERIFIED: 'true', MONK_FACTORY_OPENAI_BILLING_EVIDENCE_REF: 'fixture', MONK_FACTORY_HEYGEN_BILLING_VERIFIED: 'true', MONK_FACTORY_HEYGEN_BILLING_EVIDENCE_REF: 'fixture',
  MONK_FACTORY_UPLOAD_POST_BILLING_VERIFIED: 'true', MONK_FACTORY_UPLOAD_POST_BILLING_EVIDENCE_REF: 'fixture', MONK_FACTORY_UPLOAD_POST_WHITELABEL_VERIFIED: 'true' };
function nextClaim(id) {
  sql('UPDATE monk_factory_jobs SET next_run_at=now() WHERE id=' + quoted(id));
  return claimJob(id);
}

test('real adapter plus database completes DB-script speech render publish and attributed nonzero metrics once', options, async () => {
  const { advanceFactoryJob } = require('../monk-factory-jobs.js');
  const { createFactoryProviders } = require('../monk-factory-providers.js');
  account(11);
  sql('UPDATE monk_factory_accounts SET avatar_id=\'avatar11\',auto_post=true,social_profile=\'factory_' + uid(11) + '\',instagram_account_id=\'opaque11\',connected_at=now(),social_checked_at=now() WHERE user_id=' + quoted(uid(11)));
  const job = JSON.parse(sql(reserve(uid(11), 'end-to-end-fixture')));
  sql('UPDATE monk_factory_jobs SET origin=\'auto\',autopost_requested=true WHERE id=' + quoted(job.id));
  const paths = [];
  const providers = createFactoryProviders({ env: providerEnv, fetchImpl: async (address, request = {}) => {
    const url = new URL(address); const method = request.method || 'GET'; paths.push(method + ' ' + url.pathname);
    let data;
    if (url.pathname === '/v1/chat/completions') {
      const payload = JSON.parse(request.body);
      assert.ok(payload.messages[1].content.includes('shalev-yang-mun-playbook'));
      data = { id: 'chat11', choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ script: 'Pause and take one easy breath.', caption: 'One small pause.', source_ids: ['shalev-yang-mun-playbook'] }) } }] };
    } else if (url.pathname === '/v3/voices/speech') data = { data: { request_id: 'speech11', audio_url: 'https://fixture.example/audio.mp3', duration: 19, engine: 'starfish' } };
    else if (url.pathname === '/v3/videos' && method === 'POST') data = { data: { video_id: 'video11', status: 'pending' } };
    else if (url.pathname === '/v3/videos/video11') data = { data: { id: 'video11', status: 'completed', video_url: 'https://fixture.example/video.mp4', duration: 19 } };
    else if (url.pathname === '/api/uploadposts/users/factory_' + uid(11)) data = { success: true, profile: { username: 'factory_' + uid(11), social_accounts: { instagram: { username: 'opaque11', handle: 'fixture11' } } } };
    else if (url.pathname === '/api/upload') {
      assert.equal(request.body.get('user'), 'factory_' + uid(11));
      assert.ok(request.body.get('title').startsWith('Fictional AI-generated monk. '));
      data = { success: true, request_id: job.id + ':post_submitting' };
    } else if (url.pathname === '/api/uploadposts/status') data = { request_id: job.id + ':post_submitting', status: 'completed', results: [{ platform: 'instagram', success: true, post_id: 'native11', post_url: 'https://www.instagram.com/reel/fixture11/' }] };
    else if (url.pathname === '/api/uploadposts/post-analytics') data = { success: true, post: { profile_username: 'factory_' + uid(11), platform_post_id: 'native11', platform: 'instagram' }, platforms: { instagram: { success: true, platform_post_id: 'native11', post_metrics_source: 'platform_api', post_metrics: { views: 17 } } } };
    else assert.fail('unexpected synthetic transport: ' + method + ' ' + url.pathname);
    return new Response(JSON.stringify(data), { headers: { 'x-request-id': 'receipt11' } });
  } });
  const store = jobStore();
  for (const expected of ['script_ready','speech_ready','video_pending','post_ready','post_pending','published','published']) {
    await advanceFactoryJob({ job: nextClaim(job.id), store, providers, env: providerEnv, syncBilling: async () => store.account(uid(11)) });
    const current = await store.job(job.id);
    assert.equal(current.stage, expected, current.error_class);
  }
  const result = await store.job(job.id);
  assert.equal(result.status, 'completed');
  assert.deepEqual(result.metrics, { views: 17 });
  assert.ok(result.metrics_at);
  assert.equal(result.metrics.likes, undefined);
  assert.deepEqual(paths.filter(x => x.startsWith('POST')), ['POST /v1/chat/completions','POST /v3/voices/speech','POST /v3/videos','POST /api/upload']);
  assert.equal(nextClaim(job.id), null);
});

test('signed duplicate background invocations create one private image and one verified PhotoAvatar', options, async () => {
  const { advanceFactoryJob, runFactoryImage, signImageTicket } = require('../monk-factory-jobs.js');
  const { createFactoryProviders } = require('../monk-factory-providers.js');
  account(12);
  const reserved = JSON.parse(sql(reserve(uid(12), 'avatar:lifetime', 'avatar')));
  const store = jobStore(); const data = new Map(); const posts = [];
  const images = { put: async (key, value) => data.set(key, value), get: async key => data.get(key) || null };
  const providers = createFactoryProviders({ env: providerEnv, fetchImpl: async (address, request = {}) => {
    const path = new URL(address).pathname;
    if (request.method === 'POST') posts.push(path);
    let value;
    if (path === '/v1/images/generations') value = { data: [{ b64_json: Buffer.from([0xff,0xd8,0xff,0xd9]).toString('base64') }] };
    else if (path === '/v3/avatars') value = { data: { avatar_item: { id: 'avatar12', status: 'pending' } } };
    else if (path === '/v3/avatars/looks/avatar12') value = { data: { id: 'avatar12', avatar_type: 'photo_avatar', status: 'completed', preview_image_url: 'https://fixture.example/avatar.jpg', supported_api_engines: ['avatar_iv'] } };
    else assert.fail('unexpected synthetic image transport');
    return new Response(JSON.stringify(value), { headers: { 'x-request-id': 'image12' } });
  } });
  let dispatched;
  const options = { store, providers, images, env: providerEnv, syncBilling: async () => store.account(uid(12)) };
  await advanceFactoryJob({ ...options, job: claimJob(reserved.id), dispatch: async job => { dispatched = job; } });
  const ticket = signImageTicket({ jobId: reserved.id, nonce: dispatched.image_nonce, expiresAt: Date.parse(dispatched.image_ticket_until) }, providerEnv);
  await Promise.all([runFactoryImage({ ...options, ticket }),runFactoryImage({ ...options, ticket })]);
  assert.equal((await store.job(reserved.id)).stage, 'image_ready');
  await advanceFactoryJob({ ...options, job: nextClaim(reserved.id) });
  await advanceFactoryJob({ ...options, job: nextClaim(reserved.id) });
  await runFactoryImage({ ...options, ticket });
  assert.equal((await store.account(uid(12))).avatar_id, 'avatar12');
  assert.deepEqual(posts, ['/v1/images/generations','/v3/avatars']);
  assert.equal((await store.job(reserved.id)).evidence.image_readback.provider_receipt_id, 'image12');
  assert.equal(JSON.stringify((await store.job(reserved.id)).evidence).includes('/9j/2Q=='), false);
});

test('a lost DB response after a successful script only reconciles the saved row', options, async () => {
  const { advanceFactoryJob } = require('../monk-factory-jobs.js');
  account(13);
  sql('UPDATE monk_factory_accounts SET avatar_id=\'avatar13\' WHERE user_id=' + quoted(uid(13)));
  const job = JSON.parse(sql(reserve(uid(13), 'lost-save-response')));
  const store = jobStore(); const advance = store.advanceJob; let lost = false; let posts = 0;
  store.advanceJob = async (row, patch, keep) => {
    const saved = await advance(row, patch, keep);
    if (patch.stage === 'script_ready' && !lost) { lost = true; throw Object.assign(new Error(), { code: 'store_unavailable' }); }
    return saved;
  };
  await advanceFactoryJob({ job: claimJob(job.id), store, env: providerEnv, syncBilling: async () => store.account(uid(13)), loadPlaybooks: async () => [{ id: 'source13' }],
    providers: { readiness: () => ({ ready: true }), createScript: async () => { posts++; return { id: 'script13', script: 'Pause.', caption: 'Pause.', sourceIds: ['source13'] }; } } });
  assert.equal(posts, 1);
  assert.equal((await store.job(job.id)).stage, 'script_ready');
  assert.equal((await store.job(job.id)).script_receipt_id, 'script13');
});

test('a timed-out Instagram upload recovers by its official request ID without another upload', options, async () => {
  const { advanceFactoryJob } = require('../monk-factory-jobs.js');
  account(14);
  sql('UPDATE monk_factory_accounts SET avatar_id=\'avatar14\',auto_post=true,social_profile=\'factory_' + uid(14) + '\',instagram_account_id=\'opaque14\',connected_at=now(),social_checked_at=now() WHERE user_id=' + quoted(uid(14)));
  const job = JSON.parse(sql(reserve(uid(14), 'post-timeout')));
  sql('UPDATE monk_factory_jobs SET stage=\'post_ready\',video_url=\'https://fixture.example/video.mp4\',caption=\'Fictional AI-generated monk. Pause.\' WHERE id=' + quoted(job.id));
  let uploads = 0; let reads = 0;
  const store = jobStore();
  const providers = { readiness: () => ({ ready: true }), socialState: async () => ({ profile: 'factory_' + uid(14), connected: true, accountId: 'opaque14', handle: 'fixture14', reauthRequired: false }),
    publishInstagram: async () => { uploads++; throw Object.assign(new Error(), { code: 'provider_effect_unknown', effect: 'unknown' }); },
    postStatus: async id => { reads++; assert.equal(id, job.id + ':post_submitting'); return { id, status: 'completed', postId: 'native14', postUrl: 'https://www.instagram.com/reel/fixture14/', profile: 'factory_' + uid(14) }; },
    metrics: async () => ({ profile: 'factory_' + uid(14), postId: 'native14', source: 'platform_api', metrics: { views: 19 } }) };
  for (const expected of ['post_submitting','post_pending','published','published']) {
    await advanceFactoryJob({ job: nextClaim(job.id), store, providers, env: providerEnv, syncBilling: async () => store.account(uid(14)) });
    assert.equal((await store.job(job.id)).stage, expected);
  }
  assert.equal(uploads, 1); assert.equal(reads, 1);
  assert.equal((await store.job(job.id)).status, 'completed');
});

test('expired Checkout receipts release only unused matching slots and persist failed readback diagnostics', options, async () => {
  const { processFactoryEvents } = require('../monk-factory-jobs.js');
  const store = jobStore();
  for (const n of [15,16,17,18]) {
    sql('UPDATE monk_factory_accounts SET checkout_nonce=' + quoted(uid(n)) + ',checkout_created_at=now()-interval \'1 day\',checkout_session_id=NULL,trial_used=' + (n===16) + ' WHERE user_id=' + quoted(uid(n)));
    sql('INSERT INTO monk_factory_stripe_events(id,user_id,event_type,stripe_object_id) VALUES(' + ["evt_queue"+n,uid(n),'checkout.session.expired','cs_expired'+n].map(quoted).join(',') + ')');
  }
  store.pendingEvents = async () => JSON.parse(sql("SELECT coalesce(jsonb_agg(e),'[]') FROM monk_factory_stripe_events e WHERE id LIKE 'evt_queue%' AND processed_at IS NULL AND next_attempt_at<=now()"));
  store.markEvent = async id => sql('UPDATE monk_factory_stripe_events SET processed_at=now() WHERE id=' + quoted(id));
  store.deferEvent = async (id, patch) => sql('UPDATE monk_factory_stripe_events SET error_class=' + quoted(patch.error_class) + ',evidence=' + quoted(JSON.stringify(patch.evidence)) + '::jsonb,next_attempt_at=' + quoted(patch.next_attempt_at) + ' WHERE id=' + quoted(id));
  store.saveCheckout = async (id, nonce, session) => sql('UPDATE monk_factory_accounts SET checkout_session_id=' + quoted(session) + ' WHERE user_id=' + quoted(id) + ' AND checkout_nonce=' + quoted(nonce));
  store.releaseUnusedProfile = billingStore().releaseUnusedProfile;
  const stripe = { checkout: { sessions: { retrieve: async id => {
    const n = Number(id.slice('cs_expired'.length));
    if (n===18) throw Object.assign(new Error(), { code: 'billing_unavailable' });
    return { id, livemode: false, mode: 'subscription', status: 'expired', subscription: null, client_reference_id: uid(n), metadata: { product: 'ai_monk_factory', user_id: uid(n), checkout_nonce: uid(n===17 ? 1 : n) } };
  } } } };
  for (let n=0;n<4;n++) await processFactoryEvents({ store, stripe, env: { MONK_FACTORY_STRIPE_LIVE: 'false' } });
  assert.equal((await store.account(uid(15))).profile_reserved_at, null);
  assert.equal((await store.account(uid(15))).checkout_session_id, null);
  assert.equal((await store.account(uid(16))).profile_reserved_at, null);
  assert.equal((await store.account(uid(16))).trial_used, true);
  assert.ok((await store.account(uid(17))).profile_reserved_at);
  assert.equal(sql("SELECT count(*) FROM monk_factory_stripe_events WHERE id LIKE 'evt_queue%' AND processed_at IS NOT NULL"), '3');
  assert.equal(sql("SELECT error_class FROM monk_factory_stripe_events WHERE id='evt_queue18'"), 'billing_unavailable');
  assert.equal(JSON.parse(sql("SELECT evidence FROM monk_factory_stripe_events WHERE id='evt_queue18'")).stripe_reconcile.next_action, 'official_stripe_get');
});

test('the atomic POST fence rejects OFF or cancellation after a worker read its account', options, () => {
  for (const n of [19,20]) account(n);
  sql('UPDATE monk_factory_accounts SET auto_post=true WHERE user_id=' + quoted(uid(19)));
  const auto = JSON.parse(sql(reserve(uid(19), 'off-race')));
  sql('UPDATE monk_factory_jobs SET origin=\'auto\' WHERE id=' + quoted(auto.id));
  const autoLease = claimJob(auto.id);
  sql('UPDATE monk_factory_accounts SET auto_post=false WHERE user_id=' + quoted(uid(19)));
  const fence = job => 'SET ROLE service_role; SELECT monk_factory_advance_job(' + [job.id,job.lease_id,'reserved',JSON.stringify({ stage: 'script_submitting', status: 'effect_unknown' })].map(quoted).join(',') + '::jsonb,true)';
  assert.throws(() => sql(fence(autoLease)), /autopost_stopped/);
  const manual = JSON.parse(sql(reserve(uid(20), 'cancel-race')));
  const manualLease = claimJob(manual.id);
  sql('UPDATE monk_factory_accounts SET cancel_at_period_end=true WHERE user_id=' + quoted(uid(20)));
  assert.throws(() => sql(fence(manualLease)), /subscription_required/);
});

test('twenty-five canceled unconnected trials free capacity while retaining lifetime trials and charged jobs', options, async () => {
  const { syncFactoryBilling } = require('../monk-factory-billing.js');
  // The preceding tests are complete; this remains the same isolated local fixture.
  sql('TRUNCATE monk_factory_accounts CASCADE');
  const store = billingStore();
  const subscriptions = new Map();
  const stripe = { subscriptions: { retrieve: async id => structuredClone(subscriptions.get(id)) } };
  for (let n=1;n<=25;n++) {
    await store.reserveProfile(uid(n));
    const context = await store.checkoutContext(uid(n), capacityPrice.id, 'fixture@example.com');
    const sub = capacitySubscription(context); subscriptions.set(sub.id, sub);
    await syncFactoryBilling({ userId: uid(n), subscriptionId: sub.id, store, stripe, env: billingEnv });
  }
  assert.equal(sql('SELECT count(*) FROM monk_factory_accounts WHERE profile_reserved_at IS NOT NULL'), '25');
  assert.throws(() => sql('SET ROLE service_role; SELECT monk_factory_reserve_profile(' + quoted(uid(26)) + ')'), /profile_capacity/);
  sql(reserve(uid(1), 'retained-charge'));
  const cost = sql('SELECT sum(reserved_micro_usd) FROM monk_factory_jobs');
  const social = await store.claimSocial(uid(1));
  for (let n=1;n<=25;n++) {
    const current = await store.account(uid(n));
    subscriptions.get(current.stripe_subscription_id).status = n===25 ? 'incomplete_expired' : 'canceled';
    await syncFactoryBilling({ userId: uid(n), store, stripe, env: billingEnv });
  }
  assert.equal(sql('SELECT count(*) FROM monk_factory_accounts WHERE profile_reserved_at IS NOT NULL'), '0');
  assert.equal(sql('SELECT count(*) FROM monk_factory_accounts WHERE trial_used AND stripe_subscription_id IS NOT NULL'), '25');
  assert.equal(sql('SELECT count(*) FROM monk_factory_accounts WHERE checkout_nonce IS NOT NULL'), '0');
  assert.equal((await store.account(uid(1))).social_lease_id, null);
  assert.equal(sql('SET ROLE service_role; SELECT monk_factory_fence_social(' + quoted(uid(1)) + ',' + quoted(social.social_lease_id) + ')'), 'f');
  assert.equal(await store.saveSocial(uid(1), social.social_lease_id, { profile: 'factory_' + uid(1), connected: false }), null);
  assert.equal(sql('SELECT sum(reserved_micro_usd) FROM monk_factory_jobs'), cost);
  assert.equal((await store.reserveProfile(uid(26))).user_id, uid(26));
});

test('checkout reserves again after terminal billing frees its old context and never repeats the lifetime trial', options, async () => {
  const { syncFactoryBilling, beginFactoryCheckout } = require('../monk-factory-billing.js');
  const store = billingStore();
  await store.reserveProfile(uid(27));
  const context = await store.checkoutContext(uid(27), capacityPrice.id, 'fixture@example.com');
  const sub = capacitySubscription(context);
  let creates = 0;
  const stripe = { subscriptions: { retrieve: async () => sub }, prices: { retrieve: async () => capacityPrice },
    checkout: { sessions: { create: async params => {
      creates++;
      assert.equal(params.subscription_data.trial_period_days, undefined);
      assert.notEqual(params.metadata.checkout_nonce, context.checkout_nonce);
      return { id: 'cs_capacity27', mode: 'subscription', status: 'open', customer: sub.customer,
        client_reference_id: uid(27), metadata: params.metadata, url: 'https://checkout.stripe.com/c/pay/capacity27' };
    } } } };
  await syncFactoryBilling({ userId: uid(27), subscriptionId: sub.id, store, stripe, env: billingEnv });
  sub.status = 'canceled';
  const result = await beginFactoryCheckout({ user: { id: uid(27), email: 'fixture@example.com' }, store, stripe, env: billingEnv });
  assert.equal(result.url, 'https://checkout.stripe.com/c/pay/capacity27');
  assert.equal(creates, 1);
  const current = await store.account(uid(27));
  assert.ok(current.profile_reserved_at);
  assert.equal(current.trial_used, true);
  assert.equal(current.checkout_trial, false);
  assert.equal(current.stripe_subscription_id, sub.id);
});

test('terminal billing retains real profiles, unknown social POSTs and a checkout changed during its GET', options, async () => {
  const { syncFactoryBilling } = require('../monk-factory-billing.js');
  const store = billingStore();
  for (const n of [28,29,30]) {
    await store.reserveProfile(uid(n));
    const context = await store.checkoutContext(uid(n), capacityPrice.id, 'fixture@example.com');
    const sub = capacitySubscription(context);
    const stripe = { subscriptions: { retrieve: async () => structuredClone(sub) } };
    await syncFactoryBilling({ userId: uid(n), subscriptionId: sub.id, store, stripe, env: billingEnv });
    const social = await store.claimSocial(uid(n));
    if (n===28) assert.equal(sql('SET ROLE service_role; SELECT monk_factory_fence_social(' + quoted(uid(n)) + ',' + quoted(social.social_lease_id) + ')'), 't');
    if (n===29) await store.saveSocial(uid(n), social.social_lease_id, { profile: 'factory_' + uid(n), connected: false });
    if (n===30) stripe.subscriptions.retrieve = async () => {
      sql('UPDATE monk_factory_accounts SET checkout_nonce=' + quoted(uid(30)) + ' WHERE user_id=' + quoted(uid(n)));
      return structuredClone(sub);
    };
    sub.status = 'canceled';
    await syncFactoryBilling({ userId: uid(n), store, stripe, env: billingEnv });
    const current = await store.account(uid(n));
    assert.ok(current.profile_reserved_at, 'retained case ' + n);
    assert.equal(current.checkout_nonce, n===30 ? uid(30) : context.checkout_nonce);
    if (n!==29) assert.equal(current.social_lease_id, social.social_lease_id);
  }
  const current = await store.account(uid(30));
  const sub = capacitySubscription(current);
  const stripe = { subscriptions: { retrieve: async () => sub } };
  for (const status of ['active','trialing','past_due','unpaid','paused','incomplete']) {
    sub.status = status;
    sub.cancel_at_period_end = status === 'trialing';
    await syncFactoryBilling({ userId: uid(30), store, stripe, env: billingEnv });
    assert.ok((await store.account(uid(30))).profile_reserved_at, status);
  }
});

test('expiry of a returning user checkout frees only its current unused slot after official terminal readback', options, async () => {
  const { processFactoryEvents } = require('../monk-factory-jobs.js');
  const store = billingStore();
  let current = await store.account(uid(27));
  const social = await store.claimSocial(uid(27));
  let pending = { id: 'evt_returning', user_id: uid(27), event_type: 'checkout.session.expired', stripe_object_id: 'cs_old_capacity27' };
  let processed = 0, replaceDuringGet = false, wrongCustomer = false;
  const failures = [];
  store.pendingEvents = async () => pending ? [pending] : [];
  store.markEvent = async () => { processed++; pending = null; };
  store.deferEvent = async (_id, patch) => { failures.push(patch.error_class); };
  const sub = capacitySubscription(current, 'canceled');
  sub.metadata.checkout_nonce = uid(1); // The completed trial has a different nonce from its new Checkout.
  const stripe = { subscriptions: { retrieve: async () => sub }, checkout: { sessions: { retrieve: async id => {
    const session = { id, livemode: false, mode: 'subscription', status: 'expired', subscription: null,
      customer: wrongCustomer ? 'cus_other' : current.checkout_customer_id,
      client_reference_id: uid(27), metadata: { product: 'ai_monk_factory', user_id: uid(27),
        checkout_nonce: id==='cs_old_capacity27' ? uid(1) : current.checkout_nonce } };
    if (replaceDuringGet) sql('UPDATE monk_factory_accounts SET checkout_nonce=' + quoted(uid(27)) + ',checkout_session_id=\'cs_replacement27\' WHERE user_id=' + quoted(uid(27)));
    return session;
  } } } };
  await processFactoryEvents({ store, stripe, env: billingEnv });
  assert.equal(processed, 1);
  assert.equal((await store.account(uid(27))).checkout_nonce, current.checkout_nonce);
  assert.ok((await store.account(uid(27))).profile_reserved_at);
  pending = { id: 'evt_returning_current', user_id: uid(27), event_type: 'checkout.session.expired', stripe_object_id: current.checkout_session_id };
  replaceDuringGet = true;
  await processFactoryEvents({ store, stripe, env: billingEnv });
  current = await store.account(uid(27));
  assert.equal(processed, 2);
  assert.equal(current.checkout_nonce, uid(27));
  assert.ok(current.profile_reserved_at);
  assert.equal(current.social_lease_id, social.social_lease_id);
  replaceDuringGet = false;
  wrongCustomer = true;
  pending = { id: 'evt_returning_replacement', user_id: uid(27), event_type: 'checkout.session.expired', stripe_object_id: current.checkout_session_id };
  await processFactoryEvents({ store, stripe, env: billingEnv });
  assert.deepEqual(failures, ['billing_mismatch']);
  assert.equal(processed, 2);
  assert.ok((await store.account(uid(27))).profile_reserved_at);
  wrongCustomer = false;
  await processFactoryEvents({ store, stripe, env: billingEnv });
  const released = await store.account(uid(27));
  assert.equal(processed, 3);
  assert.equal(released.profile_reserved_at, null);
  assert.equal(released.checkout_nonce, null);
  assert.equal(released.social_lease_id, null);
  assert.equal(released.trial_used, true);
  assert.equal(released.stripe_subscription_id, current.stripe_subscription_id);
  assert.equal(sql('SET ROLE service_role; SELECT monk_factory_fence_social(' + quoted(uid(27)) + ',' + quoted(social.social_lease_id) + ')'), 'f');
  assert.throws(() => sql('SET ROLE authenticated; SELECT monk_factory_release_unused_profile(' + [uid(27),current.checkout_nonce,current.checkout_session_id,current.stripe_subscription_id].map(quoted).join(',') + ')'), /permission denied/);
});

test('expired checkouts cannot free a profile, a fenced POST or a subscription still active on official GET', options, async () => {
  const { processFactoryEvents } = require('../monk-factory-jobs.js');
  const store = billingStore();
  for (const n of [28,29,30]) {
    const current = await store.account(uid(n));
    await store.saveCheckout(uid(n), current.checkout_nonce, 'cs_retained' + n);
    let marked = false;
    store.pendingEvents = async () => [{ id: 'evt_retained'+n, user_id: uid(n), event_type: 'checkout.session.expired', stripe_object_id: 'cs_retained'+n }];
    store.markEvent = async () => { marked = true; };
    store.deferEvent = async () => {};
    const sub = capacitySubscription(current, n===30 ? 'active' : 'canceled');
    const stripe = { subscriptions: { retrieve: async () => sub }, checkout: { sessions: { retrieve: async id => ({
      id, livemode: false, mode: 'subscription', status: 'expired', subscription: null, customer: current.checkout_customer_id,
      client_reference_id: uid(n), metadata: { product: 'ai_monk_factory', user_id: uid(n), checkout_nonce: current.checkout_nonce },
    }) } } };
    await processFactoryEvents({ store, stripe, env: billingEnv });
    assert.equal(marked, true);
    assert.ok((await store.account(uid(n))).profile_reserved_at);
    assert.equal((await store.account(uid(n))).checkout_nonce, current.checkout_nonce);
  }
});
