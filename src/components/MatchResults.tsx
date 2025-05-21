
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Star, MessageSquare } from "lucide-react";

type MatchResultProps = {
  playerId: string;
  playerName: string;
  onResultSubmitted?: () => void;
};

export const MatchResults = ({ playerId, playerName, onResultSubmitted }: MatchResultProps) => {
  const [location, setLocation] = useState("");
  const [performanceRating, setPerformanceRating] = useState<string>("");
  const [playRating, setPlayRating] = useState<string>("");
  const [reliabilityRating, setReliabilityRating] = useState<string>("");
  const [etiquetteRating, setEtiquetteRating] = useState<string>("");
  const [reviewComment, setReviewComment] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Padel specific fields
  const [matchFormat, setMatchFormat] = useState("best-of-3");
  const [score, setScore] = useState("");
  const { toast } = useToast();
  
  // Sport is now always Padel
  const sport = "Padel";

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

      // Prepare additional data specific to Padel
      const additionalData: Record<string, any> = {
        feedback: `Format: ${matchFormat}, Score: ${score}. ${feedback}`
      };

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
    <Card className="overflow-hidden border-0 shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <Calendar size={20} className="text-blue-100" />
          Record Match Results
        </CardTitle>
        <CardDescription className="text-blue-100">
          For {playerName} in Padel
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="location" className="flex items-center gap-1">
            <MapPin size={16} /> Match Location
          </Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter match location"
            className="border-blue-100 focus-visible:ring-blue-400"
          />
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-blue-50">
            <TabsTrigger value="general" className="data-[state=active]:bg-white">
              General Rating
            </TabsTrigger>
            <TabsTrigger value="sport-specific" className="data-[state=active]:bg-white">
              Padel Details
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="performance-rating" className="flex items-center gap-1">
                <Star size={16} /> Overall Rating
              </Label>
              <Select value={performanceRating} onValueChange={setPerformanceRating}>
                <SelectTrigger className="border-blue-100 focus-visible:ring-blue-400">
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
              <div className="space-y-1">
                <Label htmlFor="play-rating" className="text-sm">Play</Label>
                <Select value={playRating} onValueChange={setPlayRating}>
                  <SelectTrigger className="border-blue-100 focus-visible:ring-blue-400 h-9">
                    <SelectValue placeholder="1-5" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="reliability-rating" className="text-sm">Reliability</Label>
                <Select value={reliabilityRating} onValueChange={setReliabilityRating}>
                  <SelectTrigger className="border-blue-100 focus-visible:ring-blue-400 h-9">
                    <SelectValue placeholder="1-5" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="etiquette-rating" className="text-sm">Etiquette</Label>
                <Select value={etiquetteRating} onValueChange={setEtiquetteRating}>
                  <SelectTrigger className="border-blue-100 focus-visible:ring-blue-400 h-9">
                    <SelectValue placeholder="1-5" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="review-comment" className="flex items-center gap-1">
                <MessageSquare size={16} /> Comment
              </Label>
              <Textarea
                id="review-comment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Write your feedback about this player's performance"
                className="border-blue-100 focus-visible:ring-blue-400"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="sport-specific" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="match-format">Match Format</Label>
                <Select value={matchFormat} onValueChange={setMatchFormat}>
                  <SelectTrigger className="border-blue-100 focus-visible:ring-blue-400">
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
              <div className="space-y-1">
                <Label htmlFor="score">Match Score</Label>
                <Input
                  id="score"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="e.g. 6-4, 7-5"
                  className="border-blue-100 focus-visible:ring-blue-400"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="feedback">Additional Details</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Any additional details about the match"
                className="border-blue-100 focus-visible:ring-blue-400"
              />
            </div>
          </TabsContent>
        </Tabs>

        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 mt-4"
        >
          {isSubmitting ? "Recording..." : "Record Match Results"}
        </Button>
      </CardContent>
    </Card>
  );
};
