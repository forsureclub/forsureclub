
import { supabase } from "@/integrations/supabase/client";

/**
 * Send match notifications to all players
 */
export async function sendMatchNotifications(
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
export async function sendMatchEmail(
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
