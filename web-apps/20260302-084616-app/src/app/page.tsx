import Link from "next/link";

const features = [
  {
    icon: "⚡",
    title: "Instant Preview",
    description:
      "See your signature update in real-time as you type. No waiting, no page refreshes.",
  },
  {
    icon: "🎨",
    title: "Modern Templates",
    description:
      "Choose from professionally designed templates that make a lasting impression.",
  },
  {
    icon: "📋",
    title: "One-Click Copy",
    description:
      "Copy your signature and paste directly into Gmail, Outlook, or Apple Mail.",
  },
  {
    icon: "🔗",
    title: "Social Links",
    description:
      "Add LinkedIn, Twitter, GitHub, and website links with beautiful icons.",
  },
  {
    icon: "📱",
    title: "Mobile Responsive",
    description:
      "Signatures that look great on every device and email client.",
  },
  {
    icon: "🚀",
    title: "No Signup Required",
    description:
      "Create your first signature for free — no account needed to get started.",
  },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white px-6 py-24 dark:from-zinc-900 dark:to-zinc-950 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl lg:text-6xl">
            Professional email signatures{" "}
            <span className="text-indigo-600">in seconds</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Stop spending hours on HTML. Create beautiful, modern email
            signatures with real-time preview and one-click copy for Gmail,
            Outlook, and Apple Mail.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/create"
              className="rounded-lg bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              Create Your Signature — Free
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-zinc-300 px-8 py-3 text-base font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Everything you need for a perfect signature
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-600 dark:text-zinc-400">
            No design skills required. Just fill in your details and pick a
            template.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-zinc-200 p-6 transition-shadow hover:shadow-md dark:border-zinc-800"
              >
                <div className="text-3xl">{feature.icon}</div>
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-indigo-600 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to make a great first impression?
          </h2>
          <p className="mt-4 text-lg text-indigo-100">
            Join thousands of professionals who use SignatureCraft to stand out
            in every email.
          </p>
          <Link
            href="/create"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3 text-base font-semibold text-indigo-600 shadow-sm transition-colors hover:bg-indigo-50"
          >
            Create Your Signature Now
          </Link>
        </div>
      </section>
    </>
  );
}
