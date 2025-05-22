
import { useState } from "react";
import { Hero } from "../components/Hero";
import { MatchmakingCard } from "../components/MatchmakingCard";
import { Button } from "@/components/ui/button";
import { PlayerLeaderboard } from "@/components/PlayerLeaderboard";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [isMatching, setIsMatching] = useState(false);
  const { user } = useAuth();

  const handleBack = () => {
    setIsMatching(false);
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
              Back to Home
            </Button>
          </header>

          <h2 className="text-3xl font-bold text-center mb-6">
            Find Your Padel Match
          </h2>
          <MatchmakingCard 
            selectedSport="Padel" 
          />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Padel Leaderboard</h1>
            <Button onClick={() => setIsMatching(true)}>Find Match</Button>
          </div>
          
          <PlayerLeaderboard sport="Padel" />
          
          <div className="text-center pt-6">
            <Button onClick={() => setIsMatching(true)} size="lg">
              Find Your Perfect Padel Match
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
