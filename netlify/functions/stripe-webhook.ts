import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const handler = async (event: any) => {
  try {
    const sig = event.headers["stripe-signature"];
    const rawBody = event.body;
    if (!sig || !rawBody) return { statusCode: 400, body: "No signature/body" };

    const {
      STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET,
      SUPABASE_SERVICE_ROLE_KEY,
    } = process.env as Record<string, string>;

    const SUPABASE_URL =
      (process.env.SUPABASE_URL as string) ||
      (process.env.REACT_APP_SUPABASE_URL as string);

    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET)
      return { statusCode: 500, body: "Server misconfigured (Stripe webhook envs)" };
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
      return { statusCode: 500, body: "Server misconfigured (Supabase envs)" };

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const ev = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);

    if (ev.type === "checkout.session.completed") {
      const session = ev.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId || null;

      console.log("WEBHOOK checkout.session.completed", {
        session_id: session.id,
        userId,
        payment_status: session.payment_status,
      });

      if (userId) {
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ plan: "pro" })
          .eq("id", userId);
        if (error) {
          console.error("Supabase update error:", error);
          return { statusCode: 500, body: "Supabase update failed" };
        }
      }
    }

    return { statusCode: 200, body: "ok" };
  } catch (err: any) {
    console.error("webhook error:", err);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }
};

// Necesario para cuerpo RAW en Stripe webhooks
export const config = { bodyParser: false };
