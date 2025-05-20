import { Tables } from "@/integrations/supabase/types";
import { getDefaultElo } from "./eloSystem";

type Player = Tables<"players">;
export type MatchingResult = {
  matchedPlayers: Player[];
  foundMatch: boolean;
  matchScore?: number;
};

/**
 * Advanced AI matchmaking algorithm that finds players based on sport, location, skill level, gender and desired player count
 * Uses a scoring system to find the best possible matches
 * @param sport The sport to match
 * @param location The player's location
 * @param skillLevel The player's skill level
 * @param gender The player's gender
 * @param playerId The current player's ID (to exclude from results)
 * @param desiredPlayerCount The number of players the user is looking for (default: 1)
 */
export async function findMatchingPlayers(
  players: Player[],
  sport: string,
  location: string,
  skillLevel: string,
  gender: string,
  playerId: string,
  desiredPlayerCount: number = 1
): Promise<MatchingResult> {
  console.log(`Finding matches for ${sport} in ${location} with level ${skillLevel}, gender: ${gender}, looking for ${desiredPlayerCount} player(s)`);
  
  // Filter out the current player and only include players of the same gender
  const potentialPlayers = players.filter(player => 
    player.id !== playerId && 
    player.gender === gender
  );

  if (!potentialPlayers || potentialPlayers.length === 0) {
    return { matchedPlayers: [], foundMatch: false, matchScore: 0 };
  }
  
  // Find the ELO rating of the requesting player
  const initiatorPlayer = players.find(p => p.id === playerId);
  const initiatorElo = initiatorPlayer?.elo_rating || getDefaultElo();

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
    
    // ELO matching (closer = higher score)
    const playerElo = player.elo_rating || getDefaultElo();
    const eloDiff = Math.abs(playerElo - initiatorElo);
    const eloScore = Math.max(0, 100 - (eloDiff / 30)); // 100 = perfect match, loses 1 point per 30 ELO difference
    
    // Availability matching bonus
    const availabilityScore = player.play_time === "both" ? 20 : 0;
    
    // Calculate total score with weights
    const totalScore = 
      (locationScore * 0.4) + // Location is most important
      (skillScore * 0.2) +    // Skill level is somewhat important
      (eloScore * 0.3) +      // ELO is important
      (availabilityScore * 0.1); // Availability is least important
    
    return {
      player,
      score: totalScore
    };
  });
  
  // Sort by score (highest first)
  scoredPlayers.sort((a, b) => b.score - a.score);
  
  // Get the top matches (up to the desired number of players)
  const bestMatches = scoredPlayers.slice(0, desiredPlayerCount).map(match => match.player);
  const highestScore = scoredPlayers.length > 0 ? scoredPlayers[0].score : 0;
  
  // We have a good match if we found the exact number of players requested and with a decent score
  const foundMatch = bestMatches.length === desiredPlayerCount && highestScore > 60;

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
  players: Player[],
  sport: string,
  location: string,
  skillLevel: string,
  gender: string,
  playerId: string
): Promise<MatchingResult> {
  console.log(`Finding 4-player match for ${sport} in ${location} with level ${skillLevel}, gender: ${gender}`);
  
  // Filter players by gender and exclude current player
  const potentialPlayers = players.filter(player => 
    player.gender === gender && player.id !== playerId
  );

  if (!potentialPlayers || potentialPlayers.length < 3) {
    return { matchedPlayers: [], foundMatch: false, matchScore: 0 };
  }
  
  // Find the ELO rating of the requesting player
  const initiatorPlayer = players.find(p => p.id === playerId);
  const initiatorElo = initiatorPlayer?.elo_rating || getDefaultElo();

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
    
    // ELO matching (closer = higher score)
    const playerElo = player.elo_rating || getDefaultElo();
    const eloDiff = Math.abs(playerElo - initiatorElo);
    const eloScore = Math.max(0, 100 - (eloDiff / 30)); // 100 = perfect match, loses 1 point per 30 ELO difference
    
    // Availability matching bonus
    const availabilityScore = player.play_time === "both" ? 20 : 0;
    
    // Calculate total score with weights
    const totalScore = 
      (locationScore * 0.5) + // Location is most important
      (eloScore * 0.3) +      // ELO is important
      (skillScore * 0.1) +    // Less emphasis on skill level for doubles
      (availabilityScore * 0.1); // Availability is least important
    
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
export function parseHandicap(handicap: string): number {
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
export function convertSkillLevelToRating(level: string): number {
  switch (level.toLowerCase()) {
    case "beginner": return 1;
    case "intermediate": return 3;
    case "advanced": return 4;
    case "professional": return 5;
    default: return 2.5; // Default middle value
  }
}
