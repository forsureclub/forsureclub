
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
import { ChevronLeft, MapPin, Star, Trophy, Users, Calendar, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
    return (
      <div className="container mx-auto p-8">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-48 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="container mx-auto p-8 text-center">
        <div className="max-w-md mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center p-6">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h2 className="text-xl font-bold mb-2">Player Not Found</h2>
                <p className="text-gray-500 mb-4">
                  The player profile you're looking for doesn't exist or has been removed.
                </p>
                <Button onClick={() => navigate(-1)} className="flex items-center gap-2">
                  <ChevronLeft size={16} />
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4 hover:bg-transparent hover:text-orange-600">
        <ChevronLeft size={16} />
        Back
      </Button>
      
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-r from-orange-600 to-orange-400 h-24"></div>
        <CardContent className="relative pt-16 pb-6 px-6">
          <div className="absolute -top-12 left-6 w-24 h-24 rounded-full bg-white p-1 shadow-lg">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
              <span className="text-3xl font-bold text-orange-600">{player.name.charAt(0)}</span>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
            <div>
              <h1 className="text-2xl font-bold">{player.name}</h1>
              <div className="flex items-center text-gray-500 mt-1">
                <MapPin size={16} className="mr-1" />
                {player.city}
              </div>
              <div className="mt-2 flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i}
                    size={18}
                    fill={i < Math.round(player.rating || 0) ? "#FB923C" : "none"}
                    stroke={i < Math.round(player.rating || 0) ? "#FB923C" : "#D1D5DB"}
                  />
                ))}
                <span className="ml-2 text-sm font-medium">
                  {player.rating ? player.rating.toFixed(1) : "Not rated"} / 5.0
                </span>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 hover:bg-orange-50">
                    <Trophy size={16} />
                    Update Skill
                  </Button>
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
                  <Button variant="outline" className="flex items-center gap-2 hover:bg-orange-50">
                    <Calendar size={16} />
                    Record Match
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <MatchResults 
                    playerId={player.id}
                    playerName={player.name}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Player Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Sport</span>
                  <span className="font-medium">{player.sport}</span>
                </div>
                <Separator />
                
                {player.club && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Club</span>
                      <span className="font-medium">{player.club}</span>
                    </div>
                    <Separator />
                  </>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Privacy & Contact</h3>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Protected Information</span>
                </div>
                <p className="text-xs text-blue-700">
                  Contact details (email and phone) are only shared once you successfully match and arrange a game together for privacy and safety.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Performance History</CardTitle>
        </CardHeader>
        <CardContent>
          <PlayerPerformance playerId={player.id} />
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerProfile;
