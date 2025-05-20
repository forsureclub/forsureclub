
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createSingleEliminationBracket, advancePlayerInBracket } from "@/services/matchmaking/tournamentUtils";
import { getEloRankDescription } from "@/services/matchmaking/eloSystem";
import { Trophy, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface BracketPlayer {
  id: string;
  name: string;
  eloRating: number;
  seed?: number;
}

interface BracketMatch {
  id: string;
  player1?: BracketPlayer;
  player2?: BracketPlayer;
  winner?: string;
  nextMatchId?: string;
  round: number;
  matchNumber: number;
}

interface TournamentBracket {
  id: string;
  name: string;
  matches: BracketMatch[];
  rounds: number;
  roundNames?: string[];
}

interface TournamentBracketProps {
  tournamentId: string;
  editable?: boolean;
}

export const TournamentBracket = ({ tournamentId, editable = false }: TournamentBracketProps) => {
  const [bracket, setBracket] = useState<TournamentBracket | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentBracket(tournamentId);
    }
  }, [tournamentId]);

  const fetchTournamentBracket = async (id: string) => {
    try {
      setLoading(true);
      const { data: tournament, error } = await supabase
        .from('tournaments')
        .select('name, sport, bracket_data')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (tournament && tournament.bracket_data) {
        setBracket({
          id,
          name: tournament.name,
          ...tournament.bracket_data
        });
      } else {
        // No bracket data yet
        setBracket(null);
      }
    } catch (error) {
      console.error("Error fetching tournament bracket:", error);
      toast({
        title: "Error",
        description: "Could not load tournament bracket",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBracket = async () => {
    try {
      setGenerating(true);
      
      // Get tournament details
      const { data: tournament, error } = await supabase
        .from('tournaments')
        .select('name, sport')
        .eq('id', tournamentId)
        .single();
      
      if (error || !tournament) throw new Error("Tournament not found");
      
      // Generate bracket
      const newBracket = await createSingleEliminationBracket(
        tournamentId, 
        tournament.name, 
        tournament.sport
      );
      
      setBracket(newBracket);
      
      toast({
        title: "Bracket Generated",
        description: "Tournament bracket has been created successfully"
      });
    } catch (error: any) {
      console.error("Error generating bracket:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate bracket",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleWinnerSelection = async (match: BracketMatch, winnerId: string) => {
    try {
      await advancePlayerInBracket(tournamentId, match.id, winnerId);
      toast({
        title: "Match Updated",
        description: "Winner has been advanced to the next round"
      });
      await fetchTournamentBracket(tournamentId);
    } catch (error: any) {
      console.error("Error advancing player:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update match",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-48">
          <span className="loading loading-spinner text-primary"></span>
        </div>
      </Card>
    );
  }

  if (!bracket) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-lg font-medium">No bracket available yet</h3>
          {editable && (
            <Button 
              onClick={handleGenerateBracket}
              disabled={generating}
            >
              {generating ? "Generating..." : "Generate 16-Player Bracket"}
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 overflow-x-auto">
      <h3 className="text-xl font-semibold mb-4">{bracket.name} - Tournament Bracket</h3>
      
      <div className="flex min-w-max gap-4 pb-4">
        {Array.from({ length: bracket.rounds }, (_, i) => i + 1).map((round) => {
          const roundMatches = bracket.matches.filter(m => m.round === round);
          const roundName = bracket.roundNames?.[round - 1] || `Round ${round}`;
          
          return (
            <div 
              key={`round-${round}`} 
              className="flex flex-col gap-4"
              style={{ 
                width: '240px',
                marginTop: round > 1 ? `${2 ** (round - 1) * 20}px` : '0' 
              }}
            >
              <h4 className="text-center font-medium">{roundName}</h4>
              
              <div className="flex flex-col gap-6">
                {roundMatches.map((match) => {
                  const player1 = match.player1;
                  const player2 = match.player2;
                  const hasWinner = !!match.winner;
                  const spacing = round > 1 ? `${2 ** round * 20}px` : '40px';
                  
                  return (
                    <div 
                      key={match.id} 
                      className="flex flex-col" 
                      style={{ marginBottom: spacing }}
                    >
                      <Card className={`p-2 border-2 ${hasWinner ? 'border-green-200' : ''}`}>
                        <div className={`flex flex-col divide-y ${editable ? 'hover:bg-muted/50' : ''}`}>
                          {/* Player 1 */}
                          <div className={`flex justify-between items-center p-2 ${
                            match.winner === player1?.id ? 'bg-green-50' : ''
                          }`}>
                            <div className="flex items-center gap-2">
                              {player1 ? (
                                <>
                                  {player1.seed && <span className="text-xs font-bold bg-primary/10 px-1 rounded">{player1.seed}</span>}
                                  <span>{player1.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({player1.eloRating})
                                  </span>
                                </>
                              ) : (
                                <span className="text-muted-foreground">TBD</span>
                              )}
                            </div>
                            
                            {editable && player1 && !hasWinner && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleWinnerSelection(match, player1.id)}
                                className="h-6 w-6 p-0"
                              >
                                <ArrowRight size={14} />
                              </Button>
                            )}
                            
                            {match.winner === player1?.id && (
                              <Trophy className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          
                          {/* Player 2 */}
                          <div className={`flex justify-between items-center p-2 ${
                            match.winner === player2?.id ? 'bg-green-50' : ''
                          }`}>
                            <div className="flex items-center gap-2">
                              {player2 ? (
                                <>
                                  {player2.seed && <span className="text-xs font-bold bg-primary/10 px-1 rounded">{player2.seed}</span>}
                                  <span>{player2.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({player2.eloRating})
                                  </span>
                                </>
                              ) : (
                                <span className="text-muted-foreground">TBD</span>
                              )}
                            </div>
                            
                            {editable && player2 && !hasWinner && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleWinnerSelection(match, player2.id)}
                                className="h-6 w-6 p-0"
                              >
                                <ArrowRight size={14} />
                              </Button>
                            )}
                            
                            {match.winner === player2?.id && (
                              <Trophy className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
