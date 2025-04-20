
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { playerEmail, matchDetails } = await req.json()
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

    const { data, error } = await resend.emails.send({
      from: "ForSure Club <matches@yourdomain.com>",
      to: [playerEmail],
      subject: "New Match Details Available!",
      html: `
        <div style="font-family: sans-serif;">
          <h1>Your Match is Confirmed!</h1>
          <p>New match details are available in your dashboard.</p>
          <p>Match Details:</p>
          <ul>
            <li>Date: ${matchDetails.date}</li>
            <li>Location: ${matchDetails.location}</li>
            <li>Players: ${matchDetails.players.join(", ")}</li>
          </ul>
          <p>Log in to your account to view full details and confirm your attendance.</p>
        </div>
      `,
    })

    if (error) {
      throw error
    }

    return new Response(JSON.stringify(data), {
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
