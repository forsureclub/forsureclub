
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  )

  try {
    const authHeader = req.headers.get("Authorization")!
    const token = authHeader.replace("Bearer ", "")
    const { data } = await supabaseClient.auth.getUser(token)
    const user = data.user
    if (!user?.email) throw new Error("User not authenticated or email not available")

    const { tier } = await req.json()
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" })
    
    // Find or create customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 })
    let customerId
    if (customers.data.length > 0) {
      customerId = customers.data[0].id
    }

    // Price IDs based on tier
    const priceIds = {
      basic: "price_basic", // Replace with your actual Stripe price IDs
      premium: "price_premium",
      enterprise: "price_enterprise"
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceIds[tier], quantity: 1 }],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/subscription/success`,
      cancel_url: `${req.headers.get("origin")}/subscription/cancel`,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
