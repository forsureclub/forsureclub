
import { useState, useEffect } from "react";
import { PlayerCard } from "./PlayerCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "./ui/card";
import { Loader2, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const PlayerSwiper = () => {
  const [players, setPlayers] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        // Get current player information
        const { data: playerData } = await supabase
          .from("players")
          .select("*")
          .eq("email", user.email)
          .single();

        if (!playerData) {
          toast({
            title: "Error",
            description: "Could not find your player profile",
            variant: "destructive",
          });
          return;
        }

        setCurrentPlayer(playerData);

        // Get potential matches - similar ability (±0.5 rating) and same location
        const { data: potentialMatches, error } = await supabase
          .from("players")
          .select("*")
          .eq("sport", playerData.sport)
          .eq("city", playerData.city)
          .eq("gender", playerData.gender)
          .neq("id", playerData.id)
          .gte("rating", playerData.rating - 0.5)
          .lte("rating", playerData.rating + 0.5)
          .limit(20);

        if (error) throw error;

        if (potentialMatches && potentialMatches.length > 0) {
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
    if (!currentPlayer) return;

    try {
      // Check if the other player has already liked this player
      const { data: existingLike, error: checkError } = await supabase
        .from("chat_messages")
        .select("*")
        .like("content", `%"type":"like"%`)
        .like("content", `%"from_player":"${playerId}"%`)
        .like("content", `%"to_player":"${currentPlayer.id}"%`)
        .maybeSingle();

      if (checkError) throw checkError;

      // Record this player's like
      await supabase
        .from("chat_messages")
        .insert({
          user_id: user!.id,
          content: JSON.stringify({
            type: "like",
            from_player: currentPlayer.id,
            to_player: playerId,
            timestamp: new Date().toISOString()
          }),
          is_ai: false
        });

      if (existingLike) {
        // It's a mutual match!
        const { data: matchedPlayer } = await supabase
          .from("players")
          .select("*")
          .eq("id", playerId)
          .single();

        if (matchedPlayer) {
          // Send notification to both players
          await sendMutualMatchNotification(currentPlayer.email, matchedPlayer.email, {
            player1Name: currentPlayer.name,
            player2Name: matchedPlayer.name,
            sport: currentPlayer.sport,
            location: currentPlayer.city
          });

          toast({
            title: "🎉 It's a Match!",
            description: `You and ${matchedPlayer.name} have matched! You can now message each other.`,
          });
        }
      } else {
        // Send like notification to the other player
        const { data: likedPlayer } = await supabase
          .from("players")
          .select("*")
          .eq("id", playerId)
          .single();

        if (likedPlayer) {
          await sendLikeNotification(likedPlayer.email, {
            likerName: currentPlayer.name,
            sport: currentPlayer.sport,
            location: currentPlayer.city
          });

          toast({
            title: "Like Sent!",
            description: `${likedPlayer.name} has been notified of your interest.`,
          });
        }
      }
      
      // Move to next card
      if (currentIndex < players.length - 1) {
        setCurrentIndex(prevIndex => prevIndex + 1);
      }
    } catch (error) {
      console.error("Error processing like:", error);
      toast({
        title: "Error",
        description: "Failed to process like",
        variant: "destructive",
      });
    }
  };

  const handleSkip = (playerId: string) => {
    if (currentIndex < players.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  };

  const sendMutualMatchNotification = async (email1: string, email2: string, matchDetails: any) => {
    try {
      await supabase.functions.invoke("send-mutual-match-notification", {
        body: { 
          email1,
          email2,
          matchDetails
        }
      });
    } catch (error) {
      console.error("Error sending mutual match notification:", error);
    }
  };

  const sendLikeNotification = async (recipientEmail: string, likeDetails: any) => {
    try {
      await supabase.functions.invoke("send-like-notification", {
        body: { 
          recipientEmail,
          likeDetails
        }
      });
    } catch (error) {
      console.error("Error sending like notification:", error);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 flex justify-center items-center">
          <Loader2 className="h-8 w-8 text-orange-600 animate-spin mr-2" />
          <p>Finding similar players in your area...</p>
        </CardContent>
      </Card>
    );
  }

  if (players.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">No Similar Players Found</h3>
          <p className="text-gray-500 mb-4">
            We couldn't find any players with similar ability (±0.5 rating) in your area at the moment. Please check back later!
          </p>
        </CardContent>
      </Card>
    );
  }

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
          You've gone through all available players with similar abilities in your area. Check back later for new matches!
        </p>
      </CardContent>
    </Card>
  );
};
