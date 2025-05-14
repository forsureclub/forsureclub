import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

type Player = Tables<"players">;
type MatchingResult = {
  matchedPlayers: Player[];
  foundMatch: boolean;
  matchScore?: number;
};

/**
 * Advanced AI matchmaking algorithm that finds players based on sport, location, and skill level
 * Uses a scoring system to find the best possible matches
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
  
  // First, get all potential players for the sport
  const { data: potentialPlayers, error } = await supabase
    .from("players")
    .select("*")
    .eq("sport", sport)
    .neq("id", playerId); // Exclude the current player

  if (error) {
    console.error("Error finding matches:", error);
    throw new Error(`Error finding matches: ${error.message}`);
  }

  if (!potentialPlayers || potentialPlayers.length === 0) {
    return { matchedPlayers: [], foundMatch: false, matchScore: 0 };
  }

  // Calculate match score for each player
  const scoredPlayers = potentialPlayers.map(player => {
    // Location matching (exact match = 100, different = 0)
    const locationScore = player.city === location ? 100 : 0;
    
    // Skill level matching (convert to numeric if possible for better comparison)
    let skillScore = 0;
    
    // For Golf handicaps
    if (sport === "Golf") {
      const playerHandicap = parseHandicap(player.rating.toString());
      const targetHandicap = parseHandicap(skillLevel);
      
      // Calculate difference (closer = higher score)
      const handicapDiff = Math.abs(playerHandicap - targetHandicap);
      skillScore = Math.max(0, 100 - (handicapDiff * 5)); // 5 points per handicap difference
    } 
    // For other sports with numeric ratings
    else {
      const playerRating = parseFloat(player.rating.toString()) || 0;
      const targetRating = convertSkillLevelToRating(skillLevel);
      
      // Calculate difference (closer = higher score)
      const ratingDiff = Math.abs(playerRating - targetRating);
      skillScore = Math.max(0, 100 - (ratingDiff * 20)); // 20 points per rating difference
    }
    
    // Availability matching bonus
    const availabilityScore = player.play_time === "both" ? 20 : 0;
    
    // Calculate total score - weight location more heavily
    const totalScore = (locationScore * 0.6) + (skillScore * 0.3) + (availabilityScore * 0.1);
    
    return {
      player,
      score: totalScore
    };
  });
  
  // Sort by score (highest first)
  scoredPlayers.sort((a, b) => b.score - a.score);
  
  // Get the top matches (up to 3)
  const bestMatches = scoredPlayers.slice(0, 3).map(match => match.player);
  const highestScore = scoredPlayers.length > 0 ? scoredPlayers[0].score : 0;
  
  // We have a good match if we found players with a decent score
  const foundMatch = bestMatches.length > 0 && highestScore > 60;

  console.log(`Found ${bestMatches.length} potential matches with highest score: ${highestScore}`);
  
  return {
    matchedPlayers: bestMatches,
    foundMatch: foundMatch,
    matchScore: highestScore
  };
}

/**
 * Matches four players for a doubles game based on gender, location and skill level
 * @param sport The sport to match (Tennis, Padel, etc)
 * @param location The player's location
 * @param skillLevel The player's skill level
 * @param gender The player's gender
 * @param playerId The current player's ID (to exclude from results)
 */
export async function findFourPlayersForMatch(
  sport: string,
  location: string,
  skillLevel: string,
  gender: string,
  playerId: string
): Promise<MatchingResult> {
  console.log(`Finding 4-player match for ${sport} in ${location} with level ${skillLevel}, gender: ${gender}`);
  
  // Get all potential players for the sport with matching gender
  const { data: potentialPlayers, error } = await supabase
    .from("players")
    .select("*")
    .eq("sport", sport)
    .eq("gender", gender)  // Match based on gender
    .neq("id", playerId); // Exclude the current player

  if (error) {
    console.error("Error finding matches:", error);
    throw new Error(`Error finding matches: ${error.message}`);
  }

  if (!potentialPlayers || potentialPlayers.length < 3) {
    return { matchedPlayers: [], foundMatch: false, matchScore: 0 };
  }

  // Calculate match score for each player
  const scoredPlayers = potentialPlayers.map(player => {
    // Location matching (exact match = 100, different = 0)
    const locationScore = player.city === location ? 100 : 0;
    
    // Skill level matching (convert to numeric if possible for better comparison)
    let skillScore = 0;
    
    // For Golf handicaps
    if (sport === "Golf") {
      const playerHandicap = parseHandicap(player.rating.toString());
      const targetHandicap = parseHandicap(skillLevel);
      
      // Calculate difference (closer = higher score)
      const handicapDiff = Math.abs(playerHandicap - targetHandicap);
      skillScore = Math.max(0, 100 - (handicapDiff * 5)); // 5 points per handicap difference
    } 
    // For other sports with numeric ratings
    else {
      const playerRating = parseFloat(player.rating.toString()) || 0;
      const targetRating = convertSkillLevelToRating(skillLevel);
      
      // Calculate difference (closer = higher score)
      const ratingDiff = Math.abs(playerRating - targetRating);
      skillScore = Math.max(0, 100 - (ratingDiff * 20)); // 20 points per rating difference
    }
    
    // Availability matching bonus
    const availabilityScore = player.play_time === "both" ? 20 : 0;
    
    // Calculate total score - weight location more heavily
    const totalScore = (locationScore * 0.6) + (skillScore * 0.3) + (availabilityScore * 0.1);
    
    return {
      player,
      score: totalScore
    };
  });
  
  // Sort by score (highest first)
  scoredPlayers.sort((a, b) => b.score - a.score);
  
  // Get the top 3 matches (plus the initiator = 4 players)
  const bestMatches = scoredPlayers.slice(0, 3).map(match => match.player);
  const highestScore = scoredPlayers.length > 0 ? scoredPlayers[0].score : 0;
  
  // We have a good match if we found enough players with a decent score
  const foundMatch = bestMatches.length === 3 && highestScore > 60;

  console.log(`Found ${bestMatches.length} potential players for 4-player match with highest score: ${highestScore}`);
  
  return {
    matchedPlayers: bestMatches,
    foundMatch: foundMatch,
    matchScore: highestScore
  };
}

/**
 * Helper function to parse golf handicaps
 */
function parseHandicap(handicap: string): number {
  if (handicap === "Beginner") return 30;
  
  // Try to parse ranges like "0-5", "6-10" etc.
  if (handicap.includes("-")) {
    const parts = handicap.split("-");
    if (parts.length === 2) {
      const low = parseInt(parts[0], 10);
      const high = parseInt(parts[1], 10);
      if (!isNaN(low) && !isNaN(high)) {
        return (low + high) / 2; // Use the middle of the range
      }
    }
  }
  
  // Try to parse as a number
  const numericHandicap = parseInt(handicap, 10);
  if (!isNaN(numericHandicap)) {
    return numericHandicap;
  }
  
  // Default value if parsing fails
  return 20;
}

/**
 * Convert text skill levels to numeric ratings
 */
function convertSkillLevelToRating(level: string): number {
  switch (level.toLowerCase()) {
    case "beginner": return 1;
    case "intermediate": return 3;
    case "advanced": return 4;
    case "professional": return 5;
    default: return 2.5; // Default middle value
  }
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

    // Try to find an immediate match using our AI matchmaking algorithm
    const matchResult = await findMatchingPlayers(sport, location, skillLevel, playerId);
    
    // If we found enough players, create the match
    if (matchResult.foundMatch) {
      await createMatch(playerId, matchResult.matchedPlayers, sport, location);
      return matchResult;
    }
    
    // If we didn't find enough players, queue them for later matching
    await queuePlayerForLaterMatching(playerId, email, sport, location, skillLevel);
    
    return matchResult;
  } catch (error) {
    console.error("Error in registerPlayerForMatchmaking:", error);
    toast({
        title: "Matching Error",
        description: "There was an error organizing your match. Please try again.",
        variant: "destructive",
    });
    throw error;
  }
}

/**
 * Organizes a doubles match with 4 players of similar skill levels
 */
export async function organizeFourPlayerMatch(playerId: string, sport: string, location: string, skillLevel: string, gender: string, email: string): Promise<MatchingResult> {
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

    // Try to find 3 more players for a doubles match
    const matchResult = await findFourPlayersForMatch(sport, location, skillLevel, gender, playerId);
    
    // If we found enough players, create the match
    if (matchResult.foundMatch) {
      await createDoublesMatch(playerId, matchResult.matchedPlayers, sport, location);
      toast({
        title: "Doubles Match Organized!",
        description: `We've found 3 other players for your ${sport} match in ${location}!`,
      });
      return matchResult;
    }
    
    // If we didn't find enough players, queue them for later matching
    await queuePlayerForDoublesMatching(playerId, email, sport, location, skillLevel, gender);
    toast({
        title: "Doubles Match Pending",
        description: `We'll notify you when we find 3 more players for your ${sport} match.`,
    });
    
    return matchResult;
  } catch (error) {
    console.error("Error in organizeFourPlayerMatch:", error);
    toast({
        title: "Matching Error",
        description: "There was an error organizing your match. Please try again.",
        variant: "destructive",
    });
    throw error;
  }
}

/**
 * Creates a match with 4 players (doubles format)
 */
async function createDoublesMatch(
  initiatorId: string,
  matchedPlayers: Player[],
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
 * Queue a player for doubles matching later when we have enough players
 */
async function queuePlayerForDoublesMatching(
  playerId: string,
  email: string, 
  sport: string,
  location: string,
  skillLevel: string,
  gender: string
): Promise<void> {
  console.log(`Queueing player ${playerId} for later doubles matching`);
  
  // Update the registration status to indicate we're waiting for more players
  const { error: updateError } = await supabase
    .from("player_registrations")
    .update({
      status: "waiting_doubles",
      admin_notes: `Waiting for more ${gender} ${sport} players in ${location} with level ${skillLevel}. Will email ${email} when found.`
    })
    .eq("player_id", playerId);

  if (updateError) {
    console.error("Error updating player registration for doubles:", updateError);
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
          matchId,
          requiresConfirmation: player.id !== playerIds[0] // First player is the initiator, already confirmed
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
    requiresConfirmation: boolean;
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
