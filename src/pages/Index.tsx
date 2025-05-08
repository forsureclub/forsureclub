
import { useState, useEffect } from "react";
import { Hero } from "../components/Hero";
import { SportSelector } from "../components/SportSelector";
import { MatchmakingCard } from "../components/MatchmakingCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const Index = () => {
  const [isMatching, setIsMatching] = useState(false);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        // Get featured players or recently active players
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) throw error;
        setPlayers(data || []);
      } catch (error) {
        console.error('Error fetching players:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const handleBack = () => {
    if (selectedSport) {
      setSelectedSport(null);
    } else {
      setIsMatching(false);
    }
  };

  // Show Hero for non-authenticated users
  if (!user && !isMatching) {
    return <Hero onStartMatching={() => setIsMatching(true)} />;
  }

  return (
    <div className="container mx-auto p-6">
      {isMatching ? (
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Find Your Match</h1>
            
            <Button
              variant="outline"
              className="text-gray-700"
              onClick={handleBack}
            >
              {selectedSport ? "Back to Sports" : "Back to Home"}
            </Button>
          </header>

          {!selectedSport ? (
            <>
              <h2 className="text-3xl font-bold text-center mb-6">Select Your Sport</h2>
              <SportSelector onSportSelect={setSelectedSport} />
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-center mb-6">
                Find Your {selectedSport} Match
              </h2>
              <MatchmakingCard selectedSport={selectedSport} />
            </>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Available Players</h1>
            <Button onClick={() => setIsMatching(true)}>Find Match</Button>
          </div>
          
          {loading ? (
            <div className="text-center py-12">Loading players...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {players.map((player) => (
                <Link key={player.id} to={`/player/${player.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle>{player.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Sport</span>
                          <span className="font-medium">{player.sport}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Rating</span>
                          <span className="font-medium">{player.rating}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Location</span>
                          <span className="font-medium">{player.city}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              
              {players.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No players found. Be the first to register!
                </div>
              )}
            </div>
          )}
          
          <div className="text-center pt-6">
            <Button onClick={() => setIsMatching(true)} size="lg">
              Find Your Perfect Match
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
