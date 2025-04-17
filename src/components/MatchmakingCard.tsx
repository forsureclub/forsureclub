import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, Users, Briefcase, Building, Mail, Star, Download } from "lucide-react";
import { PlayerProfile } from "../types/matchmaking";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

type MatchedPlayerWithScore = PlayerProfile & {
  matchScore: number;
  suggestedLocation: string;
};

export const MatchmakingCard = ({ selectedSport }: { selectedSport: string }) => {
  const [playerName, setPlayerName] = useState("");
  const [abilityLevel, setAbilityLevel] = useState("");
  const [spendingLevel, setSpendingLevel] = useState<'1' | '2' | '3'>('1');
  const [isClubMember, setIsClubMember] = useState(false);
  const [occupation, setOccupation] = useState("");
  const [clubName, setClubName] = useState("");
  const [location, setLocation] = useState("");
  const [preferredDays, setPreferredDays] = useState<'weekdays' | 'weekends' | 'both'>('both');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [isWaitingForMatch, setIsWaitingForMatch] = useState(false);
  const [matchedPlayers, setMatchedPlayers] = useState<MatchedPlayerWithScore[]>([]);
  const { toast } = useToast();

  const abilityOptions = selectedSport === "Golf" 
    ? ["0-5", "6-10", "11-15", "16-20", "21+", "Beginner"] 
    : ["Beginner", "Intermediate", "Advanced", "Professional"];

  const abilityLabel = selectedSport === "Golf" ? "Handicap" : "Playtomic/LTA Level";
  
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    return /^[\d\+\-\(\) ]{7,15}$/.test(phone);
  };

  const handleJoin = () => {
    if (!playerName || !abilityLevel || !occupation || !location || (isClubMember && !clubName) || !email || !validateEmail(email) || !phoneNumber || !validatePhone(phoneNumber)) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields including valid email and phone number",
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
      preferredTimes: [],
      gender,
      email,
      phoneNumber
    };

    // Simulate matching logic
    setTimeout(() => {
      // Randomly decide if we have enough players for a match or if we need to wait
      const hasEnoughPlayers = Math.random() > 0.5;
      
      if (hasEnoughPlayers) {
        const simulatedPlayers = generateMatchedPlayers(currentPlayer);
        setMatchedPlayers([{...currentPlayer, matchScore: 100, suggestedLocation: getRandomVenue(currentPlayer.location, selectedSport) }]);
        setMatchedPlayers(prev => [...prev, ...simulatedPlayers]);
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

  const getRandomVenue = (baseLocation: string, sport: string): string => {
    const venues = [
      `${baseLocation} ${sport} Club`,
      `${baseLocation} Central ${sport} Courts`,
      `${baseLocation} Community Sports Center`,
      `${sport} World ${baseLocation}`,
      `The ${baseLocation} ${sport} Academy`
    ];
    
    return venues[Math.floor(Math.random() * venues.length)];
  };

  const generateMatchedPlayers = (player: PlayerProfile): MatchedPlayerWithScore[] => {
    const matchedPlayers: MatchedPlayerWithScore[] = [];
    const occupations = ["Software Engineer", "Doctor", "Lawyer", "Business Owner", "Marketing Executive", "Finance Professional"];
    const locations = ["London", "Manchester", "Birmingham", "Leeds", "Edinburgh"];
    const clubs = [
      "The Royal Golf Club",
      "Elite Padel Center",
      "City Sports Hub",
      "Premium Golf & Country Club",
      "Urban Padel Club"
    ];
    
    for (let i = 0; i < 3; i++) {
      const nameIndex = Math.floor(Math.random() * 20);
      const name = `Player ${nameIndex + 1}`;
      
      let abilityIndex = abilityOptions.indexOf(player.abilityLevel);
      if (abilityIndex < 0) abilityIndex = 0;
      
      const abilityVariation = Math.floor(Math.random() * 3) - 1;
      const newAbilityIndex = Math.max(0, Math.min(abilityOptions.length - 1, abilityIndex + abilityVariation));
      
      const spendingLevelNum = parseInt(player.spendingLevel);
      const spendingVariation = Math.floor(Math.random() * 3) - 1;
      const newSpendingLevel = Math.max(1, Math.min(3, spendingLevelNum + spendingVariation));
      
      const genders: Array<'male' | 'female' | 'other'> = ['male', 'female', 'other'];

      const baseScore = 75;
      const abilityScore = 10 - Math.abs(abilityIndex - newAbilityIndex) * 5;
      const spendingScore = 10 - Math.abs(spendingLevelNum - newSpendingLevel) * 5;
      const randomFactors = Math.floor(Math.random() * 15);
      
      const matchScore = Math.min(100, Math.max(60, baseScore + abilityScore + spendingScore + randomFactors));
      const locationIndex = Math.floor(Math.random() * locations.length);
      
      matchedPlayers.push({
        name,
        sport: player.sport,
        abilityLevel: abilityOptions[newAbilityIndex],
        spendingLevel: newSpendingLevel.toString() as '1' | '2' | '3',
        isClubMember: Math.random() > 0.5,
        occupation: occupations[Math.floor(Math.random() * occupations.length)],
        clubName: clubs[Math.floor(Math.random() * clubs.length)],
        location: locations[locationIndex],
        preferredDays: player.preferredDays,
        preferredTimes: [],
        gender: genders[Math.floor(Math.random() * genders.length)],
        email: `player${nameIndex + 1}@example.com`,
        phoneNumber: `07${Math.floor(Math.random() * 1000000000)}`.substring(0, 11),
        matchScore,
        suggestedLocation: getRandomVenue(locations[locationIndex], player.sport)
      });
    }
    
    return matchedPlayers.sort((a, b) => b.matchScore - a.matchScore);
  };

  const exportToCSV = () => {
    if (matchedPlayers.length === 0) {
      toast({
        title: "No data to export",
        description: "Please find a match first",
        variant: "destructive"
      });
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";

    csvContent += "Name,Sport,Ability Level,Spending Level,Occupation,Club Member,Club Name,Location,Availability,Gender,Email,Phone Number,Match Score,Suggested Location\n";

    matchedPlayers.forEach(player => {
      const row = [
        player.name,
        player.sport,
        player.abilityLevel,
        player.spendingLevel,
        player.occupation,
        player.isClubMember ? "Yes" : "No",
        player.clubName || "N/A",
        player.location,
        player.preferredDays === 'both' ? 'Flexible' : player.preferredDays,
        player.gender,
        player.email,
        player.phoneNumber || "N/A",
        player.matchScore,
        player.suggestedLocation
      ].map(cell => `"${cell}"`).join(",");

      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedSport}_Matches_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "Your match data has been exported to CSV",
    });
  };

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
                  <div className="flex items-center gap-1">
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {player.gender}
                    </span>
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      {player.matchScore}
                    </span>
                  </div>
                </div>
                <div className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> {player.occupation}
                </div>
                <div className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {player.location}
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  Skill Level: {player.abilityLevel}
                </div>
                {player.isClubMember && (
                  <div className="mt-1 text-sm text-gray-500">
                    Club: {player.clubName}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-800">Suggested Meeting Location</h3>
            <p className="mt-2 text-sm text-gray-700 flex items-center gap-1">
              <Building className="h-4 w-4" /> {matchedPlayers[0]?.suggestedLocation || "To be determined"}
            </p>
            <p className="mt-2 text-sm text-gray-700">
              Availability: {preferredDays === 'both' ? 'Flexible (Weekdays & Weekends)' : 
                          preferredDays === 'weekdays' ? 'Weekdays' : 'Weekends'}
            </p>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => setIsMatched(false)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Find Another Match
            </Button>
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
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
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter your city"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="availability" className="text-sm font-medium text-gray-700">Availability</Label>
          <Select 
            value={preferredDays} 
            onValueChange={(value) => setPreferredDays(value as 'weekdays' | 'weekends' | 'both')}
          >
            <SelectTrigger id="availability" className="w-full">
              <SelectValue placeholder="When are you available?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekdays">Weekdays</SelectItem>
              <SelectItem value="weekends">Weekends</SelectItem>
              <SelectItem value="both">Both (Flexible)</SelectItem>
            </SelectContent>
          </Select>
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
          <Label htmlFor="spending" className="text-sm font-medium text-gray-700">Willing to Pay</Label>
          <Select 
            value={spendingLevel} 
            onValueChange={(value) => setSpendingLevel(value as '1' | '2' | '3')}
          >
            <SelectTrigger id="spending" className="w-full">
              <SelectValue placeholder="Select your budget" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">💰</SelectItem>
              <SelectItem value="2">💰💰</SelectItem>
              <SelectItem value="3">💰💰💰</SelectItem>
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
              <Input
                id="club-name"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="Enter your club name"
                className="mt-1"
              />
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
        
        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter your phone number"
            className="mt-1"
          />
        </div>
        
        <Button
          onClick={handleJoin}
          disabled={!playerName || !abilityLevel || !occupation || !location || (isClubMember && !clubName) || isJoining || !email || !phoneNumber}
          className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
        >
          {isJoining ? "Finding Match..." : "Find Match"}
        </Button>
      </div>
    </Card>
  );
};
