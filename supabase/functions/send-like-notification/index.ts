
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LikeNotificationRequest {
  recipientEmail: string;
  likeDetails: {
    likerName: string;
    sport: string;
    location: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, likeDetails }: LikeNotificationRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "Sports Match <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `${likeDetails.likerName} is interested in playing ${likeDetails.sport} with you!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ea580c;">Someone's Interested!</h1>
          <p>Hi there!</p>
          <p><strong>${likeDetails.likerName}</strong> has shown interest in playing <strong>${likeDetails.sport}</strong> with you in <strong>${likeDetails.location}</strong>!</p>
          
          <div style="background: #f97316; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0; color: white;">What's Next?</h3>
            <p style="margin: 5px 0; color: white;">Log in to your account to see their profile and decide if you'd like to match!</p>
            <p style="margin: 5px 0; color: white;">If you both like each other, you'll be able to message and coordinate your game.</p>
          </div>
          
          <p>Don't keep them waiting - check out their profile now!</p>
          
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
    console.error("Error in send-like-notification function:", error);
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
