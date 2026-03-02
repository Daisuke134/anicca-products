import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <div className="mb-6 text-6xl">🎉</div>
      <h1 className="mb-4 text-3xl font-bold">Welcome to ColdCraft Pro!</h1>
      <p className="mb-8 text-lg text-muted">
        Your subscription is active. You now have unlimited access to all
        features, templates, and tone options.
      </p>
      <div className="space-y-4">
        <Link
          href="/generate"
          className="inline-block rounded-lg bg-accent px-8 py-3 font-medium text-white hover:bg-accent-hover transition-colors"
        >
          Start Generating Emails
        </Link>
        <p className="text-sm text-muted">
          Manage your subscription anytime from the Stripe billing portal.
        </p>
      </div>
    </div>
  );
}
