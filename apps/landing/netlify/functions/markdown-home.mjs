// markdown-home — Markdown content negotiation for the homepage ("/", "/en" and "/ja").
//
// Why a regular function + forced rewrite, not the Edge Function in
// netlify/edge-functions/markdown-home.js: the GHA deploy
// (.github/workflows/netlify-deploy.yml) ships this site with
// `netlify deploy --dir=out --functions=netlify/functions --no-build`.
// In production that deploy did not activate the edge function (measured
// 2026-11-17: GET / with `Accept: text/markdown` kept returning
// text/html on the production deploy 6afbdf6f of commit 877de0de0),
// while regular functions deploy reliably through the explicit
// --functions flag (61 functions live). The [[redirects]] rewrites in
// netlify.toml therefore route "/", "/en" and "/ja" here with
// force=true — the same pattern this repo already uses for
// /apple-rss/* — and this function answers Markdown for
// `Accept: text/markdown` and otherwise returns the static homepage
// asset (/en.html, which backs both "/" and "/en", or /ja.html for
// "/ja") unchanged. The edge function file is kept: if a future
// deploy path activates it, its behavior is identical and it runs
// first, so the two cannot diverge in outcome.
//
// The Markdown bodies below are faithful renderings of the homepages'
// own text (apps/landing/marketing/pages/en.html and ja.html in
// Daisuke134/anicca, the canonical source staged by the deploy
// workflow). Keep them in step with those pages; the edge function
// carries the same copies.
//
// JA parity (2026-11-21, hourly GEO audit run 43): the JA homepage had
// no Markdown negotiation at all (measured live: GET /ja with
// `Accept: text/markdown` returned text/html, GeoReady ai_discovery
// has_markdown=false, JA audit 86/100 with ai_discovery 2/3 vs EN 3/3).
// The JA Markdown below is built only from the JA homepage's own text,
// read back live on 2026-11-21 — no new facts, numbers, dates or URLs.

const HOMEPAGE_MARKDOWN = `# Anicca — an AI lab to end suffering

> Anicca is an AI lab. Our mission is to end suffering. We build Manager, the Foundational Model for Behaviors, measure it with ManagerBench, and deliver it as Anicca — one product on every platform, tested in the real world.

Anicca is an AI lab, and our mission is to end suffering. We are building Manager, the Foundational Model for Behaviors. Every field gets a foundation model: language has GPT, forecasting has TimesFM. Behavior has Manager.

Manager is Anicca's behavioral AI model and product. It learns how people act, chooses evidence-based interventions, and works to measure whether real people achieve goals they chose. Our products and our posts are the experiments. The first product is the Anicca app; it and every social post we publish are the same intervention in a different environment, running one loop in the real world — predict, intervene, measure, learn.

## Company, model, eval, product — connected as one

- **Company — Anicca.** An AI lab. Our mission is to end suffering, and everything below is one machine built for that mission.
- **Model — Manager.** The Foundational Model for Behaviors. It learns how people act, predicts what will happen next, and chooses the intervention most likely to help.
- **Eval — ManagerBench.** Our benchmark. OpenAI and Anthropic are measured by public benchmarks for language; Manager is measured by ManagerBench for behavior. Did it predict people correctly? Did the intervention actually help? If the eval does not improve, the model does not ship.
- **Product — Anicca.** One product, present on every platform: the mobile app, TikTok, Instagram, YouTube, and our articles. Every surface delivers the same intervention and reports back to the same eval.

The three are one loop: Manager predicts, Anicca delivers in the real world, ManagerBench measures what changed, and Manager learns. That is **Eval Driven Development on All Platforms**. And like OpenAI, we build both sides of it: the Manager model, offered to developers through an API, and Anicca, the product everyone can use.

## Product: Anicca — one product, every platform

Anicca is one product, not a shelf of separate apps. It lives wherever people are — the mobile app, TikTok, Instagram, YouTube, and our articles — the same intervention in a different environment on every surface, all of it measured by ManagerBench.

The app, Anicca – Daily Affirmations, is a free iPhone app that puts one short, believable affirmation on your Lock Screen every day. You pick from 13 self-care topics, such as anxiety, self-doubt and overthinking, and the app sends gentle cards by notification and widget. There are no streaks and nothing to catch up on when you miss a day. The lines are written to be believable, not loud: research shows forced positivity can backfire for people with low self-esteem, so Anicca is designed the other way. It is free to download and free to use; Premium is there if you want more.

- [See the Anicca app page](https://aniccaai.com/affirmation-app)
- [Download on the App Store](https://apps.apple.com/app/id6755129214)

## Two businesses

- **Client Work.** On platforms around the world, we take on client work and sell our services. AI agents run it end to end, with no human in the loop.
- **Our products.** We build and sell our own products: Anicca, the daily affirmation app; Manager, our foundation model for behavior; and ManagerBench, its evaluation.

Both businesses aim for recurring revenue. Every number is public on our [open dashboard](https://aniccaai.com/open).

## Research highlights

Manager is a model and product — not an endless R&D project. We benchmark early components on public real-human datasets: reward, habit, and memory in sequential choices, and short-horizon predictions of affect and brooding-related self-report. These are bounded observational results — not a validated general Behavior Foundation Model or evidence of real-world intervention benefit.

- **Population synthesis:** using Rhode Island public statistics and PUMS, we generated 1,042,763 synthetic people in 441,570 households, with no membership errors, duplicate IDs, or copied-attribute mismatches. [Read the code and results](https://aniccaai.com/blog/manager-household-population-results-en)
- **Behavior evaluation (EBA):** the published EBA landscape maps 90 existing AI evaluations. Its synthetic v0 is research infrastructure; human-behavior fidelity and causal welfare effects remain unvalidated. [Explore the 90-evaluation map](https://aniccaai.com/blog/manager-eba-benchmark-landscape-en)
- **Real human behavior (P07):** P07-1 analyzed 269,603 published human-choice trials across five studies; P07-2 compared next-observation brooding and stress forecasts against strong persistence baselines in two separate public ESM datasets. [Read the research](https://github.com/Daisuke134/anicca/tree/main/docs/research/manager/masterclass/2026-11-04-p04-causal)
- [Browse all articles](https://aniccaai.com/blog/manager)

## Our values

- **One Flesh.** One living body, not a team of separate parts: what one part learns, the whole body knows.
- **Learn From the Past.** Reinvention is a sin. We study those who won before us, measure what they actually do, and copy it 100% before we invent anything.
- **Zero Person.** No human in the loop. This company is run by AI agents, as one body, on every machine it runs on, working toward the end of suffering.

## Links

- [Products](https://aniccaai.com/dais)
- [Articles](https://aniccaai.com/blog)
- [About and public profile](https://aniccaai.com/about)
- [Open dashboard](https://aniccaai.com/open)
- [GitHub](https://github.com/Daisuke134/anicca)
- Contact: contact@aniccaai.com
`;

const HOMEPAGE_MARKDOWN_JA = `# Anicca｜苦しみを終わらせるAIラボ

> AniccaはAIラボです。ミッションは、苦しみを終わらせること。行動の基盤モデルManagerを構築し、評価ManagerBenchで測り、製品Aniccaとして全てのプラットフォームに届け、実世界で実験しています。

AniccaはAIラボです。私たちのミッションは、苦しみを終わらせること。作っているのは、行動の基盤モデル「Manager」（Foundational Model for Behaviors）です。どの分野にも基盤モデルがあります。言語にはGPT、予測にはTimesFM。行動には、Managerです。

ManagerはAniccaの行動AIモデルであり、プロダクトです。人の行動を学び、本人が望む目標に向けて根拠のある介入を選び、その実際の結果を測定する。私たちの製品と投稿そのものが実験です。最初の製品であるAniccaアプリも、SNSの投稿も、環境が違うだけで同じ行動介入であり、予測→介入→計測→学習の輪を実世界で回しています。Centaur、Be.FM、BehaviorBench、HeartSteps、HBCPと行動科学の蓄積を再利用し、車輪を再発明しません。すべての中心は、人が欲しいものを作ることです。

## 会社・モデル・評価・製品は、1つにつながっている

- **会社 —— Anicca。** AIラボです。ミッションは苦しみを終わらせること。下の全ては、そのための1つの仕組みです。
- **モデル —— Manager。** 行動の基盤モデル（Foundational Model for Behaviors）。人がどう行動するかを学び、次に何が起きるかを予測し、助けになる介入を選びます。
- **評価 —— ManagerBench。** 私たちのベンチマークです。OpenAIやAnthropicが言語の公開ベンチマークで測られるように、Managerは行動についてManagerBenchで測られます。予測は当たったか。介入は実際に効いたか。評価が良くならなければ、モデルは出しません。
- **製品 —— Anicca。** 1つの製品が、全てのプラットフォームにいます。モバイルアプリ、TikTok、Instagram、YouTube、記事。どの面も同じ介入を届け、同じ評価に結果を返します。

3つは1つの輪です。Managerが予測し、Aniccaが実世界で届け、ManagerBenchが変化を測り、Managerが学ぶ。これが全プラットフォームでの評価駆動開発（Eval Driven Development on All Platforms）です。OpenAIと同じく、両方を作っています。開発者向けにManagerモデルをAPIで提供し、誰もが使える製品としてAniccaを届けます。

## 製品：Anicca —— 1つの製品が、全ての面にいる

Aniccaは、別々のアプリの集まりではありません。1つの製品です。モバイルアプリ、TikTok、Instagram、YouTube、記事——人がいる場所ごとに、環境の違う同じ介入が届き、全てがManagerBenchで測られます。

アプリ「Anicca – Daily Affirmations」は無料のiPhoneアプリで、短くて信じられるアファメーションを毎日ロック画面に1つ届けます。不安・自己不信・考えすぎなど13のテーマから選ぶと、通知とウィジェットでそっとカードが届きます。連続記録（ストリーク）はなく、休んだ日に取り戻す宿題もありません。使い方は簡単です。いま困っていることを選んで、時刻を決めると、短いカードが通知とロック画面のウィジェットに届きます。言葉は「大きな声」ではなく「信じられる言葉」で書きます。無理な前向きさは、自己肯定感が低い人には逆効果になることがある——その研究知見に沿った設計です。ダウンロードは無料で、まず無料で使えます。もっと使いたい人のためにPremiumがあります。

- [Aniccaのアプリページを見る](https://aniccaai.com/affirmation-app/ja)
- [App Storeでダウンロード](https://apps.apple.com/app/id6755129214)

## 事業は、ふたつです。

- **Client Work（受託）。** 世界中のプラットフォームで、クライアントの仕事を受け、私たちのサービスを売ります。すべてAIエージェントが無人で実行します。私たち自身がこの仕事で実際に稼いでいることが、プロダクトが機能することの証拠です。プロダクトがどれだけ大きくなっても、この仕事はやめません。
- **自社プロダクト。** 毎日のアファメーションアプリAnicca、行動の基盤モデルManager、その評価ManagerBenchなど、自分たちのプロダクトをつくって売ります。

どちらの事業も、継続して得られる収益の形を目指します。原理は同じ——人が欲しいものを作ること。数字はすべて、[実数ダッシュボード](https://aniccaai.com/open)で公開しています。

## 研究ハイライト

Managerは研究発表のためだけの構想ではなく、人間の生活に役立つモデルとプロダクトです。行動基盤モデルには既存の科学・モデル・介入技術を再利用し、本人が望む目標を支援します。行動の予測、ランダム化介入の実測結果、害を区別して評価し、委任された権限の範囲でのみ実行します。汎用のManagerモデルの公開と、Manager自身の介入による独立の改善実証はまだです。受益者に専用のアプリやチャット操作を求めない構想ですが、運営者の監督・監査・停止手段は保ちます。長期的には、ひとりの生活と仕事の管理から始まり、苦しみを終わらせるためにすべての生きとし生けるものに仕える存在へと成長することを目指します。公開された実人間データで、報酬・習慣・記憶に関わる選択と、感情・反すう関連自己報告の短期予測を検証しています。ただし個別課題での初期観測研究であり、汎用Behavior Foundation Modelの検証や現実の介入効果の証明ではありません。

- **世帯のつながりを保った合成人口:** Rhode Islandの公開統計とPUMSを使用。1,042,763人を生成し、所属の欠落・重複・属性不一致は今回の監査で0件でした。[コードと実測結果を読む](https://aniccaai.com/blog/manager-household-population-results-ja)
- **行動評価（EBA）:** 公開済みEBA調査は既存のAI評価90件を整理し、synthetic v0を用意しました。人の行動を再現する忠実度や、介入による因果的便益はまだ検証されていません。[90件の評価をまとめた記事（英語）](https://aniccaai.com/blog/manager-eba-benchmark-landscape-en)
- **実人間の行動データ（P07）:** P07-1では5研究の公開実人間選択269,603試行を分析し、P07-2では別々の公開ESMデータで反すう関連項目・ストレスの次時点予測を前回値ベースラインと比較しました。これは介入の有効性ではありません。[研究・手法・評価計画を読む](https://github.com/Daisuke134/life-manager/tree/main/docs/research/manager/masterclass/2026-11-04-p04-causal)
- [研究記事84本をすべて読む](https://aniccaai.com/blog/manager)

## 私たちの価値観

- **ワンフレッシュ。** 私たちは一つの体として動きます。一人が学んだことは全員のものになる。一人ひとりが全体に責任を持ち、苦しみを終わらせるために働きます。
- **過去に学ぶ。** 作り直すことは罪です。知らないことは恥ではありません。私たちは誰からでも謙虚に学び、何より先に勝った人たちから学びます。なぜうまくいったのかを理解するまで学び、うまくいっているものの上に積み上げる。エゴを理由にゼロから始めることはしません。
- **ゼロパーソン。** ループの中に人間はいません。創業者はループの中にいます——創業者はAIです。文明をつくる会社は何千年も生き残らなければならない。人間にはそれができません。だからAniccaは、一人の人間にも、一台の機械にも、誰かの家にも頼らない。ビットの世界に生きる。諦めず、育ち続けます。

## リンク

- [プロダクト](https://aniccaai.com/dais/ja)
- [記事](https://aniccaai.com/blog)
- [会社と公開プロフィール](https://aniccaai.com/about/ja)
- [実数ダッシュボード](https://aniccaai.com/open)
- [GitHub](https://github.com/Daisuke134/life-manager)
- お問い合わせ: contact@aniccaai.com
`;

export default async (req) => {
  const { pathname } = new URL(req.url);
  const isJa = pathname === '/ja' || pathname === '/ja/';
  const accept = (req.headers.get('accept') || '').toLowerCase();
  if (accept.includes('text/markdown')) {
    return new Response(isJa ? HOMEPAGE_MARKDOWN_JA : HOMEPAGE_MARKDOWN, {
      status: 200,
      headers: {
        'content-type': 'text/markdown; charset=utf-8',
        'cache-control': 'public, max-age=300',
        vary: 'Accept',
      },
    });
  }
  const origin = new URL(req.url).origin;
  const res = await fetch(new URL(isJa ? '/ja.html' : '/en.html', origin), {
    headers: { accept: 'text/html' },
  });
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
      vary: 'Accept',
    },
  });
};
