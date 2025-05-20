import { Tables } from "@/integrations/supabase/types";
import { getDefaultElo } from "./eloSystem";
import { getSkillLevelDescription, SKILL_LEVELS } from "@/types/matchmaking";

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
  
  // Find the ELO rating and skill level of the requesting player
  const initiatorPlayer = players.find(p => p.id === playerId);
  const initiatorElo = initiatorPlayer?.elo_rating || getDefaultElo();
  const initiatorSkill = initiatorPlayer?.rating || 1;

  // Calculate match score for each player
  const scoredPlayers = potentialPlayers.map(player => {
    // Location matching (exact match = 100, different = 0)
    const locationScore = player.city === location ? 100 : 0;
    
    // Skill level matching (closer = higher score)
    const playerSkill = player.rating || 1;
    const skillDiff = Math.abs(playerSkill - initiatorSkill);
    
    // Prioritize matches within 1.0 skill level difference
    // If within 1.0 level, high score (80-100)
    // If outside 1.0 level, much lower score (0-60)
    const skillScore = skillDiff <= 1.0 
      ? Math.max(80, 100 - (skillDiff * 20)) // Within desired range: 80-100 points
      : Math.max(0, 60 - ((skillDiff - 1.0) * 20)); // Outside desired range: 0-60 points
    
    // ELO matching (closer = higher score)
    const playerElo = player.elo_rating || getDefaultElo();
    const eloDiff = Math.abs(playerElo - initiatorElo);
    const eloScore = Math.max(0, 100 - (eloDiff / 30)); // 100 = perfect match, loses 1 point per 30 ELO difference
    
    // Availability matching bonus
    const availabilityScore = player.play_time === "both" ? 20 : 0;
    
    // Calculate total score with weights - skill level is now even more important
    const totalScore = 
      (locationScore * 0.35) + // Location is still important
      (skillScore * 0.45) +    // Skill level is now the most important factor
      (eloScore * 0.10) +      // ELO is less important given our detailed skill levels
      (availabilityScore * 0.10); // Availability is still considered
    
    return {
      player,
      score: totalScore,
      skillDiff: skillDiff // Store skill difference for debugging and filtering
    };
  });
  
  // Sort by score (highest first)
  scoredPlayers.sort((a, b) => b.score - a.score);
  
  // Get the top matches (up to the desired number of players)
  const bestMatches = scoredPlayers.slice(0, desiredPlayerCount).map(match => match.player);
  const highestScore = scoredPlayers.length > 0 ? scoredPlayers[0].score : 0;
  
  // A good match is now defined as:
  // 1. Found the exact number of players requested
  // 2. The highest score is above 70 (was 60)
  // 3. For the highest-scoring player, the skill difference is within 1.0 level
  const bestSkillDiff = scoredPlayers.length > 0 ? scoredPlayers[0].skillDiff : 999;
  const foundMatch = bestMatches.length === desiredPlayerCount && 
                    highestScore > 70 && 
                    bestSkillDiff <= 1.0;

  console.log(`Found ${bestMatches.length} potential matches with highest score: ${highestScore}, skill diff: ${bestSkillDiff}`);
  
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
  
  // Find the ELO rating and skill level of the requesting player
  const initiatorPlayer = players.find(p => p.id === playerId);
  const initiatorElo = initiatorPlayer?.elo_rating || getDefaultElo();
  const initiatorSkill = initiatorPlayer?.rating || 1;

  // Calculate match score for each player
  const scoredPlayers = potentialPlayers.map(player => {
    // Location matching (exact match = 100, different = 0)
    const locationScore = player.city === location ? 100 : 0;
    
    // Skill level matching (closer = higher score)
    const playerSkill = player.rating || 1;
    const skillDiff = Math.abs(playerSkill - initiatorSkill);
    
    // For doubles, being within 1.0 skill level is even more important
    // If within 1.0 level, high score (85-100)
    // If outside 1.0 level, much lower score (0-50)
    const skillScore = skillDiff <= 1.0 
      ? Math.max(85, 100 - (skillDiff * 15)) // Within desired range: 85-100 points
      : Math.max(0, 50 - ((skillDiff - 1.0) * 25)); // Outside desired range: 0-50 points
    
    // ELO matching (closer = higher score)
    const playerElo = player.elo_rating || getDefaultElo();
    const eloDiff = Math.abs(playerElo - initiatorElo);
    const eloScore = Math.max(0, 100 - (eloDiff / 30)); // 100 = perfect match, loses 1 point per 30 ELO difference
    
    // Availability matching bonus
    const availabilityScore = player.play_time === "both" ? 20 : 0;
    
    // Calculate total score with weights - skill level is now even more important for doubles
    const totalScore = 
      (locationScore * 0.30) + // Location is important
      (skillScore * 0.50) +    // Skill level is the most important factor for doubles
      (eloScore * 0.10) +      // ELO is less important
      (availabilityScore * 0.10); // Availability is still considered
    
    return {
      player,
      score: totalScore,
      skillDiff: skillDiff // Store skill difference for filtering and reporting
    };
  });
  
  // Sort by score (highest first)
  scoredPlayers.sort((a, b) => b.score - a.score);
  
  // Get the top 3 matches (plus the initiator = 4 players)
  const bestMatches = scoredPlayers.slice(0, 3).map(match => match.player);
  const highestScore = scoredPlayers.length > 0 ? scoredPlayers[0].score : 0;
  
  // For doubles, we're even more strict about skill matching
  // We want all players to be within 1.0 skill level of each other if possible
  const allWithinRange = scoredPlayers.slice(0, 3).every(match => match.skillDiff <= 1.0);
  const foundMatch = bestMatches.length === 3 && highestScore > 70 && allWithinRange;

  console.log(`Found ${bestMatches.length} potential players for 4-player match with highest score: ${highestScore}, all within 1.0 level: ${allWithinRange}`);
  
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
 * Convert text skill levels to numeric ratings on the 0-7 scale
 */
export function convertSkillLevelToRating(level: string): number {
  switch (level.toLowerCase()) {
    case "beginner": return 1.0;
    case "initiation": return 1.0;
    case "initiation/intermediate": return 2.0;
    case "intermediate": return 3.0;
    case "intermediate high": return 4.0;
    case "intermediate advanced": return 5.0;
    case "advanced": return 6.0;
    case "elite": return 7.0;
    case "professional": return 7.0;
    default:
      // Try to parse it as a number
      const numLevel = parseFloat(level);
      return !isNaN(numLevel) ? numLevel : 3.0; // Default to intermediate
  }
}
