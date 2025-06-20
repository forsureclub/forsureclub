import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SportSelector } from "@/components/SportSelector";
import { User, MessageSquare, Video, Bot, Trophy, Users, Calendar, Send, Heart, Star, Zap, Menu } from "lucide-react";
import { PhotoUpload } from "@/components/PhotoUpload";
import { PlayerMatches } from "@/components/PlayerMatches";
import { PlayerSwiper } from "@/components/PlayerSwiper";
import { GameSuggestions } from "@/components/GameSuggestions";
import { useIsMobile } from "@/hooks/use-mobile";

const PlayerDashboard = () => {
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string | null>("Padel");
  const [showAIChat, setShowAIChat] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

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

  const sendQuickMessage = (message: string) => {
    setNewMessage(message);
    setTimeout(() => {
      const form = document.querySelector('form[data-chat-form]') as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-6 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white border-b lg:hidden">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button 
              size="sm"
              onClick={() => setShowAIChat(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Bot className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileMenu(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 lg:p-6 space-y-6">
        {/* Desktop Header - Hidden on Mobile */}
        <div className="hidden lg:flex justify-between items-center">
          <h1 className="text-3xl font-bold">Player Dashboard</h1>
          <Button 
            onClick={() => setShowAIChat(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            size="lg"
          >
            <Bot className="h-5 w-5 mr-2" />
            Find Matches with AI
          </Button>
        </div>

        {/* Quick Match Banner - Mobile Optimized */}
        {playerProfile && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
                    <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 text-sm sm:text-base">Quick Match Finder</h3>
                    <p className="text-blue-700 text-xs sm:text-sm">
                      Rating {Math.max(1, playerProfile.rating - 0.5).toFixed(1)} - {Math.min(5, playerProfile.rating + 0.5).toFixed(1)} in {playerProfile.city}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    setShowAIChat(true);
                    setTimeout(() => sendQuickMessage(`Find me a ${playerProfile.sport} match in ${playerProfile.city}`), 500);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  size={isMobile ? "default" : "default"}
                >
                  Find Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile-First Grid Layout */}
        <div className="space-y-6">
          {/* Profile Section - Mobile Stack */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Profile Card - Full Width on Mobile */}
            <div className="lg:col-span-1">
              <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-b from-white to-gray-50">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    {playerProfile ? (
                      <>
                        <PhotoUpload 
                          playerId={playerProfile.id}
                          playerName={playerProfile.name}
                          existingUrl={playerProfile.club}
                          onPhotoUpdated={handlePhotoUpdated}
                        />
                        
                        <div className="text-center">
                          <h2 className="text-lg sm:text-xl font-bold mt-2">{playerProfile.name}</h2>
                          <p className="text-sm text-gray-500">{playerProfile.city}</p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Sport</span>
                            <span className="font-medium text-sm">{playerProfile.sport || "Padel"}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Rating</span>
                            <div className="flex items-center">
                              <span className="font-medium mr-2 text-sm">{playerProfile.rating.toFixed(1)}/5</span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={`text-xs ${i < Math.round(playerProfile.rating) ? 'text-orange-500' : 'text-gray-300'}`}>★</span>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Email</span>
                            <span className="font-medium text-xs truncate max-w-32">{playerProfile.email}</span>
                          </div>
                        </div>

                        <Button variant="outline" asChild className="w-full flex items-center gap-2 hover:bg-orange-50 text-sm">
                          <Link to={`/player/${playerProfile.id}`}>
                            <User size={14} />
                            <span>View Public Profile</span>
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <div className="py-4">
                        <p className="text-gray-500 mb-4 text-sm">Please select your sport to continue:</p>
                        <SportSelector onSportSelect={handleSportSelection} />
                        <p className="mt-4 text-xs text-gray-500">
                          Your profile will be created automatically based on your selection.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions - Mobile Optimized Grid */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* AI Match Finder Card */}
                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 touch-manipulation">
                  <div className="block" onClick={() => setShowAIChat(true)}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-blue-900 text-sm sm:text-base">AI Match Finder</h3>
                        <p className="text-xs sm:text-sm text-blue-700">Smart rating-based matching</p>
                      </div>
                    </div>
                    {playerProfile && (
                      <Badge className="mb-2 bg-blue-200 text-blue-800 border-blue-300 text-xs">
                        Rating: {playerProfile.rating.toFixed(1)}/5.0
                      </Badge>
                    )}
                    <p className="text-xs text-blue-600">Find players with similar skill levels instantly</p>
                  </div>
                </Card>

                {/* AI Coaching Card */}
                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 touch-manipulation">
                  <Link to="/coaching" className="block">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-600 rounded-full flex items-center justify-center">
                        <Video className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-orange-900 text-sm sm:text-base">AI Coaching</h3>
                        <p className="text-xs sm:text-sm text-orange-700">Video analysis & tips</p>
                      </div>
                    </div>
                    <p className="text-xs text-orange-600">Upload videos for AI feedback and improve your game</p>
                  </Link>
                </Card>

                {/* Tournament Card */}
                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 touch-manipulation sm:col-span-2 lg:col-span-1">
                  <Link to="/tournament-results" className="block">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-full flex items-center justify-center">
                        <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-purple-900 text-sm sm:text-base">Tournaments</h3>
                        <p className="text-xs sm:text-sm text-purple-700">Compete & track results</p>
                      </div>
                    </div>
                    <p className="text-xs text-purple-600">Join tournaments and view your performance</p>
                  </Link>
                </Card>
              </div>
            </div>
          </div>

          {/* Game Finder Section - Mobile Optimized */}
          {playerProfile && (
            <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-gray-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Heart className="h-5 w-5 text-orange-600" />
                  Find Players & Schedule Games
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="suggestions" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="suggestions" className="text-xs sm:text-sm">Game Suggestions</TabsTrigger>
                    <TabsTrigger value="discover" className="text-xs sm:text-sm">Discover Players</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="suggestions" className="mt-0">
                    <GameSuggestions />
                  </TabsContent>
                  
                  <TabsContent value="discover" className="mt-0">
                    <div className="text-center mb-4">
                      <h3 className="text-base sm:text-lg font-semibold mb-2">Discover Similar Players</h3>
                      <p className="text-gray-600 text-sm">Swipe through players with similar abilities in your area</p>
                    </div>
                    <PlayerSwiper />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

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
                  <h2 className="text-lg sm:text-xl font-bold">Complete Your Profile</h2>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Select your sport to create your player profile and start tracking your games.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Sheet */}
      <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
        <SheetContent side="left" className="w-80">
          <div className="py-4">
            <h2 className="text-lg font-semibold mb-4">Menu</h2>
            <div className="space-y-3">
              <Link 
                to="/coaching" 
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                <Video className="h-5 w-5 text-orange-600" />
                <span>AI Coaching</span>
              </Link>
              <Link 
                to="/tournament-results" 
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                <Trophy className="h-5 w-5 text-purple-600" />
                <span>Tournaments</span>
              </Link>
              {playerProfile && (
                <Link 
                  to={`/player/${playerProfile.id}`} 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <User className="h-5 w-5 text-gray-600" />
                  <span>My Profile</span>
                </Link>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Enhanced AI Chat Sheet - Mobile Optimized */}
      <Sheet open={showAIChat} onOpenChange={setShowAIChat}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-2 p-4 border-b bg-white">
              <div className="bg-blue-100 p-2 rounded-full">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold">AI Match Finder</h2>
                <p className="text-sm text-gray-500">Smart rating-based matching</p>
              </div>
            </div>
            
            {/* Player Context */}
            {playerProfile && (
              <div className="bg-blue-50 rounded-lg p-3 m-4 mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Your Profile</span>
                </div>
                <div className="text-xs text-blue-700">
                  <p>Rating: {playerProfile.rating.toFixed(1)}/5.0 • {playerProfile.city}</p>
                  <p>Looking for players rated {Math.max(1, playerProfile.rating - 0.5).toFixed(1)} - {Math.min(5, playerProfile.rating + 0.5).toFixed(1)}</p>
                </div>
              </div>
            )}
            
            {/* Chat Interface */}
            <div className="flex-1 flex flex-col min-h-0 p-4 pt-4">
              <div className="flex-1 bg-white rounded-lg p-4 mb-4 overflow-y-auto border min-h-0">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <Bot className="h-12 w-12 text-blue-500 mb-4" />
                    <p className="text-gray-500 mb-4">👋 Hi! I'm your smart match finder!</p>
                    <p className="text-gray-500 text-sm">
                      I'll help you find {playerProfile?.sport || 'Padel'} players with similar ratings in {playerProfile?.city || 'your area'}
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
                          className={`max-w-[85%] rounded-lg p-3 ${
                            msg.is_ai
                              ? "bg-blue-50 text-blue-900 border border-blue-200"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          <p className="whitespace-pre-line text-sm">{msg.content}</p>
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
              <form onSubmit={handleSendMessage} className="flex gap-2 mb-4" data-chat-form>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask me to find matches..."
                  disabled={isSending}
                  className="flex-1 text-sm"
                />
                <Button type="submit" disabled={isSending} size="sm" className="bg-blue-600 hover:bg-blue-700 px-3">
                  {isSending ? <Bot className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>

              {/* Quick Actions - Mobile Optimized */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Quick Actions:</h4>
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => sendQuickMessage(`Find me a ${playerProfile?.sport || 'Padel'} match in ${playerProfile?.city || 'my area'}`)}
                    className="text-left justify-start hover:bg-blue-50 border-blue-200 h-auto py-3 px-3"
                  >
                    <Users className="h-4 w-4 mr-2 text-blue-600 flex-shrink-0" />
                    <span className="text-xs">Find similar skill players</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => sendQuickMessage(`Show me my skill level and best matches`)}
                    className="text-left justify-start hover:bg-green-50 border-green-200 h-auto py-3 px-3"
                  >
                    <Star className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />
                    <span className="text-xs">Check my rating compatibility</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => sendQuickMessage(`When are the best times to play ${playerProfile?.sport || 'Padel'}?`)}
                    className="text-left justify-start hover:bg-orange-50 border-orange-200 h-auto py-3 px-3"
                  >
                    <Calendar className="h-4 w-4 mr-2 text-orange-600 flex-shrink-0" />
                    <span className="text-xs">Best play times</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PlayerDashboard;
