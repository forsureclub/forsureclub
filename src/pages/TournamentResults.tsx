
import React, { useState, useEffect } from "react";
import { TournamentSummary } from "@/components/tournament/TournamentSummary";
import { PlayerLeaderboard } from "@/components/PlayerLeaderboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const TournamentResults = () => {
  // Set sport directly to "Padel" without options to change
  const sport = "Padel";
  const [hasCompletedMatches, setHasCompletedMatches] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    checkForCompletedMatches();
  }, []);
  
  const checkForCompletedMatches = async () => {
    try {
      setIsLoading(true);
      
      // Check if there are any completed matches in the database
      const { data, error } = await supabase
        .from('matches')
        .select('id')
        .eq('status', 'completed')
        .limit(1);
      
      if (error) throw error;
      
      // Set state based on whether matches were found
      setHasCompletedMatches(data && data.length > 0);
    } catch (error) {
      console.error("Error checking for completed matches:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse flex space-x-2">
          <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
          <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
          <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
        </div>
      </div>
    );
  }
  
  if (!hasCompletedMatches) {
    return (
      <div className="container mx-auto py-6 space-y-8">
        <h1 className="text-3xl font-bold">Tournament Results</h1>
        <div className="bg-muted/30 p-12 rounded-lg text-center">
          <h2 className="text-xl font-medium text-muted-foreground">
            No tournament results available yet
          </h2>
          <p className="mt-2 text-muted-foreground">
            Results will be displayed after matches have been played.
          </p>
        </div>
      </div>
    );
  }
  
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
