
import { useState } from "react";
import { Hero } from "../components/Hero";
import { MatchmakingCard } from "../components/MatchmakingCard";
import { EnhancedMatchmakingCard } from "../components/matchmaking/EnhancedMatchmakingCard";
import { Button } from "@/components/ui/button";
import { PlayerLeaderboard } from "@/components/PlayerLeaderboard";
import { useAuth } from "@/hooks/useAuth";
import { PlayerSwiper } from "@/components/PlayerSwiper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Trophy, Users, Zap } from "lucide-react";

const Index = () => {
  const [isMatching, setIsMatching] = useState(false);
  const [useEnhancedMatching, setUseEnhancedMatching] = useState(true);
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
            
            <div className="flex items-center gap-3">
              <Button
                variant={useEnhancedMatching ? "default" : "outline"}
                size="sm"
                onClick={() => setUseEnhancedMatching(!useEnhancedMatching)}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                {useEnhancedMatching ? "Enhanced AI" : "Basic"}
              </Button>
              <Button
                variant="outline"
                className="text-gray-700"
                onClick={handleBack}
              >
                Back to Home
              </Button>
            </div>
          </header>

          <h2 className="text-3xl font-bold text-center mb-6">
            Find Your Padel Match
          </h2>
          
          {useEnhancedMatching ? (
            <EnhancedMatchmakingCard selectedSport="Padel" />
          ) : (
            <MatchmakingCard selectedSport="Padel" />
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Padel Matches</h1>
            <Button onClick={() => setIsMatching(true)}>Find Match</Button>
          </div>
          
          <Tabs defaultValue="discover" className="space-y-6">
            <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 grid w-full grid-cols-2">
              <TabsTrigger value="discover" className="flex items-center gap-2">
                <Users size={16} />
                <span>Discover Players</span>
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                <Trophy size={16} />
                <span>Leaderboard</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="discover" className="space-y-6">
              <div className="max-w-md mx-auto">
                <PlayerSwiper />
              </div>
            </TabsContent>
            
            <TabsContent value="leaderboard">
              <PlayerLeaderboard sport="Padel" />
            </TabsContent>
          </Tabs>
          
          <div className="text-center pt-6">
            <Button onClick={() => setIsMatching(true)} size="lg" className="bg-orange-600 hover:bg-orange-700">
              Find Your Perfect Padel Match
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
