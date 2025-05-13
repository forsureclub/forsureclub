import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Calendar, MapPin, Users, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow, format } from "date-fns";
import { CourtBooking } from "./CourtBooking";
import { isMatchReadyForBooking } from "@/services/matchmakingService";

export const PlayerMatches = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMatches = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Get all matches the player is part of
        const { data: playerMatches, error: matchError } = await supabase
          .from("match_players")
          .select("match_id")
          .eq("player_id", user.id);

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
            booking_id,
            booking_details,
            match_players (
              player_id,
              has_confirmed
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
          .select("id, name, rating, club, city")
          .in("id", playerIds);
        
        if (playersError) throw playersError;
        
        // Combine all the data
        const enrichedMatches = matchDetails.map(match => {
          const matchPlayers = players.filter(player => 
            match.match_players.some((mp: any) => mp.player_id === player.id)
          );
          
          const userConfirmed = match.match_players.find(
            (mp: any) => mp.player_id === user.id
          )?.has_confirmed || false;
          
          const allConfirmed = match.match_players.every(
            (mp: any) => mp.has_confirmed
          );
          
          return {
            ...match,
            players: matchPlayers,
            userConfirmed,
            allConfirmed
          };
        });
        
        setMatches(enrichedMatches);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [user]);

  const confirmMatch = async (matchId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("match_players")
        .update({ has_confirmed: true })
        .eq("match_id", matchId)
        .eq("player_id", user.id);
      
      if (error) throw error;
      
      // Update the local state
      setMatches(matches.map(match => {
        if (match.id === matchId) {
          const updatedMatch = { ...match, userConfirmed: true };
          
          // Check if all players have confirmed now
          const allConfirmed = match.match_players.every(
            (mp: any) => mp.player_id === user.id ? true : mp.has_confirmed
          );
          
          updatedMatch.allConfirmed = allConfirmed;
          return updatedMatch;
        }
        return match;
      }));
    } catch (error) {
      console.error("Error confirming match:", error);
    }
  };

  const getStatusBadge = (status: string, userConfirmed: boolean, allConfirmed: boolean) => {
    switch(status) {
      case "scheduled":
        return userConfirmed 
          ? <Badge className="bg-orange-100 text-orange-800">Waiting for others</Badge>
          : <Badge className="bg-yellow-100 text-yellow-800">Needs confirmation</Badge>;
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">Confirmed, ready to book</Badge>;
      case "booked":
        return <Badge className="bg-blue-100 text-blue-800">Court booked</Badge>;
      case "completed":
        return <Badge className="bg-gray-100 text-gray-800">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return allConfirmed
          ? <Badge className="bg-green-100 text-green-800">All confirmed</Badge>
          : <Badge>Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner text-orange-500"></span>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-xl font-semibold mb-4">No Matches Yet</h3>
        <p className="text-gray-600 mb-4">
          You don't have any scheduled matches yet. Start matching with other players to see your games here.
        </p>
        <Button className="bg-orange-600 hover:bg-orange-700">
          Find a Match
        </Button>
      </Card>
    );
  }

  // If a match is selected for booking, show the court booking component
  if (selectedMatch) {
    const match = matches.find(m => m.id === selectedMatch);
    if (!match) return null;
    
    return (
      <div className="space-y-6">
        <Button 
          variant="outline" 
          onClick={() => setSelectedMatch(null)}
          className="mb-4"
        >
          ← Back to matches
        </Button>
        
        <CourtBooking 
          matchId={match.id} 
          sport={match.sport} 
          location={match.location}
          playerIds={match.players.map((p: any) => p.id)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Matches</h2>
      {matches.map((match) => (
        <Card key={match.id} className="p-6 shadow-md">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="space-y-4">
              <div className="flex items-center">
                <h3 className="text-xl font-semibold">{match.sport} Match</h3>
                {getStatusBadge(match.status, match.userConfirmed, match.allConfirmed)}
              </div>
              
              <div className="flex flex-col space-y-2">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-gray-500" />
                  <span>
                    {format(new Date(match.played_at), "MMMM d, yyyy")} 
                    <span className="text-gray-500 ml-2">
                      ({formatDistanceToNow(new Date(match.played_at), { addSuffix: true })})
                    </span>
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-gray-500" />
                  <span>{format(new Date(match.played_at), "h:mm a")}</span>
                </div>
                
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-gray-500" />
                  <span>{match.location}</span>
                </div>
                
                <div className="flex items-start">
                  <Users className="w-5 h-5 mr-2 text-gray-500" />
                  <div>
                    <p className="font-medium">Players:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {match.players.map((player: any) => (
                        <li key={player.id} className="flex items-center">
                          {player.name}
                          {match.match_players.find((mp: any) => mp.player_id === player.id)?.has_confirmed && (
                            <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col justify-between">
              {match.status === "booked" && match.booking_details && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-blue-800 mb-2">Court Booking</h4>
                  <p className="text-sm">
                    Court booked for {format(new Date(match.played_at), "MMMM d, yyyy")} at {format(new Date(match.played_at), "h:mm a")}
                  </p>
                  <p className="text-sm mt-1">Booking reference: {match.booking_id}</p>
                </div>
              )}
              
              <div className="flex flex-col space-y-2">
                {!match.userConfirmed && (
                  <Button 
                    onClick={() => confirmMatch(match.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Confirm Participation
                  </Button>
                )}
                
                {(match.status === "scheduled" || match.status === "confirmed") && match.allConfirmed && (
                  <Button 
                    onClick={() => setSelectedMatch(match.id)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {match.status === "confirmed" ? "Book Court" : "View Booking Options"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
