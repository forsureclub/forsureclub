
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send } from "lucide-react";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const params = useParams();

  // Use params if props aren't provided
  const currentMatchId = matchId || params.matchId;
  const currentRecipientId = recipientId || params.playerId;

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch recipient info
        if (currentRecipientId) {
          const { data: playerData, error: playerError } = await supabase
            .from("players")
            .select("id, name")
            .eq("id", currentRecipientId)
            .single();
            
          if (playerError) throw playerError;
          setRecipient(playerData);
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
        }
        
        // Fetch existing messages
        let query = supabase
          .from("player_messages")
          .select("*")
          .order("created_at", { ascending: true });
          
        if (currentMatchId) {
          query = query.eq("match_id", currentMatchId);
        } else if (currentRecipientId) {
          query = query.or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
            .or(`sender_id.eq.${currentRecipientId},recipient_id.eq.${currentRecipientId}`);
        }
        
        const { data: messagesData, error: messagesError } = await query;
        
        if (messagesError) throw messagesError;
        setMessages(messagesData || []);

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
    
    // Set up subscription for real-time updates
    const channel = supabase
      .channel('player_messages_changes')
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_messages',
          filter: currentMatchId ? `match_id=eq.${currentMatchId}` : 
            `or(sender_id=eq.${user.id},recipient_id=eq.${user.id})`
        }, 
        (payload) => {
          // Only add if it's related to current conversation
          const msg = payload.new;
          if ((currentRecipientId && 
              (msg.sender_id === currentRecipientId || msg.recipient_id === currentRecipientId)) ||
              currentMatchId) {
            setMessages(msgs => [...msgs, msg]);
          }
        }
      )
      .subscribe();

    // Clean up subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentMatchId, currentRecipientId, toast]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    
    try {
      const messageData = {
        content: newMessage,
        sender_id: user.id,
        recipient_id: currentRecipientId,
        match_id: currentMatchId
      };
      
      const { error } = await supabase
        .from("player_messages")
        .insert(messageData);
        
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
                  message.sender_id === user?.id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender_id === user?.id
                      ? "bg-orange-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  <p>{message.content}</p>
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
          placeholder="Type a message..."
          className="resize-none"
        />
        <Button type="submit" className="bg-orange-600 hover:bg-orange-700 self-end">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
};

export default PlayerMessaging;
