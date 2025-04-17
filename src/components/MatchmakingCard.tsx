
import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, Users, Briefcase, Building, Mail } from "lucide-react";
import { DateTimeSelector } from "./DateTimeSelector";
import { PlayerProfile } from "../types/matchmaking";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

export const MatchmakingCard = ({ selectedSport }: { selectedSport: string }) => {
  const [playerName, setPlayerName] = useState("");
  const [abilityLevel, setAbilityLevel] = useState("");
  const [spendingLevel, setSpendingLevel] = useState<'1' | '2' | '3'>('1');
  const [isClubMember, setIsClubMember] = useState(false);
  const [occupation, setOccupation] = useState("");
  const [clubName, setClubName] = useState("");
  const [location, setLocation] = useState("");
  const [preferredDays, setPreferredDays] = useState<'weekdays' | 'weekends' | 'both'>('both');
  const [preferredTimes, setPreferredTimes] = useState<string[]>([]);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [email, setEmail] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [isWaitingForMatch, setIsWaitingForMatch] = useState(false);
  const [matchedPlayers, setMatchedPlayers] = useState<PlayerProfile[]>([]);
  const { toast } = useToast();

  const abilityOptions = selectedSport === "Golf" 
    ? ["0-5", "6-10", "11-15", "16-20", "21+", "Beginner"] 
    : ["Beginner", "Intermediate", "Advanced", "Professional"];

  const abilityLabel = selectedSport === "Golf" ? "Handicap" : "Playtomic/LTA Level";

  const handleLocationSearch = () => {
    const searchQuery = encodeURIComponent(`${location} ${selectedSport} club`);
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
  };
  
  const handleClubSearch = () => {
    if (!clubName) return;
    const searchQuery = encodeURIComponent(`${clubName} ${selectedSport} club`);
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleJoin = () => {
    if (!playerName || !abilityLevel || !occupation || !location || (isClubMember && !clubName) || 
        preferredTimes.length === 0 || !email || !validateEmail(email)) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields including email address",
        variant: "destructive"
      });
      return;
    }

    setIsJoining(true);
    
    const currentPlayer: PlayerProfile = {
      name: playerName,
      sport: selectedSport,
      abilityLevel,
      spendingLevel,
      isClubMember,
      occupation,
      clubName,
      location,
      preferredDays,
      preferredTimes,
      gender,
      email
    };

    // Simulate matching logic
    setTimeout(() => {
      // Randomly decide if we have enough players for a match or if we need to wait
      const hasEnoughPlayers = Math.random() > 0.5;
      
      if (hasEnoughPlayers) {
        const simulatedPlayers = generateMatchedPlayers(currentPlayer);
        setMatchedPlayers([currentPlayer, ...simulatedPlayers]);
        setIsMatched(true);
        setIsWaitingForMatch(false);
        
        toast({
          title: "Match Found!",
          description: "We've found your perfect group based on location, ability, and interests",
        });
      } else {
        // Not enough similar players found, put user in waiting list
        setIsWaitingForMatch(true);
        setIsMatched(false);
        
        toast({
          title: "Added to Waiting List",
          description: "We'll email you when we find suitable players for your game",
        });
      }
      
      setIsJoining(false);
    }, 2000);
  };

  const generateMatchedPlayers = (player: PlayerProfile): PlayerProfile[] => {
    const matchedPlayers: PlayerProfile[] = [];
    const occupations = ["Software Engineer", "Doctor", "Lawyer", "Business Owner", "Marketing Executive", "Finance Professional"];
    const locations = ["London", "Manchester", "Birmingham", "Leeds", "Edinburgh"];
    const clubs = [
      "The Royal Golf Club",
      "Elite Padel Center",
      "City Sports Hub",
      "Premium Golf & Country Club",
      "Urban Padel Club"
    ];
    
    // Generate 3 matched players (to make a group of 4 with the current player)
    for (let i = 0; i < 3; i++) {
      const nameIndex = Math.floor(Math.random() * 20);
      const name = `Player ${nameIndex + 1}`;
      
      // Select similar ability level
      let abilityIndex = abilityOptions.indexOf(player.abilityLevel);
      if (abilityIndex < 0) abilityIndex = 0;
      
      const abilityVariation = Math.floor(Math.random() * 3) - 1;
      const newAbilityIndex = Math.max(0, Math.min(abilityOptions.length - 1, abilityIndex + abilityVariation));
      
      // Select similar spending level
      const spendingLevelNum = parseInt(player.spendingLevel);
      const spendingVariation = Math.floor(Math.random() * 3) - 1;
      const newSpendingLevel = Math.max(1, Math.min(3, spendingLevelNum + spendingVariation));
      
      // Match gender randomly 
      const genders: Array<'male' | 'female' | 'other'> = ['male', 'female', 'other'];
      
      matchedPlayers.push({
        name,
        sport: player.sport,
        abilityLevel: abilityOptions[newAbilityIndex],
        spendingLevel: newSpendingLevel.toString() as '1' | '2' | '3',
        isClubMember: Math.random() > 0.5,
        occupation: occupations[Math.floor(Math.random() * occupations.length)],
        clubName: clubs[Math.floor(Math.random() * clubs.length)],
        location: locations[Math.floor(Math.random() * locations.length)],
        preferredDays: player.preferredDays,
        preferredTimes: player.preferredTimes,
        gender: genders[Math.floor(Math.random() * genders.length)],
        email: `player${nameIndex + 1}@example.com`
      });
    }
    
    return matchedPlayers;
  };

  // Display waiting for match page
  if (isWaitingForMatch) {
    return (
      <Card className="p-6 bg-white shadow-lg rounded-xl max-w-md w-full">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Thank You for Joining!</h2>
          <p className="text-gray-600">
            We're currently looking for more players who match your profile for {selectedSport}.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg text-left">
            <h3 className="font-medium text-blue-800 mb-2">What happens next?</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• We'll email you at <span className="font-medium">{email}</span> when we find your perfect match.</li>
              <li>• You'll receive player details and recommended game times.</li>
              <li>• No payment is required until you confirm your game.</li>
            </ul>
          </div>
          <Button
            onClick={() => {
              setIsWaitingForMatch(false);
              setIsJoining(false);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
          >
            Back to Home
          </Button>
        </div>
      </Card>
    );
  }

  // Display match result
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
                    {player.gender}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {player.location}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-800">Match Information</h3>
            <p className="mt-2 text-sm text-gray-700">
              An email has been sent to you with more details about your group. You can 
              proceed to coordinate a game time based on your specified preferences.
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

  // Main matchmaking form
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
          <Label htmlFor="occupation" className="text-sm font-medium text-gray-700">Occupation</Label>
          <Input
            id="occupation"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            placeholder="Enter your occupation"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="location" className="text-sm font-medium text-gray-700">Location</Label>
          <div className="flex gap-2">
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter your city"
              className="mt-1 flex-1"
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleLocationSearch}
              className="mt-1"
              disabled={!location}
            >
              Search
            </Button>
          </div>
        </div>
        
        <DateTimeSelector
          selectedDays={preferredDays}
          onDaysChange={setPreferredDays}
          selectedTimes={preferredTimes}
          onTimesChange={setPreferredTimes}
        />
        
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
          <Label htmlFor="spending" className="text-sm font-medium text-gray-700">Willing to Pay</Label>
          <Select 
            value={spendingLevel} 
            onValueChange={(value) => setSpendingLevel(value as '1' | '2' | '3')}
          >
            <SelectTrigger id="spending" className="w-full">
              <SelectValue placeholder="Select your budget" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">💰 Budget-friendly</SelectItem>
              <SelectItem value="2">💰💰 Mid-range</SelectItem>
              <SelectItem value="3">💰💰💰 Premium experience</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col gap-2">
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
          
          {isClubMember && (
            <div className="mt-2">
              <div className="flex gap-2">
                <Input
                  id="club-name"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="Enter your club name"
                  className="mt-1 flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClubSearch}
                  className="mt-1"
                  disabled={!clubName}
                >
                  Search
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-700">Gender</Label>
          <RadioGroup
            value={gender}
            onValueChange={(value) => setGender(value as 'male' | 'female' | 'other')}
            className="mt-2 flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male" className="cursor-pointer">Male</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female" className="cursor-pointer">Female</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other" className="cursor-pointer">Other</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="mt-1"
          />
        </div>
        
        <Button
          onClick={handleJoin}
          disabled={!playerName || !abilityLevel || !occupation || !location || (isClubMember && !clubName) || isJoining || !email}
          className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
        >
          {isJoining ? "Finding Match..." : "Find Match"}
        </Button>
      </div>
    </Card>
  );
};
