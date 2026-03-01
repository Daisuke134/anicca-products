"use client";

import { useState } from "react";
import { createCheckoutSession } from "@/lib/actions";

export function CheckoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const url = await createCheckoutSession();
      if (url) {
        window.location.href = url;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="block w-full rounded-lg bg-indigo-600 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
    >
      {loading ? "Redirecting..." : "Start Pro"}
    </button>
  );
}
