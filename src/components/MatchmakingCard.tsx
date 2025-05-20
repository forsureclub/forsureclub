
import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createOrFetchPlayer } from "@/utils/playerRegistration";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { registerPlayerForMatchmaking, organizeFourPlayerMatch } from "@/services/matchmakingService";
import { PlayerInfoForm } from "./matchmaking/PlayerInfoForm";
import { MatchTypeSelector } from "./matchmaking/MatchTypeSelector";
import { MatchWaitingCard } from "./matchmaking/MatchWaitingCard";
import { useFormValidation } from "./matchmaking/useFormValidation";

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
  const [matchType, setMatchType] = useState<'singles' | 'doubles'>('singles');
  const [playerCount, setPlayerCount] = useState<'1' | '2' | '3'>('1');
  const { toast } = useToast();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { validateForm } = useFormValidation();

  const abilityOptions = ["Beginner", "Intermediate", "Advanced", "Professional"];
  const abilityLabel = "Playtomic/LTA Level";

  const handleJoin = async () => {
    // Validate form
    const isValid = validateForm(
      playerName,
      abilityLevel,
      occupation,
      location,
      isClubMember,
      clubName,
      email,
      phoneNumber,
      password,
      confirmPassword
    );

    if (!isValid) return;

    setIsJoining(true);

    try {
      // Create an account first
      const { error: signUpError } = await signUp(email, password);
      if (signUpError) throw signUpError;

      toast.success({
        title: "Account Created",
        description: "Your account has been created successfully",
      });

      // Calculate a rating based on ability level
      let initialRating = 2.5; // Default middle rating
      
      if (abilityLevel) {
        if (abilityLevel === "Beginner") {
          initialRating = 1.5;
        } else if (abilityLevel === "Intermediate") {
          initialRating = 2.5;
        } else if (abilityLevel === "Advanced") {
          initialRating = 3.5;
        } else if (abilityLevel === "Professional") {
          initialRating = 4.5;
        }
      }

      // Register the player - always with "Padel" as the sport
      const playerId = await createOrFetchPlayer({
        playerName,
        location,
        clubName,
        isClubMember,
        occupation,
        gender,
        preferredDays,
        spendingLevel,
        email,
        phoneNumber,
        initialRating
      });

      let matchResult;
      
      // Determine which matchmaking function to use based on preferences
      if (matchType === 'doubles') {
        // For 4-player doubles match
        matchResult = await organizeFourPlayerMatch(
          playerId,
          "Padel",
          location,
          abilityLevel,
          gender,
          email
        );
      } else {
        // For regular singles match - now with additional playerCount parameter
        matchResult = await registerPlayerForMatchmaking(
          playerId,
          "Padel",
          location,
          abilityLevel,
          gender,
          email,
          playerCount
        );
      }
      
      // Update state with match results
      setFoundMatch(matchResult.foundMatch);
      setMatchedPlayers(matchResult.matchedPlayers);
      setIsWaitingForMatch(true);
      setIsJoining(false);

      if (matchResult.foundMatch) {
        toast.success({
          title: `Perfect ${matchType === 'doubles' ? 'Doubles' : 'Singles'} Match Found!`,
          description: `Our AI has found ${matchResult.matchedPlayers.length} ideal players for your ${matchType} game! Check your email for details.`,
        });
      } else {
        toast.success({
          title: "Registration Successful",
          description: `Our AI will continue looking for perfect ${matchType} matches and email you when found`,
        });
      }
      
      // Short delay before navigating to dashboard
      setTimeout(() => {
        navigate("/player-dashboard");
      }, 3000);
    } catch (error: any) {
      console.error('Player registration error:', error);
      toast.error({
        title: "Registration Failed",
        description: error.message ? String(error.message) : "An unexpected error occurred. Please try again.",
      });
      setIsJoining(false);
    }
  };

  if (isWaitingForMatch) {
    return (
      <MatchWaitingCard 
        foundMatch={foundMatch}
        matchType={matchType}
        matchedPlayers={matchedPlayers}
        selectedSport={selectedSport}
        email={email}
        location={location}
        abilityLevel={abilityLevel}
      />
    );
  }

  return (
    <Card className="p-6 bg-white shadow-lg rounded-xl max-w-md w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Join {selectedSport} Match</h2>
      <div className="space-y-4">
        <MatchTypeSelector
          matchType={matchType}
          onMatchTypeChange={setMatchType}
          playerCount={playerCount}
          onPlayerCountChange={setPlayerCount}
        />
        
        <PlayerInfoForm
          playerName={playerName}
          setPlayerName={setPlayerName}
          occupation={occupation}
          setOccupation={setOccupation}
          location={location}
          setLocation={setLocation}
          preferredDays={preferredDays}
          setPreferredDays={setPreferredDays}
          abilityLevel={abilityLevel}
          setAbilityLevel={setAbilityLevel}
          abilityOptions={abilityOptions}
          abilityLabel={abilityLabel}
          spendingLevel={spendingLevel}
          setSpendingLevel={setSpendingLevel}
          isClubMember={isClubMember}
          setIsClubMember={setIsClubMember}
          clubName={clubName}
          setClubName={setClubName}
          gender={gender}
          setGender={setGender}
          email={email}
          setEmail={setEmail}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
        />
        
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
            `Find ${playerCount === '1' ? 'a Partner' : playerCount === '2' ? '2 Players' : '3 Players'}`
          )}
        </Button>
      </div>
    </Card>
  );
};
