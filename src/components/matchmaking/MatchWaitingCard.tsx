import { Card } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";
import { Badge } from "../ui/badge";

interface MatchWaitingCardProps {
  foundMatch: boolean;
  matchType: "singles" | "doubles";
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
  return (
    <Card className="p-6 bg-white shadow-lg rounded-xl max-w-md w-full">
      <div className="text-center">
        {foundMatch ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Match Found!</h2>
            <p className="text-sm text-gray-600 mb-4">
              Great news! Our AI has found {matchedPlayers.length} perfect {matchType === "singles" ? "player" : "players"} for your {selectedSport} game on Wednesday.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left mb-4">
              <h3 className="font-medium text-gray-800 mb-2">Match Details:</h3>
              <ul className="space-y-1 text-sm">
                <li><span className="font-medium">Sport:</span> {selectedSport}</li>
                <li><span className="font-medium">Location:</span> {location}</li>
                <li><span className="font-medium">Day:</span> Wednesday</li>
                <li><span className="font-medium">Level:</span> {abilityLevel}</li>
              </ul>
            </div>
            <div className="mt-4 space-y-4">
              <p className="text-sm text-gray-600">
                An email with all the details will be sent to {email}.
              </p>
              <Badge className="bg-purple-100 text-purple-800">Wednesday Game</Badge>
              <p className="text-xs text-gray-500 mt-2">
                You'll be redirected to your dashboard in a moment...
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Finding Your Match</h2>
            <p className="text-sm text-gray-600 mb-4">
              Our AI is looking for the perfect {matchType === "singles" ? "player" : "players"} for your {selectedSport} game.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left mb-4">
              <h3 className="font-medium text-gray-800 mb-2">Your Match Preferences:</h3>
              <ul className="space-y-1 text-sm">
                <li><span className="font-medium">Sport:</span> {selectedSport}</li>
                <li><span className="font-medium">Location:</span> {location}</li>
                <li><span className="font-medium">Day:</span> Wednesday</li>
                <li><span className="font-medium">Level:</span> {abilityLevel}</li>
              </ul>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                We'll send details to {email} once we've found a match.
              </p>
              <Badge className="bg-purple-100 text-purple-800 mt-2">Wednesday Game</Badge>
              <p className="text-xs text-gray-500 mt-2">
                You'll be redirected to your dashboard in a moment...
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
