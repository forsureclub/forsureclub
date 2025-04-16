
import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { useToast } from "./ui/use-toast";

type AbilityLevel = {
  golf: string; // Handicap
  padel: string; // Playtomic or LTA level
};

type PlayerProfile = {
  name: string;
  sport: string;
  abilityLevel: string;
  spendingLevel: '1' | '2' | '3';
  isClubMember: boolean;
};

export const MatchmakingCard = ({ selectedSport }: { selectedSport: string }) => {
  const [playerName, setPlayerName] = useState("");
  const [abilityLevel, setAbilityLevel] = useState("");
  const [spendingLevel, setSpendingLevel] = useState<'1' | '2' | '3'>('1');
  const [isClubMember, setIsClubMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [matchedPlayers, setMatchedPlayers] = useState<PlayerProfile[]>([]);
  const { toast } = useToast();

  const abilityOptions = selectedSport === "Golf" 
    ? ["0-5", "6-10", "11-15", "16-20", "21+", "Beginner"] 
    : ["Beginner", "Intermediate", "Advanced", "Professional"];

  const abilityLabel = selectedSport === "Golf" ? "Handicap" : "Playtomic/LTA Level";

  const handleJoin = () => {
    if (!playerName || !abilityLevel) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsJoining(true);
    
    // Create player profile
    const currentPlayer: PlayerProfile = {
      name: playerName,
      sport: selectedSport,
      abilityLevel,
      spendingLevel,
      isClubMember
    };

    // Simulate AI matching logic
    setTimeout(() => {
      const simulatedPlayers = generateMatchedPlayers(currentPlayer);
      setMatchedPlayers([currentPlayer, ...simulatedPlayers]);
      setIsMatched(true);
      setIsJoining(false);
      
      toast({
        title: "Match Found!",
        description: "We've found your perfect group",
      });
    }, 2000);
  };

  // Simulated AI matching logic
  const generateMatchedPlayers = (player: PlayerProfile): PlayerProfile[] => {
    const names = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Avery"];
    const matchedPlayers: PlayerProfile[] = [];
    
    // Generate 3 matched players with similar attributes
    for (let i = 0; i < 3; i++) {
      const nameIndex = Math.floor(Math.random() * names.length);
      const name = names.splice(nameIndex, 1)[0];
      
      // Similar ability level (within 1 level)
      let abilityIndex = abilityOptions.indexOf(player.abilityLevel);
      if (abilityIndex < 0) abilityIndex = 0;
      
      const abilityVariation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      const newAbilityIndex = Math.max(0, Math.min(abilityOptions.length - 1, abilityIndex + abilityVariation));
      
      // Similar spending level (within 1 level)
      const spendingLevelNum = parseInt(player.spendingLevel);
      const spendingVariation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      const newSpendingLevel = Math.max(1, Math.min(3, spendingLevelNum + spendingVariation));
      
      matchedPlayers.push({
        name,
        sport: player.sport,
        abilityLevel: abilityOptions[newAbilityIndex],
        spendingLevel: newSpendingLevel.toString() as '1' | '2' | '3',
        isClubMember: Math.random() > 0.5 // 50% chance of being a club member
      });
    }
    
    return matchedPlayers;
  };

  if (isMatched) {
    return (
      <Card className="p-6 bg-white shadow-lg rounded-xl max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your {selectedSport} Match</h2>
        <div className="space-y-4">
          <p className="text-green-600 font-medium">Perfect match found! Here's your group:</p>
          
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            {matchedPlayers.map((player, index) => (
              <div key={index} className="p-3 bg-white rounded-md shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{player.name}</span>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {player.abilityLevel}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-500 flex justify-between">
                  <span>Budget: {"💰".repeat(parseInt(player.spendingLevel))}</span>
                  <span>{player.isClubMember ? "Club Member" : "Non-Member"}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-800">AI Match Analysis</h3>
            <p className="mt-2 text-sm text-gray-700">
              This group has compatible {selectedSport === "Golf" ? "handicaps" : "skill levels"} 
              and similar budget expectations. {matchedPlayers.filter(p => p.isClubMember).length > 2 ? 
              "Most players are club members, so you might want to play at a club." : 
              "Consider playing at a public venue that everyone can access."}
            </p>
          </div>
          
          <Button
            onClick={() => setIsMatched(false)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Find Another Match
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white shadow-lg rounded-xl max-w-md w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Join {selectedSport} Match</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">Your Name</Label>
          <Input
            id="name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="ability" className="text-sm font-medium text-gray-700">{abilityLabel}</Label>
          <Select 
            value={abilityLevel} 
            onValueChange={setAbilityLevel}
          >
            <SelectTrigger id="ability" className="w-full">
              <SelectValue placeholder={`Select your ${abilityLabel}`} />
            </SelectTrigger>
            <SelectContent>
              {abilityOptions.map((level) => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="spending" className="text-sm font-medium text-gray-700">Spending Level</Label>
          <Select 
            value={spendingLevel} 
            onValueChange={(value) => setSpendingLevel(value as '1' | '2' | '3')}
          >
            <SelectTrigger id="spending" className="w-full">
              <SelectValue placeholder="Select your spending level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">💰 Low budget</SelectItem>
              <SelectItem value="2">💰💰 Mid-range</SelectItem>
              <SelectItem value="3">💰💰💰 Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="club-member" 
            checked={isClubMember}
            onCheckedChange={(checked) => setIsClubMember(checked as boolean)}
          />
          <Label htmlFor="club-member" className="text-sm font-medium text-gray-700">
            I am a member of a {selectedSport} club
          </Label>
        </div>
        
        <Button
          onClick={handleJoin}
          disabled={!playerName || !abilityLevel || isJoining}
          className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
        >
          {isJoining ? "Finding Match..." : "Find Match"}
        </Button>
      </div>
    </Card>
  );
};
