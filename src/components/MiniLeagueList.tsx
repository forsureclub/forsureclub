
import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Trophy, Users, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { getPlayerMiniLeagues } from "@/services/matchmaking/miniLeagueService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export const MiniLeagueList = () => {
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchLeagues = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const leaguesData = await getPlayerMiniLeagues(user.id);
        setLeagues(leaguesData);
      } catch (error) {
        console.error("Error fetching mini-leagues:", error);
        toast({
          title: "Error",
          description: "Failed to load your leagues. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, [user, toast]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner text-orange-500"></span>
      </div>
    );
  }

  if (leagues.length === 0) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-xl font-semibold mb-4">No Mini-Leagues Yet</h3>
        <p className="text-gray-600 mb-4">
          You're not part of any mini-leagues yet. Join or create a league to get started.
        </p>
        <Button asChild className="bg-orange-600 hover:bg-orange-700">
          <Link to="/create-league">Create a Mini-League</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Mini-Leagues</h2>
      {leagues.map((league) => (
        <Card key={league.id} className="p-6 shadow-md">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{league.name}</h3>
                <Badge className={
                  league.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : league.status === 'completed' 
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-amber-100 text-amber-800'
                }>{league.status}</Badge>
              </div>
              
              <div className="flex items-center text-gray-700">
                <Trophy className="w-4 h-4 mr-2 text-orange-500" />
                <span>{league.sport}</span>
              </div>
              
              <div className="flex items-center text-gray-700">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                <span>{league.location}</span>
              </div>
              
              <div className="flex items-center text-gray-700">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span>Started {format(new Date(league.start_date), "MMMM d, yyyy")}</span>
              </div>
              
              <div className="flex items-center text-gray-700">
                <Users className="w-4 h-4 mr-2 text-gray-500" />
                <span>{league.player_count} Players</span>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col justify-between space-y-2">
              <Button
                asChild
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Link to={`/league/${league.id}/standings`}>View Standings</Link>
              </Button>
              
              <Button
                asChild
                variant="outline"
              >
                <Link to={`/league/${league.id}/matches`}>Upcoming Matches</Link>
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
