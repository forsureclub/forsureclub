
import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { createMiniLeague } from "@/services/matchmaking/miniLeagueService";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PlayerSearch } from "./PlayerSearch";
import { LeagueForm } from "./LeagueForm";

export const CreateMiniLeagueForm = () => {
  const [leagueName, setLeagueName] = useState("");
  const [sport, setSport] = useState("Padel");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [selectedPlayers, setSelectedPlayers] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { query, setQuery, suggestions, isLoading } = useLocationSearch();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Handle league creation
  const handleCreateLeague = async () => {
    if (!leagueName || !query || !startDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (selectedPlayers.length < 2) {
      toast({
        title: "Not Enough Players",
        description: "A mini-league needs at least 3 players (including yourself).",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreating(true);
      
      // Make sure the current user is included
      if (user && !selectedPlayers.some(p => p.id === user.id)) {
        // Fetch current user's player data
        const { data: currentPlayer, error: playerError } = await supabase
          .from("players")
          .select("id, name, rating, email")
          .eq("id", user.id)
          .single();
        
        if (playerError) throw playerError;
        
        if (currentPlayer) {
          setSelectedPlayers(prev => [...prev, currentPlayer]);
        }
      }
      
      // Create the mini-league
      const result = await createMiniLeague(
        leagueName,
        sport,
        query,
        selectedPlayers.map(p => p.id),
        startDate,
        1 // 1 week between matches
      );
      
      toast({
        title: "League Created",
        description: "Your mini-league has been created successfully.",
      });
      
      // Navigate to the league page
      navigate(`/league/${result.id}/matches`);
    } catch (error: any) {
      console.error("Error creating mini-league:", error);
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create mini-league. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <LeagueForm 
        leagueName={leagueName}
        setLeagueName={setLeagueName}
        sport={sport}
        setSport={setSport}
        startDate={startDate}
        setStartDate={setStartDate}
        query={query}
        setQuery={setQuery}
        suggestions={suggestions}
        isLoading={isLoading}
      />
      
      <PlayerSearch 
        selectedPlayers={selectedPlayers}
        setSelectedPlayers={setSelectedPlayers}
      />
      
      <Button
        onClick={handleCreateLeague}
        disabled={!leagueName || !query || !startDate || selectedPlayers.length < 2 || isCreating}
        className="w-full bg-orange-600 hover:bg-orange-700"
      >
        {isCreating ? (
          <span className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating League...
          </span>
        ) : (
          "Create Mini-League"
        )}
      </Button>
    </div>
  );
};
