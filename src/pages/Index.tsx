
import { useState, useEffect } from "react";
import { Hero } from "../components/Hero";
import { SportSelector } from "../components/SportSelector";
import { MatchmakingCard } from "../components/MatchmakingCard";
import { Button } from "@/components/ui/button";
import { PlayerLeaderboard } from "@/components/PlayerLeaderboard";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const [isMatching, setIsMatching] = useState(false);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [displaySport, setDisplaySport] = useState<string>("Tennis");
  const { user } = useAuth();

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
              <MatchmakingCard 
                selectedSport={selectedSport} 
              />
            </>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Player Leaderboard</h1>
            <Button onClick={() => setIsMatching(true)}>Find Match</Button>
          </div>
          
          <div className="flex justify-end space-x-2 mb-4">
            <Card className="inline-flex p-1">
              <CardContent className="flex space-x-2 p-1">
                <Button 
                  variant={displaySport === "Tennis" ? "default" : "ghost"} 
                  onClick={() => setDisplaySport("Tennis")}
                  className="h-8"
                >
                  Tennis
                </Button>
                <Button 
                  variant={displaySport === "Golf" ? "default" : "ghost"} 
                  onClick={() => setDisplaySport("Golf")}
                  className="h-8"
                >
                  Golf
                </Button>
                <Button 
                  variant={displaySport === "Padel" ? "default" : "ghost"} 
                  onClick={() => setDisplaySport("Padel")}
                  className="h-8"
                >
                  Padel
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <PlayerLeaderboard sport={displaySport} />
          
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
