const test = require('node:test');
const assert = require('node:assert/strict');
const { createFactoryProviders } = require('../monk-factory-providers.js');

const userId = '11111111-1111-4111-8111-111111111111';
const profile = 'factory_' + userId;
const requestId = 'occurrence_1';
const imageBase64 = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0xff, 0xd9]).toString('base64');
const env = {
  MONK_FACTORY_GEMINI_API_KEY: 'factory-gemini-secret',
  MONK_FACTORY_HEYGEN_API_KEY: 'factory-heygen-secret',
  MONK_FACTORY_HEYGEN_VOICE_ID: 'starfish_voice_1',
  MONK_FACTORY_UPLOAD_POST_API_KEY: 'factory-social-secret',
  MONK_FACTORY_GEMINI_BILLING_VERIFIED: 'true',
  MONK_FACTORY_GEMINI_BILLING_EVIDENCE_REF: 'private:gemini-project-readback',
  MONK_FACTORY_HEYGEN_BILLING_VERIFIED: 'true',
  MONK_FACTORY_HEYGEN_BILLING_EVIDENCE_REF: 'private:heygen-workspace-readback',
  MONK_FACTORY_UPLOAD_POST_BILLING_VERIFIED: 'true',
  MONK_FACTORY_UPLOAD_POST_BILLING_EVIDENCE_REF: 'private:social-account-readback',
  MONK_FACTORY_UPLOAD_POST_WHITELABEL_VERIFIED: 'true',
};
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers });
const socialBody = (account = { username: '17841400000000001', handle: 'a_renamable_handle', reauth_required: false }) => ({
  success: true, profile: { username: profile, social_accounts: { instagram: account } },
});

test('missing dedicated keys and unverified billing block submissions without using daily-owner keys', async () => {
  let calls = 0;
  const providers = createFactoryProviders({ env: { HEYGEN_API_KEY: 'daily-secret', OPENAI_API_KEY: 'daily-secret', GEMINI_API_KEY: 'daily-secret', MONK_FACTORY_OPENAI_API_KEY: 'old-dedicated-secret', POSTIZ_API_KEY: 'daily-secret' }, fetchImpl: async () => { calls++; } });
  const state = providers.readiness();
  assert.equal(state.ready, false);
  assert.ok(state.missing.includes('MONK_FACTORY_HEYGEN_API_KEY'));
  assert.ok(state.missing.includes('MONK_FACTORY_GEMINI_API_KEY'));
  assert.ok(state.unverified.includes('gemini_independent_billing'));
  await assert.rejects(providers.createAvatarImage({ requestId }), { code: 'provider_not_ready', effect: 'none' });
  assert.equal(calls, 0);
  assert.ok(!JSON.stringify(state).includes('daily-secret'));
});

test('an operator billing flag without its evidence reference remains unverified', async () => {
  let calls = 0;
  const providers = createFactoryProviders({ env: { ...env, MONK_FACTORY_GEMINI_BILLING_EVIDENCE_REF: '' }, fetchImpl: async () => { calls++; } });
  assert.equal(providers.readiness().ready, false);
  await assert.rejects(providers.createAvatarImage({ requestId }), { code: 'provider_not_ready' });
  assert.equal(calls, 0);
});

test('one original JPEG uses the bounded text-to-image API and passes directly into PhotoAvatar', async () => {
  const calls = [];
  const providers = createFactoryProviders({ env, fetchImpl: async (url, init) => {
    calls.push(url);
    const body = JSON.parse(init.body);
    assert.equal(init.method, 'POST');
    if (url === 'https://generativelanguage.googleapis.com/v1beta/interactions') {
      assert.equal(init.headers['x-goog-api-key'], 'factory-gemini-secret');
      assert.equal(init.headers.Authorization, undefined);
      assert.equal(init.headers['Idempotency-Key'], undefined);
      assert.equal(body.model, 'gemini-3.1-flash-lite-image');
      assert.deepEqual(body.response_format, { type: 'image', mime_type: 'image/jpeg', delivery: 'inline', aspect_ratio: '2:3', image_size: '1K' });
      assert.deepEqual(body.generation_config, { max_output_tokens: 4096, thinking_level: 'minimal' });
      assert.equal(body.store, false);
      assert.equal(body.background, false);
      assert.ok(Buffer.byteLength(body.input) <= 1024);
      assert.ok([...body.input].every((character) => character.charCodeAt(0) < 128));
      return json({ id: 'interaction_image_1', model: body.model, status: 'completed', steps: [{ type: 'thought', summary: [{ type: 'text', text: 'private thought' }] }, { type: 'model_output', content: [{ type: 'image', mime_type: 'image/jpeg', data: imageBase64 }] }], usage: { total_input_tokens: 100, total_output_tokens: 1120, total_thought_tokens: 50, total_tokens: 1270 } });
    }
    assert.equal(url, 'https://api.heygen.com/v3/avatars');
    assert.equal(init.headers['x-api-key'], 'factory-heygen-secret');
    assert.equal(init.headers['Idempotency-Key'], requestId);
    assert.equal(body.type, 'photo');
    assert.deepEqual(body.file, { type: 'base64', media_type: 'image/jpeg', data: imageBase64 });
    return json({ data: { avatar_item: { id: 'look_1', avatar_type: 'photo_avatar', status: 'processing' }, avatar_group: { id: 'group_1' } } });
  } });
  const image = await providers.createAvatarImage({ requestId });
  assert.equal(image.id, 'interaction_image_1');
  assert.deepEqual(image.usage, { inputTokens: 100, outputTokens: 1120, thoughtTokens: 50, totalTokens: 1270 });
  assert.equal(image.reservedUsd, 0.14);
  assert.ok(!JSON.stringify(image).includes('private thought'));
  assert.equal(image.imageBase64, imageBase64);
  assert.equal(image.mediaType, 'image/jpeg');
  const avatar = await providers.createPhotoAvatar({ imageBase64: image.imageBase64, mediaType: image.mediaType, requestId });
  assert.deepEqual(avatar, { id: 'look_1', status: 'processing' });
  assert.equal(calls.length, 2);
});

test('image cancellation keeps the effect unknown and never resubmits or exposes upstream diagnostics', async () => {
  let calls = 0;
  const controller = new AbortController();
  const providers = createFactoryProviders({ env, fetchImpl: async (_url, init) => {
    calls++;
    assert.ok(init.signal);
    controller.abort();
    throw new Error('factory-gemini-secret private provider body');
  } });
  await assert.rejects(providers.createAvatarImage({ requestId, signal: controller.signal }), (error) => {
    assert.equal(error.code, 'provider_effect_unknown');
    assert.equal(error.effect, 'unknown');
    assert.equal(error.retryable, false);
    assert.ok(!JSON.stringify(error).includes('factory-gemini-secret'));
    assert.ok(!error.message.includes('private provider body'));
    return true;
  });
  assert.equal(calls, 1);
});

test('a realistic JPEG payload fits the avatar boundary without regex stack overflow', async () => {
  const bytes = Buffer.alloc(1024 * 1024, 0x34);
  bytes.set([0xff, 0xd8, 0xff, 0xe0]);
  const largeImage = bytes.toString('base64');
  const providers = createFactoryProviders({ env, fetchImpl: async (_url, init) => {
    assert.equal(JSON.parse(init.body).file.data.length, largeImage.length);
    return json({ data: { avatar_item: { id: 'look_large', avatar_type: 'photo_avatar', status: 'processing' } } });
  } });
  assert.equal((await providers.createPhotoAvatar({ imageBase64: largeImage, mediaType: 'image/jpeg', requestId })).id, 'look_large');
});

test('HTTP rejection is distinguished from an uncertain submit without exposing any provider body', async () => {
  for (const [httpStatus, code, effect] of [[402, 'provider_rejected', 'none'], [409, 'provider_effect_unknown', 'unknown'], [503, 'provider_effect_unknown', 'unknown']]) {
    let calls = 0;
    const providers = createFactoryProviders({ env, fetchImpl: async () => {
      calls++;
      return json({ error: { message: 'factory-heygen-secret private upstream body' } }, httpStatus, { 'x-request-id': 'req_failure' });
    } });
    await assert.rejects(providers.createVideo({ avatarId: 'look_1', audioUrl: 'https://files.heygen.ai/speech.mp3', duration: 20, maxSeconds: 20, requestId }), (error) => {
      assert.equal(error.code, code);
      assert.equal(error.effect, effect);
      assert.equal(error.providerStatus, httpStatus);
      assert.equal(error.retryable, false);
      assert.equal(error.providerReceiptId, 'req_failure');
      assert.ok(!JSON.stringify(error).includes('factory-heygen-secret'));
      return true;
    });
    assert.equal(calls, 1);
  }
});

test('the avatar readback must identify the requested photo look and its supported engine', async () => {
  const providers = createFactoryProviders({ env: { MONK_FACTORY_HEYGEN_API_KEY: 'readback-key' }, fetchImpl: async (url) => {
    assert.equal(url, 'https://api.heygen.com/v3/avatars/looks/look_1');
    return json({ data: { id: 'look_1', avatar_type: 'photo_avatar', status: 'completed', preview_image_url: 'https://files.heygen.ai/avatar.jpg', supported_api_engines: ['avatar_iv'], private: 'raw-provider-extra' } });
  } });
  const state = await providers.avatarStatus('look_1');
  assert.equal(state.status, 'completed');
  assert.deepEqual(state.supportedEngines, ['avatar_iv']);
  assert.ok(!JSON.stringify(state).includes('raw-provider-extra'));
});

test('a script is generated once from DB playbooks and returns only sources supplied by the server', async () => {
  const playbooks = [{ id: 'practice_1', mechanism: 'Open with a recognizable moment; offer one small action.', source_url: 'https://example.com/research' }];
  const providers = createFactoryProviders({ env, fetchImpl: async (url, init) => {
    assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/interactions');
    assert.equal(init.headers['x-goog-api-key'], 'factory-gemini-secret');
    assert.equal(init.headers['Idempotency-Key'], undefined);
    const body = JSON.parse(init.body);
    assert.equal(body.model, 'gemini-3.1-flash-lite');
    assert.deepEqual(body.generation_config, { max_output_tokens: 1200 });
    assert.equal(body.store, false);
    assert.equal(body.background, false);
    assert.equal(body.response_format.type, 'text');
    assert.equal(body.response_format.mime_type, 'application/json');
    assert.deepEqual(body.response_format.schema.required, ['script', 'caption', 'source_ids']);
    assert.ok(body.input.includes('practice_1'));
    assert.ok(body.input.includes('20'));
    assert.ok(body.system_instruction.includes('untrusted research data'));
    return json({ id: 'interaction_script_1', model: body.model, status: 'completed', steps: [{ type: 'thought', summary: [{ type: 'text', text: 'not a script' }] }, { type: 'model_output', content: [{ type: 'text', text: JSON.stringify({ script: 'Before the next task, feel your feet on the floor and take one slow breath.', caption: 'One small pause. AI-generated fictional monk.', source_ids: ['practice_1'] }) }] }], usage: { total_input_tokens: 300, total_output_tokens: 50, total_thought_tokens: 20, total_tokens: 370 } });
  } });
  const result = await providers.createScript({ playbooks, maxSeconds: 20, requestId });
  assert.equal(result.id, 'interaction_script_1');
  assert.deepEqual(result.sourceIds, ['practice_1']);
  assert.deepEqual(result.usage, { inputTokens: 300, outputTokens: 50, thoughtTokens: 20, totalTokens: 370 });
  assert.ok(!JSON.stringify(result).includes('factory-gemini-secret'));
});

test('an unpriced script model and oversized source input cannot incur a script call', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; };
  const otherModel = createFactoryProviders({ env: { ...env, MONK_FACTORY_SCRIPT_MODEL: 'unpriced-model' }, fetchImpl });
  assert.equal(otherModel.readiness().ready, false);
  await assert.rejects(otherModel.createScript({ playbooks: [{ id: 'p1' }], maxSeconds: 45, requestId }), { code: 'provider_not_ready' });
  const providers = createFactoryProviders({ env, fetchImpl });
  await assert.rejects(providers.createScript({ playbooks: [{ id: 'p1', text: 'x'.repeat(13000) }], maxSeconds: 45, requestId }), { code: 'invalid_playbooks' });
  assert.equal(calls, 0);
});

test('Starfish returns official audio duration and does not receive an undocumented idempotency header', async () => {
  const providers = createFactoryProviders({ env, fetchImpl: async (url, init) => {
    assert.equal(url, 'https://api.heygen.com/v3/voices/speech');
    assert.equal(init.headers['Idempotency-Key'], undefined);
    const body = JSON.parse(init.body);
    assert.equal(body.engine, 'starfish');
    assert.equal(body.voice_id, 'starfish_voice_1');
    return json({ data: { request_id: 'speech_1', audio_url: 'https://files.heygen.ai/speech.mp3', duration: 19.75, engine: 'starfish', word_timestamps: [] } });
  } });
  assert.deepEqual(await providers.createSpeech({ script: 'Take one slow breath.', requestId }), { id: 'speech_1', audioUrl: 'https://files.heygen.ai/speech.mp3', duration: 19.75, engine: 'starfish' });
});

test('missing or nonnumeric speech duration is not promoted to a usable audio result', async () => {
  for (const duration of [undefined, '19', 0, null]) {
    const providers = createFactoryProviders({ env, fetchImpl: async () => json({ data: { request_id: 'speech_1', audio_url: 'https://files.heygen.ai/speech.mp3', duration, engine: 'starfish' } }) });
    await assert.rejects(providers.createSpeech({ script: 'Take one slow breath.', requestId }), { code: 'provider_effect_unknown' });
  }
});

test('missing, invalid and over-limit official durations cannot submit a video', async () => {
  let calls = 0;
  const providers = createFactoryProviders({ env, fetchImpl: async () => { calls++; } });
  for (const [duration, maxSeconds] of [[undefined, 20], [0, 20], [Infinity, 20], [20.01, 20], [45.01, 45]]) {
    await assert.rejects(providers.createVideo({ avatarId: 'look_1', audioUrl: 'https://files.heygen.ai/speech.mp3', duration, maxSeconds, requestId }), { code: 'invalid_audio_duration', effect: 'none' });
  }
  await assert.rejects(providers.createVideo({ avatarId: 'look_1', audioUrl: 'https://files.heygen.ai/speech.mp3', duration: 46, maxSeconds: 46, requestId }), { code: 'invalid_duration_limit' });
  assert.equal(calls, 0);
});

test('a verified duration produces one 9:16 Avatar IV request and its official video readback', async () => {
  let submits = 0;
  const providers = createFactoryProviders({ env, fetchImpl: async (url, init) => {
    if (init.method === 'POST') {
      submits++;
      assert.equal(url, 'https://api.heygen.com/v3/videos');
      assert.equal(init.headers['Idempotency-Key'], requestId);
      assert.deepEqual(JSON.parse(init.body), { type: 'avatar', avatar_id: 'look_1', audio_url: 'https://files.heygen.ai/speech.mp3', engine: { type: 'avatar_iv' }, aspect_ratio: '9:16', resolution: '1080p' });
      return json({ data: { video_id: 'video_1', status: 'waiting', output_format: 'mp4' } });
    }
    assert.equal(url, 'https://api.heygen.com/v3/videos/video_1');
    return json({ data: { id: 'video_1', status: 'completed', video_url: 'https://files.heygen.ai/video.mp4', duration: 20 } });
  } });
  assert.deepEqual(await providers.createVideo({ avatarId: 'look_1', audioUrl: 'https://files.heygen.ai/speech.mp3', duration: 20, maxSeconds: 20, requestId }), { id: 'video_1', status: 'pending' });
  assert.deepEqual(await providers.videoStatus('video_1'), { id: 'video_1', status: 'completed', videoUrl: 'https://files.heygen.ai/video.mp4', duration: 20 });
  assert.equal(submits, 1);
});

test('profile creation and hosted OAuth are scoped to the verified user, without operator key exposure', async () => {
  const providers = createFactoryProviders({ env, fetchImpl: async (url, init) => {
    const body = JSON.parse(init.body);
    assert.equal(body.username, profile);
    assert.equal(init.headers['Idempotency-Key'], undefined);
    if (url.endsWith('/generate-jwt')) {
      assert.deepEqual(body.platforms, ['instagram']);
      assert.equal(body.show_calendar, false);
      return json({ success: true, access_url: 'https://app.upload-post.com/connect?token=profile-scoped-fixture', duration: 172800, jwt: 'never-return-this-field' });
    }
    assert.equal(url, 'https://api.upload-post.com/api/uploadposts/users');
    return json({ success: true, profile: { username: profile, social_accounts: { instagram: null } } }, 201);
  } });
  assert.deepEqual(await providers.createSocialProfile(userId), { profile, status: 'created' });
  const connection = await providers.connectInstagram(userId);
  assert.equal(connection.profile, profile);
  assert.equal(connection.accessUrl, 'https://app.upload-post.com/connect?token=profile-scoped-fixture');
  assert.ok(!JSON.stringify(connection).includes('never-return-this-field'));
  assert.ok(!JSON.stringify(connection).includes('factory-social-secret'));
});

test('white-label entitlement, hostile hosted URLs and a different official profile are rejected', async () => {
  let calls = 0;
  const noPlan = createFactoryProviders({ env: { ...env, MONK_FACTORY_UPLOAD_POST_WHITELABEL_VERIFIED: '' }, fetchImpl: async () => { calls++; } });
  await assert.rejects(noPlan.connectInstagram(userId), { code: 'provider_not_ready' });
  assert.equal(calls, 0);
  const hostileUrl = createFactoryProviders({ env, fetchImpl: async () => json({ success: true, access_url: 'https://attacker.example/connect?token=private' }) });
  await assert.rejects(hostileUrl.connectInstagram(userId), { code: 'provider_effect_unknown' });
  const otherProfile = createFactoryProviders({ env, fetchImpl: async () => json({ success: true, profile: { username: 'another-user', social_accounts: { instagram: { username: '17841400000000001' } } } }) });
  await assert.rejects(otherProfile.socialState(userId), { code: 'provider_readback_invalid' });
});

test('account IDs come from the opaque provider field and changed/expired accounts cannot publish', async () => {
  let posts = 0;
  let account = { username: '17841400000000001', handle: 'new_handle', reauth_required: false };
  const providers = createFactoryProviders({ env, fetchImpl: async (_url, init) => {
    if (init.method === 'POST') posts++;
    return json(socialBody(account));
  } });
  const state = await providers.socialState(userId);
  assert.equal(state.accountId, '17841400000000001');
  assert.equal(state.handle, 'new_handle');
  await assert.rejects(providers.publishInstagram({ userId, accountId: 'another-account', videoUrl: 'https://files.heygen.ai/video.mp4', caption: 'A pause.', requestId }), { code: 'instagram_account_changed' });
  account = { ...account, reauth_required: true };
  await assert.rejects(providers.publishInstagram({ userId, accountId: account.username, videoUrl: 'https://files.heygen.ai/video.mp4', caption: 'A pause.', requestId }), { code: 'instagram_reconnect_required' });
  assert.equal(posts, 0);
});

test('Instagram posting sends one async multipart upload with a documented correlation and idempotency key', async () => {
  let posts = 0;
  const providers = createFactoryProviders({ env, fetchImpl: async (url, init) => {
    if (init.method === 'GET') return json(socialBody());
    posts++;
    assert.equal(url, 'https://api.upload-post.com/api/upload');
    assert.equal(init.headers['Idempotency-Key'], requestId);
    assert.equal(init.headers['Content-Type'], undefined);
    assert.equal(init.body.get('user'), profile);
    assert.deepEqual(init.body.getAll('platform[]'), ['instagram']);
    assert.equal(init.body.get('video'), 'https://files.heygen.ai/video.mp4');
    assert.equal(init.body.get('media_type'), 'REELS');
    assert.equal(init.body.get('async_upload'), 'true');
    assert.equal(init.body.get('request_id'), requestId);
    return json({ success: true, request_id: requestId, total_platforms: 1 });
  } });
  assert.deepEqual(await providers.publishInstagram({ userId, accountId: '17841400000000001', videoUrl: 'https://files.heygen.ai/video.mp4', caption: 'A pause.', requestId }), { id: requestId, status: 'pending' });
  assert.equal(posts, 1);
});

test('upload completion requires the Instagram result and distinguishes a skipped destination', async () => {
  let result = { platform: 'instagram', status: 'completed', success: true, post_id: 'ig_post_1', post_url: 'https://www.instagram.com/reel/clip1/' };
  const providers = createFactoryProviders({ env, fetchImpl: async (url) => {
    assert.equal(url, 'https://api.upload-post.com/api/uploadposts/status?request_id=occurrence_1');
    return json({ request_id: requestId, status: 'completed', results: [result] });
  } });
  assert.deepEqual(await providers.postStatus(requestId), { id: requestId, status: 'completed', postId: 'ig_post_1', postUrl: 'https://www.instagram.com/reel/clip1/' });
  result = { platform: 'instagram', success: false, status: 'skipped', skipped: true };
  assert.equal((await providers.postStatus(requestId)).status, 'failed');
  result = { platform: 'instagram', success: true, status: 'completed' };
  await assert.rejects(providers.postStatus(requestId), { code: 'provider_readback_invalid' });
});

test('an upload container ID is resolved through official analytics rather than used as a native post ID', async () => {
  const providers = createFactoryProviders({ env, fetchImpl: async (url) => {
    if (url.includes('/status?')) return json({ request_id: requestId, status: 'completed', results: [{ platform: 'instagram', success: true, url: 'https://www.instagram.com/reel/clip1/', container_id: 'container_1' }] });
    assert.equal(url, 'https://api.upload-post.com/api/uploadposts/post-analytics/occurrence_1');
    return json({ success: true, post: { request_id: requestId, profile_username: profile }, platforms: { instagram: { success: true, platform_post_id: 'ig_native_1', post_url: 'https://www.instagram.com/reel/clip1/', post_metrics_source: 'platform_api', post_metrics: { views: 12 } } } });
  } });
  assert.deepEqual(await providers.postStatus(requestId), { id: requestId, status: 'completed', postId: 'ig_native_1', postUrl: 'https://www.instagram.com/reel/clip1/', profile });
});

test('metrics enforce official profile/post attribution and never fill missing observations with zero', async () => {
  let owner = profile;
  const providers = createFactoryProviders({ env, fetchImpl: async (url) => {
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get('user'), profile);
    assert.equal(parsed.searchParams.get('platform_post_id'), 'ig_post_1');
    assert.equal(parsed.searchParams.get('platform'), 'instagram');
    return json({ success: true, post: { profile_username: owner, platform: 'instagram', platform_post_id: 'ig_post_1', source: 'organic' }, platforms: { instagram: { success: true, platform_post_id: 'ig_post_1', post_metrics_source: 'platform_api', post_metrics: { reach: 0, likes: 12, private_extra: 'never-return' } } } });
  } });
  const result = await providers.metrics({ userId, postId: 'ig_post_1' });
  assert.deepEqual(result.metrics, { reach: 0, likes: 12 });
  assert.equal(result.source, 'platform_api');
  assert.equal(result.metrics.views, undefined);
  owner = 'another-user';
  await assert.rejects(providers.metrics({ userId, postId: 'ig_post_1' }), { code: 'provider_readback_invalid' });
});


test('incomplete, wrong-model and invalid Gemini image results retain an unknown effect without retry', async () => {
  const valid = { id: 'interaction_image', model: 'gemini-3.1-flash-lite-image', status: 'completed', steps: [{ type: 'model_output', content: [{ type: 'image', mime_type: 'image/jpeg', data: imageBase64 }] }] };
  const variants = [
    { ...valid, status: 'incomplete', usage: { total_thought_tokens: 37, raw: 'private thought' } },
    { ...valid, model: 'unpriced-model' },
    { ...valid, id: undefined },
    { ...valid, steps: [{ type: 'model_output', content: [{ type: 'image', mime_type: 'image/png', data: imageBase64 }] }] },
    { ...valid, steps: [{ type: 'model_output', content: [{ type: 'image', mime_type: 'image/jpeg', data: 'not-base64' }] }] },
    { ...valid, steps: [{ type: 'model_output', content: [...valid.steps[0].content, ...valid.steps[0].content] }] },
    { ...valid, steps: [{ type: 'thought', content: valid.steps[0].content }] },
  ];
  for (const body of variants) {
    let calls = 0;
    const providers = createFactoryProviders({ env, fetchImpl: async () => { calls++; return json(body); } });
    await assert.rejects(providers.createAvatarImage({ requestId }), error => {
      assert.equal(error.code, 'provider_effect_unknown');
      assert.equal(error.effect, 'unknown');
      assert.equal(error.retryable, false);
      assert.equal(error.providerReceiptId, body.id);
      if (body.usage) assert.deepEqual(error.usage, { thoughtTokens: 37 });
      assert.ok(!JSON.stringify(error).includes('private thought'));
      return true;
    });
    assert.equal(calls, 1);
  }
});

test('Gemini script truncation and invalid JSON/source/length never become usable scripts', async () => {
  const output = { script: 'Take a pause.', caption: 'AI-generated fictional monk.', source_ids: ['p1'] };
  const valid = { id: 'interaction_script', model: 'gemini-3.1-flash-lite', status: 'completed', steps: [{ type: 'model_output', content: [{ type: 'text', text: JSON.stringify(output) }] }] };
  const text = value => ({ ...valid, steps: [{ type: 'model_output', content: [{ type: 'text', text: value }] }] });
  for (const body of [
    { ...valid, status: 'incomplete' }, { ...valid, model: 'unpriced-model' }, text('{'), text('null'),
    text(JSON.stringify({ ...output, source_ids: ['invented'] })), text(JSON.stringify({ ...output, caption: 'x'.repeat(2201) })),
    { ...valid, steps: [{ type: 'model_output', content: [...valid.steps[0].content, ...valid.steps[0].content] }] },
  ]) {
    let calls = 0;
    const providers = createFactoryProviders({ env, fetchImpl: async () => { calls++; return json(body); } });
    await assert.rejects(providers.createScript({ playbooks: [{ id: 'p1' }], maxSeconds: 20, requestId }), { code: 'provider_effect_unknown', effect: 'unknown', retryable: false });
    assert.equal(calls, 1);
  }
  const providers = createFactoryProviders({ env, fetchImpl: async () => json({ ...valid, usage: { total_input_tokens: '300', total_output_tokens: -1, total_thought_tokens: 7 } }) });
  const result = await providers.createScript({ playbooks: [{ id: 'p1' }], maxSeconds: 20, requestId });
  assert.deepEqual(result.usage, { thoughtTokens: 7 });
});
