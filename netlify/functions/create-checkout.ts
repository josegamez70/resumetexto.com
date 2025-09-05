import Stripe from "stripe";

export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2024-06-20",
    });

    const { userId, email } = JSON.parse(event.body || "{}");
    if (!userId) return { statusCode: 400, body: "Missing userId" };

    const success_url = `${process.env.SITE_URL}/?checkout_success=1&session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url  = `${process.env.SITE_URL}/?checkout_canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",                       // si es suscripción: "subscription"
      customer_email: email || undefined,
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      success_url,
      cancel_url,
      metadata: { userId },
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err: any) {
    console.error("create-checkout error:", err);
    return { statusCode: 500, body: err?.message || "Server error" };
  }
};
