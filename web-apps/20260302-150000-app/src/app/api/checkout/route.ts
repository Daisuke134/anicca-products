import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const priceId = process.env.STRIPE_PRICE_ID;
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  if (!priceId) {
    return NextResponse.json(
      { error: "STRIPE_PRICE_ID not configured" },
      { status: 500 }
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/pricing`,
  });

  return NextResponse.redirect(session.url!, 303);
}
