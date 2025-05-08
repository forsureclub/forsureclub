
import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MatchResultProps = {
  playerId: string;
  playerName: string;
  sport: string;
  onResultSubmitted?: () => void;
};

export const MatchResults = ({ playerId, playerName, sport, onResultSubmitted }: MatchResultProps) => {
  const [location, setLocation] = useState("");
  const [performanceRating, setPerformanceRating] = useState<string>("");
  const [playRating, setPlayRating] = useState<string>("");
  const [reliabilityRating, setReliabilityRating] = useState<string>("");
  const [etiquetteRating, setEtiquetteRating] = useState<string>("");
  const [reviewComment, setReviewComment] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Golf specific
  const [golfScore, setGolfScore] = useState("");
  const [handicap, setHandicap] = useState("");
  const [numberOfHoles, setNumberOfHoles] = useState("18");
  
  // Tennis/Padel specific 
  const [matchFormat, setMatchFormat] = useState("best-of-3");
  const [score, setScore] = useState("");
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!location || !performanceRating) {
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

      // Prepare additional sport-specific data
      const additionalData: Record<string, any> = {};
      
      if (sport === 'Golf') {
        additionalData.feedback = `Score: ${golfScore}, Handicap: ${handicap}, Holes: ${numberOfHoles}. ${feedback}`;
      } else if (sport === 'Tennis' || sport === 'Padel') {
        additionalData.feedback = `Format: ${matchFormat}, Score: ${score}. ${feedback}`;
      } else {
        additionalData.feedback = feedback;
      }

      // Record player performance with multi-dimensional ratings and review comment
      const { error: playerRatingError } = await supabase
        .from('match_players')
        .insert({
          match_id: matchData.id,
          player_id: playerId,
          performance_rating: parseInt(performanceRating),
          play_rating: parseInt(playRating || performanceRating),
          reliability_rating: parseInt(reliabilityRating || performanceRating),
          etiquette_rating: parseInt(etiquetteRating || performanceRating),
          review_comment: reviewComment,
          ...additionalData
        });

      if (playerRatingError) throw playerRatingError;

      toast({
        title: "Match Results Recorded",
        description: "Performance and ratings have been successfully recorded",
      });

      // Reset form
      setLocation("");
      setPerformanceRating("");
      setPlayRating("");
      setReliabilityRating("");
      setEtiquetteRating("");
      setReviewComment("");
      setFeedback("");
      setGolfScore("");
      setHandicap("");
      setScore("");
      
      // Notify parent component
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
      <h3 className="text-lg font-semibold">Record Match Results for {sport || "Your Sport"}</h3>
      
      <div className="space-y-2">
        <Label htmlFor="location">Match Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter match location"
        />
      </div>

      {/* Sport-specific inputs */}
      {sport && (
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General Rating</TabsTrigger>
            <TabsTrigger value="sport-specific">{sport} Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="performance-rating">Performance (Overall) Rating</Label>
              <Select value={performanceRating} onValueChange={setPerformanceRating}>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="play-rating">Play Rating</Label>
                <Select value={playRating} onValueChange={setPlayRating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Play (1-5)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reliability-rating">Reliability Rating</Label>
                <Select value={reliabilityRating} onValueChange={setReliabilityRating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Reliability (1-5)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="etiquette-rating">Etiquette Rating</Label>
                <Select value={etiquetteRating} onValueChange={setEtiquetteRating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Etiquette (1-5)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-comment">Review Comment</Label>
              <Textarea
                id="review-comment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Write your feedback or remark about this player's etiquette or spirit"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="sport-specific" className="space-y-4">
            {sport === 'Golf' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="golf-score">Score</Label>
                  <Input
                    id="golf-score"
                    type="number"
                    value={golfScore}
                    onChange={(e) => setGolfScore(e.target.value)}
                    placeholder="Enter final score"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handicap">Handicap</Label>
                  <Input
                    id="handicap"
                    value={handicap}
                    onChange={(e) => setHandicap(e.target.value)}
                    placeholder="Your handicap"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="holes">Number of Holes</Label>
                  <Select value={numberOfHoles} onValueChange={setNumberOfHoles}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select holes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9">9 Holes</SelectItem>
                      <SelectItem value="18">18 Holes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            {(sport === 'Tennis' || sport === 'Padel') && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="match-format">Match Format</Label>
                  <Select value={matchFormat} onValueChange={setMatchFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select match format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="best-of-3">Best of 3 sets</SelectItem>
                      <SelectItem value="best-of-5">Best of 5 sets</SelectItem>
                      <SelectItem value="single-set">Single set</SelectItem>
                      <SelectItem value="pro-set">Pro set (first to 8/10)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="score">Match Score</Label>
                  <Input
                    id="score"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="e.g. 6-4, 7-5"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="feedback">Additional Details</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Any additional details about the match"
              />
            </div>
          </TabsContent>
        </Tabs>
      )}

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
