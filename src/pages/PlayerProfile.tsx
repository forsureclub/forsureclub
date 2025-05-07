
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PlayerPerformance } from "@/components/PlayerPerformance";
import { SkillLevelUpdate } from "@/components/SkillLevelUpdate";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MatchResults } from "@/components/MatchResults";

const PlayerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlayer = async () => {
      if (!id) {
        toast({
          title: "Error",
          description: "Player ID not provided",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("players")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        
        setPlayer(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching player:", error);
        toast({
          title: "Error",
          description: "Failed to fetch player information",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    fetchPlayer();
  }, [id, toast, navigate]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading player profile...</div>;
  }

  if (!player) {
    return <div className="p-8 text-center">Player not found</div>;
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">{player.name}</CardTitle>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Player Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Sport:</span> {player.sport}</p>
                <p><span className="font-medium">Location:</span> {player.city}</p>
                <p><span className="font-medium">Rating:</span> {player.rating ? player.rating.toFixed(1) : "Not rated"}/5.0</p>
                <p><span className="font-medium">Play Time:</span> {player.play_time}</p>
                {player.club && <p><span className="font-medium">Club:</span> {player.club}</p>}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Contact Information</h3>
              <div className="space-y-2">
                {player.email && <p><span className="font-medium">Email:</span> {player.email}</p>}
                {player.phone_number && <p><span className="font-medium">Phone:</span> {player.phone_number}</p>}
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button>Update Skill Level</Button>
              </SheetTrigger>
              <SheetContent>
                <SkillLevelUpdate
                  playerId={player.id}
                  playerName={player.name}
                  sport={player.sport}
                  currentRating={player.rating}
                />
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Record Match Results</Button>
              </SheetTrigger>
              <SheetContent>
                <MatchResults 
                  playerId={player.id}
                  playerName={player.name}
                  sport={player.sport}
                />
              </SheetContent>
            </Sheet>
          </div>
        </CardContent>
      </Card>

      <PlayerPerformance playerId={player.id} />
    </div>
  );
};

export default PlayerProfile;
