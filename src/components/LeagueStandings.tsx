
import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LeagueStandingsProps {
  leagueId: string;
}

interface PlayerStanding {
  position: number;
  id: string;
  name: string;
  rating: number;
  played: number;
  won: number;
  lost: number;
  points: number;
}

interface League {
  name: string;
  sport: string;
  location: string;
  start_date: string;
  status: string;
  player_count: number;
}

export const LeagueStandings = ({ leagueId }: LeagueStandingsProps) => {
  const [league, setLeague] = useState<League | null>(null);
  const [players, setPlayers] = useState<PlayerStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLeagueData = async () => {
      try {
        setLoading(true);
        
        // Fetch league details
        const { data: leagueData, error: leagueError } = await supabase
          .from("mini_leagues")
          .select("name, sport, location, start_date, status, player_count")
          .eq("id", leagueId)
          .single();
        
        if (leagueError) throw leagueError;
        
        // Fetch league players with their stats
        const { data: leaguePlayers, error: playersError } = await supabase
          .from("league_players")
          .select(`
            player_id,
            matches_played,
            matches_won,
            matches_lost,
            points,
            players (
              id,
              name,
              rating
            )
          `)
          .eq("league_id", leagueId)
          .order("points", { ascending: false });
        
        if (playersError) throw playersError;
        
        setLeague(leagueData as League);
        
        // Process player data
        if (leaguePlayers) {
          const processedPlayers = leaguePlayers.map((player: any, index: number) => ({
            position: index + 1,
            id: player.player_id,
            name: player.players?.name || "Unknown Player",
            rating: player.players?.rating || 0,
            played: player.matches_played,
            won: player.matches_won,
            lost: player.matches_lost,
            points: player.points
          }));
          
          setPlayers(processedPlayers);
        }
      } catch (error) {
        console.error("Error fetching league data:", error);
        toast({
          title: "Error",
          description: "Failed to load league data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (leagueId) {
      fetchLeagueData();
    }
  }, [leagueId, toast]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner text-orange-500"></span>
      </div>
    );
  }

  if (!league) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-xl font-semibold mb-4">League Not Found</h3>
        <p className="text-gray-600">
          The requested league could not be found or you don't have access to it.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">{league.name} - Standings</h2>
          <p className="text-gray-600">{league.sport} in {league.location}</p>
        </div>
        
        <Badge className={
          league.status === 'active' 
            ? 'bg-green-100 text-green-800 mt-2 md:mt-0' 
            : league.status === 'completed' 
            ? 'bg-gray-100 text-gray-800 mt-2 md:mt-0'
            : 'bg-amber-100 text-amber-800 mt-2 md:mt-0'
        }>{league.status}</Badge>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Pos</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Rating</TableHead>
              <TableHead className="text-right">P</TableHead>
              <TableHead className="text-right">W</TableHead>
              <TableHead className="text-right">L</TableHead>
              <TableHead className="text-right">Pts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => (
              <TableRow key={player.id}>
                <TableCell className="font-medium">{player.position}</TableCell>
                <TableCell>{player.name}</TableCell>
                <TableCell className="text-right">{player.rating.toFixed(1)}</TableCell>
                <TableCell className="text-right">{player.played}</TableCell>
                <TableCell className="text-right">{player.won}</TableCell>
                <TableCell className="text-right">{player.lost}</TableCell>
                <TableCell className="text-right font-bold">{player.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
