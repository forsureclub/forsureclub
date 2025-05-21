
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface PlayerSearchProps {
  selectedPlayers: any[];
  setSelectedPlayers: React.Dispatch<React.SetStateAction<any[]>>;
}

export const PlayerSearch = ({
  selectedPlayers,
  setSelectedPlayers,
}: PlayerSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  // Handle player search
  const handlePlayerSearch = async () => {
    if (!searchTerm) return;
    
    try {
      setIsSearching(true);
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
      
      if (filteredPlayers.length > 0) {
        addPlayer(filteredPlayers[0]);
      } else {
        toast({
          title: "No Players Found",
          description: "No matching players were found with that name.",
          variant: "destructive"
        });
      }
      
      return filteredPlayers;
    } catch (error) {
      console.error("Error searching for players:", error);
      toast({
        title: "Search Error",
        description: "Failed to search for players. Please try again.",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsSearching(false);
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

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="players">Add Players</Label>
        <div className="flex gap-2">
          <Input
            id="players"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="button" 
            variant="secondary"
            onClick={handlePlayerSearch}
            disabled={!searchTerm || isSearching}
          >
            {isSearching ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...
              </span>
            ) : (
              "Add"
            )}
          </Button>
        </div>
      </div>
      
      {selectedPlayers.length > 0 && (
        <div className="grid gap-2">
          <Label>Selected Players ({selectedPlayers.length})</Label>
          <div className="border rounded-md p-3 space-y-2">
            {selectedPlayers.map((player) => (
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
    </div>
  );
};
