import { describe, it, expect, vi, beforeEach } from 'vitest';

let resendCalls;
beforeEach(() => {
  resendCalls = [];
  global.fetch = vi.fn(async (url, opts) => {
    resendCalls.push({ url, body: JSON.parse(opts.body) });
    return { ok: true, text: async () => '{}' };
  });
  process.env.RESEND_API_KEY = 'test-key';
});

import { handler } from '../feedback.js';

describe('⑦ feedback.js Netlify function', () => {
  it('Test #6: happy → Resend send to keiodaisuke@gmail.com', async () => {
    const res = await handler({
      httpMethod: 'POST',
      body: JSON.stringify({ text: 'great app', locale: 'ja', appVersion: '1.9.3' })
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ ok: true });
    const resend = resendCalls.find(c => c.url.includes('api.resend.com/emails'));
    expect(resend.body.to).toBe('keiodaisuke@gmail.com');
  });

  it('Test #7: text > 2000 → 413', async () => {
    const res = await handler({
      httpMethod: 'POST',
      body: JSON.stringify({ text: 'a'.repeat(2001), locale: 'ja', appVersion: '1.9.3' })
    });
    expect(res.statusCode).toBe(413);
  });
});
