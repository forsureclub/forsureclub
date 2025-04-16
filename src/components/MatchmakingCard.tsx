
import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export const MatchmakingCard = ({ selectedSport }: { selectedSport: string }) => {
  const [playerName, setPlayerName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = () => {
    setIsJoining(true);
    // TODO: Implement actual matchmaking logic
    setTimeout(() => {
      setIsJoining(false);
    }, 2000);
  };

  return (
    <Card className="p-6 bg-white shadow-lg rounded-xl max-w-md w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Join {selectedSport} Match</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Your Name</label>
          <Input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="mt-1"
          />
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Current Players: 0/4</h3>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <Button
          onClick={handleJoin}
          disabled={!playerName || isJoining}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isJoining ? "Joining..." : "Join Match"}
        </Button>
      </div>
    </Card>
  );
};
