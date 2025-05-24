import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export const PlayerMessaging = ({ matchId, recipientId }: { matchId?: string; recipientId?: string }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [recipient, setRecipient] = useState<any>(null);
  const [match, setMatch] = useState<any>(null);
  const [canMessage, setCanMessage] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const params = useParams();

  const currentMatchId = matchId || params.matchId;
  const currentRecipientId = recipientId || params.playerId;

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current player ID
        const { data: playerData } = await supabase
          .from("players")
          .select("id")
          .eq("email", user.email)
          .single();

        if (playerData) {
          setCurrentPlayerId(playerData.id);
        }
        
        // Fetch recipient info
        if (currentRecipientId) {
          const { data: playerData, error: playerError } = await supabase
            .from("players")
            .select("*")
            .eq("id", currentRecipientId)
            .single();
            
          if (playerError) throw playerError;
          setRecipient(playerData);

          // Check if both players have liked each other (mutual match)
          if (playerData && currentPlayerId) {
            const canChat = await checkMutualMatch(currentPlayerId, currentRecipientId);
            setCanMessage(canChat);
          }
        }
        
        // Fetch match info if available
        if (currentMatchId) {
          const { data: matchData, error: matchError } = await supabase
            .from("matches")
            .select(`
              id, 
              sport,
              location,
              played_at,
              status
            `)
            .eq("id", currentMatchId)
            .single();
            
          if (matchError) throw matchError;
          setMatch(matchData);
          setCanMessage(true); // Can always message about confirmed matches
        }
        
        // Only fetch messages if messaging is allowed
        if (canMessage || currentMatchId) {
          await fetchMessages();
        }

      } catch (error) {
        console.error("Error fetching messaging data:", error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, currentMatchId, currentRecipientId, toast, canMessage, currentPlayerId]);

  const checkMutualMatch = async (playerId1: string, playerId2: string): Promise<boolean> => {
    try {
      // Check if player1 liked player2
      const { data: like1 } = await supabase
        .from("chat_messages")
        .select("*")
        .like("content", `%"type":"like"%`)
        .like("content", `%"from_player":"${playerId1}"%`)
        .like("content", `%"to_player":"${playerId2}"%`)
        .maybeSingle();

      // Check if player2 liked player1
      const { data: like2 } = await supabase
        .from("chat_messages")
        .select("*")
        .like("content", `%"type":"like"%`)
        .like("content", `%"from_player":"${playerId2}"%`)
        .like("content", `%"to_player":"${playerId1}"%`)
        .maybeSingle();

      return !!(like1 && like2);
    } catch (error) {
      console.error("Error checking mutual match:", error);
      return false;
    }
  };

  const fetchMessages = async () => {
    try {
      let query = supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true });
        
      if (currentMatchId) {
        // For match chat, filter by match_id in content
        query = query.like("content", `%"match_id":"${currentMatchId}"%`);
      } else if (currentRecipientId && user.id) {
        // For direct messages, we need to get the current user's player ID first
        const { data: playerData } = await supabase
          .from("players")
          .select("id")
          .eq("user_id", user.id)
          .single();
        
        if (playerData) {
          const playerId = playerData.id;
          // Get messages where content contains conversation between these two players
          const { data: messagesData, error: messagesError } = await supabase
            .from("chat_messages")
            .select("*")
            .order("created_at", { ascending: true });
          
          if (messagesError) throw messagesError;
          
          // Filter messages manually for direct conversation
          const filteredMessages = (messagesData || []).filter(msg => {
            try {
              const parsedContent = JSON.parse(msg.content);
              return (
                (parsedContent.sender_id === playerId && parsedContent.recipient_id === currentRecipientId) ||
                (parsedContent.sender_id === currentRecipientId && parsedContent.recipient_id === playerId)
              );
            } catch (e) {
              return false;
            }
          });
          
          // Process the filtered messages
          const processedMessages = filteredMessages.map(msg => {
            try {
              const parsedContent = JSON.parse(msg.content);
              return {
                ...msg,
                actualContent: parsedContent.message || msg.content,
                metadata: parsedContent
              };
            } catch (e) {
              return {
                ...msg,
                actualContent: msg.content,
                metadata: {}
              };
            }
          });
          
          setMessages(processedMessages);
          setLoading(false);
          return;
        }
      }
      
      // For match messages, execute the query
      if (currentMatchId) {
        const { data: messagesData, error: messagesError } = await query;
        
        if (messagesError) throw messagesError;
        
        // Process the messages to extract the actual message content from the JSON
        const processedMessages = (messagesData || []).map(msg => {
          try {
            const parsedContent = JSON.parse(msg.content);
            return {
              ...msg,
              actualContent: parsedContent.message || msg.content,
              metadata: parsedContent
            };
          } catch (e) {
            return {
              ...msg,
              actualContent: msg.content,
              metadata: {}
            };
          }
        });
        
        setMessages(processedMessages);
      }

    } catch (error) {
      console.error("Error fetching messaging data:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !canMessage) return;
    
    try {
      const senderId = currentPlayerId;
      if (!senderId) return;
      
      const messageData = {
        sender_id: senderId,
        recipient_id: currentRecipientId,
        match_id: currentMatchId,
        message: newMessage,
        timestamp: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from("chat_messages")
        .insert({
          user_id: user.id,
          content: JSON.stringify(messageData),
          is_ai: false
        });
        
      if (error) throw error;
      
      setNewMessage("");
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send",
        description: "Your message could not be sent. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner text-orange-500"></span>
      </div>
    );
  }

  if (!canMessage && !currentMatchId) {
    return (
      <Card className="p-6 text-center">
        <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Match Required</h3>
        <p className="text-gray-600">
          You can only message players after you've both matched with each other. 
          Use the player finder to like players and wait for them to like you back!
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> 
          Back
        </Button>
        <div>
          <h2 className="text-lg font-semibold">
            {recipient ? `Chat with ${recipient.name}` : "Match Chat"}
          </h2>
          {match && (
            <p className="text-sm text-gray-500">
              {match.sport} match on {format(new Date(match.played_at), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          )}
          {recipient && !match && (
            <p className="text-sm text-green-600">✓ Mutual match - you can message!</p>
          )}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4 h-[400px] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-500">No messages yet.</p>
            <p className="text-gray-500 text-sm mt-2">
              Start the conversation with your match partner!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.metadata?.sender_id === (user?.id ? "currentUser" : message.user_id) ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.metadata?.sender_id === (user?.id ? "currentUser" : message.user_id)
                      ? "bg-orange-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  <p>{message.actualContent}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {format(new Date(message.created_at), "h:mm a")}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={canMessage ? "Type a message..." : "Match required to message"}
          className="resize-none"
          disabled={!canMessage}
        />
        <Button 
          type="submit" 
          className="bg-orange-600 hover:bg-orange-700 self-end"
          disabled={!canMessage}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
};

export default PlayerMessaging;
