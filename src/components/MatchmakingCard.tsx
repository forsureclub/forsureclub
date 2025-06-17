
import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createOrFetchPlayer } from "@/utils/playerRegistration";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { registerPlayerForMatchmaking } from "@/services/matchmakingService";
import { PlayerInfoForm } from "./matchmaking/PlayerInfoForm";
import { MatchTypeSelector } from "./matchmaking/MatchTypeSelector";
import { MatchWaitingCard } from "./matchmaking/MatchWaitingCard";
import { useFormValidation } from "./matchmaking/useFormValidation";

export const MatchmakingCard = ({ selectedSport }: { selectedSport: string }) => {
  const [playerName, setPlayerName] = useState("");
  const [industry, setIndustry] = useState("");
  const [skillLevel, setSkillLevel] = useState(2.5);
  const [spendingLevel, setSpendingLevel] = useState<'1' | '2' | '3'>('1');
  const [isClubMember, setIsClubMember] = useState(false);
  const [clubName, setClubName] = useState("");
  const [location, setLocation] = useState("");
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isWaitingForMatch, setIsWaitingForMatch] = useState(false);
  const [matchedPlayers, setMatchedPlayers] = useState<any[]>([]);
  const [foundMatch, setFoundMatch] = useState(false);
  const [playerCount, setPlayerCount] = useState<'1' | '2' | '3'>('1');
  const { toast } = useToast();
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const { validateForm } = useFormValidation();

  const handleJoin = async () => {
    // Validate form
    const isValid = validateForm(
      playerName,
      "Intermediate", // Default value for abilityLevel since we removed the selector
      industry,
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
      // First check if the email already exists by trying to sign in
      const { error: signInError } = await signIn(email, password);
      
      let signUpError = null;
      // If sign in failed with an error that's not about credentials, handle that error
      if (signInError && !signInError.message.includes("Invalid login credentials")) {
        console.error("Error during sign-in check:", signInError);
        toast.error({
          title: "Error",
          description: signInError.message,
        });
        setIsJoining(false);
        return;
      }
      
      // If sign in succeeded, the user already exists and is now logged in
      if (!signInError) {
        console.log("User already exists and is now signed in");
        toast.success({
          title: "Welcome Back!",
          description: "You've been signed in successfully.",
        });
      } else {
        // User doesn't exist, try to sign up
        const { error } = await signUp(email, password);
        signUpError = error;
        
        if (signUpError && !signUpError.message.includes("already registered")) {
          throw signUpError;
        }
        
        if (!signUpError) {
          toast.success({
            title: "Account Created",
            description: "Your account has been created successfully",
          });
        } else {
          console.log("User already exists but couldn't sign in. Proceeding anyway.");
        }
      }

      // Register the player with the skill level from the slider
      const playerId = await createOrFetchPlayer({
        playerName,
        location,
        clubName,
        isClubMember,
        occupation: industry, // Pass industry as occupation for backward compatibility
        gender,
        preferredDays: 'both', // Set a default value since we removed the field
        spendingLevel,
        email,
        phoneNumber,
        initialRating: skillLevel // Use the skill level from the slider
      });

      // For regular singles match - now with additional playerCount parameter
      const matchResult = await registerPlayerForMatchmaking(
        playerId,
        "Padel",
        location,
        "Intermediate", // Default ability level
        gender,
        email,
        playerCount
      );
      
      // Update state with match results
      setFoundMatch(matchResult.foundMatch);
      setMatchedPlayers(matchResult.matchedPlayers);
      setIsWaitingForMatch(true);
      setIsJoining(false);

      if (matchResult.foundMatch) {
        toast.success({
          title: "Perfect Match Found!",
          description: `Our AI has found ${matchResult.matchedPlayers.length} ideal players for your game! Check your email for details.`,
        });
      } else {
        toast.success({
          title: "Registration Successful",
          description: `Our AI will continue looking for perfect matches and email you when found`,
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
        matchType="singles"
        matchedPlayers={matchedPlayers}
        selectedSport={selectedSport}
        email={email}
        location={location}
        abilityLevel="Intermediate" // Default ability level
      />
    );
  }

  return (
    <Card className="p-6 bg-white shadow-lg rounded-xl max-w-md w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Join {selectedSport} Match</h2>
      <div className="space-y-4">
        <MatchTypeSelector
          playerCount={playerCount}
          onPlayerCountChange={setPlayerCount}
        />
        
        <PlayerInfoForm
          playerName={playerName}
          setPlayerName={setPlayerName}
          occupation={industry}
          setOccupation={setIndustry}
          location={location}
          setLocation={setLocation}
          abilityLevel="Intermediate" // Default value
          setAbilityLevel={() => {}} // No-op function since we removed the selector
          abilityOptions={["Beginner", "Intermediate", "Advanced", "Professional"]}
          abilityLabel="Experience Level"
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
          skillLevel={skillLevel}
          setSkillLevel={setSkillLevel}
        />
        
        <Button
          onClick={handleJoin}
          disabled={!playerName || !industry || !location || (isClubMember && !clubName) || !email || !password || isJoining}
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
