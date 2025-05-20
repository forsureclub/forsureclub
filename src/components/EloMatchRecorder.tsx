
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { updatePlayerEloRating, processMatchResult } from "@/services/matchmaking/eloSystem";
import { supabase } from "@/integrations/supabase/client";

export const EloMatchRecorder = ({ sport }: { sport: string }) => {
  const [winnerIds, setWinnerIds] = useState<string[]>([]);
  const [loserIds, setLoserIds] = useState<string[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<{ id: string, name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();

  // Fetch available players for this sport
  useState(() => {
    const fetchPlayers = async () => {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('id, name, elo_rating')
          .eq('sport', sport)
          .order('name', { ascending: true });

        if (error) throw error;
        
        setAvailablePlayers(data || []);
      } catch (error) {
        console.error('Error fetching players:', error);
        toast({
          title: "Error",
          description: "Could not load players",
          variant: "destructive",
        });
      } finally {
        setIsFetching(false);
      }
    };

    fetchPlayers();
  }, [sport]);

  const addWinner = (playerId: string) => {
    if (winnerIds.includes(playerId)) return;
    setWinnerIds([...winnerIds, playerId]);
    
    // Remove from losers if present
    if (loserIds.includes(playerId)) {
      setLoserIds(loserIds.filter(id => id !== playerId));
    }
  };

  const addLoser = (playerId: string) => {
    if (loserIds.includes(playerId)) return;
    setLoserIds([...loserIds, playerId]);
    
    // Remove from winners if present
    if (winnerIds.includes(playerId)) {
      setWinnerIds(winnerIds.filter(id => id !== playerId));
    }
  };

  const removeWinner = (playerId: string) => {
    setWinnerIds(winnerIds.filter(id => id !== playerId));
  };

  const removeLoser = (playerId: string) => {
    setLoserIds(loserIds.filter(id => id !== playerId));
  };

  const recordMatch = async () => {
    if (winnerIds.length === 0 || loserIds.length === 0) {
      toast({
        title: "Invalid Selection",
        description: "Please select at least one winner and one loser",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Fetch current ratings for all involved players
      const { data, error } = await supabase
        .from('players')
        .select('id, elo_rating')
        .in('id', [...winnerIds, ...loserIds]);

      if (error) throw error;

      const playerRatings = new Map<string, number>();
      data?.forEach(player => {
        playerRatings.set(player.id, player.elo_rating || 1500);
      });

      // Calculate new ratings
      const newRatings = processMatchResult(playerRatings, winnerIds, loserIds);

      // Record the match
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert({
          sport: sport,
          played_at: new Date().toISOString(),
          location: 'Recorded via ELO System',
        })
        .select('id')
        .single();

      if (matchError) throw matchError;

      // Add match players
      const matchPlayers = [
        ...winnerIds.map(playerId => ({
          player_id: playerId,
          match_id: matchData.id,
          performance_rating: 5,
          feedback: 'Match winner - ELO updated',
        })),
        ...loserIds.map(playerId => ({
          player_id: playerId,
          match_id: matchData.id,
          performance_rating: 3,
          feedback: 'Match loser - ELO updated',
        }))
      ];

      const { error: playersError } = await supabase
        .from('match_players')
        .insert(matchPlayers);

      if (playersError) throw playersError;

      // Update player ELO ratings
      const updatePromises = Array.from(newRatings.entries()).map(
        ([playerId, newRating]) => updatePlayerEloRating(playerId, newRating)
      );

      await Promise.all(updatePromises);

      toast({
        title: "Match Recorded",
        description: "Match results and ELO ratings have been updated",
      });

      // Clear selections
      setWinnerIds([]);
      setLoserIds([]);

    } catch (error) {
      console.error('Error recording match:', error);
      toast({
        title: "Error",
        description: "Failed to record match results",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPlayerName = (id: string) => {
    return availablePlayers.find(p => p.id === id)?.name || 'Unknown Player';
  };

  if (isFetching) {
    return <div>Loading players...</div>;
  }

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Record Match Results</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label>Select Winners</Label>
            <Select onValueChange={addWinner}>
              <SelectTrigger>
                <SelectValue placeholder="Select player" />
              </SelectTrigger>
              <SelectContent>
                {availablePlayers.map((player) => (
                  <SelectItem key={`winner-${player.id}`} value={player.id}>
                    {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Winners</Label>
            <div className="flex flex-wrap gap-2">
              {winnerIds.map(id => (
                <Badge key={`winner-badge-${id}`} variant="default" className="flex gap-1 items-center">
                  {getPlayerName(id)}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeWinner(id)} />
                </Badge>
              ))}
              {winnerIds.length === 0 && <div className="text-sm text-gray-500">No winners selected</div>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Select Losers</Label>
            <Select onValueChange={addLoser}>
              <SelectTrigger>
                <SelectValue placeholder="Select player" />
              </SelectTrigger>
              <SelectContent>
                {availablePlayers.map((player) => (
                  <SelectItem key={`loser-${player.id}`} value={player.id}>
                    {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Losers</Label>
            <div className="flex flex-wrap gap-2">
              {loserIds.map(id => (
                <Badge key={`loser-badge-${id}`} variant="secondary" className="flex gap-1 items-center">
                  {getPlayerName(id)}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeLoser(id)} />
                </Badge>
              ))}
              {loserIds.length === 0 && <div className="text-sm text-gray-500">No losers selected</div>}
            </div>
          </div>
        </div>
      </div>

      <Button 
        onClick={recordMatch}
        disabled={isLoading || winnerIds.length === 0 || loserIds.length === 0}
        className="w-full"
      >
        {isLoading ? "Recording..." : "Record Match Result"}
      </Button>
    </Card>
  );
};

// Missing imports
import { X } from "lucide-react";
import { Badge } from "./ui/badge";
