
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Player = Tables<"players">;
type MatchingResult = {
  matchedPlayers: Player[];
  foundMatch: boolean;
};

/**
 * Finds matching players based on sport, location, and skill level
 * @param sport The sport to match
 * @param location The player's location
 * @param skillLevel The player's skill level
 * @param playerId The current player's ID (to exclude from results)
 */
export async function findMatchingPlayers(
  sport: string,
  location: string,
  skillLevel: string,
  playerId: string
): Promise<MatchingResult> {
  console.log(`Finding matches for ${sport} in ${location} with level ${skillLevel}`);
  
  // First match by sport and location
  const { data: matchedPlayers, error } = await supabase
    .from("players")
    .select("*")
    .eq("sport", sport)
    .eq("city", location)
    .neq("id", playerId) // Exclude the current player
    .limit(3);

  if (error) {
    console.error("Error finding matches:", error);
    throw new Error(`Error finding matches: ${error.message}`);
  }

  // If we don't have enough matches by location, try to find more players by sport only
  if (matchedPlayers.length < 3) {
    console.log(`Not enough matches in ${location}, trying wider search`);
    
    const { data: additionalPlayers, error: widerError } = await supabase
      .from("players")
      .select("*")
      .eq("sport", sport)
      .neq("city", location) // Different location
      .neq("id", playerId)
      .order("rating", { ascending: false }) // Prioritize by skill level
      .limit(3 - matchedPlayers.length); // Only get what we need

    if (widerError) {
      console.error("Error in wider search:", widerError);
    } else if (additionalPlayers) {
      matchedPlayers.push(...additionalPlayers);
    }
  }

  // We have a match if we found at least 3 other players
  const foundMatch = matchedPlayers.length >= 3;
  
  return {
    matchedPlayers,
    foundMatch
  };
}

/**
 * Registers a player for matchmaking and attempts to find an immediate match
 */
export async function registerPlayerForMatchmaking(playerId: string, sport: string, location: string, skillLevel: string, email: string): Promise<MatchingResult> {
  try {
    console.log(`Registering player ${playerId} for matchmaking`);
    
    // Register the player in the matchmaking queue
    const { error: registrationError } = await supabase
      .from("player_registrations")
      .upsert({
        player_id: playerId,
        status: "waiting",
        admin_notes: `Looking for ${sport} match in ${location}`
      });

    if (registrationError) {
      throw registrationError;
    }

    // Try to find an immediate match
    const matchResult = await findMatchingPlayers(sport, location, skillLevel, playerId);
    
    // If we found enough players, create the match
    if (matchResult.foundMatch) {
      await createMatch(playerId, matchResult.matchedPlayers, sport, location);
      return matchResult;
    }
    
    // If we didn't find enough players, queue them for later matching
    // and send an email when we find matches
    await queuePlayerForLaterMatching(playerId, email, sport, location, skillLevel);
    
    return matchResult;
  } catch (error) {
    console.error("Error in registerPlayerForMatchmaking:", error);
    throw error;
  }
}

/**
 * Creates a match with the found players
 */
async function createMatch(
  initiatorId: string,
  matchedPlayers: Player[],
  sport: string,
  location: string
): Promise<void> {
  try {
    // Create a new match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .insert({
        sport,
        location,
        played_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
        status: "scheduled"
      })
      .select()
      .single();

    if (matchError || !match) {
      throw new Error(`Failed to create match: ${matchError?.message}`);
    }

    // Add the initiator and matched players to the match
    const matchPlayers = [
      {
        match_id: match.id,
        player_id: initiatorId
      },
      ...matchedPlayers.map(player => ({
        match_id: match.id,
        player_id: player.id
      }))
    ];

    const { error: playersError } = await supabase
      .from("match_players")
      .insert(matchPlayers);

    if (playersError) {
      throw new Error(`Failed to add players to match: ${playersError.message}`);
    }

    // Send notifications to all players
    const playerIds = [initiatorId, ...matchedPlayers.map(p => p.id)];
    await sendMatchNotifications(playerIds, match.id, sport, location, match.played_at);
    
    console.log(`Match created successfully with ID: ${match.id}`);
  } catch (error) {
    console.error("Error creating match:", error);
    throw error;
  }
}

/**
 * Queue a player for matching later when we have enough players
 */
async function queuePlayerForLaterMatching(
  playerId: string,
  email: string, 
  sport: string,
  location: string,
  skillLevel: string
): Promise<void> {
  console.log(`Queueing player ${playerId} for later matching`);
  
  // Update the registration status to indicate we're waiting for more players
  const { error: updateError } = await supabase
    .from("player_registrations")
    .update({
      status: "pending",
      admin_notes: `Waiting for more ${sport} players in ${location}. Will email ${email} when found.`
    })
    .eq("player_id", playerId);

  if (updateError) {
    console.error("Error updating player registration:", updateError);
    throw updateError;
  }
}

/**
 * Send match notifications to all players
 */
async function sendMatchNotifications(
  playerIds: string[],
  matchId: string,
  sport: string,
  location: string,
  playDate: string
): Promise<void> {
  try {
    // Get player emails
    const { data: players, error } = await supabase
      .from("players")
      .select("id, email, name")
      .in("id", playerIds);

    if (error || !players) {
      throw new Error(`Failed to fetch player emails: ${error?.message}`);
    }

    // Send email to each player
    for (const player of players) {
      if (player.email) {
        await sendMatchEmail(player.email, {
          date: new Date(playDate).toLocaleDateString(),
          location,
          players: players.map(p => p.name),
          sport,
          matchId
        });
      }
    }
  } catch (error) {
    console.error("Error sending match notifications:", error);
  }
}

/**
 * Send an email notification about a match
 */
async function sendMatchEmail(
  playerEmail: string,
  matchDetails: {
    date: string;
    location: string;
    players: string[];
    sport: string;
    matchId: string;
  }
): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("send-match-email", {
      body: { playerEmail, matchDetails }
    });
    
    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
    
    console.log(`Match email sent to ${playerEmail}`);
  } catch (error) {
    console.error("Error sending match email:", error);
  }
}
