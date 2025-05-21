
import { supabase } from "@/integrations/supabase/client";
import { generateRoundRobinSchedule } from "../leagueScheduler";
import { LeagueCreationResult } from "./types";

/**
 * Creates a new mini-league with the specified players
 */
export async function createMiniLeague(
  leagueName: string,
  sport: string,
  location: string,
  playerIds: string[],
  startDate: Date,
  weeksBetweenMatches: number = 1
): Promise<LeagueCreationResult> {
  try {
    // Validate inputs
    if (playerIds.length < 3) {
      throw new Error("Mini-leagues require at least 3 players");
    }

    if (!leagueName || !sport || !location) {
      throw new Error("League name, sport and location are required");
    }

    // Create the schedule using the round robin algorithm
    const schedule = generateRoundRobinSchedule(playerIds);

    // Calculate match dates based on startDate - always on Wednesdays
    const matchDates = schedule.map((round, index) => {
      // Start with the provided start date
      const date = new Date(startDate);
      
      // Add weeks between matches
      date.setDate(date.getDate() + (index * 7 * weeksBetweenMatches));
      
      // Ensure it's a Wednesday (day 3)
      const dayOfWeek = date.getDay();
      const daysToAdd = (3 - dayOfWeek + 7) % 7; // Adjust to Wednesday
      date.setDate(date.getDate() + daysToAdd);
      
      return date;
    });

    // Create league record in the database
    const { data: league, error: leagueError } = await supabase
      .from("mini_leagues")
      .insert({
        name: leagueName,
        sport,
        location,
        start_date: startDate.toISOString(),
        status: "active",
        player_count: playerIds.length,
        weeks_between_matches: weeksBetweenMatches
      })
      .select()
      .single();

    if (leagueError) throw leagueError;

    // Add players to the league
    const playerEntries = playerIds.map(playerId => ({
      league_id: league.id,
      player_id: playerId,
      matches_played: 0,
      matches_won: 0,
      matches_lost: 0,
      points: 0
    }));

    const { error: playerError } = await supabase
      .from("league_players")
      .insert(playerEntries);

    if (playerError) throw playerError;

    // Create scheduled matches for each round
    await createLeagueMatches(league.id, schedule, matchDates, sport, location);

    return { id: league.id, name: leagueName, rounds: schedule.length };
  } catch (error) {
    console.error("Error creating mini-league:", error);
    throw error;
  }
}

/**
 * Creates match entries for all rounds in a league schedule
 */
async function createLeagueMatches(
  leagueId: string, 
  schedule: string[][][], 
  matchDates: Date[], 
  sport: string, 
  location: string
): Promise<void> {
  for (let roundIndex = 0; roundIndex < schedule.length; roundIndex++) {
    const round = schedule[roundIndex];
    const matchDate = matchDates[roundIndex];
    
    // Create each match in this round
    for (let matchIndex = 0; matchIndex < round.length; matchIndex++) {
      const match = round[matchIndex];
      
      // Only create the match if there are two players (handles odd number of players with byes)
      if (match.length === 2) {
        const { data: matchData, error: matchError } = await supabase
          .from("matches")
          .insert({
            sport,
            location,
            played_at: matchDate.toISOString(),
            status: "scheduled",
            league_id: leagueId,
            round_number: roundIndex + 1
          })
          .select()
          .single();
        
        if (matchError) throw matchError;
        
        // Add players to the match
        const playerMatchEntries = match.map(playerId => ({
          match_id: matchData.id,
          player_id: playerId,
          has_confirmed: false
        }));
        
        const { error: matchPlayerError } = await supabase
          .from("match_players")
          .insert(playerMatchEntries);
        
        if (matchPlayerError) throw matchPlayerError;
      }
    }
  }
}
