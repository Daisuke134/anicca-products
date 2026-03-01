import Link from "next/link";
import { CheckoutButton } from "@/components/checkout-button";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out SignatureCraft",
    features: [
      "1 signature",
      "3 templates",
      "Basic customization",
      "Copy to clipboard",
    ],
    cta: "Get Started",
    href: "/create",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$4.99",
    period: "/month",
    description: "For professionals who want to stand out",
    features: [
      "Unlimited signatures",
      "All premium templates",
      "Custom brand colors",
      "Social link icons",
      "Photo upload",
      "Priority support",
    ],
    cta: "Start Pro",
    href: null,
    highlighted: true,
  },
];

export default function PricingPage() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-center text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-lg text-zinc-600 dark:text-zinc-400">
          Start for free, upgrade when you need more.
        </p>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 ${
                plan.highlighted
                  ? "border-indigo-600 shadow-lg ring-1 ring-indigo-600"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                  Most Popular
                </span>
              )}
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {plan.name}
              </h2>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                  {plan.price}
                </span>
                <span className="text-zinc-500">{plan.period}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {plan.description}
              </p>
              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    <svg
                      className="h-5 w-5 flex-shrink-0 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {plan.href ? (
                  <Link
                    href={plan.href}
                    className="block w-full rounded-lg border border-zinc-300 py-3 text-center text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <CheckoutButton />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
