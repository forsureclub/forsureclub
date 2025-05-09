
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerPerformance } from "@/components/PlayerPerformance";
import { SkillLevelUpdate } from "@/components/SkillLevelUpdate";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { MatchResults } from "@/components/MatchResults";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { GolfBall, BadmintonBall } from "lucide-react";
import { SportSelector } from "@/components/SportSelector";

const PlayerDashboard = () => {
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Get player profile
        const { data: authProfile } = await supabase
          .from('auth_profiles')
          .select('*, player:player_id(*)')
          .eq('id', user.id)
          .single();

        if (authProfile && authProfile.player) {
          setPlayerProfile(authProfile.player);
          setSelectedSport(authProfile.player.sport);
        } else {
          // Check if there's an existing player by email
          const { data: existingPlayer } = await supabase
            .from('players')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();

          if (existingPlayer) {
            // Link existing player to auth profile
            await supabase
              .from('auth_profiles')
              .upsert({
                id: user.id,
                player_id: existingPlayer.id
              });
            
            setPlayerProfile(existingPlayer);
            setSelectedSport(existingPlayer.sport);
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  const handleRefreshProfile = async () => {
    setIsLoading(true);
    await fetchProfile();
  };

  const fetchProfile = async () => {
    try {
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get player profile
      const { data: authProfile } = await supabase
        .from('auth_profiles')
        .select('*, player:player_id(*)')
        .eq('id', user.id)
        .single();

      if (authProfile && authProfile.player) {
        setPlayerProfile(authProfile.player);
        setSelectedSport(authProfile.player.sport);
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSportIcon = (sport: string) => {
    switch (sport?.toLowerCase()) {
      case 'golf':
        return <GolfBall className="h-6 w-6" />;
      case 'tennis':
      case 'padel':
        return <BadmintonBall className="h-6 w-6" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-lg">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Player Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profile</CardTitle>
              {playerProfile?.sport && (
                <div className="bg-primary/10 p-2 rounded-full">
                  {getSportIcon(playerProfile.sport)}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p>{user?.email}</p>
                </div>
                
                {playerProfile ? (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p>{playerProfile.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Sport</p>
                      <p>{playerProfile.sport}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Current Rating</p>
                      <div className="text-lg font-semibold">
                        {playerProfile.rating}/5
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Location</p>
                      <p>{playerProfile.city}</p>
                    </div>
                  </>
                ) : (
                  <div className="py-4">
                    <p className="text-gray-500">No player profile linked yet.</p>
                    
                    <div className="mt-4">
                      <p className="mb-2 font-medium">Select your sport:</p>
                      <SportSelector onSportSelect={(sport) => setSelectedSport(sport)} />
                    </div>
                    
                    <Button className="mt-4" asChild>
                      <Link to="/">Complete Registration</Link>
                    </Button>
                  </div>
                )}

                <div className="pt-4 space-y-2">
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/chat">Find Games with AI</Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/">Browse Players</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {playerProfile ? (
            <Tabs defaultValue="performance" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="record-match">Record Match</TabsTrigger>
                <TabsTrigger value="skill">Update Skill</TabsTrigger>
              </TabsList>
              
              <TabsContent value="performance" className="space-y-4">
                <PlayerPerformance playerId={playerProfile.id} />
              </TabsContent>
              
              <TabsContent value="record-match">
                <Card>
                  <CardContent className="pt-6">
                    <MatchResults 
                      playerId={playerProfile.id}
                      playerName={playerProfile.name}
                      sport={playerProfile.sport}
                      onResultSubmitted={handleRefreshProfile}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="skill">
                <Card>
                  <CardContent className="pt-6">
                    <SkillLevelUpdate 
                      playerId={playerProfile.id}
                      playerName={playerProfile.name}
                      sport={playerProfile.sport}
                      currentRating={playerProfile.rating}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="p-6">
              <p className="text-center text-gray-500">
                Complete your registration to view your game history and performance.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboard;
