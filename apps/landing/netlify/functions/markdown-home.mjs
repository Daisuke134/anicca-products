// markdown-home — Markdown content negotiation for the homepage ("/" and "/en").
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
// netlify.toml therefore route "/" and "/en" here with force=true —
// the same pattern this repo already uses for /apple-rss/* — and this
// function answers Markdown for `Accept: text/markdown` and otherwise
// returns the static homepage asset (/en.html, which backs both "/"
// and "/en") unchanged. The edge function file is kept: if a future
// deploy path activates it, its behavior is identical and it runs
// first, so the two cannot diverge in outcome.
//
// The Markdown body below is a faithful rendering of the homepage's
// own text (apps/landing/marketing/pages/en.html in Daisuke134/anicca,
// the canonical source staged by the deploy workflow). Keep it in step
// with that page; the edge function carries the same copy.

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

export default async (req) => {
  const accept = (req.headers.get('accept') || '').toLowerCase();
  if (accept.includes('text/markdown')) {
    return new Response(HOMEPAGE_MARKDOWN, {
      status: 200,
      headers: {
        'content-type': 'text/markdown; charset=utf-8',
        'cache-control': 'public, max-age=300',
        vary: 'Accept',
      },
    });
  }
  const origin = new URL(req.url).origin;
  const res = await fetch(new URL('/en.html', origin), {
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
