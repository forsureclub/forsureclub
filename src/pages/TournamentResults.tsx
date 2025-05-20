
import React, { useState } from "react";
import { TournamentSummary } from "@/components/tournament/TournamentSummary";
import { PlayerLeaderboard } from "@/components/PlayerLeaderboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const TournamentResults = () => {
  const [sport, setSport] = useState<string>("Tennis");
  
  const handleSportChange = (newSport: string) => {
    setSport(newSport);
  };

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
            <div className="flex justify-start gap-4">
              <button 
                className={`px-4 py-2 rounded-md ${sport === "Tennis" ? "bg-primary text-white" : "bg-muted"}`}
                onClick={() => handleSportChange("Tennis")}
              >
                Tennis
              </button>
              <button 
                className={`px-4 py-2 rounded-md ${sport === "Golf" ? "bg-primary text-white" : "bg-muted"}`}
                onClick={() => handleSportChange("Golf")}
              >
                Golf
              </button>
              <button 
                className={`px-4 py-2 rounded-md ${sport === "Padel" ? "bg-primary text-white" : "bg-muted"}`}
                onClick={() => handleSportChange("Padel")}
              >
                Padel
              </button>
            </div>
            
            <PlayerLeaderboard sport={sport} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
