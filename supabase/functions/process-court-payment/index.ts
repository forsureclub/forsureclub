
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
  bookingId: string;
  clubId: string;
  returnUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, clubId, returnUrl }: PaymentRequest = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("court_bookings")
      .select(`
        *,
        clubs (*),
        courts (*)
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }

    // Calculate duration and price
    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const totalPrice = Math.round(booking.clubs.price_per_hour * durationHours * 100); // Convert to pence

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Court Booking - ${booking.clubs.name}`,
              description: `${booking.courts?.name || 'Court'} booking on ${new Date(booking.booking_date).toLocaleDateString()}`,
            },
            unit_amount: totalPrice,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${req.headers.get("origin")}/book-court`,
      metadata: {
        bookingId,
        clubId,
      },
    });

    // Update booking with payment session
    await supabase
      .from("court_bookings")
      .update({
        stripe_session_id: session.id,
        total_price: totalPrice / 100,
        status: 'pending_payment'
      })
      .eq("id", bookingId);

    return new Response(JSON.stringify({ 
      paymentUrl: session.url,
      totalPrice: (totalPrice / 100).toFixed(2)
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in process-court-payment function:", error);
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
