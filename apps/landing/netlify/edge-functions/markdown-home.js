// Markdown content negotiation for the canonical homepage ("/" and "/en").
//
// Why this exists: the homepage is a static file staged by the canonical
// Manager marketing overlay (Daisuke134/anicca, apps/landing/marketing), so
// there is no server that could answer `Accept: text/markdown`. Netlify
// redirect rules cannot condition on the Accept header (their conditions are
// Country / Language / Role / Cookie / query params only), so an Edge
// Function is the supported mechanism. Clients that ask for text/markdown
// (AI crawlers and GEO auditors such as GeoReady, whose ai_discovery check
// requires `GET /` + `Accept: text/markdown` -> 200 + `text/markdown`)
// receive the Markdown rendering below; every other request falls through
// to the static HTML unchanged via context.next().
//
// The Markdown body is a faithful rendering of the homepage's own text
// (hero, the company/model/eval/product loop, the product section, the two
// businesses, research highlights, values). Keep it in step with
// pages/en.html in the canonical marketing package when that page changes.

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

export default async (request, context) => {
  const accept = request.headers.get("accept") || "";
  if (!accept.toLowerCase().includes("text/markdown")) {
    return context.next();
  }
  return new Response(HOMEPAGE_MARKDOWN, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      Vary: "Accept",
    },
  });
};

export const config = { path: ["/", "/en"] };
