import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { Mail } from "lucide-react";

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
  const [isWaitingForMatch, setIsWaitingForMatch] = useState(false);
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

  const handleJoin = async () => {
    if (!playerName || !abilityLevel || !occupation || !location || 
        (isClubMember && !clubName)) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsJoining(true);
    
    try {
      const { data: existingPlayers } = await supabase
        .from('players')
        .select('id')
        .eq('name', playerName)
        .eq('sport', selectedSport);

      let playerId;

      if (existingPlayers && existingPlayers.length > 0) {
        playerId = existingPlayers[0].id;
        console.log('Using existing player:', playerId);
      } else {
        const playerData = {
          name: playerName,
          sport: selectedSport,
          city: location,
          club: isClubMember ? clubName : null,
          occupation: occupation,
          gender: gender,
          play_time: preferredDays,
          budget_range: spendingLevel,
          rating: 0,
          user_id: null,
          email: email || null,
          phone_number: phoneNumber || null
        };
        
        console.log('Creating new player with data:', JSON.stringify(playerData, null, 2));
        
        const { data: insertedPlayer, error: playerError } = await supabase
          .from('players')
          .insert(playerData)
          .select()
          .single();

        if (playerError) {
          console.error('Player insertion error:', playerError);
          toast({
            title: "Registration Failed",
            description: `Error: ${playerError.message}`,
            variant: "destructive"
          });
          setIsJoining(false);
          return;
        }

        playerId = insertedPlayer.id;
        console.log('Created new player:', playerId);
      }

      const { error: registrationError } = await supabase
        .from('player_registrations')
        .insert({
          player_id: playerId,
          status: 'pending',
          admin_notes: `Registered for ${selectedSport}`
        });

      if (registrationError) {
        console.error('Registration error:', registrationError);
        setIsWaitingForMatch(true);
        setIsJoining(false);
        return;
      }

      setIsWaitingForMatch(true);
      setIsJoining(false);
      
      toast({
        title: "Registration Successful",
        description: "We'll email you when we find suitable players in your area",
      });
    } catch (error) {
      console.error('Unexpected error in registration:', error);
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      setIsJoining(false);
    }
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
            We're currently looking for players who match your profile for {selectedSport} in your area.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg text-left">
            <h3 className="font-medium text-blue-800 mb-2">What happens next?</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• We'll contact you at {email ? <span className="font-medium">{email}</span> : ""} 
                  {email && phoneNumber ? " or " : ""}
                  {phoneNumber ? <span className="font-medium">{phoneNumber}</span> : ""} 
                  {!email && !phoneNumber ? <span className="font-medium">your provided contact information</span> : ""}
                  {" when we find players that match your:"}
              </li>
              <li className="ml-4">- Location ({location})</li>
              <li className="ml-4">- Ability Level ({abilityLevel})</li>
              <li>• You'll receive player details and recommended game times</li>
              <li>• No payment is required until you confirm your game</li>
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
          disabled={!playerName || !abilityLevel || !occupation || !location || (isClubMember && !clubName) || isJoining}
          className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
        >
          {isJoining ? "Finding Match..." : "Find Match"}
        </Button>
      </div>
    </Card>
  );
};
