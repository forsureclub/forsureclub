import { supabase } from "@/integrations/supabase/client";

/**
 * Queue a player for later matching when no immediate match is found
 */
export async function queuePlayerForLaterMatching(
  playerId: string,
  email: string,
  sport: string,
  location: string,
  skillLevel: string,
  playerCount: string = '1',
  preferredDate?: string,
  playStyle?: string
): Promise<void> {
  try {
    console.log(`Queueing player ${playerId} for later matching`);
    
    // Update the status in the player registrations table
    const { error } = await supabase
      .from('player_registrations')
      .update({
        status: 'waiting_match',
        admin_notes: `Looking for ${sport} match in ${location} with ${playerCount} player(s). ` +
                    `Skill level: ${skillLevel}, Date: ${preferredDate || 'Any'}, Style: ${playStyle || 'Any'}`
      })
      .eq('player_id', playerId);
    
    if (error) {
      console.error("Error queueing player for later matching:", error);
      throw error;
    }
    
    // TODO: Potentially trigger a background process to look for matches periodically
  } catch (error) {
    console.error("Error in queuePlayerForLaterMatching:", error);
    throw error;
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
