
import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createOrFetchPlayer } from "@/utils/playerRegistration";
import { useAuth } from "@/hooks/useAuth";
import { registerPlayerForMatchmaking } from "@/services/matchmakingService";
import { MatchTypeSelector } from "./matchmaking/MatchTypeSelector";

interface MatchmakingCardProps {
  selectedSport: string;
  onMatchFound?: (foundMatch: boolean, matchedPlayers: any[]) => void;
  existingPlayerData?: any;
}

export const MatchmakingCard = ({ 
  selectedSport, 
  onMatchFound,
  existingPlayerData 
}: MatchmakingCardProps) => {
  const [isJoining, setIsJoining] = useState(false);
  const [playerCount, setPlayerCount] = useState<'1' | '2' | '3'>('1');
  const { toast } = useToast();

  const handleFindGame = async () => {
    if (!existingPlayerData) {
      toast.error({
        title: "Profile Required",
        description: "Please complete your profile before finding a game",
      });
      return;
    }

    setIsJoining(true);

    try {
      // Use existing player data for matchmaking
      const matchResult = await registerPlayerForMatchmaking(
        existingPlayerData.id,
        selectedSport,
        existingPlayerData.city,
        existingPlayerData.rating.toString(),
        existingPlayerData.gender,
        existingPlayerData.email,
        playerCount
      );
      
      setIsJoining(false);

      // Call onMatchFound callback if provided
      if (onMatchFound) {
        onMatchFound(matchResult.foundMatch, matchResult.matchedPlayers);
      }
      
      if (matchResult.foundMatch) {
        toast.success({
          title: "Perfect Match Found!",
          description: `Our AI has found ${matchResult.matchedPlayers.length} ideal players for your Wednesday game! Check your email for details.`,
        });
      } else {
        toast.success({
          title: "Registration Successful",
          description: `Our AI will continue looking for perfect matches for your Wednesday game and email you when found`,
        });
      }
    } catch (error: any) {
      console.error('Match finding error:', error);
      setIsJoining(false);
      toast.error({
        title: "Could Not Find Match",
        description: error.message ? String(error.message) : "An unexpected error occurred. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">
          Find your perfect {selectedSport} match for this Wednesday.
          Our AI will match you with compatible players based on your profile.
        </p>
      </div>
      
      <div className="space-y-4">
        <MatchTypeSelector
          playerCount={playerCount}
          onPlayerCountChange={setPlayerCount}
        />
        
        <div className="p-4 bg-orange-50 rounded-lg">
          <h3 className="font-medium text-orange-700 mb-2">Your Match Preferences</h3>
          <ul className="space-y-1 text-sm">
            <li><span className="font-medium">Sport:</span> {selectedSport}</li>
            <li><span className="font-medium">Location:</span> {existingPlayerData?.city || "Not specified"}</li>
            <li><span className="font-medium">Skill Level:</span> {existingPlayerData?.rating?.toFixed(1) || "Not specified"}/5</li>
            <li><span className="font-medium">Day:</span> Wednesday</li>
          </ul>
        </div>
        
        <Button
          onClick={handleFindGame}
          disabled={isJoining || !existingPlayerData}
          className="w-full bg-orange-600 hover:bg-orange-700 mt-2"
        >
          {isJoining ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finding Match...
            </span>
          ) : (
            `Find ${playerCount === '1' ? 'a Partner' : playerCount === '2' ? '2 Players' : '3 Players'} for Wednesday`
          )}
        </Button>
      </div>
    </div>
  );
};
