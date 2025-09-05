import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== "GET") return { statusCode: 405, body: "Method Not Allowed" };

    const sessionId = event.queryStringParameters?.session_id;
    if (!sessionId) return { statusCode: 400, body: "Missing session_id" };

    // ✅ Lee envs con fallback a REACT_APP_*
    const {
      STRIPE_SECRET_KEY,
      SUPABASE_SERVICE_ROLE_KEY,
    } = process.env as Record<string, string>;

    const SUPABASE_URL =
      (process.env.SUPABASE_URL as string) ||
      (process.env.REACT_APP_SUPABASE_URL as string);

    if (!STRIPE_SECRET_KEY) return { statusCode: 500, body: "Server misconfigured (Stripe key)" };
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
      return { statusCode: 500, body: "Server misconfigured (Supabase envs)" };

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["payment_intent"] });

    const paid =
      session.payment_status === "paid" ||
      (typeof session.payment_intent === "object" &&
        (session.payment_intent as any)?.status === "succeeded");

    // Fallback al webhook: si está pagado, asegura PRO
    if (paid && session.metadata?.userId) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ plan: "pro" })
        .eq("id", session.metadata.userId);
      if (error) console.error("Supabase update error:", error);
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid, session_status: session.status, payment_status: session.payment_status }),
    };
  } catch (err: any) {
    console.error("check-session error:", err);
    return { statusCode: 500, body: err?.message || "Server error" };
  }
};
