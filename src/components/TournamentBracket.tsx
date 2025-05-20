
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { createSingleEliminationBracket, advancePlayerInBracket } from "@/services/matchmaking/tournamentUtils";
import { LoadingState } from "./tournament/LoadingState";
import { EmptyBracketState } from "./tournament/EmptyBracketState";
import { BracketRound } from "./tournament/BracketRound";
import { useToast } from "@/components/ui/use-toast";
import { TournamentBracket as TournamentBracketType } from "@/types/tournament";

interface TournamentBracketProps {
  tournamentId: string;
  editable?: boolean;
}

export const TournamentBracket = ({ tournamentId, editable = false }: TournamentBracketProps) => {
  const [bracket, setBracket] = useState<TournamentBracketType | null>(null);
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
        // Parse the bracket data safely
        const bracketData = tournament.bracket_data as any;
        
        setBracket({
          id,
          name: tournament.name,
          matches: Array.isArray(bracketData.matches) ? bracketData.matches : [],
          rounds: typeof bracketData.rounds === 'number' ? bracketData.rounds : 0,
          roundNames: Array.isArray(bracketData.roundNames) ? bracketData.roundNames : []
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

  const handleWinnerSelection = async (matchId: string, winnerId: string) => {
    try {
      await advancePlayerInBracket(tournamentId, matchId, winnerId);
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
    return <LoadingState />;
  }

  if (!bracket) {
    return (
      <EmptyBracketState 
        editable={editable} 
        generating={generating} 
        onGenerate={handleGenerateBracket} 
      />
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
            <BracketRound 
              key={`round-${round}`}
              round={round}
              roundName={roundName}
              matches={roundMatches}
              editable={editable}
              onSelectWinner={handleWinnerSelection}
            />
          );
        })}
      </div>
    </Card>
  );
};
