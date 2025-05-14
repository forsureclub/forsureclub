import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Award, Trophy, Medal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TournamentCreation } from "@/components/TournamentCreation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const AdminLeaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState<string>("all");
  const [timeFrame, setTimeFrame] = useState<string>("all-time");
  const [showTournamentForm, setShowTournamentForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaderboardData();
  }, [sport, timeFrame]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      
      // Construct query to get players and their performance
      let query = supabase
        .from('players')
        .select(`
          id,
          name,
          sport,
          city,
          club,
          rating,
          match_players(
            performance_rating,
            play_rating,
            match_id
          ),
          matches:match_players(
            match(
              played_at,
              sport
            )
          )
        `);
      
      // Filter by sport if needed
      if (sport !== "all") {
        query = query.eq('sport', sport);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setLeaderboardData([]);
        setLoading(false);
        return;
      }

      // Process data to calculate leaderboard metrics
      const processedData = data.map(player => {
        const matchesPlayed = player.match_players?.length || 0;
        
        // Calculate average ratings
        const avgPerformance = player.match_players?.reduce((sum: number, mp: any) => 
          sum + (mp.performance_rating || 0), 0) / (matchesPlayed || 1);
        
        const avgPlayRating = player.match_players?.reduce((sum: number, mp: any) => 
          sum + (mp.play_rating || 0), 0) / (matchesPlayed || 1);
        
        // Filter matches by timeframe if needed
        let relevantMatches = player.matches || [];
        if (timeFrame === "this-month") {
          const thisMonth = new Date().getMonth();
          const thisYear = new Date().getFullYear();
          relevantMatches = relevantMatches.filter((m: any) => {
            const matchDate = new Date(m.match.played_at);
            return matchDate.getMonth() === thisMonth && 
                   matchDate.getFullYear() === thisYear;
          });
        } else if (timeFrame === "last-3-months") {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          relevantMatches = relevantMatches.filter((m: any) => 
            new Date(m.match.played_at) >= threeMonthsAgo);
        }
        
        return {
          id: player.id,
          name: player.name,
          sport: player.sport,
          location: player.city,
          club: player.club,
          matchesPlayed,
          rating: player.rating,
          avgPerformance: avgPerformance || 0,
          avgPlayRating: avgPlayRating || 0,
          recentMatches: relevantMatches.length
        };
      });
      
      // Sort by average performance (highest first)
      processedData.sort((a, b) => b.avgPerformance - a.avgPerformance);
      
      setLeaderboardData(processedData);
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAwardIcon = (position: number) => {
    switch(position) {
      case 0: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1: return <Medal className="h-5 w-5 text-gray-400" />;
      case 2: return <Medal className="h-5 w-5 text-amber-700" />;
      default: return <Award className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="leaderboard" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Player Leaderboard</h2>
            
            <div className="flex space-x-4">
              <div>
                <Label htmlFor="sport-select">Sport</Label>
                <Select value={sport} onValueChange={setSport}>
                  <SelectTrigger id="sport-select" className="w-[180px]">
                    <SelectValue placeholder="Select Sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sports</SelectItem>
                    <SelectItem value="Tennis">Tennis</SelectItem>
                    <SelectItem value="Golf">Golf</SelectItem>
                    <SelectItem value="Padel">Padel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="time-select">Time Period</Label>
                <Select value={timeFrame} onValueChange={setTimeFrame}>
                  <SelectTrigger id="time-select" className="w-[180px]">
                    <SelectValue placeholder="Select Time Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-time">All Time</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <Card className="p-0 overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <span className="loading loading-spinner text-orange-500"></span>
              </div>
            ) : leaderboardData.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No player data available for the selected criteria
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead className="text-center">Matches</TableHead>
                    <TableHead className="text-center">Performance</TableHead>
                    <TableHead className="text-center">Play Rating</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Club</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboardData.map((player, index) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1">
                          {getAwardIcon(index)}
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell>{player.name}</TableCell>
                      <TableCell>
                        <Badge variant={player.sport === "Tennis" ? "default" : 
                                         player.sport === "Golf" ? "outline" : 
                                         "secondary"}>{player.sport}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{player.matchesPlayed}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${
                          player.avgPerformance >= 4.5 ? "text-green-600" : 
                          player.avgPerformance >= 3.5 ? "text-blue-600" :
                          player.avgPerformance >= 2.5 ? "text-amber-600" : "text-red-600"
                        }`}>
                          {player.avgPerformance.toFixed(1)}/5
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {player.avgPlayRating.toFixed(1)}/5
                      </TableCell>
                      <TableCell>{player.location}</TableCell>
                      <TableCell>{player.club || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="tournaments">
          <TournamentCreation />
        </TabsContent>
      </Tabs>
    </div>
  );
};
