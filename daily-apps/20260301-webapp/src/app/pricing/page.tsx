"use client";

const STRIPE_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || "price_1T6C45EeDsUAcaLSg8SXT0xT";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "Pomodoro timer (25/5)",
      "3 ambient sounds",
      "7-day session history",
      "Basic stats",
    ],
    cta: "Get Started",
    href: "/",
    primary: false,
  },
  {
    name: "Pro",
    price: "$4.99",
    period: "/month",
    features: [
      "All timer modes (25/5, 50/10, Custom)",
      "All 5 ambient sounds",
      "Unlimited session history",
      "Full statistics dashboard",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    href: "/pricing",
    primary: true,
  },
];

export default function PricingPage() {
  const handleCheckout = async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: STRIPE_PRICE_ID }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold">Simple pricing</h1>
        <p className="mt-3 text-[#737373]">
          Start free. Upgrade when you need more.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-lg border p-8 ${
              plan.primary
                ? "border-blue-500 bg-[#111111]"
                : "border-[#1a1a1a] bg-[#111111]"
            }`}
          >
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-mono text-4xl font-bold">
                {plan.price}
              </span>
              <span className="text-[#737373]">{plan.period}</span>
            </div>
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-[#e5e5e5]"
                >
                  <span className="text-blue-500">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={plan.primary ? handleCheckout : undefined}
              className={`mt-8 w-full rounded-lg py-3 font-medium transition-colors ${
                plan.primary
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "border border-[#1a1a1a] text-[#737373] hover:bg-[#1a1a1a] hover:text-[#e5e5e5]"
              }`}
            >
              {plan.primary ? (
                plan.cta
              ) : (
                <a href={plan.href}>{plan.cta}</a>
              )}
            </button>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-[#737373]">
        Also available: $39.99/year (save 33%)
      </p>
    </div>
  );
}
