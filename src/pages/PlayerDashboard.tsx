
import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SportSelector } from "@/components/SportSelector";
import { User, MessageSquare, Video, Bot, Trophy, Users, Calendar, Send } from "lucide-react";
import { PhotoUpload } from "@/components/PhotoUpload";
import { PlayerMatches } from "@/components/PlayerMatches";

const PlayerDashboard = () => {
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string | null>("Padel");
  const [showAIChat, setShowAIChat] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchChatMessages();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!user) return;

    const chatSubscription = supabase
      .channel('chat_messages_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setMessages((current) => [...current, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatSubscription);
    };
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChatMessages = async () => {
    if (!user) return;

    try {
      const { data: chatMessages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      if (chatMessages) {
        setMessages(chatMessages);
      }
    } catch (error) {
      console.error("Error fetching chat messages:", error);
    }
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
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
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
        
        toast({
          title: "Sport Selected",
          description: `You've selected ${sport || "Padel"}. Please complete your profile.`,
        });
      }
    } catch (error) {
      console.error("Error creating player profile:", error);
      toast({
        title: "Error",
        description: "Failed to create player profile",
        variant: "destructive",
      });
    }
  };

  const handlePhotoUpdated = (url: string) => {
    if (playerProfile) {
      // Use club field to store the photo URL
      setPlayerProfile({...playerProfile, club: url});
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isSending) return;
    
    try {
      setIsSending(true);
      
      // Call the sports-chat edge function
      const { data, error } = await supabase.functions.invoke('sports-chat', {
        body: {
          message: newMessage,
          userId: user?.id,
          sport: playerProfile?.sport || "",
          location: playerProfile?.city || ""
        }
      });
      
      if (error) throw error;
      
      setNewMessage("");
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
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
      </div>

      <div className="grid gap-6">
        {/* Main Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-4">
          {/* Profile Card */}
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

                      <Button variant="outline" asChild className="w-full flex items-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                        <Link to={`/player/${playerProfile.id}`}>
                          <User size={16} />
                          <span>View Public Profile</span>
                        </Link>
                      </Button>
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

          {/* Quick Actions Cards */}
          <div className="md:col-span-3">
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              {/* AI Coaching Card */}
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <Link to="/coaching" className="block">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                      <Video className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-orange-900">AI Coaching</h3>
                      <p className="text-sm text-orange-700">Video analysis & tips</p>
                    </div>
                  </div>
                  <p className="text-xs text-orange-600">Upload videos for AI feedback and improve your game</p>
                </Link>
              </Card>

              {/* AI Game Finder Card */}
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="block" onClick={() => setShowAIChat(true)}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">AI Game Finder</h3>
                      <p className="text-sm text-blue-700">Find perfect matches</p>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600">Chat with AI to find players and schedule games</p>
                </div>
              </Card>

              {/* Tournament Card */}
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <Link to="/tournament-results" className="block">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-900">Tournaments</h3>
                      <p className="text-sm text-purple-700">Compete & track results</p>
                    </div>
                  </div>
                  <p className="text-xs text-purple-600">Join tournaments and view your performance</p>
                </Link>
              </Card>
            </div>
          </div>
        </div>

        {/* Matches Section */}
        <div className="w-full">
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

      {/* AI Game Finder Sheet */}
      <Sheet open={showAIChat} onOpenChange={setShowAIChat}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold">AI Game Finder</h2>
          </div>
          
          {/* Chat Interface */}
          <div className="flex flex-col h-full">
            <div className="flex-1 bg-white rounded-lg p-4 mb-4 min-h-[400px] max-h-[500px] overflow-y-auto border">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <p className="text-gray-500 mb-4">Welcome to the Game Finder AI!</p>
                  <p className="text-gray-500">
                    Ask me to help you find {playerProfile?.sport || 'Padel'} matches in {playerProfile?.city || 'your area'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.is_ai ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.is_ai
                            ? "bg-gray-100 text-gray-800"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2 mb-4">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ask about finding games..."
                disabled={isSending}
                className="flex-1"
              />
              <Button type="submit" disabled={isSending} size="sm">
                {isSending ? <Bot className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>

            {/* Suggested Questions */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Quick Actions:</h4>
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setNewMessage(`Find me a ${playerProfile?.sport || 'Padel'} match in ${playerProfile?.city || 'my area'}`)}
                  className="text-left justify-start"
                >
                  Find a match
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setNewMessage(`When are good times to play ${playerProfile?.sport || 'Padel'}?`)}
                  className="text-left justify-start"
                >
                  Best play times
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setNewMessage(`Find players at my skill level (${playerProfile?.rating || 2.5}/5)`)}
                  className="text-left justify-start"
                >
                  Similar skill level
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PlayerDashboard;
