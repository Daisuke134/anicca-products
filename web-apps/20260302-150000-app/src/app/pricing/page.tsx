import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out ColdCraft",
    features: [
      "5 emails per month",
      "2 tone options",
      "Basic templates",
      "A/B subject lines",
    ],
    cta: "Start Free",
    href: "/generate",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/month",
    description: "For serious outreach professionals",
    features: [
      "Unlimited email generation",
      "All 4 tone options",
      "All templates (sales, recruiting, partnerships, freelance)",
      "A/B subject lines with scoring",
      "Email length control",
      "Priority generation speed",
    ],
    cta: "Upgrade to Pro",
    href: "/api/checkout",
    highlighted: true,
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <div className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-muted">
          Start free. Upgrade when you need unlimited emails.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-8 ${
              plan.highlighted
                ? "border-accent bg-accent/5"
                : "border-border bg-surface"
            }`}
          >
            {plan.highlighted && (
              <div className="mb-4 inline-block rounded-full bg-accent px-3 py-1 text-xs font-medium text-white">
                Most Popular
              </div>
            )}
            <h2 className="mb-1 text-2xl font-bold">{plan.name}</h2>
            <p className="mb-4 text-sm text-muted">{plan.description}</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-muted">{plan.period}</span>
            </div>
            <ul className="mb-8 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <span className="text-accent">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {plan.highlighted ? (
              <form action="/api/checkout" method="POST">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-accent px-6 py-3 font-medium text-white hover:bg-accent-hover transition-colors cursor-pointer"
                >
                  {plan.cta}
                </button>
              </form>
            ) : (
              <Link
                href={plan.href}
                className="block w-full rounded-lg border border-border px-6 py-3 text-center font-medium text-muted hover:text-foreground hover:border-foreground transition-colors"
              >
                {plan.cta}
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <h3 className="mb-4 text-xl font-semibold">
          Frequently asked questions
        </h3>
        <div className="mx-auto max-w-2xl space-y-6 text-left">
          {[
            {
              q: "Can I cancel anytime?",
              a: "Yes. Cancel your subscription at any time from your Stripe billing portal. No questions asked.",
            },
            {
              q: "What counts as one email?",
              a: "Each generation (including A/B variants) counts as one email. You get the full email body plus 2 subject line options.",
            },
            {
              q: "Is there a free trial for Pro?",
              a: "The Free plan is your trial. Use 5 emails per month for free, forever. Upgrade to Pro when you need more.",
            },
          ].map((faq) => (
            <div key={faq.q} className="rounded-lg border border-border p-4">
              <p className="mb-2 font-medium">{faq.q}</p>
              <p className="text-sm text-muted">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
