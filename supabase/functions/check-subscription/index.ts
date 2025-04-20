
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
    const { data: userData } = await supabaseClient.auth.getUser(token)
    const user = userData.user
    if (!user?.email) throw new Error("Not authenticated")

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" })
    const customers = await stripe.customers.list({ email: user.email, limit: 1 })
    
    if (customers.data.length === 0) {
      await updateSubscriptionStatus(supabaseClient, user.email, user.id, null, false, null, null)
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const customerId = customers.data[0].id
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    })

    const hasActiveSub = subscriptions.data.length > 0
    let subscriptionTier = null
    let subscriptionEnd = null

    if (hasActiveSub) {
      const subscription = subscriptions.data[0]
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString()
      const priceId = subscription.items.data[0].price.id
      subscriptionTier = getPriceIdToTier(priceId)
    }

    await updateSubscriptionStatus(
      supabaseClient,
      user.email,
      user.id,
      customerId,
      hasActiveSub,
      subscriptionTier,
      subscriptionEnd
    )

    return new Response(
      JSON.stringify({
        subscribed: hasActiveSub,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})

async function updateSubscriptionStatus(
  supabaseClient,
  email,
  userId,
  stripeCustomerId,
  subscribed,
  subscriptionTier,
  subscriptionEnd
) {
  await supabaseClient.from("subscribers").upsert({
    email,
    user_id: userId,
    stripe_customer_id: stripeCustomerId,
    subscribed,
    subscription_tier: subscriptionTier,
    subscription_end: subscriptionEnd,
    updated_at: new Date().toISOString(),
  })
}

function getPriceIdToTier(priceId: string) {
  // Replace with your actual price ID to tier mapping
  const mapping = {
    "price_basic": "basic",
    "price_premium": "premium",
    "price_enterprise": "enterprise"
  }
  return mapping[priceId] || null
}
