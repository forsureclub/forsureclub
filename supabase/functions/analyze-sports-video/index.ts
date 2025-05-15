
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

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
    const { videoUrl, sport } = await req.json();

    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: "Missing video URL" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing ${sport} video: ${videoUrl}`);

    // In a real implementation, we would use computer vision APIs to analyze the video
    // For this demo, we'll use OpenAI to generate specific feedback based on the sport type
    
    let systemPrompt;
    if (sport === 'padel') {
      systemPrompt = `You are an expert padel coach with years of experience training professionals. 
      
      Provide detailed, constructive feedback as if you're watching a video of someone playing padel. Focus on:
      1. Positioning on the court
      2. Grip and racket technique
      3. Footwork and movement
      4. Shot selection and strategy
      5. Common mistakes that padel players make at various levels
      
      Structure your feedback in a clear format with:
      - Overall assessment (1-2 sentences)
      - Strengths (2-3 bullet points)
      - Areas for improvement (3-4 specific tips with clear instructions)
      - Drills to practice (2-3 recommendations)
      
      Be encouraging but honest, as if you're a real coach helping your student improve their padel game.`;
    } else {
      systemPrompt = `You are an expert ${sport} coach with years of experience training professionals. 
      
      Provide detailed, constructive feedback on a player's technique and suggest specific areas for improvement. 
      Focus on the fundamentals of ${sport} and common errors that players make.
      
      Structure your feedback in a clear format with:
      - Overall assessment (1-2 sentences)
      - Strengths (2-3 bullet points)
      - Areas for improvement (3-4 specific tips with clear instructions)
      - Drills to practice (2-3 recommendations)
      
      Be encouraging but honest, as if you're a real coach helping your student improve their ${sport} game.`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Analyze this ${sport} video and provide coaching feedback on technique, form, and areas for improvement. The video URL is: ${videoUrl}`
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error (${response.status}):`, errorText);
      throw new Error(`OpenAI API error: Status ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in analyze-sports-video function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
