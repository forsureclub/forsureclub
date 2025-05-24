
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MatchNotificationRequest {
  recipientEmail: string;
  matchDetails: {
    initiatorName: string;
    sport: string;
    location: string;
    date: string;
    matchId: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, matchDetails }: MatchNotificationRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "Sports Match <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `${matchDetails.initiatorName} wants to play ${matchDetails.sport} with you!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ea580c;">New Match Request!</h1>
          <p>Hi there!</p>
          <p><strong>${matchDetails.initiatorName}</strong> has sent you a match request for <strong>${matchDetails.sport}</strong>.</p>
          
          <div style="background: #f97316; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0; color: white;">Match Details:</h3>
            <p style="margin: 5px 0; color: white;"><strong>Sport:</strong> ${matchDetails.sport}</p>
            <p style="margin: 5px 0; color: white;"><strong>Location:</strong> ${matchDetails.location}</p>
            <p style="margin: 5px 0; color: white;"><strong>Proposed Date:</strong> ${matchDetails.date}</p>
          </div>
          
          <p>Log in to your account to accept or decline this match request.</p>
          <p>Once both players confirm, you'll be able to message each other to coordinate the details!</p>
          
          <p>Happy playing!<br>The Sports Match Team</p>
        </div>
      `,
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-match-notification function:", error);
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
