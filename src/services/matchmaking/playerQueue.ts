
import { supabase } from "@/integrations/supabase/client";

/**
 * Queue a player for matching later when we have enough players
 */
export async function queuePlayerForLaterMatching(
  playerId: string,
  email: string, 
  sport: string,
  location: string,
  skillLevel: string,
  playerCount: '1' | '2' | '3' = '1'
): Promise<void> {
  console.log(`Queueing player ${playerId} for later matching, looking for ${playerCount} player(s)`);
  
  // Update the registration status to indicate we're waiting for more players
  const { error: updateError } = await supabase
    .from("player_registrations")
    .update({
      status: "pending",
      admin_notes: `Waiting for ${playerCount} ${sport} player(s) in ${location}. Will email ${email} when found.`
    })
    .eq("player_id", playerId);

  if (updateError) {
    console.error("Error updating player registration:", updateError);
    throw updateError;
  }
}

/**
 * Queue a player for doubles matching when we need to find 3 more players
 */
export async function queuePlayerForDoublesMatching(
  playerId: string,
  email: string, 
  sport: string,
  location: string,
  skillLevel: string,
  gender: string
): Promise<void> {
  console.log(`Queueing player ${playerId} for doubles matching in ${location}`);
  
  // Update the registration status to indicate we're waiting for more players for doubles
  const { error: updateError } = await supabase
    .from("player_registrations")
    .update({
      status: "waiting_doubles",
      admin_notes: `Waiting for 3 more ${gender} ${sport} players in ${location} for doubles. Will email ${email} when found.`
    })
    .eq("player_id", playerId);

  if (updateError) {
    console.error("Error updating player registration for doubles:", updateError);
    throw updateError;
  }
}
