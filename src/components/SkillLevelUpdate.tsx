
import { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const [selfRating, setSelfRating] = useState<string>("");
  const [experience, setExperience] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selfRating) {
      toast({
        title: "Missing Information",
        description: "Please provide your self-assessment rating",
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
          self_rating: parseInt(selfRating),
          experience_level: experience || null,
          notes,
          assessment_type: 'self',
        })
        .select('id')
        .single();

      if (assessmentError) throw assessmentError;

      // Update the player's rating if no existing rating or if self-assessment is significantly different
      const newRating = parseInt(selfRating);
      if (!currentRating || Math.abs(currentRating - newRating) > 1) {
        const { error: updateError } = await supabase
          .from('players')
          .update({ rating: newRating })
          .eq('id', playerId);
        
        if (updateError) throw updateError;
      }

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

  const sportSpecificOptions = {
    "Tennis": ["Beginner", "Intermediate", "Advanced", "NTRP 2.5", "NTRP 3.0", "NTRP 3.5", "NTRP 4.0", "NTRP 4.5", "NTRP 5.0+"],
    "Padel": ["Beginner", "Intermediate", "Advanced", "Category 5", "Category 4", "Category 3", "Category 2", "Category 1"],
    "Golf": ["Beginner", "Intermediate", "Advanced", "Handicap 28+", "Handicap 18-27", "Handicap 10-17", "Handicap 0-9", "Plus Handicap"],
  };

  const experienceOptions = sportSpecificOptions[sport as keyof typeof sportSpecificOptions] || 
    ["Beginner", "Intermediate", "Advanced"];

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Update Skill Level for {playerName}</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rating">Your Skill Level (1-5)</Label>
          <Select value={selfRating} onValueChange={setSelfRating}>
            <SelectTrigger>
              <SelectValue placeholder="Select your skill rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 - Beginner</SelectItem>
              <SelectItem value="2">2 - Novice</SelectItem>
              <SelectItem value="3">3 - Intermediate</SelectItem>
              <SelectItem value="4">4 - Advanced</SelectItem>
              <SelectItem value="5">5 - Expert</SelectItem>
            </SelectContent>
          </Select>
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

      <Button 
        onClick={handleSubmit} 
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Updating..." : "Update Skill Level"}
      </Button>
    </div>
  );
};
