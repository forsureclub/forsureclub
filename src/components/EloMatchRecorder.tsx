import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { updatePlayerEloRating, processMatchResult } from "@/services/matchmaking/eloSystem";
import { supabase } from "@/integrations/supabase/client";
import { X, Trophy, UserMinus, Plus } from "lucide-react";
import { Badge } from "./ui/badge";
import { getSkillLevelDescription } from "@/types/matchmaking";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const EloMatchRecorder = () => {
  const [winnerIds, setWinnerIds] = useState<string[]>([]);
  const [loserIds, setLoserIds] = useState<string[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<{ id: string, name: string, rating: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();

  // Set the sport to Padel
  const sport = "Padel";

  // Fetch available players for Padel
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('id, name, rating, elo_rating')
          .eq('sport', sport)
          .order('name', { ascending: true });

        if (error) throw error;
        
        if (data) {
          setAvailablePlayers(data.map(player => ({
            id: player.id,
            name: player.name,
            rating: player.rating
          })));
        }
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
  }, [toast]);

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

  const getPlayerInfo = (id: string) => {
    const player = availablePlayers.find(p => p.id === id);
    if (!player) return { name: 'Unknown Player', rating: 0 };
    return { 
      name: player.name,
      rating: player.rating
    };
  };

  if (isFetching) {
    return (
      <Card className="p-4">
        <CardContent className="pt-2">
          <div className="flex justify-center items-center h-40">
            <div className="animate-pulse text-center">
              <div className="h-6 w-32 bg-gray-200 rounded mx-auto mb-2"></div>
              <div className="h-4 w-48 bg-gray-200 rounded mx-auto"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white pb-4">
        <CardTitle className="flex items-center gap-2">
          <Trophy size={20} />
          Quick Match Record - Padel
        </CardTitle>
        <CardDescription className="text-orange-100">
          Record match results and update ELO ratings
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 pt-6 space-y-4">
        <Tabs defaultValue="select" className="space-y-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="select">Select Players</TabsTrigger>
            <TabsTrigger value="review">Review & Submit</TabsTrigger>
          </TabsList>
          
          <TabsContent value="select" className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <Label className="flex items-center gap-1 text-green-600">
                    <Trophy size={16} /> Winners
                  </Label>
                  <span className="text-xs text-gray-500">{winnerIds.length} selected</span>
                </div>
                <Select onValueChange={addWinner}>
                  <SelectTrigger className="flex items-center">
                    <SelectValue placeholder="Add winner" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlayers
                      .filter(player => !winnerIds.includes(player.id))
                      .map((player) => (
                      <SelectItem key={`winner-${player.id}`} value={player.id} className="flex justify-between">
                        <div className="flex items-center gap-1">
                          <Plus size={14} className="text-green-500" />
                          <span>{player.name}</span>
                          <span className="text-xs text-gray-500 ml-1">
                            ({getSkillLevelDescription(player.rating)})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2 min-h-10">
                {winnerIds.map(id => {
                  const player = getPlayerInfo(id);
                  return (
                    <Badge 
                      key={`winner-badge-${id}`} 
                      variant="outline" 
                      className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 pl-2 pr-1 py-1"
                    >
                      {player.name}
                      <button 
                        onClick={() => removeWinner(id)}
                        className="ml-1 rounded-full hover:bg-green-200 p-1"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  );
                })}
                {winnerIds.length === 0 && 
                  <div className="text-sm text-gray-400 flex items-center">
                    No winners selected
                  </div>
                }
              </div>

              <div className="border-t pt-4 mt-2"></div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <Label className="flex items-center gap-1 text-red-500">
                    <UserMinus size={16} /> Losers
                  </Label>
                  <span className="text-xs text-gray-500">{loserIds.length} selected</span>
                </div>
                <Select onValueChange={addLoser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add loser" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlayers
                      .filter(player => !loserIds.includes(player.id))
                      .map((player) => (
                      <SelectItem key={`loser-${player.id}`} value={player.id}>
                        <div className="flex items-center gap-1">
                          <Plus size={14} className="text-red-500" />
                          <span>{player.name}</span>
                          <span className="text-xs text-gray-500 ml-1">
                            ({getSkillLevelDescription(player.rating)})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2 min-h-10">
                {loserIds.map(id => {
                  const player = getPlayerInfo(id);
                  return (
                    <Badge 
                      key={`loser-badge-${id}`} 
                      variant="outline" 
                      className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1 pl-2 pr-1 py-1"
                    >
                      {player.name}
                      <button 
                        onClick={() => removeLoser(id)}
                        className="ml-1 rounded-full hover:bg-red-200 p-1"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  );
                })}
                {loserIds.length === 0 && 
                  <div className="text-sm text-gray-400 flex items-center">
                    No losers selected
                  </div>
                }
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="review" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Winners</h3>
                {winnerIds.length > 0 ? (
                  <div className="bg-green-50 rounded-md p-3">
                    <ul className="space-y-1">
                      {winnerIds.map(id => (
                        <li key={`review-winner-${id}`} className="flex items-center gap-2">
                          <Trophy size={16} className="text-green-500" />
                          <span>{getPlayerName(id)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-red-500 text-sm">No winners selected</div>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Losers</h3>
                {loserIds.length > 0 ? (
                  <div className="bg-red-50 rounded-md p-3">
                    <ul className="space-y-1">
                      {loserIds.map(id => (
                        <li key={`review-loser-${id}`} className="flex items-center gap-2">
                          <UserMinus size={16} className="text-red-500" />
                          <span>{getPlayerName(id)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-red-500 text-sm">No losers selected</div>
                )}
              </div>

              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                <p>Recording this match will:</p>
                <ul className="list-disc ml-5 mt-1">
                  <li>Create a new match record</li>
                  <li>Update player ELO ratings based on the result</li>
                  <li>Add this match to player histories</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Button 
          onClick={recordMatch}
          disabled={isLoading || winnerIds.length === 0 || loserIds.length === 0}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
        >
          {isLoading ? "Recording..." : "Record Match Result"}
        </Button>
      </CardContent>
    </Card>
  );
};
