
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

    // Generate an AI response based on the sport and location
    let aiResponse = "";
    
    // Simple matching logic - in a real app, this would use a real AI service
    if (message.toLowerCase().includes('find') || message.toLowerCase().includes('match') || message.toLowerCase().includes('game')) {
      // Query the database for potential matches
      const { data: players } = await supabaseClient
        .from('players')
        .select('*')
        .eq('sport', sport)
        .eq('city', location)
        .neq('id', userId) // Exclude the current user
        .limit(3);
      
      if (players && players.length > 0) {
        aiResponse = `I found ${players.length} potential ${sport} players in ${location} for you:\n\n`;
        players.forEach((player: any, index: number) => {
          aiResponse += `${index + 1}. ${player.name} - Skill level: ${player.rating}/5\n`;
        });
        aiResponse += `\nWould you like me to help you connect with any of these players?`;
      } else {
        aiResponse = `I couldn't find any ${sport} players in ${location} right now. Would you like me to notify you when new players register?`;
      }
    } else if (message.toLowerCase().includes('schedule') || message.toLowerCase().includes('when') || message.toLowerCase().includes('time')) {
      aiResponse = `The best times for ${sport} matches in ${location} are typically weekday evenings after 6pm and weekends. When would you prefer to play?`;
    } else if (message.toLowerCase().includes('skill') || message.toLowerCase().includes('level') || message.toLowerCase().includes('rating')) {
      aiResponse = `For ${sport}, we recommend finding players within 0.5-1 rating points of your own skill level for the most competitive matches. Would you like me to find players with a specific skill rating?`;
    } else {
      aiResponse = `Thanks for your message about ${sport} in ${location}. How can I help you find a match today?`;
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

// Simple Supabase client for Deno
function createClient(supabaseUrl: string, supabaseKey: string) {
  return {
    from: (table: string) => ({
      select: (columns: string = '*') => ({
        eq: (column: string, value: any) => ({
          neq: (column: string, value: any) => ({
            limit: async (limit: number) => {
              const response = await fetch(
                `${supabaseUrl}/rest/v1/${table}?select=${columns}&${column}=eq.${value}&limit=${limit}`,
                {
                  headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              return { data: await response.json() };
            }
          })
        })
      }),
      insert: async (record: any) => {
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
