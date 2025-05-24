
import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Calendar, MapPin, Users, Clock, CheckCircle, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { GameSuggestions } from "./GameSuggestions";
import { QuickMatchRecorder } from "./QuickMatchRecorder";

export const PlayerMatches = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPlayerAndMatches();
    }
  }, [user]);

  const fetchPlayerAndMatches = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get current player profile
      const { data: player, error: playerError } = await supabase
        .from("players")
        .select("*")
        .eq("email", user.email)
        .single();

      if (playerError || !player) {
        setLoading(false);
        return;
      }

      setPlayerProfile(player);

      // Get all matches the player is part of
      const { data: playerMatches, error: matchError } = await supabase
        .from("match_players")
        .select("match_id")
        .eq("player_id", player.id);

      if (matchError) throw matchError;
      
      if (!playerMatches || playerMatches.length === 0) {
        setMatches([]);
        return;
      }

      const matchIds = playerMatches.map(m => m.match_id);
      
      // Get the detailed match information
      const { data: matchDetails, error: detailsError } = await supabase
        .from("matches")
        .select(`
          id, 
          sport, 
          location, 
          played_at, 
          status,
          match_players (
            player_id,
            has_confirmed,
            performance_rating,
            feedback
          )
        `)
        .in("id", matchIds)
        .order("played_at", { ascending: false });

      if (detailsError) throw detailsError;
      
      if (!matchDetails) {
        setMatches([]);
        return;
      }
      
      // Get all player information for the matches
      const playerIds = matchDetails.flatMap(match => 
        match.match_players.map((p: any) => p.player_id)
      );
      
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select("id, name, rating, city")
        .in("id", playerIds);
      
      if (playersError) throw playersError;
      
      // Combine all the data
      const enrichedMatches = matchDetails.map(match => {
        const matchPlayers = players.filter(player => 
          match.match_players.some((mp: any) => mp.player_id === player.id)
        );
        
        const userConfirmed = match.match_players.find(
          (mp: any) => mp.player_id === player.id
        )?.has_confirmed || false;

        const userMatchData = match.match_players.find(
          (mp: any) => mp.player_id === player.id
        );
        
        return {
          ...match,
          players: matchPlayers,
          userConfirmed,
          userFeedback: userMatchData?.feedback,
          isPastMatch: new Date(match.played_at) < new Date()
        };
      });
      
      setMatches(enrichedMatches);
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmMatch = async (matchId: string) => {
    if (!user || !playerProfile) return;
    
    try {
      const { error } = await supabase
        .from("match_players")
        .update({ has_confirmed: true })
        .eq("match_id", matchId)
        .eq("player_id", playerProfile.id);
      
      if (error) throw error;
      
      setMatches(matches.map(match => {
        if (match.id === matchId) {
          return { ...match, userConfirmed: true };
        }
        return match;
      }));

      toast({
        title: "Match confirmed",
        description: "You have confirmed your participation in this match.",
      });
    } catch (error) {
      console.error("Error confirming match:", error);
      toast({
        title: "Error",
        description: "Could not confirm match participation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string, userConfirmed: boolean, isPastMatch: boolean, userFeedback: string) => {
    if (isPastMatch) {
      return userFeedback 
        ? <Badge className="bg-green-100 text-green-800">Completed</Badge>
        : <Badge className="bg-orange-100 text-orange-800">Pending feedback</Badge>;
    }
    
    if (status === "pending") {
      return userConfirmed 
        ? <Badge className="bg-orange-100 text-orange-800">Waiting for opponent</Badge>
        : <Badge className="bg-yellow-100 text-yellow-800">Needs confirmation</Badge>;
    }
    
    return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner text-orange-500"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Suggestions */}
      <GameSuggestions />
      
      {/* Quick Match Recorder */}
      {playerProfile && (
        <QuickMatchRecorder 
          playerId={playerProfile.id}
          playerName={playerProfile.name}
          onMatchRecorded={fetchPlayerAndMatches}
        />
      )}

      {/* Recent Matches */}
      {matches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Matches</h3>
          {matches.slice(0, 5).map((match) => (
            <Card key={match.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{match.sport} Match</h4>
                    {getStatusBadge(match.status, match.userConfirmed, match.isPastMatch, match.userFeedback)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(match.played_at), "MMM d, h:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{match.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{match.players.length} players</span>
                    </div>
                  </div>

                  {match.userFeedback && (
                    <p className="text-sm text-gray-600 italic">{match.userFeedback}</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    asChild
                  >
                    <Link to={`/messages/match/${match.id}`}>
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Chat
                    </Link>
                  </Button>
                  
                  {!match.isPastMatch && !match.userConfirmed && (
                    <Button 
                      size="sm"
                      onClick={() => confirmMatch(match.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Confirm
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
