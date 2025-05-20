
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Calendar } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { BracketMatch, BracketPlayer } from "@/types/tournament";

interface TournamentResult {
  tournamentId: string;
  tournamentName: string;
  sport: string;
  date: string;
  winner?: {
    id: string;
    name: string;
  };
  runnerUp?: {
    id: string;
    name: string;
  };
  semifinalists: {
    id: string;
    name: string;
  }[];
}

export const TournamentSummary = () => {
  const [results, setResults] = useState<TournamentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentTournamentResults();
  }, []);

  const fetchRecentTournamentResults = async () => {
    try {
      setLoading(true);
      
      // Fetch recently completed tournaments
      const { data: tournaments, error } = await supabase
        .from('tournaments')
        .select('id, name, sport, start_date, bracket_data, status')
        .eq('status', 'completed')
        .order('start_date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      if (!tournaments || tournaments.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }
      
      // Process each tournament to extract results
      const processedResults = tournaments.map((tournament: any) => {
        const bracketData = tournament.bracket_data as any;
        const matches = bracketData?.matches || [];
        
        // Find the final match
        const finalMatch = matches.find((match: BracketMatch) => match.round === bracketData.rounds);
        
        // Find semifinals
        const semifinalMatches = matches.filter(
          (match: BracketMatch) => match.round === bracketData.rounds - 1
        );
        
        // Extract winner, runner-up and semifinalists
        let winner, runnerUp;
        const semifinalists: {id: string; name: string}[] = [];
        
        if (finalMatch && finalMatch.winner) {
          // Winner is the player with matching ID
          const winningPlayer = finalMatch.player1?.id === finalMatch.winner 
            ? finalMatch.player1 
            : finalMatch.player2;
            
          if (winningPlayer) {
            winner = {
              id: winningPlayer.id,
              name: winningPlayer.name
            };
          }
          
          // Runner-up is the other player
          const losingPlayer = finalMatch.player1?.id === finalMatch.winner 
            ? finalMatch.player2 
            : finalMatch.player1;
            
          if (losingPlayer) {
            runnerUp = {
              id: losingPlayer.id,
              name: losingPlayer.name
            };
          }
        }
        
        // Extract semifinalists (excluding finalists)
        semifinalMatches.forEach((match: BracketMatch) => {
          // The player who didn't advance to the final is a semifinalist
          if (match.player1 && match.player2) {
            const loserId = match.winner === match.player1.id 
              ? match.player2.id 
              : match.player1.id;
              
            const loser = match.winner === match.player1.id 
              ? match.player2 
              : match.player1;
            
            if (loser) {
              semifinalists.push({
                id: loser.id,
                name: loser.name
              });
            }
          }
        });
        
        return {
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          sport: tournament.sport,
          date: tournament.start_date,
          winner,
          runnerUp,
          semifinalists
        };
      });
      
      setResults(processedResults);
    } catch (error) {
      console.error("Error fetching tournament results:", error);
      toast({
        title: "Error",
        description: "Failed to load tournament results",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-48">
            <span className="loading loading-spinner text-primary"></span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recent Tournament Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No completed tournaments found
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Recent Tournament Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {results.map((result) => (
          <Card key={result.tournamentId} className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-lg font-semibold">{result.tournamentName}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge>{result.sport}</Badge>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(result.date), "PPP")}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                {result.winner && (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">Winner: {result.winner.name}</span>
                  </div>
                )}
                
                {result.runnerUp && (
                  <div className="flex items-center gap-2">
                    <Medal className="h-5 w-5 text-gray-400" />
                    <span>Runner-up: {result.runnerUp.name}</span>
                  </div>
                )}
                
                {result.semifinalists.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Medal className="h-5 w-5 text-amber-700" />
                    <span>
                      Semifinalists: {result.semifinalists.map(s => s.name).join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};
