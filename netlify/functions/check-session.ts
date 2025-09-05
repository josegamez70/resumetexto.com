import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== "GET") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const sessionId = event.queryStringParameters?.session_id;
    if (!sessionId) return { statusCode: 400, body: "Missing session_id" };

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    const paid =
      session.payment_status === "paid" ||
      (session.payment_intent &&
        typeof session.payment_intent === "object" &&
        (session.payment_intent as any).status === "succeeded");

    // Fallback: si está pagado, asegúrate de marcar PRO
    if (paid && session.metadata?.userId) {
      await supabaseAdmin
        .from("profiles")
        .update({ plan: "pro" })
        .eq("id", session.metadata.userId);
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paid,
        session_status: session.status,
        payment_status: session.payment_status,
      }),
    };
  } catch (err: any) {
    console.error("check-session error:", err);
    return { statusCode: 500, body: err?.message || "Server error" };
  }
};
