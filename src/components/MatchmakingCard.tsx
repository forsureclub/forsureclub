
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
  const { toast } = useToast();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { validateForm } = useFormValidation();

  const abilityOptions = selectedSport === "Golf" 
    ? ["0-5", "6-10", "11-15", "16-20", "21+", "Beginner"] 
    : ["Beginner", "Intermediate", "Advanced", "Professional"];

  const abilityLabel = selectedSport === "Golf" ? "Handicap" : "Playtomic/LTA Level";

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
        } else if (selectedSport === "Golf") {
          // For Golf, lower handicap means higher rating
          const handicapRange = abilityLevel.split('-');
          if (handicapRange[0] === "0") {
            initialRating = 4.5; // 0-5 handicap is very good
          } else if (handicapRange[0] === "6") {
            initialRating = 3.5; // 6-10 handicap is good
          } else if (handicapRange[0] === "11") {
            initialRating = 2.5; // 11-15 handicap is average
          } else if (handicapRange[0] === "16") {
            initialRating = 1.5; // 16-20 handicap is beginner
          } else {
            initialRating = 1.0; // 21+ handicap is very beginner
          }
        }
      }

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
        phoneNumber,
        initialRating
      });

      let matchResult;
      
      // Use appropriate matching function based on match type
      if (matchType === 'doubles') {
        // For 4-player doubles match
        matchResult = await organizeFourPlayerMatch(
          playerId,
          selectedSport,
          location,
          abilityLevel,
          gender,
          email
        );
      } else {
        // For regular singles match
        matchResult = await registerPlayerForMatchmaking(
          playerId,
          selectedSport,
          location,
          abilityLevel,
          email
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
            `Find ${matchType === 'doubles' ? '4-Player' : '2-Player'} Match`
          )}
        </Button>
      </div>
    </Card>
  );
};
