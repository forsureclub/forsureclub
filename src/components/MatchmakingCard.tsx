
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
import { Mail, Loader2, Users } from "lucide-react";
import { createOrFetchPlayer } from "@/utils/playerRegistration";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { registerPlayerForMatchmaking } from "@/services/matchmakingService";

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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isWaitingForMatch, setIsWaitingForMatch] = useState(false);
  const [matchedPlayers, setMatchedPlayers] = useState<any[]>([]);
  const [foundMatch, setFoundMatch] = useState(false);
  const { toast } = useToast();
  const { signUp } = useAuth();
  const navigate = useNavigate();

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
        (isClubMember && !clubName) || !email) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    if (phoneNumber && !validatePhone(phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return;
    }

    if (!password) {
      toast({
        title: "Password Required",
        description: "Please create a password for your account",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match",
        variant: "destructive"
      });
      return;
    }

    setIsJoining(true);

    try {
      // Create an account first
      const { error: signUpError } = await signUp(email, password);
      if (signUpError) throw signUpError;

      toast({
        title: "Account Created",
        description: "Your account has been created successfully",
      });

      // Register the player
      const playerId = await createOrFetchPlayer({
        playerName,
        selectedSport,
        location,
        clubName,
        isClubMember,
        occupation,
        gender,
        preferredDays,
        spendingLevel,
        email,
        phoneNumber
      });

      // Use our enhanced AI matchmaking
      const matchResult = await registerPlayerForMatchmaking(
        playerId,
        selectedSport,
        location,
        abilityLevel,
        email
      );

      // Update state with match results
      setFoundMatch(matchResult.foundMatch);
      setMatchedPlayers(matchResult.matchedPlayers);
      setIsWaitingForMatch(true);
      setIsJoining(false);

      if (matchResult.foundMatch) {
        toast({
          title: "Perfect Match Found!",
          description: `Our AI has found ${matchResult.matchedPlayers.length} ideal players for you! Check your email for details.`,
        });
      } else {
        toast({
          title: "Registration Successful",
          description: "Our AI will continue looking for perfect matches and email you when found",
        });
      }
      
      // Short delay before navigating
      setTimeout(() => {
        navigate("/player-dashboard");
      }, 3000);
    } catch (error: any) {
      console.error('Player registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message ? String(error.message) : "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      setIsJoining(false);
    }
  };

  if (isWaitingForMatch) {
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
            {foundMatch ? "Perfect Match Found!" : "Thank You for Joining!"}
          </h2>
          <p className="text-gray-600">
            {foundMatch 
              ? `Our AI has matched you with ${matchedPlayers.length} ideal ${selectedSport} players in your area!` 
              : `Our AI is analyzing player profiles to find your perfect ${selectedSport} match.`}
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
                  <li>• Our AI will contact you at <span className="font-medium">{email}</span> when it finds your ideal match based on:</li>
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
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="mt-1"
            required
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
        
        <div>
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password *</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            className="mt-1"
            required
            minLength={6}
          />
        </div>
        
        <div>
          <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">Confirm Password *</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            className="mt-1"
            required
            minLength={6}
          />
          <p className="text-xs text-gray-500 mt-1">
            Password must be at least 6 characters long
          </p>
        </div>
        
        <Button
          onClick={handleJoin}
          disabled={!playerName || !abilityLevel || !occupation || !location || (isClubMember && !clubName) || !email || !password || isJoining}
          className="w-full bg-orange-600 hover:bg-orange-700 mt-2"
        >
          {isJoining ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finding Match...
            </span>
          ) : (
            "Find Match"
          )}
        </Button>
      </div>
    </Card>
  );
};
