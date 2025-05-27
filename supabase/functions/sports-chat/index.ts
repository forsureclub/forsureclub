
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sport, location, userId } = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Create a Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Save user message to database
    await supabaseClient
      .from('chat_messages')
      .insert({
        user_id: userId,
        content: message,
        is_ai: false,
      });

    // Get current user's player data first
    const currentPlayerResponse = await fetch(
      `${supabaseUrl}/rest/v1/players?select=*&email=eq.${encodeURIComponent(userId)}`,
      {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    let currentPlayer = null;
    if (currentPlayerResponse.ok) {
      const players = await currentPlayerResponse.json();
      if (players && players.length > 0) {
        currentPlayer = players[0];
      }
    }

    // Generate an AI response based on the sport, location, and user's rating
    let aiResponse = "";
    
    if (message.toLowerCase().includes('find') || message.toLowerCase().includes('match') || message.toLowerCase().includes('game')) {
      // Build query for potential matches with rating similarity
      let queryUrl = `${supabaseUrl}/rest/v1/players?select=*&sport=eq.${encodeURIComponent(sport)}&city=eq.${encodeURIComponent(location)}`;
      
      if (currentPlayer) {
        // Exclude current user and find players within 0.5 rating points
        const minRating = Math.max(1, currentPlayer.rating - 0.5);
        const maxRating = Math.min(5, currentPlayer.rating + 0.5);
        queryUrl += `&id=neq.${currentPlayer.id}&rating=gte.${minRating}&rating=lte.${maxRating}`;
      }
      
      queryUrl += '&limit=5';
      
      const playersResponse = await fetch(queryUrl, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (playersResponse.ok) {
        const players = await playersResponse.json();
        
        if (players && players.length > 0) {
          aiResponse = `🎾 Great! I found ${players.length} ${sport} players in ${location} with similar skill levels:\n\n`;
          
          players.forEach((player, index) => {
            const ratingDiff = currentPlayer ? Math.abs(player.rating - currentPlayer.rating) : 0;
            const matchQuality = ratingDiff <= 0.2 ? "Perfect match" : ratingDiff <= 0.5 ? "Great match" : "Good match";
            
            aiResponse += `${index + 1}. **${player.name}**\n`;
            aiResponse += `   • Rating: ${player.rating.toFixed(1)}/5.0 (${matchQuality})\n`;
            aiResponse += `   • Plays: ${player.play_time}\n`;
            if (currentPlayer) {
              aiResponse += `   • Rating difference: ${ratingDiff.toFixed(1)} points\n`;
            }
            aiResponse += `\n`;
          });
          
          aiResponse += `💡 **Tips for contacting players:**\n`;
          aiResponse += `• Use the "Discover Players" tab to like players\n`;
          aiResponse += `• Send match requests through the app\n`;
          aiResponse += `• Players with ratings ±0.5 from yours provide the best matches\n\n`;
          aiResponse += `Would you like me to help you find players at a specific time or with other preferences?`;
        } else {
          if (currentPlayer) {
            aiResponse = `😔 No ${sport} players found in ${location} with similar ratings (${currentPlayer.rating.toFixed(1)} ±0.5).\n\n`;
            aiResponse += `**Suggestions:**\n`;
            aiResponse += `• Try expanding your search to nearby areas\n`;
            aiResponse += `• Consider players with slightly different ratings\n`;
            aiResponse += `• Check back later as new players join regularly\n\n`;
            aiResponse += `Would you like me to notify you when new players with similar ratings register?`;
          } else {
            aiResponse = `I couldn't find any ${sport} players in ${location} right now. Would you like me to notify you when new players register?`;
          }
        }
      }
    } else if (message.toLowerCase().includes('rating') || message.toLowerCase().includes('skill') || message.toLowerCase().includes('level')) {
      if (currentPlayer) {
        const skillLevel = getSkillLevel(currentPlayer.rating);
        aiResponse = `🏆 Your current ${sport} rating is ${currentPlayer.rating.toFixed(1)}/5.0 (${skillLevel} level).\n\n`;
        aiResponse += `**Perfect matches:** Players rated ${Math.max(1, currentPlayer.rating - 0.2).toFixed(1)} - ${Math.min(5, currentPlayer.rating + 0.2).toFixed(1)}\n`;
        aiResponse += `**Good matches:** Players rated ${Math.max(1, currentPlayer.rating - 0.5).toFixed(1)} - ${Math.min(5, currentPlayer.rating + 0.5).toFixed(1)}\n\n`;
        aiResponse += `Would you like me to find players in your skill range?`;
      } else {
        aiResponse = `I'd be happy to help with skill-based matching! What's your current ${sport} rating or skill level?`;
      }
    } else if (message.toLowerCase().includes('schedule') || message.toLowerCase().includes('when') || message.toLowerCase().includes('time')) {
      aiResponse = `⏰ Best times for ${sport} matches in ${location}:\n\n`;
      aiResponse += `**Weekdays:** 6:00 PM - 9:00 PM (most popular)\n`;
      aiResponse += `**Weekends:** 9:00 AM - 12:00 PM & 2:00 PM - 6:00 PM\n`;
      aiResponse += `**Peak times:** Wednesday & Saturday evenings\n\n`;
      if (currentPlayer) {
        aiResponse += `Your availability: ${currentPlayer.play_time}\n\n`;
      }
      aiResponse += `When would you prefer to play? I can help find players available at that time.`;
    } else if (message.toLowerCase().includes('beginner') || message.toLowerCase().includes('new')) {
      aiResponse = `🌟 Welcome to ${sport}! Here's how I can help you get started:\n\n`;
      aiResponse += `**For beginners (Rating 1.0-2.0):**\n`;
      aiResponse += `• I'll match you with other beginners\n`;
      aiResponse += `• Look for players with "patient" or "coaching" in their profile\n`;
      aiResponse += `• Start with casual games to build confidence\n\n`;
      aiResponse += `Would you like me to find beginner-friendly players in ${location}?`;
    } else {
      aiResponse = `🤖 Hi! I'm your ${sport} match finder. I can help you:\n\n`;
      aiResponse += `🎯 **Find players with similar ratings** - Just say "find me a match"\n`;
      aiResponse += `⭐ **Check skill compatibility** - Ask about ratings or skill levels\n`;
      aiResponse += `🕐 **Schedule games** - Ask about best times to play\n`;
      aiResponse += `📍 **Local recommendations** - Find players in ${location}\n\n`;
      if (currentPlayer) {
        aiResponse += `Your rating: ${currentPlayer.rating.toFixed(1)}/5.0 • Location: ${location}\n\n`;
      }
      aiResponse += `What would you like help with today?`;
    }
    
    // Save AI response to database
    await supabaseClient
      .from('chat_messages')
      .insert({
        user_id: userId,
        content: aiResponse,
        is_ai: true,
      });

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error('Error in sports-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        } 
      }
    );
  }
});

// Helper function to determine skill level
function getSkillLevel(rating) {
  if (rating <= 1.5) return "Beginner";
  if (rating <= 2.5) return "Intermediate";
  if (rating <= 3.5) return "Advanced";
  if (rating <= 4.5) return "Expert";
  return "Professional";
}

// Simple Supabase client for Deno
function createClient(supabaseUrl, supabaseKey) {
  return {
    from: (table) => ({
      insert: async (record) => {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/${table}`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(record)
          }
        );
        return { data: await response.json(), error: null };
      }
    })
  };
}
