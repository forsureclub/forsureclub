
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MATCHI_API_KEY = Deno.env.get("MATCHI_API_KEY");
const MATCHI_BASE_URL = "https://api.matchi.se/api/v1";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, matchId, facilityId, date, startTime, endTime, playerIds } = await req.json();

    // Different endpoints based on action
    switch (action) {
      case "getAvailableSlots":
        return await getAvailableSlots(facilityId, date);
      case "bookCourt":
        return await bookCourt(facilityId, date, startTime, endTime, playerIds);
      case "confirmMatch":
        return await confirmMatch(matchId, playerIds);
      default:
        throw new Error("Invalid action specified");
    }
  } catch (error) {
    console.error("Matchi API error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});

// Get available court slots from Matchi
async function getAvailableSlots(facilityId: string, date: string) {
  const response = await fetch(
    `${MATCHI_BASE_URL}/facilities/${facilityId}/slots?date=${date}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${MATCHI_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to get available slots: ${errorData}`);
  }

  const data = await response.json();
  return new Response(
    JSON.stringify({ slots: data }),
    { 
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json" 
      } 
    }
  );
}

// Book a court at the facility
async function bookCourt(facilityId: string, date: string, startTime: string, endTime: string, playerIds: string[]) {
  const response = await fetch(
    `${MATCHI_BASE_URL}/facilities/${facilityId}/bookings`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MATCHI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        date,
        start_time: startTime,
        end_time: endTime,
        player_ids: playerIds
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to book court: ${errorData}`);
  }

  const data = await response.json();
  return new Response(
    JSON.stringify({ booking: data }),
    { 
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json" 
      } 
    }
  );
}

// Update match status to confirmed when all players have confirmed
async function confirmMatch(matchId: string, playerIds: string[]) {
  // First check if all players in the match have confirmed
  const { data: match, error } = await supabase
    .from("matches")
    .select("id, status")
    .eq("id", matchId)
    .single();

  if (error || !match) {
    throw new Error(`Match not found: ${error?.message}`);
  }

  // Check if all players have confirmed
  const { data: confirmations, error: confirmationsError } = await supabase
    .from("match_players")
    .select("player_id, has_confirmed")
    .eq("match_id", matchId);

  if (confirmationsError || !confirmations) {
    throw new Error(`Failed to get match confirmations: ${confirmationsError?.message}`);
  }

  const allConfirmed = confirmations.every(p => p.has_confirmed);
  
  if (!allConfirmed) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Not all players have confirmed yet" 
      }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  }

  // If all confirmed, update match status and proceed with booking
  const { error: updateError } = await supabase
    .from("matches")
    .update({ status: "confirmed" })
    .eq("id", matchId);

  if (updateError) {
    throw new Error(`Failed to update match status: ${updateError.message}`);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: "Match confirmed, ready for court booking" 
    }),
    { 
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json" 
      } 
    }
  );
}
