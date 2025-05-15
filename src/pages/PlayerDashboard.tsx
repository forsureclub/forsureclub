
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
import { SportSelector } from "@/components/SportSelector";
import { User, Calendar, Award, Activity, MessageSquare, Video } from "lucide-react";

const PlayerDashboard = () => {
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("performance");
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Check for tab query parameter
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["performance", "record-match", "skill"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [user]);

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
        toast({
          title: "Welcome back!",
          description: `You're logged in as ${authProfile.player.name}.`,
        });
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
          
          toast({
            title: "Profile Linked",
            description: `Your account has been linked to your ${existingPlayer.sport} player profile.`,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error({
        title: "Error",
        description: "Failed to load profile data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshProfile = async () => {
    setIsLoading(true);
    await fetchProfile();
  };

  const handleSportSelection = async (sport: string) => {
    setSelectedSport(sport);
    
    try {
      if (!user) return;
      
      // If no player profile exists yet, create a simple one based on the selected sport
      if (!playerProfile) {
        const { data: newPlayer, error } = await supabase
          .from('players')
          .insert({
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Player',
            email: user.email,
            sport: sport,
            rating: 2.5, // Default middle rating
            gender: 'other', // Default, will be updated later
            city: 'Not specified',
            occupation: 'Not specified',
            budget_range: 'Not specified',
            play_time: 'weekends'
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // Link to auth profile
        await supabase
          .from('auth_profiles')
          .upsert({
            id: user.id,
            player_id: newPlayer.id
          });
          
        setPlayerProfile(newPlayer);
        
        toast.success({
          title: "Sport Selected",
          description: `You've selected ${sport}. Please complete your profile.`,
        });
      }
    } catch (error) {
      console.error("Error creating player profile:", error);
      toast.error({
        title: "Error",
        description: "Failed to create player profile",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-6 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Player Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/coaching">
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 flex items-center gap-2">
              <Video size={18} />
              AI Coaching
            </Button>
          </Link>
          <Link to="/chat">
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 flex items-center gap-2">
              <MessageSquare size={18} />
              Find Games
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <CardHeader className="flex flex-row items-center justify-between bg-gray-50 dark:bg-gray-900">
              <CardTitle className="flex items-center gap-2">
                <User size={20} className="text-orange-500" />
                Profile
              </CardTitle>
              {playerProfile?.sport && (
                <div className="bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 p-2 rounded-full">
                  <span className="font-medium">{playerProfile.sport}</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                
                {playerProfile ? (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
                      <p className="font-medium">{playerProfile.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sport</p>
                      <p className="font-medium">{playerProfile.sport}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Rating</p>
                      <div className="flex items-center">
                        <div className="text-lg font-semibold">
                          {playerProfile.rating}/5
                        </div>
                        <div className="ml-2">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-lg ${i < Math.round(playerProfile.rating) ? 'text-orange-500' : 'text-gray-300'}`}>★</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</p>
                      <p className="font-medium">{playerProfile.city}</p>
                    </div>
                  </>
                ) : (
                  <div className="py-4">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Please select your sport to continue:</p>
                    
                    <SportSelector onSportSelect={handleSportSelection} />
                    
                    <p className="mt-4 text-sm text-gray-500">
                      Your profile will be created automatically based on your selection.
                    </p>
                  </div>
                )}

                <div className="pt-4 space-y-2">
                  <Button variant="outline" asChild className="w-full flex items-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                    <Link to="/coaching">
                      <Video size={16} />
                      <span>AI Coaching</span>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full flex items-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                    <Link to="/chat">
                      <MessageSquare size={16} />
                      <span>Find Games with AI</span>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full flex items-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                    <Link to="/">
                      <User size={16} />
                      <span>Browse Players</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {playerProfile ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 grid w-full grid-cols-3">
                <TabsTrigger value="performance" className="flex items-center gap-2">
                  <Activity size={16} />
                  <span className="hidden sm:inline">Performance</span>
                </TabsTrigger>
                <TabsTrigger value="record-match" className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span className="hidden sm:inline">Record Match</span>
                </TabsTrigger>
                <TabsTrigger value="skill" className="flex items-center gap-2">
                  <Award size={16} />
                  <span className="hidden sm:inline">Update Skill</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="performance" className="space-y-4">
                <PlayerPerformance playerId={playerProfile.id} />
              </TabsContent>
              
              <TabsContent value="record-match">
                <Card className="border-0 shadow-lg">
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
                <Card className="border-0 shadow-lg">
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
            <Card className="p-6 border-0 shadow-lg bg-gradient-to-b from-white to-gray-50">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto flex items-center justify-center">
                  <User className="h-8 w-8 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold">Complete Your Profile</h2>
                <p className="text-gray-600">
                  Select your sport to create your player profile and start tracking your games.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboard;
