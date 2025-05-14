
import { Mail, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface MatchWaitingCardProps {
  foundMatch: boolean;
  matchType: 'singles' | 'doubles';
  matchedPlayers: any[];
  selectedSport: string;
  email: string;
  location: string;
  abilityLevel: string;
}

export const MatchWaitingCard = ({
  foundMatch,
  matchType,
  matchedPlayers,
  selectedSport,
  email,
  location,
  abilityLevel
}: MatchWaitingCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="p-6 bg-white shadow-lg rounded-xl max-w-md w-full">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto flex items-center justify-center">
          {foundMatch ? (
            <Users className="h-8 w-8 text-orange-600" />
          ) : (
            <Mail className="h-8 w-8 text-orange-600" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {foundMatch ? `Perfect ${matchType === 'doubles' ? 'Doubles' : 'Singles'} Match Found!` : "Thank You for Joining!"}
        </h2>
        <p className="text-gray-600">
          {foundMatch 
            ? `Our AI has matched you with ${matchedPlayers.length} ideal ${selectedSport} players in your area for a ${matchType} game!` 
            : `Our AI is analyzing player profiles to find your perfect ${selectedSport} ${matchType} match.`}
        </p>
        <div className="bg-orange-50 p-4 rounded-lg text-left">
          <h3 className="font-medium text-orange-800 mb-2">What happens next?</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            {foundMatch ? (
              <>
                <li>• We've sent match details to <span className="font-medium">{email}</span></li>
                <li>• Your dashboard has been updated with your new match</li>
                <li>• View full match details and confirm your attendance</li>
              </>
            ) : (
              <>
                <li>• Our AI will contact you at <span className="font-medium">{email}</span> when it finds your ideal {matchType} match based on:</li>
                <li className="ml-4">- Sport: {selectedSport}</li>
                <li className="ml-4">- Location: {location}</li>
                <li className="ml-4">- Ability Level: {abilityLevel}</li>
                <li>• You'll receive AI-optimized player details and recommended game times</li>
              </>
            )}
            <li>• No payment is required until you confirm your game</li>
          </ul>
        </div>
        <Button
          onClick={() => navigate("/player-dashboard")}
          className="w-full bg-orange-600 hover:bg-orange-700 mt-4"
        >
          Go to Dashboard
        </Button>
      </div>
    </Card>
  );
};
