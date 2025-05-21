
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, Users } from "lucide-react";
import { format } from "date-fns";

interface SimpleMatchFormProps {
  playerId: string;
  playerName: string;
  matchId?: string;
  onMatchRecorded?: () => void;
}

export const SimpleMatchForm = ({ playerId, playerName, matchId, onMatchRecorded }: SimpleMatchFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [opponentName, setOpponentName] = useState("");
  const [playerScore, setPlayerScore] = useState("");
  const [opponentScore, setOpponentScore] = useState("");
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
        toast.error({
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
        // Fetch opponent name
        const { data: opponents, error: opponentsError } = await supabase
          .from("players")
          .select("name")
          .in("id", otherPlayerIds);
        
        if (!opponentsError && opponents && opponents.length > 0) {
          // Join opponent names if multiple
          const names = opponents.map((o: any) => o.name).join(", ");
          setOpponentName(names);
        }
      }
      
      setMatchDetails(match);
      
    } catch (error) {
      console.error("Error fetching match details:", error);
    }
  };
  
  const recordMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerScore || !opponentScore) {
      toast.error({
        title: "Missing information",
        description: "Please enter both scores"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // If we have a match ID, update that match
      if (matchId) {
        // Record result for the current player
        const { error: resultError } = await supabase
          .from("match_players")
          .update({ 
            performance_rating: 3, // Default middle rating
            // Using numeric field that already exists in the schema
            // We can't use score directly since it doesn't exist
            performance_rating: parseInt(playerScore)
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
            .update({ performance_rating: parseInt(opponentScore) })
            .eq("match_id", matchId)
            .in("player_id", opponentPlayerIds);
          
          if (opponentError) throw opponentError;
        }
        
        // Update match status to completed
        const { error: matchError } = await supabase
          .from("matches")
          .update({ status: "completed" })
          .eq("id", matchId);
        
        if (matchError) throw matchError;
        
      } else {
        // Create new match if no match ID provided
        const matchDate = new Date().toISOString();
        
        // Try to find the opponent by name
        const { data: opponentData } = await supabase
          .from("players")
          .select("id")
          .ilike("name", `%${opponentName}%`)
          .limit(1);
        
        // Create the match
        const { data: match, error: matchError } = await supabase
          .from("matches")
          .insert({
            sport: "Other",
            played_at: matchDate,
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
            performance_rating: parseInt(playerScore), // Using performance_rating for the score
            has_confirmed: true
          });
        
        if (playerError) throw playerError;
        
        // Add opponent if found
        if (opponentData && opponentData.length > 0) {
          const { error: opponentError } = await supabase
            .from("match_players")
            .insert({
              match_id: match.id,
              player_id: opponentData[0].id,
              performance_rating: parseInt(opponentScore), // Using performance_rating for the score
              has_confirmed: false
            });
          
          if (opponentError) throw opponentError;
        }
      }
      
      toast.success({
        title: "Match recorded",
        description: "Your match result has been saved"
      });
      
      if (onMatchRecorded) {
        onMatchRecorded();
      }
      
      // Reset form
      setOpponentName("");
      setPlayerScore("");
      setOpponentScore("");
      
    } catch (error: any) {
      console.error("Error recording match:", error);
      toast.error({
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
            
            {opponentName && (
              <>
                <span>•</span>
                <Users className="h-4 w-4" />
                <span>vs {opponentName}</span>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <Label htmlFor="opponent">Opponent Name</Label>
              <Input
                id="opponent"
                placeholder="Enter opponent name"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                required
              />
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
            <Label htmlFor="playerScore">{playerName}'s Score</Label>
            <Input
              id="playerScore"
              type="number"
              min="0"
              placeholder="Your score"
              value={playerScore}
              onChange={(e) => setPlayerScore(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="opponentScore">Opponent's Score</Label>
            <Input
              id="opponentScore"
              type="number"
              min="0"
              placeholder="Their score"
              value={opponentScore}
              onChange={(e) => setOpponentScore(e.target.value)}
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
