
import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { getMiniLeagueMatches } from "@/services/matchmaking/miniLeagueService";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format, isFuture } from "date-fns";
import { Calendar, MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface LeagueMatchScheduleProps {
  leagueId: string;
}

export const LeagueMatchSchedule = ({ leagueId }: LeagueMatchScheduleProps) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [players, setPlayers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        
        // Fetch all matches for this league
        const matchesData = await getMiniLeagueMatches(leagueId);
        
        // Get all player IDs from the matches
        const playerIds = new Set<string>();
        matchesData.forEach(match => {
          match.match_players.forEach((player: any) => {
            playerIds.add(player.player_id);
          });
        });
        
        // Fetch player details
        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select("id, name, rating")
          .in("id", Array.from(playerIds));
        
        if (playersError) throw playersError;
        
        // Create a lookup map for players
        const playersMap: Record<string, any> = {};
        playersData?.forEach(player => {
          playersMap[player.id] = player;
        });
        
        setPlayers(playersMap);
        setMatches(matchesData);
      } catch (error) {
        console.error("Error fetching league matches:", error);
        toast({
          title: "Error",
          description: "Failed to load match schedule. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (leagueId) {
      fetchMatches();
    }
  }, [leagueId, toast]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner text-orange-500"></span>
      </div>
    );
  }

  // Separate matches into upcoming and past
  const currentDate = new Date();
  const upcomingMatches = matches.filter(match => isFuture(new Date(match.played_at)));
  const pastMatches = matches.filter(match => !isFuture(new Date(match.played_at)));

  return (
    <div className="space-y-8">
      {upcomingMatches.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Upcoming Matches</h2>
          {upcomingMatches.map(match => (
            <Card key={match.id} className="p-4 shadow-md">
              <div className="flex flex-col md:flex-row justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">Round {match.round_number}</h3>
                    <Badge className="bg-blue-100 text-blue-800">
                      {match.status === "scheduled" ? "Scheduled" : match.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    <span>
                      {format(new Date(match.played_at), "MMMM d, yyyy")} at {format(new Date(match.played_at), "h:mm a")}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{match.location}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-gray-500" />
                    <div>
                      <p className="font-medium">Players:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {match.match_players.map((player: any) => (
                          <li key={player.player_id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span>{players[player.player_id]?.name || "Unknown Player"}</span>
                              <span className="text-sm text-gray-500">
                                (Rating: {players[player.player_id]?.rating?.toFixed(1) || "N/A"})
                              </span>
                            </div>
                            {player.has_confirmed && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Confirmed
                              </Badge>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0">
                  <Button
                    asChild
                    className="bg-orange-600 hover:bg-orange-700 w-full"
                  >
                    <Link to={`/match/${match.id}`}>View Match</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {pastMatches.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Past Matches</h2>
          {pastMatches.map(match => (
            <Card key={match.id} className="p-4 shadow-md">
              <div className="flex flex-col md:flex-row justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">Round {match.round_number}</h3>
                    <Badge className="bg-gray-100 text-gray-800">
                      {match.status === "completed" ? "Completed" : match.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    <span>
                      {format(new Date(match.played_at), "MMMM d, yyyy")}
                      <span className="text-gray-500 ml-2">
                        ({formatDistanceToNow(new Date(match.played_at), { addSuffix: true })})
                      </span>
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{match.location}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-gray-500" />
                    <div>
                      <p className="font-medium">Result:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {match.match_players.map((player: any) => {
                          const hasRating = player.performance_rating !== null;
                          
                          return (
                            <li key={player.player_id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span>{players[player.player_id]?.name || "Unknown Player"}</span>
                                {hasRating && (
                                  <span className="text-sm text-gray-500">
                                    (Score: {player.performance_rating})
                                  </span>
                                )}
                              </div>
                              {match.match_players.length === 2 && 
                               hasRating && 
                               player.performance_rating === Math.max(
                                 ...match.match_players.map((p: any) => p.performance_rating || 0)
                               ) && (
                                <Badge className="bg-green-100 text-green-800">
                                  Winner
                                </Badge>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                  >
                    <Link to={`/match/${match.id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {matches.length === 0 && (
        <Card className="p-8 text-center">
          <h3 className="text-xl font-semibold mb-4">No Matches Scheduled</h3>
          <p className="text-gray-600 mb-4">
            This league doesn't have any matches scheduled yet.
          </p>
        </Card>
      )}
    </div>
  );
};
