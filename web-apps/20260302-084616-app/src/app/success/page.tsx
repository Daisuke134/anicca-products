import Link from "next/link";

export default function SuccessPage() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
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
        </div>
        <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Welcome to Pro!
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Your subscription is active. You now have access to unlimited
          signatures, all premium templates, and custom branding.
        </p>
        <Link
          href="/create"
          className="mt-8 inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Start Creating
        </Link>
      </div>
    </section>
  );
}
