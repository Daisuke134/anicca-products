import Link from "next/link";

const features = [
  {
    title: "Personalized in Seconds",
    description:
      "Describe your prospect and product. ColdCraft generates a tailored email that feels hand-written, not templated.",
    icon: "⚡",
  },
  {
    title: "Multiple Tones & Styles",
    description:
      "Professional, casual, provocative, or empathetic. Pick the tone that matches your brand and audience.",
    icon: "🎨",
  },
  {
    title: "A/B Variants Included",
    description:
      "Every generation creates 2 subject line variants so you can test what resonates with your audience.",
    icon: "📊",
  },
  {
    title: "Built for Sales & Recruiting",
    description:
      "Templates optimized for outbound sales, recruitment outreach, partnership proposals, and freelancer pitches.",
    icon: "🎯",
  },
];

const testimonials = [
  {
    name: "Sarah K.",
    role: "Freelance Designer",
    quote:
      "I used to spend 30 minutes agonizing over every cold email. Now I generate 10 personalized emails in the time it took me to write one.",
  },
  {
    name: "Marcus T.",
    role: "Sales Development Rep",
    quote:
      "My reply rate went from 3% to 12% after switching to ColdCraft. The personalization is next level.",
  },
  {
    name: "Yuki M.",
    role: "Startup Founder",
    quote:
      "At $9.99/month, this is a steal compared to Lemlist or Instantly. Perfect for bootstrapped founders.",
  },
];

export default function Home() {
  return (
    <div>
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="mb-4 inline-block rounded-full bg-accent/10 px-4 py-1 text-sm text-accent">
          AI-Powered Cold Outreach
        </div>
        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight">
          Cold emails that
          <br />
          <span className="text-accent">actually get replies</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted">
          Stop spending 30 minutes per email. ColdCraft generates personalized,
          high-converting cold emails in seconds. Trusted by freelancers, sales
          reps, and startup founders.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/generate"
            className="rounded-lg bg-accent px-6 py-3 font-medium text-white hover:bg-accent-hover transition-colors"
          >
            Try Free — 5 Emails/Month
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-border px-6 py-3 font-medium text-muted hover:text-foreground hover:border-foreground transition-colors"
          >
            View Pricing
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted">
          No credit card required. 5 free emails every month.
        </p>
      </section>

      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Everything you need for cold outreach
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-surface p-6 hover:bg-surface-hover transition-colors"
              >
                <div className="mb-3 text-2xl">{f.icon}</div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold">How it works</h2>
          <p className="mb-12 text-center text-muted">
            Three steps to your next reply
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Describe your prospect",
                desc: "Enter their role, company, and what you are offering. The more context, the better the email.",
              },
              {
                step: "2",
                title: "Choose your tone",
                desc: "Professional, casual, provocative, or empathetic. Pick what matches your brand.",
              },
              {
                step: "3",
                title: "Send & track",
                desc: "Copy your personalized email with A/B subject lines. Paste into your email client and hit send.",
              },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-lg font-bold text-white">
                  {s.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold">
            What our users say
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-xl border border-border bg-surface p-6"
              >
                <p className="mb-4 text-sm text-muted">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-muted">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold">
            Ready to 10x your outreach?
          </h2>
          <p className="mb-8 text-muted">
            Join thousands of professionals who write better cold emails with
            ColdCraft.
          </p>
          <Link
            href="/generate"
            className="inline-block rounded-lg bg-accent px-8 py-3 font-medium text-white hover:bg-accent-hover transition-colors"
          >
            Start Writing Better Emails
          </Link>
        </div>
      </section>
    </div>
  );
}
