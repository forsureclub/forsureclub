
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Chat = () => {
  const [user, setUser] = useState<any>(null);
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserAndMessages = async () => {
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
          
          // Get chat history
          const { data: chatMessages } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: true });
          
          if (chatMessages) {
            setMessages(chatMessages);
          }
        } else {
          toast({
            title: "Profile not found",
            description: "Please complete your player profile first",
            variant: "destructive",
          });
          navigate("/player-dashboard");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error",
          description: "Failed to load chat data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndMessages();

    // Set up real-time subscription for new messages
    const chatSubscription = supabase
      .channel('chat_messages_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          setMessages((current) => [...current, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatSubscription);
    };
  }, [navigate, toast, user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg">Loading chat...</p>
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
            <h1 className="text-2xl font-bold">AI Game Finder</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/">Home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/player-dashboard">Dashboard</Link>
            </Button>
          </div>
        </header>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Chat with Game Finder AI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg p-4 mb-4 min-h-[400px] max-h-[500px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <p className="text-gray-500 mb-4">Welcome to the Game Finder AI!</p>
                  <p className="text-gray-500">
                    Ask me to help you find {playerProfile?.sport} matches in {playerProfile?.city}
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

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ask about finding games..."
                disabled={isSending}
                className="flex-1"
              />
              <Button type="submit" disabled={isSending}>
                {isSending ? "Sending..." : "Send"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suggested Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline"
                onClick={() => setNewMessage(`Find me a ${playerProfile?.sport} match in ${playerProfile?.city}`)}
              >
                Find a match
              </Button>
              <Button 
                variant="outline"
                onClick={() => setNewMessage(`When are good times to play ${playerProfile?.sport}?`)}
              >
                Best play times
              </Button>
              <Button 
                variant="outline"
                onClick={() => setNewMessage(`Find players at my skill level (${playerProfile?.rating}/5)`)}
              >
                Similar skill level
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
