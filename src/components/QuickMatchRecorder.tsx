
import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, MapPin, Star } from "lucide-react";

type QuickMatchRecorderProps = {
  playerId: string;
  playerName: string;
  onMatchRecorded?: () => void;
};

export const QuickMatchRecorder = ({ playerId, playerName, onMatchRecorded }: QuickMatchRecorderProps) => {
  const [opponentName, setOpponentName] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState<"won" | "lost" | "">("");
  const [score, setScore] = useState("");
  const [rating, setRating] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!opponentName || !location || !result || !rating) {
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
          sport: 'Padel',
          location,
          played_at: new Date().toISOString(),
          status: 'completed'
        })
        .select('id')
        .single();

      if (matchError) throw matchError;

      // Record player performance
      const { error: playerRatingError } = await supabase
        .from('match_players')
        .insert({
          match_id: matchData.id,
          player_id: playerId,
          performance_rating: parseInt(rating),
          feedback: `vs ${opponentName} - ${result.toUpperCase()}${score ? ` (${score})` : ''}${notes ? ` - ${notes}` : ''}`
        });

      if (playerRatingError) throw playerRatingError;

      toast({
        title: "Match Recorded!",
        description: `Your game against ${opponentName} has been recorded`,
      });

      // Reset form
      setOpponentName("");
      setLocation("");
      setResult("");
      setScore("");
      setRating("");
      setNotes("");
      
      onMatchRecorded?.();
    } catch (error) {
      console.error('Error recording match:', error);
      toast({
        title: "Error",
        description: "Failed to record match. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold">Quick Match Recorder</h3>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="opponent">Opponent Name</Label>
            <Input
              id="opponent"
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              placeholder="Who did you play against?"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-1">
              <MapPin size={16} /> Location
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where did you play?"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="result">Result</Label>
            <Select value={result} onValueChange={(value) => setResult(value as "won" | "lost")}>
              <SelectTrigger>
                <SelectValue placeholder="Did you win?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="score">Score (Optional)</Label>
            <Input
              id="score"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="6-4, 7-5"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rating" className="flex items-center gap-1">
              <Star size={16} /> Your Performance
            </Label>
            <Select value={rating} onValueChange={setRating}>
              <SelectTrigger>
                <SelectValue placeholder="Rate 1-5" />
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about the match..."
            className="h-20"
          />
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          {isSubmitting ? "Recording..." : "Record Match"}
        </Button>
      </div>
    </Card>
  );
};
