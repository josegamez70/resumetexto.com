import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export const handler = async (event: any) => {
  try {
    const sig = event.headers["stripe-signature"];
    const body = event.body;

    if (!sig || !body) return { statusCode: 400, body: "No signature/body" };

    const stripeEvent = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);

    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      const userId = (session.metadata && session.metadata.userId) || null;

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

export const config = { bodyParser: false };
