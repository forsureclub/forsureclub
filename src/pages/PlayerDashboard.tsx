
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SportSelector } from "@/components/SportSelector";
import { User, MessageSquare, Video } from "lucide-react";
import { PhotoUpload } from "@/components/PhotoUpload";
import { PlayerMatches } from "@/components/PlayerMatches";

const PlayerDashboard = () => {
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string | null>("Padel"); // Default to Padel
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();

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
            sport: sport || "Padel", // Default to Padel if no sport selected
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
          description: `You've selected ${sport || "Padel"}. Please complete your profile.`,
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

  const handlePhotoUpdated = (url: string) => {
    if (playerProfile) {
      // Use club field to store the photo URL
      setPlayerProfile({...playerProfile, club: url});
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
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <CardContent className="p-6">
              <div className="space-y-4">
                {playerProfile ? (
                  <>
                    <PhotoUpload 
                      playerId={playerProfile.id}
                      playerName={playerProfile.name}
                      existingUrl={playerProfile.club} // Using club field for photo
                      onPhotoUpdated={handlePhotoUpdated}
                    />
                    
                    <div className="text-center">
                      <h2 className="text-xl font-bold mt-2">{playerProfile.name}</h2>
                      <p className="text-sm text-gray-500">{playerProfile.city}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Sport</span>
                        <span className="font-medium">{playerProfile.sport || "Padel"}</span>
                      </div>
                      
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Rating</span>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">{playerProfile.rating.toFixed(1)}/5</span>
                          <div>
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-sm ${i < Math.round(playerProfile.rating) ? 'text-orange-500' : 'text-gray-300'}`}>★</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Email</span>
                        <span className="font-medium">{playerProfile.email}</span>
                      </div>
                    </div>

                    <div className="pt-4 space-y-2">
                      <Button variant="outline" asChild className="w-full flex items-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                        <Link to="/coaching">
                          <Video size={16} />
                          <span>AI Coaching</span>
                        </Link>
                      </Button>
                      <Button variant="outline" asChild className="w-full flex items-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                        <Link to={`/player/${playerProfile.id}`}>
                          <User size={16} />
                          <span>View Public Profile</span>
                        </Link>
                      </Button>
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
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {playerProfile ? (
            <PlayerMatches />
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
