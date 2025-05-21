
import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { createMiniLeague } from "@/services/matchmaking/miniLeagueService";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Loader2, CalendarIcon, Check } from "lucide-react";
import { DatePicker } from "./ui/date-picker";
import { useNavigate } from "react-router-dom";

export const CreateMiniLeague = () => {
  const [leagueName, setLeagueName] = useState("");
  const [sport, setSport] = useState("Padel");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { query, setQuery, suggestions, isLoading } = useLocationSearch();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Handle player search
  const handlePlayerSearch = async () => {
    if (!searchTerm) return;
    
    try {
      const { data, error } = await supabase
        .from("players")
        .select("id, name, rating, email")
        .ilike("name", `%${searchTerm}%`)
        .limit(10);
      
      if (error) throw error;
      
      // Filter out already selected players
      const filteredPlayers = data?.filter(
        player => !selectedPlayers.some(p => p.id === player.id)
      ) || [];
      
      return filteredPlayers;
    } catch (error) {
      console.error("Error searching for players:", error);
      toast({
        title: "Search Error",
        description: "Failed to search for players. Please try again.",
        variant: "destructive"
      });
      return [];
    }
  };

  // Add player to the selected list
  const addPlayer = (player: any) => {
    if (!selectedPlayers.some(p => p.id === player.id)) {
      setSelectedPlayers([...selectedPlayers, player]);
      setSearchTerm("");
    }
  };

  // Remove player from the selected list
  const removePlayer = (playerId: string) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.id !== playerId));
  };

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
          selectedPlayers.push(currentPlayer);
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
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Create Mini-League</h2>
      
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="league-name">League Name</Label>
          <Input
            id="league-name"
            placeholder="Enter league name"
            value={leagueName}
            onChange={e => setLeagueName(e.target.value)}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="sport">Sport</Label>
          <Input
            id="sport"
            placeholder="Enter sport name"
            value={sport}
            onChange={e => setSport(e.target.value)}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="justify-between w-full"
              >
                {query || "Select location..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-full" style={{ width: "var(--radix-popover-trigger-width)" }}>
              <Command>
                <CommandInput
                  placeholder="Search location..."
                  value={query}
                  onValueChange={setQuery}
                />
                <CommandList>
                  <CommandEmpty>
                    {isLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      "No locations found."
                    )}
                  </CommandEmpty>
                  <CommandGroup heading="Locations">
                    {suggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion.id}
                        value={suggestion.name}
                        onSelect={() => {
                          setQuery(suggestion.name);
                        }}
                      >
                        {suggestion.name}
                        {suggestion.country && (
                          <span className="text-gray-400 ml-2">{suggestion.country}</span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="start-date">Start Date</Label>
          <DatePicker date={startDate} onDateChange={setStartDate} />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="players">Add Players</Label>
          <div className="flex gap-2">
            <Input
              id="players"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="secondary"
              onClick={async () => {
                const players = await handlePlayerSearch();
                if (players && players.length > 0) {
                  addPlayer(players[0]);
                }
              }}
              disabled={!searchTerm}
            >
              Add
            </Button>
          </div>
        </div>
        
        {selectedPlayers.length > 0 && (
          <div className="grid gap-2">
            <Label>Selected Players ({selectedPlayers.length})</Label>
            <div className="border rounded-md p-3 space-y-2">
              {selectedPlayers.map(player => (
                <div 
                  key={player.id} 
                  className="flex items-center justify-between bg-gray-50 p-2 rounded"
                >
                  <div>
                    <span className="font-medium">{player.name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      (Rating: {player.rating?.toFixed(1) || "N/A"})
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePlayer(player.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Button
          onClick={handleCreateLeague}
          disabled={!leagueName || !query || !startDate || selectedPlayers.length < 2 || isCreating}
          className="w-full bg-orange-600 hover:bg-orange-700 mt-4"
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
    </Card>
  );
};
