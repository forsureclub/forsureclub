
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

interface PaymentRequest {
  matchId: string;
  timeSlot: string;
  playerId: string;
}

const calculatePrice = (timeSlot: string): number => {
  const basePrice = 1000; // £10.00 in pence
  const hour = parseInt(timeSlot.split(':')[0]);
  
  // Peak hours (6-9 AM, 5-9 PM) cost 50% more
  const isPeakHour = (hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 21);
  
  return isPeakHour ? Math.round(basePrice * 1.5) : basePrice;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { matchId, timeSlot, playerId }: PaymentRequest = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get player details
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("name, email")
      .eq("id", playerId)
      .single();

    if (playerError || !player) {
      throw new Error("Player not found");
    }

    // Get match details
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("sport, location, played_at")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      throw new Error("Match not found");
    }

    const price = calculatePrice(timeSlot);
    const priceInPounds = (price / 100).toFixed(2);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `${match.sport} Match Payment`,
              description: `Match at ${match.location} on ${new Date(match.played_at).toLocaleDateString()}`,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&match_id=${matchId}`,
      cancel_url: `${req.headers.get("origin")}/dashboard`,
      customer_email: player.email,
      metadata: {
        matchId,
        playerId,
        timeSlot,
      },
    });

    // Record payment intent
    await supabase
      .from("match_payments")
      .insert({
        match_id: matchId,
        player_id: playerId,
        stripe_session_id: session.id,
        amount: price,
        status: 'pending'
      });

    return new Response(JSON.stringify({ 
      sessionUrl: session.url,
      price: priceInPounds 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in process-match-payment function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
