
import { useState, useEffect } from "react";
import { PlayerCard } from "./PlayerCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "./ui/card";
import { Loader2, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { MatchWaitingCard } from "./matchmaking/MatchWaitingCard";

export const PlayerSwiper = () => {
  const [players, setPlayers] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [matchedPlayerId, setMatchedPlayerId] = useState<string | null>(null);
  const [matchFound, setMatchFound] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        // Get current player information to filter out from potential matches
        const { data: currentPlayer } = await supabase
          .from("players")
          .select("id, sport, city, rating")
          .eq("email", user.email)
          .single();

        if (!currentPlayer) {
          toast({
            title: "Error",
            description: "Could not find your player profile",
            variant: "destructive",
          });
          return;
        }

        // Get potential matches with similar rating and sport
        const { data: potentialMatches, error } = await supabase
          .from("players")
          .select("*")
          .eq("sport", currentPlayer.sport)
          // Filter out the current player
          .neq("id", currentPlayer.id)
          // Find players with similar rating (within 1.0 point)
          .gte("rating", currentPlayer.rating - 1.0)
          .lte("rating", currentPlayer.rating + 1.0)
          // Limit results to avoid loading too many profiles
          .limit(20);

        if (error) throw error;

        if (potentialMatches && potentialMatches.length > 0) {
          // Shuffle the array to randomize order
          const shuffled = [...potentialMatches].sort(() => 0.5 - Math.random());
          setPlayers(shuffled);
        } else {
          setPlayers([]);
        }
      } catch (error) {
        console.error("Error fetching players:", error);
        toast({
          title: "Error",
          description: "Failed to load player profiles",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayers();
  }, [user, toast]);

  const handleLike = async (playerId: string) => {
    try {
      // Store the liked player ID
      setMatchedPlayerId(playerId);
      
      // Simulate finding a match (in a real app this would check if both players have liked each other)
      setMatchFound(true);
      
      // Get matched player details
      const { data: matchedPlayer } = await supabase
        .from("players")
        .select("*")
        .eq("id", playerId)
        .single();
      
      if (matchedPlayer) {
        toast({
          title: "It's a match!",
          description: `You matched with ${matchedPlayer.name}! An email will be sent soon.`,
        });
      }
      
      // Move to the next card regardless
      if (currentIndex < players.length - 1) {
        setCurrentIndex(prevIndex => prevIndex + 1);
      }
    } catch (error) {
      console.error("Error processing match:", error);
      toast({
        title: "Error",
        description: "Failed to process match request",
        variant: "destructive",
      });
    }
  };

  const handleSkip = (playerId: string) => {
    // Move to the next card
    if (currentIndex < players.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 flex justify-center items-center">
          <Loader2 className="h-8 w-8 text-orange-600 animate-spin mr-2" />
          <p>Finding players for you...</p>
        </CardContent>
      </Card>
    );
  }

  if (players.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">No Players Found</h3>
          <p className="text-gray-500 mb-4">
            We couldn't find any players matching your criteria at the moment. Please check back later!
          </p>
        </CardContent>
      </Card>
    );
  }

  // If matched and found a match, show the matching card
  if (matchFound && matchedPlayerId) {
    const matchedPlayer = players.find(p => p.id === matchedPlayerId);
    
    if (!matchedPlayer) return null;
    
    return (
      <MatchWaitingCard
        foundMatch={true}
        matchType="singles"
        matchedPlayers={[matchedPlayer]}
        selectedSport={matchedPlayer.sport}
        email={user?.email || ""}
        location={matchedPlayer.city || "Local Club"}
        abilityLevel={matchedPlayer.rating.toFixed(1)}
      />
    );
  }

  // Show the current player card
  return players[currentIndex] ? (
    <PlayerCard 
      player={players[currentIndex]} 
      onLike={handleLike} 
      onSkip={handleSkip} 
    />
  ) : (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 text-center">
        <h3 className="text-xl font-bold mb-2">All Done!</h3>
        <p className="text-gray-500">
          You've gone through all available players. Check back later for new matches!
        </p>
      </CardContent>
    </Card>
  );
};
