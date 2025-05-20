
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { findMatchingPlayers, findFourPlayersForMatch, type MatchingResult } from "./matchingAlgorithm";
import { createMatch, createDoublesMatch } from "./matchCreation";
import { queuePlayerForLaterMatching, queuePlayerForDoublesMatching } from "./playerQueue";

/**
 * Registers a player for matchmaking and attempts to find an immediate match
 */
export async function registerPlayerForMatchmaking(
  playerId: string, 
  sport: string, 
  location: string, 
  skillLevel: string,
  gender: string,
  email: string,
  playerCount: '1' | '2' | '3' = '1',
  preferredDate?: string,
  playStyle?: string
): Promise<MatchingResult> {
  try {
    console.log(`Registering player ${playerId} for matchmaking, looking for ${playerCount} players`);
    console.log(`Additional parameters - Date: ${preferredDate || 'Any'}, Play Style: ${playStyle || 'Any'}`);
    
    // Register the player in the matchmaking queue with player count info and preferences
    const { error: registrationError } = await supabase
      .from("player_registrations")
      .upsert({
        player_id: playerId,
        status: "waiting",
        admin_notes: `Looking for ${sport} match in ${location} with ${playerCount} additional player(s). Preferred date: ${preferredDate || 'Any'}, Play style: ${playStyle || 'Any'}`
      });

    if (registrationError) {
      throw registrationError;
    }

    // First, get the player_ids from registrations
    const { data: registeredPlayerIds, error: registrationQueryError } = await supabase
      .from("player_registrations")
      .select("player_id");
    
    if (registrationQueryError) {
      console.error("Error fetching registered players:", registrationQueryError);
      throw new Error(`Error fetching registered players: ${registrationQueryError.message}`);
    }

    // Extract the player_id values into an array
    const playerIdArray = registeredPlayerIds.map(row => row.player_id);

    // Get all potential players for the sport who have registrations
    const { data: potentialPlayers, error } = await supabase
      .from("players")
      .select("*")
      .eq("sport", sport)
      .neq("id", playerId)
      .in("id", playerIdArray); // Use the array of player_ids

    if (error) {
      console.error("Error finding matches:", error);
      throw new Error(`Error finding matches: ${error.message}`);
    }

    // Try to find an immediate match using our AI matchmaking algorithm, specifying player count and preferences
    const matchResult = await findMatchingPlayers(
      potentialPlayers || [], 
      sport, 
      location, 
      skillLevel,
      gender, 
      playerId,
      parseInt(playerCount), // Convert to number for the algorithm
      preferredDate,
      playStyle
    );
    
    // If we found enough players, create the match
    if (matchResult.foundMatch) {
      await createMatch(
        playerId, 
        matchResult.matchedPlayers, 
        sport, 
        location,
        preferredDate // Pass preferred date for booking
      );
      return matchResult;
    }
    
    // If we didn't find enough players, queue them for later matching
    await queuePlayerForLaterMatching(
      playerId, 
      email, 
      sport, 
      location, 
      skillLevel, 
      playerCount,
      preferredDate,
      playStyle
    );
    
    return matchResult;
  } catch (error) {
    console.error("Error in registerPlayerForMatchmaking:", error);
    toast.error({
      title: "Matching Error",
      description: "There was an error organizing your match. Please try again.",
    });
    throw error;
  }
}

/**
 * Organizes a doubles match with 4 players of similar skill levels
 */
export async function organizeFourPlayerMatch(
  playerId: string, 
  sport: string, 
  location: string, 
  skillLevel: string, 
  gender: string, 
  email: string
): Promise<MatchingResult> {
  try {
    console.log(`Setting up 4-player match for ${sport} in ${location} with level ${skillLevel}`);
    
    // Register the player in the matchmaking queue
    const { error: registrationError } = await supabase
      .from("player_registrations")
      .upsert({
        player_id: playerId,
        status: "waiting_doubles",
        admin_notes: `Looking for ${sport} doubles match in ${location}`
      });

    if (registrationError) {
      throw registrationError;
    }

    // Get all potential players for the sport with matching gender
    const { data: potentialPlayers, error } = await supabase
      .from("players")
      .select("*")
      .eq("sport", sport)
      .eq("gender", gender);  // Match based on gender

    if (error) {
      console.error("Error finding matches:", error);
      throw new Error(`Error finding matches: ${error.message}`);
    }

    // Try to find 3 more players for a doubles match
    const matchResult = await findFourPlayersForMatch(
      potentialPlayers || [], 
      sport, 
      location, 
      skillLevel, 
      gender, 
      playerId
    );
    
    // If we found enough players, create the match
    if (matchResult.foundMatch) {
      await createDoublesMatch(playerId, matchResult.matchedPlayers, sport, location);
      toast.success({
        title: "Doubles Match Organized!",
        description: `We've found 3 other players for your ${sport} match in ${location}!`,
      });
      return matchResult;
    }
    
    // If we didn't find enough players, queue them for later matching
    await queuePlayerForDoublesMatching(playerId, email, sport, location, skillLevel, gender);
    toast.success({
        title: "Doubles Match Pending",
        description: `We'll notify you when we find 3 more players for your ${sport} match.`,
    });
    
    return matchResult;
  } catch (error) {
    console.error("Error in organizeFourPlayerMatch:", error);
    toast.error({
        title: "Matching Error",
        description: "There was an error organizing your match. Please try again.",
    });
    throw error;
  }
}

export { isMatchReadyForBooking } from "./matchCreation";
export type { MatchingResult } from "./matchingAlgorithm";
