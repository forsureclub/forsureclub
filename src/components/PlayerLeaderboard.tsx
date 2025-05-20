import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getEloRankDescription } from "@/services/matchmaking/eloSystem";

type LeaderboardPlayer = {
  id: string;
  name: string;
  sport: string;
  rank: number;
  matchesPlayed: number;
  performanceRating: number;
  winPercentage: number;
  recentMatches: number;
  eloRating: number;
  isCurrentUser: boolean;
};

export const PlayerLeaderboard = ({ sport }: { sport: string }) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'elo' | 'performance'>('elo');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (sport) {
      fetchLeaderboardData(sport);
    }
  }, [sport, sortBy]);

  const fetchLeaderboardData = async (sportType: string) => {
    try {
      setLoading(true);
      
      // Get all players for this sport with their performance data
      const { data, error } = await supabase
        .from('players')
        .select(`
          id,
          name,
          sport,
          elo_rating,
          match_players(
            performance_rating,
            play_rating,
            match_id,
            feedback,
            created_at
          )
        `)
        .eq('sport', sportType);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setLeaderboardData([]);
        setLoading(false);
        return;
      }

      // Process the data for leaderboard display
      const processedData = data.map(player => {
        const matchesPlayed = player.match_players?.length || 0;
        
        // Calculate average performance rating
        const totalRating = player.match_players?.reduce((sum: number, mp: any) => 
          sum + (mp.performance_rating || 0), 0);
          
        const avgRating = matchesPlayed > 0 ? totalRating / matchesPlayed : 0;
        
        // Calculate win percentage (based on scores in feedback)
        let wins = 0;
        player.match_players?.forEach((mp: any) => {
          if (mp.feedback && mp.feedback.includes("Score:")) {
            // Simple heuristic: if the score indicates a win
            // This is a simplification - in real app we'd need proper score parsing
            if (mp.feedback.includes("won") || mp.feedback.includes("victory")) {
              wins++;
            }
          }
        });
        
        const winPercentage = matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0;
        
        // Count recent matches (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentMatches = player.match_players?.filter((mp: any) => 
          new Date(mp.created_at) >= thirtyDaysAgo
        ).length || 0;
        
        // Get ELO rating (or default to 1500 if not set)
        const eloRating = player.elo_rating || 1500;
        
        return {
          id: player.id,
          name: player.name,
          sport: player.sport,
          matchesPlayed,
          performanceRating: avgRating,
          eloRating,
          winPercentage,
          recentMatches,
          rank: 0, // Will be assigned after sorting
          isCurrentUser: user?.id === player.id
        };
      });
      
      // Filter out players with no matches
      const activePlayers = processedData.filter(p => p.matchesPlayed > 0);
      
      // Sort by selected criteria
      if (sortBy === 'elo') {
        activePlayers.sort((a, b) => b.eloRating - a.eloRating);
      } else {
        activePlayers.sort((a, b) => b.performanceRating - a.performanceRating);
      }
      
      // Assign ranks
      activePlayers.forEach((player, index) => {
        player.rank = index + 1;
      });
      
      setLeaderboardData(activePlayers);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch(rank) {
      case 1: return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2: return <Medal className="h-4 w-4 text-gray-400" />;
      case 3: return <Medal className="h-4 w-4 text-amber-700" />;
      default: return null;
    }
  };

  const toggleSortBy = () => {
    setSortBy(sortBy === 'elo' ? 'performance' : 'elo');
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex justify-center p-8">
          <span className="loading loading-spinner text-orange-500"></span>
        </div>
      </Card>
    );
  }

  if (leaderboardData.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-center text-gray-500 py-8">
          No leaderboard data available yet for {sport}. Play more matches to appear on the leaderboard!
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{sport} Leaderboard</h3>
        <Badge 
          variant="outline" 
          className="cursor-pointer" 
          onClick={toggleSortBy}
        >
          Sort by: {sortBy === 'elo' ? 'ELO Rating' : 'Performance'}
        </Badge>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-center">ELO</TableHead>
            <TableHead className="text-center">Matches</TableHead>
            <TableHead className="text-center">Rating</TableHead>
            <TableHead className="text-center hidden md:table-cell">Recent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaderboardData.slice(0, 10).map((player) => (
            <TableRow 
              key={player.id}
              className={player.isCurrentUser ? "bg-orange-50" : ""}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-1">
                  {getRankIcon(player.rank)}
                  {player.rank}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {player.name}
                  {player.isCurrentUser && (
                    <Badge variant="outline" className="text-xs">You</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex flex-col items-center justify-center">
                  <span className="font-medium">{player.eloRating}</span>
                  <span className="text-xs text-gray-500">
                    {getEloRankDescription(player.eloRating)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center">{player.matchesPlayed}</TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className={`font-medium ${
                    player.performanceRating >= 4.5 ? "text-green-600" : 
                    player.performanceRating >= 3.5 ? "text-blue-600" :
                    player.performanceRating >= 2.5 ? "text-amber-600" : "text-red-600"
                  }`}>
                    {player.performanceRating.toFixed(1)}
                  </span>
                  <Star 
                    className={`h-3 w-3 ${
                      player.performanceRating >= 4.5 ? "text-green-600" : 
                      player.performanceRating >= 3.5 ? "text-blue-600" :
                      player.performanceRating >= 2.5 ? "text-amber-600" : "text-red-600"
                    }`} 
                    fill="currentColor" 
                  />
                </div>
              </TableCell>
              <TableCell className="text-center hidden md:table-cell">
                {player.recentMatches > 0 ? (
                  <Badge variant="secondary" className="text-xs">
                    {player.recentMatches} in last 30 days
                  </Badge>
                ) : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {leaderboardData.length > 10 && (
        <p className="text-center text-sm text-gray-500 mt-2">
          Showing top 10 players
        </p>
      )}
    </Card>
  );
};
