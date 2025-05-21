
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { updatePlayerEloRating } from "@/services/matchmaking/eloSystem";

interface SimpleMatchFormProps {
  playerId: string;
  playerName: string;
  matchId?: string;
  onMatchRecorded?: () => void;
}

export const SimpleMatchForm = ({ playerId, playerName, matchId, onMatchRecorded }: SimpleMatchFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teammateName, setTeammateName] = useState("");
  const [opponentTeamNames, setOpponentTeamNames] = useState("");
  const [yourTeamScore, setYourTeamScore] = useState("");
  const [opponentTeamScore, setOpponentTeamScore] = useState("");
  const [matchDate, setMatchDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [matchDetails, setMatchDetails] = useState<any | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // If we have a matchId, fetch the match details
    if (matchId) {
      fetchMatchDetails();
    }
  }, [matchId]);
  
  const fetchMatchDetails = async () => {
    try {
      // Get the match and other players
      const { data: match, error } = await supabase
        .from("matches")
        .select(`
          id, 
          played_at,
          match_players (
            player_id,
            has_confirmed
          )
        `)
        .eq("id", matchId)
        .single();
      
      if (error) throw error;
      
      if (!match) {
        toast({
          title: "Match not found",
          description: "Could not find the specified match"
        });
        return;
      }
      
      // Set match date
      setMatchDate(format(new Date(match.played_at), "yyyy-MM-dd"));
      
      // Find the opponent
      const otherPlayerIds = match.match_players
        .filter((mp: any) => mp.player_id !== playerId)
        .map((mp: any) => mp.player_id);
      
      if (otherPlayerIds.length > 0) {
        // Fetch opponent names
        const { data: opponents, error: opponentsError } = await supabase
          .from("players")
          .select("name")
          .in("id", otherPlayerIds);
        
        if (!opponentsError && opponents && opponents.length > 0) {
          // Join opponent names if multiple
          const names = opponents.map((o: any) => o.name).join(", ");
          setOpponentTeamNames(names);
        }
      }
      
      setMatchDetails(match);
      
    } catch (error) {
      console.error("Error fetching match details:", error);
    }
  };
  
  const recordMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!yourTeamScore || !opponentTeamScore) {
      toast({
        title: "Missing information",
        description: "Please enter both scores"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const yourScore = parseInt(yourTeamScore);
      const opponentScore = parseInt(opponentTeamScore);
      const isWinner = yourScore > opponentScore;
      
      // If we have a match ID, update that match
      if (matchId) {
        // Record result for the current player
        const { error: resultError } = await supabase
          .from("match_players")
          .update({ 
            performance_rating: yourScore // Using performance_rating for score
          })
          .eq("match_id", matchId)
          .eq("player_id", playerId);
        
        if (resultError) throw resultError;
        
        // Find opponent player record in this match
        const opponentPlayerIds = matchDetails.match_players
          .filter((mp: any) => mp.player_id !== playerId)
          .map((mp: any) => mp.player_id);
        
        // Update opponent score if we have an opponent
        if (opponentPlayerIds.length > 0) {
          const { error: opponentError } = await supabase
            .from("match_players")
            .update({ performance_rating: opponentScore })
            .eq("match_id", matchId)
            .in("player_id", opponentPlayerIds);
          
          if (opponentError) throw opponentError;
          
          // Update player ELO rating based on match result
          try {
            // Get current player's ELO
            const { data: playerData } = await supabase
              .from("players")
              .select("elo_rating")
              .eq("id", playerId)
              .single();
            
            // Get opponent's ELO
            const { data: opponentData } = await supabase
              .from("players")
              .select("elo_rating")
              .eq("id", opponentPlayerIds[0]) // Taking first opponent for simplicity
              .single();
            
            if (playerData && opponentData) {
              const { calculateNewRatings } = await import("@/services/matchmaking/eloSystem");
              
              // Determine winner and loser ratings
              const winnerRating = isWinner ? playerData.elo_rating : opponentData.elo_rating;
              const loserRating = isWinner ? opponentData.elo_rating : playerData.elo_rating;
              
              // Calculate new ratings
              const { winnerNewRating, loserNewRating } = calculateNewRatings(winnerRating, loserRating);
              
              // Update player ratings
              if (isWinner) {
                await updatePlayerEloRating(playerId, winnerNewRating);
                await updatePlayerEloRating(opponentPlayerIds[0], loserNewRating);
              } else {
                await updatePlayerEloRating(playerId, loserNewRating);
                await updatePlayerEloRating(opponentPlayerIds[0], winnerNewRating);
              }
            }
          } catch (eloError) {
            console.error("Error updating ELO ratings:", eloError);
            // Continue with match recording even if ELO update fails
          }
        }
        
        // Update match status to completed
        const { error: matchError } = await supabase
          .from("matches")
          .update({ status: "completed" })
          .eq("id", matchId);
        
        if (matchError) throw matchError;
        
      } else {
        // Create new match if no match ID provided
        const playedAt = new Date(matchDate).toISOString();
        
        // Create the match
        const { data: match, error: matchError } = await supabase
          .from("matches")
          .insert({
            sport: "Padel", // Set default sport to Padel
            played_at: playedAt,
            location: "Manual Entry",
            status: "completed"
          })
          .select()
          .single();
        
        if (matchError) throw matchError;
        
        // Add current player to the match
        const { error: playerError } = await supabase
          .from("match_players")
          .insert({
            match_id: match.id,
            player_id: playerId,
            performance_rating: yourScore, // Using performance_rating for the score
            has_confirmed: true,
            feedback: teammateName ? `Played with: ${teammateName}` : undefined
          });
        
        if (playerError) throw playerError;
        
        // Try to find opponents by name if provided
        if (opponentTeamNames) {
          // Store the opponent team name and score in the match details
          const { error: matchUpdateError } = await supabase
            .from("matches")
            .update({
              booking_details: {
                opponent_team: opponentTeamNames,
                opponent_score: opponentScore
              }
            })
            .eq("id", match.id);
          
          if (matchUpdateError) throw matchUpdateError;
          
          // Try to find the opponent in the database by name
          const opponentName = opponentTeamNames.split(",")[0].trim();
          const { data: opponentData } = await supabase
            .from("players")
            .select("id, elo_rating")
            .ilike("name", `%${opponentName}%`)
            .maybeSingle();
          
          if (opponentData) {
            // Add opponent to the match
            const { error: oppError } = await supabase
              .from("match_players")
              .insert({
                match_id: match.id,
                player_id: opponentData.id,
                performance_rating: opponentScore,
                has_confirmed: false
              });
            
            if (!oppError) {
              // Update player ELO ratings
              try {
                // Get current player's ELO
                const { data: playerData } = await supabase
                  .from("players")
                  .select("elo_rating")
                  .eq("id", playerId)
                  .single();
                
                if (playerData && opponentData) {
                  const { calculateNewRatings } = await import("@/services/matchmaking/eloSystem");
                  
                  // Determine winner and loser ratings
                  const winnerRating = isWinner ? playerData.elo_rating : opponentData.elo_rating;
                  const loserRating = isWinner ? opponentData.elo_rating : playerData.elo_rating;
                  
                  // Calculate new ratings
                  const { winnerNewRating, loserNewRating } = calculateNewRatings(winnerRating, loserRating);
                  
                  // Update player ratings
                  if (isWinner) {
                    await updatePlayerEloRating(playerId, winnerNewRating);
                    await updatePlayerEloRating(opponentData.id, loserNewRating);
                  } else {
                    await updatePlayerEloRating(playerId, loserNewRating);
                    await updatePlayerEloRating(opponentData.id, winnerNewRating);
                  }
                }
              } catch (eloError) {
                console.error("Error updating ELO ratings:", eloError);
                // Continue with match recording even if ELO update fails
              }
            }
          }
        }
      }
      
      toast({
        title: "Match recorded",
        description: isWinner ? "Congratulations on your win! Your rating has been updated." : "Your match result has been saved and your rating has been updated."
      });
      
      if (onMatchRecorded) {
        onMatchRecorded();
      }
      
      // Reset form
      setTeammateName("");
      setOpponentTeamNames("");
      setYourTeamScore("");
      setOpponentTeamScore("");
      
    } catch (error: any) {
      console.error("Error recording match:", error);
      toast({
        title: "Failed to record match",
        description: error.message || "An unexpected error occurred"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={recordMatch} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {matchId ? (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(matchDate), "MMMM d, yyyy")}</span>
            
            {opponentTeamNames && (
              <>
                <span>•</span>
                <Users className="h-4 w-4" />
                <span>vs {opponentTeamNames}</span>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <Label htmlFor="teammateName">Your Teammate (Optional)</Label>
              <Input
                id="teammateName"
                placeholder="Enter your teammate's name"
                value={teammateName}
                onChange={(e) => setTeammateName(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="opponentTeam">Opponent Team</Label>
              <Input
                id="opponentTeam"
                placeholder="Enter opponent team names"
                value={opponentTeamNames}
                onChange={(e) => setOpponentTeamNames(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                E.g. "John and Sarah" or "Team Red"
              </p>
            </div>
            
            <div>
              <Label htmlFor="date">Date Played</Label>
              <Input
                id="date"
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                max={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="yourTeamScore">Your Team's Score</Label>
            <Input
              id="yourTeamScore"
              type="number"
              min="0"
              placeholder="Your team's score"
              value={yourTeamScore}
              onChange={(e) => setYourTeamScore(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="opponentTeamScore">Opponent Team's Score</Label>
            <Input
              id="opponentTeamScore"
              type="number"
              min="0"
              placeholder="Their team's score"
              value={opponentTeamScore}
              onChange={(e) => setOpponentTeamScore(e.target.value)}
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-orange-600 hover:bg-orange-700 w-full mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Record Match Result"
          )}
        </Button>
      </div>
    </form>
  );
};
