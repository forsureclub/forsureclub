
import { supabase } from "@/integrations/supabase/client";
import { MiniLeague, LeagueMatch } from "./types";

/**
 * Retrieves all mini-leagues for a specific player
 */
export async function getPlayerMiniLeagues(playerId: string): Promise<MiniLeague[]> {
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
        weeks_between_matches
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
export async function getMiniLeagueMatches(leagueId: string): Promise<LeagueMatch[]> {
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
