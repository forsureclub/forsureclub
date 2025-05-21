
import { useState } from "react";
import { Hero } from "../components/Hero";
import { Button } from "@/components/ui/button";
import { PlayerLeaderboard } from "@/components/PlayerLeaderboard";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();

  // Show Hero for non-authenticated users
  if (!user) {
    return <Hero onStartMatching={() => {}} />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Padel Leaderboard</h1>
          <Button asChild>
            <Link to="/player-dashboard?tab=find-game">Find Wednesday Game</Link>
          </Button>
        </div>
        
        <PlayerLeaderboard sport="Padel" />
        
        <div className="text-center pt-6">
          <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700">
            <Link to="/player-dashboard?tab=find-game">
              Find Your Perfect Padel Match for Wednesday
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
