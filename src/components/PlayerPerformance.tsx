
import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { supabase } from "@/integrations/supabase/client";

type PlayerStats = {
  averageRating: number;
  totalMatches: number;
  recentMatches: {
    played_at: string;
    location: string;
    performance_rating: number;
    feedback: string | null;
  }[];
};

export const PlayerPerformance = ({ playerId }: { playerId: string }) => {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch player's matches and performance data
        const { data: matchData, error: matchError } = await supabase
          .from('match_players')
          .select(`
            performance_rating,
            feedback,
            matches (
              played_at,
              location
            )
          `)
          .eq('player_id', playerId)
          .order('created_at', { ascending: false });

        if (matchError) throw matchError;

        if (matchData) {
          const recentMatches = matchData.map((match: any) => ({
            played_at: match.matches.played_at,
            location: match.matches.location,
            performance_rating: match.performance_rating,
            feedback: match.feedback,
          }));

          const totalMatches = matchData.length;
          const averageRating = totalMatches > 0
            ? matchData.reduce((acc: number, match: any) => acc + match.performance_rating, 0) / totalMatches
            : 0;

          setStats({
            averageRating,
            totalMatches,
            recentMatches,
          });
        }
      } catch (error) {
        console.error('Error fetching player stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [playerId]);

  if (isLoading) {
    return <div>Loading performance data...</div>;
  }

  if (!stats) {
    return <div>No performance data available</div>;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Performance Statistics</h3>
      
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600">Average Rating</p>
            <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}/5.0</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600">Total Matches</p>
            <p className="text-2xl font-bold">{stats.totalMatches}</p>
          </div>
        </div>

        {stats.recentMatches.length > 0 && (
          <div>
            <h4 className="text-md font-semibold mb-2">Recent Matches</h4>
            <div className="space-y-3">
              {stats.recentMatches.map((match, index) => (
                <div key={index} className="border-b pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{match.location}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(match.played_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Rating: {match.performance_rating}/5</p>
                      {match.feedback && (
                        <p className="text-sm text-gray-600">{match.feedback}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
