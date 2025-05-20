
import { supabase } from "@/integrations/supabase/client";
import { sendMatchNotifications } from "./notifications";

/**
 * Creates a match between players
 */
export async function createMatch(
  initiatorId: string,
  matchedPlayers: any[],
  sport: string,
  location: string,
  preferredDate?: string
) {
  try {
    // Format match date - use preferred date if provided, otherwise default to tomorrow
    const matchDate = preferredDate 
      ? new Date(preferredDate) 
      : new Date(new Date().setDate(new Date().getDate() + 1));
    
    // Create a match record
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        sport,
        location,
        played_at: matchDate.toISOString(),
        status: 'pending'
      })
      .select('id')
      .single();
    
    if (matchError) throw matchError;
    
    // Add the initiator to the match
    const matchPlayers = [
      {
        match_id: match.id,
        player_id: initiatorId,
        has_confirmed: true // Initiator automatically confirms
      },
      ...matchedPlayers.map(player => ({
        match_id: match.id,
        player_id: player.id,
        has_confirmed: false // Other players need to confirm
      }))
    ];
    
    const { error: playerError } = await supabase
      .from('match_players')
      .insert(matchPlayers);
    
    if (playerError) throw playerError;
    
    // Send match notification emails to all players
    // This would typically call an edge function to send emails
    
    console.log(`Match created: ${match.id} for ${sport} in ${location} on ${matchDate.toISOString()}`);
    return match;
  } catch (error) {
    console.error("Error creating match:", error);
    throw error;
  }
}

/**
 * Creates a match with 4 players (doubles format)
 */
export async function createDoublesMatch(
  initiatorId: string,
  matchedPlayers: any[],
  sport: string,
  location: string
): Promise<void> {
  try {
    // Create a new doubles match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .insert({
        sport,
        location,
        played_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
        status: "scheduled",
        booking_details: { format: "doubles", teams: "auto_balanced" }
      })
      .select()
      .single();

    if (matchError || !match) {
      throw new Error(`Failed to create doubles match: ${matchError?.message}`);
    }

    // Add the initiator and matched players to the match
    const matchPlayers = [
      {
        match_id: match.id,
        player_id: initiatorId,
        has_confirmed: true  // Initiator is auto-confirmed
      },
      ...matchedPlayers.map(player => ({
        match_id: match.id,
        player_id: player.id,
        has_confirmed: false  // Other players need to confirm
      }))
    ];

    const { error: playersError } = await supabase
      .from("match_players")
      .insert(matchPlayers);

    if (playersError) {
      throw new Error(`Failed to add players to doubles match: ${playersError.message}`);
    }

    // Send notifications to all players
    const playerIds = [initiatorId, ...matchedPlayers.map(p => p.id)];
    await sendMatchNotifications(playerIds, match.id, sport, location, match.played_at);
    
    console.log(`Doubles match created successfully with ID: ${match.id}`);
  } catch (error) {
    console.error("Error creating doubles match:", error);
    throw error;
  }
}

/**
 * Check if a match is ready for court booking (all players confirmed)
 */
export async function isMatchReadyForBooking(matchId: string): Promise<boolean> {
  try {
    // Get all players in the match
    const { data, error } = await supabase
      .from("match_players")
      .select("has_confirmed")
      .eq("match_id", matchId);

    if (error || !data) {
      console.error("Error checking match players:", error);
      return false;
    }

    // Check if all players have confirmed
    return data && data.length > 0 && data.every(player => player.has_confirmed);
  } catch (error) {
    console.error("Error checking if match is ready for booking:", error);
    return false;
  }
}
