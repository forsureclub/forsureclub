
import { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Slider } from "./ui/slider";
import { SKILL_LEVELS } from "@/types/matchmaking";
import { AlertCircle, Search } from "lucide-react";
import { Input } from "./ui/input";
import { registerPlayerForMatchmaking } from "@/services/matchmakingService";

type SkillLevelUpdateProps = {
  playerId: string;
  playerName: string;
  sport: string;
  currentRating?: number;
};

export const SkillLevelUpdate = ({ 
  playerId, 
  playerName, 
  sport, 
  currentRating 
}: SkillLevelUpdateProps) => {
  const [skillLevel, setSkillLevel] = useState<number>(currentRating || 1);
  const [experience, setExperience] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [location, setLocation] = useState("Liverpool");
  const { toast } = useToast();

  const getCurrentLevelDescription = () => {
    // Find the exact level match or closest level
    const exactLevel = SKILL_LEVELS.find(l => l.level === skillLevel);
    
    if (exactLevel) {
      return {
        level: exactLevel.level,
        description: exactLevel.description,
        category: exactLevel.category
      };
    }
    
    // If no exact match (for in-between values like 2.3), find the closest level below
    const closestLevel = SKILL_LEVELS.filter(l => l.level <= skillLevel)
      .sort((a, b) => b.level - a.level)[0];
    
    return closestLevel ? {
      level: skillLevel,
      description: closestLevel.description,
      category: closestLevel.category
    } : {
      level: skillLevel,
      description: 'Custom level',
      category: ''
    };
  };

  const handleSubmit = async () => {
    if (skillLevel < 0 || skillLevel > 7) {
      toast({
        title: "Invalid Level",
        description: "Please provide a skill level between 0 and 7",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a skill assessment record
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('skill_assessments')
        .insert({
          player_id: playerId,
          self_rating: skillLevel,
          experience_level: experience || null,
          notes,
          assessment_type: 'self',
        })
        .select('id')
        .single();

      if (assessmentError) throw assessmentError;

      // Update the player's rating
      const { error: updateError } = await supabase
        .from('players')
        .update({ 
          rating: skillLevel,
          city: location // Update location too
        })
        .eq('id', playerId);
      
      if (updateError) throw updateError;

      toast({
        title: "Skill Level Updated",
        description: "Your skill level has been recorded",
      });
    } catch (error) {
      console.error('Error updating skill level:', error);
      toast({
        title: "Error",
        description: "Failed to update skill level. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFindMatch = async () => {
    setIsSearching(true);
    
    try {
      // Get player details
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('gender, email')
        .eq('id', playerId)
        .single();
      
      if (playerError) throw playerError;
      
      // Find a match using the matchmaking service
      const matchResult = await registerPlayerForMatchmaking(
        playerId,
        sport,
        location,
        skillLevel.toString(),
        playerData.gender,
        playerData.email,
        '1' // Find 1 player for singles
      );
      
      if (matchResult.foundMatch) {
        toast({
          title: "Match Found!",
          description: `We found a perfect match for you in ${location}! Check your email for details.`,
        });
      } else {
        toast({
          title: "Match Request Registered",
          description: `We'll keep looking for a player in ${location} with similar skill level and notify you when found.`,
        });
      }
    } catch (error) {
      console.error('Error finding match:', error);
      toast({
        title: "Error",
        description: "Failed to find a match. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const currentLevelInfo = getCurrentLevelDescription();
  const sportSpecificOptions = {
    "Tennis": ["Beginner", "Intermediate", "Advanced", "NTRP 2.5", "NTRP 3.0", "NTRP 3.5", "NTRP 4.0", "NTRP 4.5", "NTRP 5.0+"],
    "Padel": ["Beginner", "Intermediate", "Advanced", "Category 5", "Category 4", "Category 3", "Category 2", "Category 1"],
    "Golf": ["Beginner", "Intermediate", "Advanced", "Handicap 28+", "Handicap 18-27", "Handicap 10-17", "Handicap 0-9", "Plus Handicap"],
  };

  const experienceOptions = sportSpecificOptions[sport as keyof typeof sportSpecificOptions] || 
    ["Beginner", "Intermediate", "Advanced"];

  // Calculate optimal match range (±1.0 level)
  const optimalMinLevel = Math.max(0, skillLevel - 1.0);
  const optimalMaxLevel = Math.min(7, skillLevel + 1.0);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Update Skill Level for {playerName}</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="skillLevel">Your Skill Level (0-7)</Label>
          <div className="pt-6 pb-2">
            <Slider 
              id="skillLevel"
              min={0} 
              max={7} 
              step={0.5}
              value={[skillLevel]} 
              onValueChange={(value) => setSkillLevel(value[0])}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span>Beginner (0)</span>
            <span>Elite (7)</span>
          </div>
          <div className="mt-2 p-3 bg-muted rounded-md">
            <p className="font-medium">Current Level: {currentLevelInfo.level} - {currentLevelInfo.category}</p>
            <p className="text-sm text-muted-foreground">{currentLevelInfo.description}</p>
          </div>

          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md flex items-start gap-3">
            <AlertCircle className="text-orange-500 h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-orange-800">Optimal Matchmaking Range</p>
              <p className="text-sm text-orange-700">
                Our AI will prioritize matching you with players between level {optimalMinLevel.toFixed(1)} and {optimalMaxLevel.toFixed(1)} 
                for the best game experience.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Your Location</Label>
          <Input 
            id="location" 
            value={location} 
            onChange={(e) => setLocation(e.target.value)} 
            placeholder="Enter your location (city)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience">Experience Level</Label>
          <Select value={experience} onValueChange={setExperience}>
            <SelectTrigger>
              <SelectValue placeholder="Select your experience level" />
            </SelectTrigger>
            <SelectContent>
              {experienceOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Share details about your playing history, strengths, areas of improvement, etc."
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Updating..." : "Update Skill Level"}
        </Button>
        
        <Button 
          onClick={handleFindMatch} 
          disabled={isSearching}
          className="w-full bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
        >
          <Search size={18} />
          {isSearching ? "Searching..." : `Find ${sport} Match in ${location}`}
        </Button>
      </div>
    </div>
  );
};
