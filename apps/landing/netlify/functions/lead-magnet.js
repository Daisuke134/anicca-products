// Email opt-in: store in Supabase + immediately send Day-0 letter via Resend.
// POST { email, lang: 'en' | 'jp' }
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'method not allowed' };
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'bad json' };
  }
  const email = String(body.email || '').trim().toLowerCase();
  const lang = body.lang === 'jp' ? 'jp' : 'en';
  if (!email || !email.includes('@')) return { statusCode: 400, body: 'invalid email' };

  const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = typeof process.env.RESEND_FROM_EMAIL === 'string'
    ? process.env.RESEND_FROM_EMAIL.trim()
    : '';
  if (!supabaseUrl || !serviceKey || !resendApiKey || !resendFromEmail) {
    return { statusCode: 503, body: 'service unavailable' };
  }

  let subscriber;
  try {
    const response = await fetch(supabaseUrl + '/rest/v1/rpc/upsert_ebook_subscriber', {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: 'Bearer ' + serviceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_email: email,
        p_lang: lang,
        p_stripe_customer_id: null,
        p_touch_existing: true,
      }),
    });
    if (!response.ok) return { statusCode: 503, body: 'subscriber registration failed' };
    subscriber = await response.json();
  } catch {
    return { statusCode: 503, body: 'subscriber registration failed' };
  }
  if (!subscriber || typeof subscriber.subscriber_id !== 'string' || !subscriber.subscriber_id
      || !['created', 'existing'].includes(subscriber.outcome)) {
    return { statusCode: 503, body: 'subscriber registration failed' };
  }

  const subject = lang === 'jp'
    ? '無常の手紙 #1 — 苦しみには寿命がある'
    : 'Letter on impermanence #1 — your suffering has an expiration date';
  const html = lang === 'jp' ? jpDay0Html() : enDay0Html();
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + resendApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: resendFromEmail, to: email, subject, html }),
    });
    if (!response.ok) return { statusCode: 502, body: 'email delivery failed' };
  } catch {
    return { statusCode: 502, body: 'email delivery failed' };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};

function enDay0Html() {
  return `
  <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #2A2520; line-height: 1.7;">
    <p style="font-size:11px; letter-spacing:3px; color:#8B7355; text-transform:uppercase;">Letter 1 of 3</p>
    <h1 style="font-weight: 300; font-size: 24px; margin-top: 8px;">Your suffering has an expiration date.</h1>
    <p>The Pali word is <em>anicca</em>. Pronounced ah-NEE-cha. It means: nothing you feel right now will be the thing you feel tomorrow.</p>
    <p>You don't believe this when you're inside a hard feeling. The mind tells you "it will always be like this." That part of the mind is wrong, every single time it has ever spoken.</p>
    <p>Your body has a half-life for emotion. About 90 seconds. Watch the clock the next time you're angry. Don't argue with the anger. Don't try to fix it. Just count.</p>
    <p>You will see something you have never seen before: the anger leaves on its own.</p>
    <p>That's the entire teaching of impermanence in one observation. The next two letters will go deeper.</p>
    <p>— Anicca</p>
    <hr style="border:none; border-top: 1px solid #E5DCC9; margin: 32px 0;" />
    <p style="font-size:13px; color:#8B7355;">If you'd like the full 49-lesson book now: <a href="https://aniccaai.com/monk" style="color:#2A2520;">The Anicca Reset — $10.99</a></p>
  </div>`;
}

function jpDay0Html() {
  return `
  <div style="font-family: 'Hiragino Mincho ProN', serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #2A2520; line-height: 1.9;">
    <p style="font-size:11px; letter-spacing:3px; color:#8B7355;">3通のうち1通目</p>
    <h1 style="font-weight: 300; font-size: 22px; margin-top: 8px;">あなたの苦しみには、消える時間が決まっています。</h1>
    <p>パーリ語で「<em>アニッチャ</em>（無常）」と言います。今あなたが感じているものは、明日感じるものとは違うものになる、という意味です。</p>
    <p>苦しみのまっただ中にいるとき、心はこう囁きます ——「ずっとこのままだ」と。その心の声は、これまで一度も正しかったことはありません。</p>
    <p>怒りには平均して90秒の半減期があります。次に怒りを感じたとき、時計を見てください。怒りと闘わず、ただ秒数を数える。</p>
    <p>あなたは初めて目撃します。怒りは、勝手に去っていく。</p>
    <p>無常の教えは、これだけです。次の2通の手紙でもう少し深く入っていきます。</p>
    <p>— アニッチャ</p>
    <hr style="border:none; border-top: 1px solid #E5DCC9; margin: 32px 0;" />
    <p style="font-size:13px; color:#8B7355;">49章すべて読みたい方は: <a href="https://aniccaai.com/achan" style="color:#2A2520;">『アニッチャ・リセット』 — ¥1,580</a></p>
  </div>`;
}
