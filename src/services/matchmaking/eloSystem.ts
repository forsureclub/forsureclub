
/**
 * Constants for ELO calculations
 */
const DEFAULT_ELO = 1500; // Starting ELO for new players
const K_FACTOR = 32; // How much a single match affects the rating (higher = more impact)

/**
 * Calculate the expected outcome of a match between two players
 * @param rating1 The rating of the first player
 * @param rating2 The rating of the second player
 * @returns A number between 0 and 1 representing player1's expected score
 */
export function calculateExpectedOutcome(rating1: number, rating2: number): number {
  return 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
}

/**
 * Calculate new ELO ratings based on match results
 * @param winnerRating The winner's current rating
 * @param loserRating The loser's current rating
 * @returns Object containing new ratings for both players
 */
export function calculateNewRatings(
  winnerRating: number, 
  loserRating: number
): { winnerNewRating: number; loserNewRating: number } {
  // Get expected outcomes
  const expectedWinnerOutcome = calculateExpectedOutcome(winnerRating, loserRating);
  const expectedLoserOutcome = calculateExpectedOutcome(loserRating, winnerRating);

  // Calculate new ratings (winner gets 1 point, loser gets 0)
  const winnerNewRating = Math.round(winnerRating + K_FACTOR * (1 - expectedWinnerOutcome));
  const loserNewRating = Math.round(loserRating + K_FACTOR * (0 - expectedLoserOutcome));

  return { winnerNewRating, loserNewRating };
}

/**
 * Process match results and calculate rating changes for all participants
 * @param playerRatings Map of player IDs to their current ELO ratings
 * @param winnerIds Array of player IDs who won the match
 * @param loserIds Array of player IDs who lost the match
 * @returns Map of player IDs to their new ratings
 */
export function processMatchResult(
  playerRatings: Map<string, number>,
  winnerIds: string[],
  loserIds: string[]
): Map<string, number> {
  // Create a new map for updated ratings
  const newRatings = new Map<string, number>();

  // Calculate average ratings for each team
  let winnersAvgRating = 0;
  let losersAvgRating = 0;
  
  // Get or set default ratings for winners
  winnerIds.forEach(id => {
    const rating = playerRatings.get(id) || DEFAULT_ELO;
    winnersAvgRating += rating;
  });
  winnersAvgRating /= winnerIds.length || 1;
  
  // Get or set default ratings for losers
  loserIds.forEach(id => {
    const rating = playerRatings.get(id) || DEFAULT_ELO;
    losersAvgRating += rating;
  });
  losersAvgRating /= loserIds.length || 1;

  // Calculate new team ratings
  const { winnerNewRating, loserNewRating } = calculateNewRatings(winnersAvgRating, losersAvgRating);
  
  // Apply rating changes proportionally to individual players
  const winnerDelta = winnerNewRating - winnersAvgRating;
  const loserDelta = loserNewRating - losersAvgRating;
  
  winnerIds.forEach(id => {
    const oldRating = playerRatings.get(id) || DEFAULT_ELO;
    newRatings.set(id, oldRating + winnerDelta);
  });
  
  loserIds.forEach(id => {
    const oldRating = playerRatings.get(id) || DEFAULT_ELO;
    newRatings.set(id, oldRating + loserDelta);
  });
  
  return newRatings;
}

/**
 * Get a player's ELO rating from the database or return the default
 * @param playerId The player's ID
 * @returns The player's current ELO rating
 */
export async function getPlayerEloRating(playerId: string): Promise<number> {
  try {
    const { data, error } = await import('@/integrations/supabase/client').then(
      module => module.supabase
        .from('players')
        .select('elo_rating')
        .eq('id', playerId)
        .single()
    );
    
    if (error || !data) {
      console.warn("Could not retrieve player ELO rating:", error);
      return DEFAULT_ELO;
    }
    
    return data.elo_rating || DEFAULT_ELO;
  } catch (e) {
    console.error("Error fetching player ELO rating:", e);
    return DEFAULT_ELO;
  }
}

/**
 * Update a player's ELO rating in the database
 * @param playerId The player's ID
 * @param newRating The player's new ELO rating
 * @returns Promise resolving to true if successful
 */
export async function updatePlayerEloRating(playerId: string, newRating: number): Promise<boolean> {
  try {
    const { error } = await import('@/integrations/supabase/client').then(
      module => module.supabase
        .from('players')
        .update({ elo_rating: newRating })
        .eq('id', playerId)
    );
    
    if (error) {
      console.error("Failed to update player ELO rating:", error);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error("Error updating player ELO rating:", e);
    return false;
  }
}

/**
 * Get the rank description based on ELO rating
 * @param eloRating The player's ELO rating
 * @returns String describing the player's rank
 */
export function getEloRankDescription(eloRating: number): string {
  if (eloRating >= 2200) return "Grandmaster";
  if (eloRating >= 2000) return "Master";
  if (eloRating >= 1800) return "Expert";
  if (eloRating >= 1600) return "Skilled";
  if (eloRating >= 1400) return "Average";
  if (eloRating >= 1200) return "Novice";
  return "Beginner";
}

/**
 * Get default ELO rating
 * @returns The default ELO rating for new players
 */
export function getDefaultElo(): number {
  return DEFAULT_ELO;
}

