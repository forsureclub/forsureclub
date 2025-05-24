
import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { MapPin, Users, Star, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";

export const GameSuggestions = () => {
  const [suggestedGames, setSuggestedGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPlayerAndSuggestions();
    }
  }, [user]);

  const fetchPlayerAndSuggestions = async () => {
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

      // Find players with similar ability (within 0.5 rating) and exact same location and sport
      const { data: similarPlayers, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("sport", player.sport)
        .eq("city", player.city)
        .eq("gender", player.gender)
        .neq("id", player.id)
        .gte("rating", player.rating - 0.5)
        .lte("rating", player.rating + 0.5)
        .limit(6);

      if (playersError) throw playersError;

      // Create suggested games for the next week
      const suggestions = (similarPlayers || []).map((suggestedPlayer, index) => {
        const gameDate = addDays(new Date(), index + 1);
        return {
          id: `suggestion-${suggestedPlayer.id}`,
          opponent: suggestedPlayer,
          suggestedDate: gameDate,
          location: player.city,
          sport: player.sport,
          matchRating: Math.abs(player.rating - suggestedPlayer.rating)
        };
      });

      setSuggestedGames(suggestions);
    } catch (error) {
      console.error("Error fetching game suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to load game suggestions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const requestMatch = async (suggestion: any) => {
    try {
      // Create a match request (pending until both players confirm)
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .insert({
          sport: suggestion.sport,
          location: suggestion.location,
          played_at: suggestion.suggestedDate.toISOString(),
          status: "pending_match"
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Add both players to the match - initiator is confirmed, recipient needs to confirm
      const { error: playersError } = await supabase
        .from("match_players")
        .insert([
          {
            match_id: match.id,
            player_id: playerProfile.id,
            has_confirmed: true
          },
          {
            match_id: match.id,
            player_id: suggestion.opponent.id,
            has_confirmed: false
          }
        ]);

      if (playersError) throw playersError;

      // Send notification to the other player
      await sendMatchNotification(suggestion.opponent.email, {
        initiatorName: playerProfile.name,
        sport: suggestion.sport,
        location: suggestion.location,
        date: format(suggestion.suggestedDate, "MMM d, yyyy 'at' h:mm a"),
        matchId: match.id
      });

      toast({
        title: "Match Request Sent!",
        description: `Match request sent to ${suggestion.opponent.name}. They will be notified via email.`,
      });

      // Remove from suggestions
      setSuggestedGames(prev => prev.filter(s => s.id !== suggestion.id));
    } catch (error) {
      console.error("Error requesting match:", error);
      toast({
        title: "Error",
        description: "Failed to send match request",
        variant: "destructive",
      });
    }
  };

  const sendMatchNotification = async (recipientEmail: string, matchDetails: any) => {
    try {
      const { error } = await supabase.functions.invoke("send-match-notification", {
        body: { 
          recipientEmail,
          matchDetails
        }
      });
      
      if (error) {
        console.error("Failed to send notification:", error);
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner text-orange-500"></span>
      </div>
    );
  }

  if (!playerProfile) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Complete Your Profile</h3>
        <p className="text-gray-600">Please complete your player profile to see game suggestions.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Suggested Matches</h3>
        <Badge variant="outline" className="bg-orange-50 text-orange-700">
          {playerProfile.city} • Rating {playerProfile.rating.toFixed(1)} • Similar ability only
        </Badge>
      </div>

      {suggestedGames.length === 0 ? (
        <Card className="p-6 text-center">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Similar Players Found</h3>
          <p className="text-gray-600">
            No players with similar ability (±0.5 rating) found in {playerProfile.city}. 
            Try checking back later or adjusting your location!
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {suggestedGames.map((suggestion) => (
            <Card key={suggestion.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-semibold">
                        {suggestion.opponent.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold">{suggestion.opponent.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Star className="h-4 w-4" />
                        <span>Rating: {suggestion.opponent.rating.toFixed(1)}</span>
                        <span className="text-green-600">
                          (Diff: {suggestion.matchRating.toFixed(1)})
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{suggestion.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(suggestion.suggestedDate, "MMM d, h:mm a")}</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => requestMatch(suggestion)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Send Match Request
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
