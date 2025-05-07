
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerPerformance } from "@/components/PlayerPerformance";
import { SkillLevelUpdate } from "@/components/SkillLevelUpdate";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PlayerDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/auth");
          return;
        }

        setUser(session.user);

        // Get player profile
        const { data: authProfile } = await supabase
          .from('auth_profiles')
          .select('*, player:player_id(*)')
          .eq('id', session.user.id)
          .single();

        if (authProfile && authProfile.player) {
          setPlayerProfile(authProfile.player);
        } else {
          // Check if there's an existing player by email
          const { data: existingPlayer } = await supabase
            .from('players')
            .select('*')
            .eq('email', session.user.email)
            .maybeSingle();

          if (existingPlayer) {
            // Link existing player to auth profile
            await supabase
              .from('auth_profiles')
              .upsert({
                id: session.user.id,
                player_id: existingPlayer.id
              });
            
            setPlayerProfile(existingPlayer);
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

    fetchUserAndProfile();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto p-4">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/af55ac11-46f4-41cd-9cdb-e68e3c019154.png" 
              alt="For Sure Club" 
              className="h-10 mr-2"
            />
            <h1 className="text-2xl font-bold">Player Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/">Home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/chat">AI Game Finder</Link>
            </Button>
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
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
                      <Button className="mt-4" asChild>
                        <Link to="/">Complete Registration</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            {playerProfile ? (
              <Tabs defaultValue="performance" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="skill">Update Skill Level</TabsTrigger>
                </TabsList>
                <TabsContent value="performance" className="space-y-4">
                  <PlayerPerformance playerId={playerProfile.id} />
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
    </div>
  );
};

export default PlayerDashboard;
