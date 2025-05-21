
import React from "react";
import { TournamentSummary } from "@/components/tournament/TournamentSummary";
import { PlayerLeaderboard } from "@/components/PlayerLeaderboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const TournamentResults = () => {
  // Set sport directly to "Padel" without options to change
  const sport = "Padel";
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-3xl font-bold">Tournament Results</h1>
      
      <Tabs defaultValue="results" className="w-full">
        <TabsList>
          <TabsTrigger value="results">Recent Results</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="results" className="mt-6">
          <TournamentSummary />
        </TabsContent>
        
        <TabsContent value="leaderboard" className="mt-6">
          <div className="space-y-4">
            {/* Remove sport selection buttons and use fixed Padel */}
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">Padel Leaderboard</h3>
            </div>
            
            <PlayerLeaderboard sport={sport} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
