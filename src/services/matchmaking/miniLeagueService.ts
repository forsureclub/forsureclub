
import { supabase } from "@/integrations/supabase/client";
import { generateRoundRobinSchedule } from "./leagueScheduler";
import { PlayerProfile } from "@/types/matchmaking";
import { useToast } from "@/hooks/use-toast";

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
) {
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

    // Calculate match dates based on start date and weeks between matches
    const matchDates = schedule.map((round, index) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (index * 7 * weeksBetweenMatches));
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
    for (let roundIndex = 0; roundIndex < schedule.length; roundIndex++) {
      const round = schedule[roundIndex];
      const matchDate = matchDates[roundIndex];
      
      // Create each match in this round
      for (let matchIndex = 0; matchIndex < round.length; matchIndex++) {
        const match = round[matchIndex];
        
        // Only create the match if there are two players (handles odd number of players with byes)
        if (match.length === 2) {
          await supabase
            .from("matches")
            .insert({
              sport,
              location,
              played_at: matchDate.toISOString(),
              status: "scheduled",
              league_id: league.id,
              round_number: roundIndex + 1
            })
            .select()
            .single()
            .then(({ data: matchData, error: matchError }) => {
              if (matchError) throw matchError;
              
              // Add players to the match
              const playerMatchEntries = match.map(playerId => ({
                match_id: matchData.id,
                player_id: playerId,
                has_confirmed: false
              }));
              
              return supabase
                .from("match_players")
                .insert(playerMatchEntries);
            });
        }
      }
    }

    return { id: league.id, name: leagueName, rounds: schedule.length };
  } catch (error) {
    console.error("Error creating mini-league:", error);
    throw error;
  }
}

/**
 * Retrieves all mini-leagues for a specific player
 */
export async function getPlayerMiniLeagues(playerId: string) {
  try {
    // First get all league IDs the player is part of
    const { data: leaguePlayerData, error: leaguePlayerError } = await supabase
      .from("league_players")
      .select("league_id")
      .eq("player_id", playerId);

    if (leaguePlayerError) throw leaguePlayerError;
    
    if (!leaguePlayerData || leaguePlayerData.length === 0) {
      return [];
    }

    const leagueIds = leaguePlayerData.map(item => item.league_id);
    
    // Then get the actual league data
    const { data: leaguesData, error: leaguesError } = await supabase
      .from("mini_leagues")
      .select(`
        id, 
        name, 
        sport, 
        location, 
        start_date, 
        status,
        player_count,
        weeks_between_matches,
        league_players (
          player_id,
          matches_played,
          matches_won,
          matches_lost,
          points
        )
      `)
      .in("id", leagueIds);

    if (leaguesError) throw leaguesError;
    
    return leaguesData || [];
  } catch (error) {
    console.error("Error getting player mini-leagues:", error);
    throw error;
  }
}

/**
 * Gets all matches for a specific mini-league
 */
export async function getMiniLeagueMatches(leagueId: string) {
  try {
    const { data, error } = await supabase
      .from("matches")
      .select(`
        id,
        played_at,
        status,
        round_number,
        sport,
        location,
        match_players (
          player_id,
          has_confirmed,
          performance_rating
        )
      `)
      .eq("league_id", leagueId)
      .order("played_at", { ascending: true })
      .order("round_number", { ascending: true });

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error getting mini-league matches:", error);
    throw error;
  }
}

/**
 * Updates the league standings after a match is completed
 */
export async function updateLeagueStandings(matchId: string, leagueId: string) {
  try {
    // Get match results
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select(`
        match_players (
          player_id,
          performance_rating
        )
      `)
      .eq("id", matchId)
      .single();

    if (matchError) throw matchError;
    
    if (!match || !match.match_players || match.match_players.length !== 2) {
      throw new Error("Invalid match data");
    }
    
    // Determine winner based on performance rating
    const players = match.match_players;
    let winnerId: string | null = null;
    
    if (players[0].performance_rating && players[1].performance_rating) {
      winnerId = players[0].performance_rating > players[1].performance_rating 
        ? players[0].player_id 
        : players[1].player_id;
    }
    
    if (!winnerId) {
      return; // No winner determined yet
    }
    
    // Update both players' stats
    for (const player of players) {
      const isWinner = player.player_id === winnerId;
      
      // Update league_players record
      await supabase
        .from("league_players")
        .update({
          matches_played: supabase.rpc("increment", { x: 1 }),
          matches_won: isWinner ? supabase.rpc("increment", { x: 1 }) : undefined,
          matches_lost: !isWinner ? supabase.rpc("increment", { x: 1 }) : undefined,
          points: isWinner ? supabase.rpc("increment", { x: 3 }) : undefined
        })
        .eq("league_id", leagueId)
        .eq("player_id", player.player_id);
    }
  } catch (error) {
    console.error("Error updating league standings:", error);
    throw error;
  }
}
