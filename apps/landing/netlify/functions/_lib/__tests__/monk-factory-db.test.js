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
  sql('CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting(\'request.jwt.claim.sub\',true),\'\')::uuid $$; GRANT USAGE ON SCHEMA auth TO authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated; INSERT INTO auth.users SELECT (\'00000000-0000-4000-8000-\'||lpad(n::text,12,\'0\'))::uuid FROM generate_series(1,30) n;');
  const dir = path.resolve(__dirname, '../../../../supabase/migrations');
  const migrations = fs.readdirSync(dir).filter(x => /_monk_factory(?:_jobs)?\.sql$/.test(x)).sort();
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
