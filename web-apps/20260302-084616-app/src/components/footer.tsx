import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <p className="text-lg font-bold tracking-tight">
              Signature<span className="text-indigo-600">Craft</span>
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Professional email signatures in seconds.
            </p>
          </div>
          <div className="flex gap-8 text-sm text-zinc-500">
            <Link href="/create" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Create
            </Link>
            <Link href="/pricing" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Pricing
            </Link>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-zinc-400">
          &copy; {new Date().getFullYear()} SignatureCraft. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
