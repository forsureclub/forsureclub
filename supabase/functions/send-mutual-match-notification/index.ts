
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MutualMatchRequest {
  email1: string;
  email2: string;
  matchDetails: {
    player1Name: string;
    player2Name: string;
    sport: string;
    location: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email1, email2, matchDetails }: MutualMatchRequest = await req.json();

    // Send email to both players
    const emailPromises = [
      resend.emails.send({
        from: "Sports Match <onboarding@resend.dev>",
        to: [email1],
        subject: `🎉 It's a Match! You and ${matchDetails.player2Name} can now play together!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ea580c;">🎉 It's a Match!</h1>
            <p>Great news, ${matchDetails.player1Name}!</p>
            <p>You and <strong>${matchDetails.player2Name}</strong> have both shown interest in playing together!</p>
            
            <div style="background: #f97316; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0; color: white;">Match Details:</h3>
              <p style="margin: 5px 0; color: white;"><strong>Sport:</strong> ${matchDetails.sport}</p>
              <p style="margin: 5px 0; color: white;"><strong>Location:</strong> ${matchDetails.location}</p>
            </div>
            
            <p>You can now message each other to coordinate your game details!</p>
            <p>Log in to your account to start chatting and arrange your match.</p>
            
            <p>Have a great game!<br>The Sports Match Team</p>
          </div>
        `,
      }),
      resend.emails.send({
        from: "Sports Match <onboarding@resend.dev>",
        to: [email2],
        subject: `🎉 It's a Match! You and ${matchDetails.player1Name} can now play together!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ea580c;">🎉 It's a Match!</h1>
            <p>Great news, ${matchDetails.player2Name}!</p>
            <p>You and <strong>${matchDetails.player1Name}</strong> have both shown interest in playing together!</p>
            
            <div style="background: #f97316; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0; color: white;">Match Details:</h3>
              <p style="margin: 5px 0; color: white;"><strong>Sport:</strong> ${matchDetails.sport}</p>
              <p style="margin: 5px 0; color: white;"><strong>Location:</strong> ${matchDetails.location}</p>
            </div>
            
            <p>You can now message each other to coordinate your game details!</p>
            <p>Log in to your account to start chatting and arrange your match.</p>
            
            <p>Have a great game!<br>The Sports Match Team</p>
          </div>
        `,
      })
    ];

    await Promise.all(emailPromises);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-mutual-match-notification function:", error);
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
