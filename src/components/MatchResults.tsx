
import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type MatchResultProps = {
  playerId: string;
  playerName: string;
  sport: string;
  onResultSubmitted?: () => void;
};

export const MatchResults = ({ playerId, playerName, sport, onResultSubmitted }: MatchResultProps) => {
  const [location, setLocation] = useState("");
  const [rating, setRating] = useState<string>("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!location || !rating) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create match record
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert({
          sport,
          location,
          played_at: new Date().toISOString(),
          status: 'completed'
        })
        .select('id')
        .single();

      if (matchError) throw matchError;

      // Record player performance
      const { error: performanceError } = await supabase
        .from('match_players')
        .insert({
          match_id: matchData.id,
          player_id: playerId,
          performance_rating: parseInt(rating),
          feedback
        });

      if (performanceError) throw performanceError;

      toast({
        title: "Match Results Recorded",
        description: "The player's performance has been successfully recorded",
      });

      onResultSubmitted?.();
    } catch (error) {
      console.error('Error recording match results:', error);
      toast({
        title: "Error",
        description: "Failed to record match results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Record Match Results for {playerName}</h3>
      
      <div className="space-y-2">
        <Label htmlFor="location">Match Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter match location"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rating">Performance Rating</Label>
        <Select value={rating} onValueChange={setRating}>
          <SelectTrigger>
            <SelectValue placeholder="Select rating (1-5)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 - Poor</SelectItem>
            <SelectItem value="2">2 - Below Average</SelectItem>
            <SelectItem value="3">3 - Average</SelectItem>
            <SelectItem value="4">4 - Good</SelectItem>
            <SelectItem value="5">5 - Excellent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback">Feedback (Optional)</Label>
        <Textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Enter feedback about the player's performance"
        />
      </div>

      <Button 
        onClick={handleSubmit} 
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Recording..." : "Record Match Results"}
      </Button>
    </Card>
  );
};
