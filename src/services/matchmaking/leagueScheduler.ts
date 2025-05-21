/**
 * Generates a round-robin tournament schedule
 * Each player will play against every other player once
 * 
 * @param playerIds - Array of player IDs
 * @returns A schedule array where each element is a round, and each round contains matches (pairs of player IDs)
 */
export function generateRoundRobinSchedule(playerIds: string[]): string[][][] {
  // Create a copy of the player IDs array
  const players = [...playerIds];
  
  // If there's an odd number of players, add a "bye" player
  if (players.length % 2 === 1) {
    players.push('BYE');
  }
  
  const n = players.length;
  const rounds = n - 1;
  const matchesPerRound = n / 2;
  
  // Initialize schedule
  const schedule: string[][][] = [];
  
  for (let round = 0; round < rounds; round++) {
    const roundMatches: string[][] = [];
    
    for (let match = 0; match < matchesPerRound; match++) {
      // For each round, pair up players
      const player1Index = match;
      const player2Index = n - 1 - match;
      
      // Skip matches involving the "BYE" player
      if (players[player1Index] !== 'BYE' && players[player2Index] !== 'BYE') {
        roundMatches.push([players[player1Index], players[player2Index]]);
      }
    }
    
    schedule.push(roundMatches);
    
    // Rotate players for the next round, keeping the first player fixed
    const firstPlayer = players[0];
    const lastPlayer = players[players.length - 1];
    
    for (let i = players.length - 1; i > 1; i--) {
      players[i] = players[i - 1];
    }
    
    players[1] = lastPlayer;
  }
  
  return schedule;
}

/**
 * Creates a balanced schedule for a specific number of weeks
 * This ensures matches are distributed evenly
 */
export function createBalancedSchedule(
  playerIds: string[], 
  numberOfWeeks: number
): { weekNumber: number; matches: string[][] }[] {
  // Generate the base round-robin schedule
  const roundRobinSchedule = generateRoundRobinSchedule(playerIds);
  
  // If we need more weeks than the round-robin provides, we'll repeat the schedule
  const schedule: { weekNumber: number; matches: string[][] }[] = [];
  
  for (let week = 0; week < numberOfWeeks; week++) {
    // Use modulo to cycle through the round robin matches
    const roundIndex = week % roundRobinSchedule.length;
    
    schedule.push({
      weekNumber: week + 1,
      matches: roundRobinSchedule[roundIndex]
    });
  }
  
  return schedule;
}
