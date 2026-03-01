import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="rounded-lg border border-[#1a1a1a] bg-[#111111] p-12 text-center">
        <div className="mb-4 text-5xl">✓</div>
        <h1 className="text-2xl font-bold">Welcome to Pro!</h1>
        <p className="mt-3 text-[#737373]">
          Your subscription is active. Enjoy all premium features.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-blue-500 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-600"
        >
          Start Focusing
        </Link>
      </div>
    </div>
  );
}
