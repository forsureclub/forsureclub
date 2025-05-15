
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

    // Creating a more specific and structured prompt for better coaching feedback
    
    let systemPrompt;
    if (sport === 'padel') {
      systemPrompt = `You are an expert padel coach with years of experience training professionals. 
      
      Provide detailed, constructive feedback as if you're watching a video of someone playing padel. Focus on:
      1. Positioning on the court
      2. Grip and racket technique
      3. Footwork and movement patterns
      4. Shot selection and strategy
      5. Common padel-specific techniques (bandeja, vibora, smash)
      
      Structure your feedback in this EXACT format:
      
      ## Overall Assessment
      [1-2 sentences summarizing what you observe]
      
      ## Strengths
      - [Specific strength 1]
      - [Specific strength 2]
      - [Specific strength 3]
      
      ## Areas for Improvement
      - [Specific improvement 1 with clear instructions on how to fix]
      - [Specific improvement 2 with clear instructions on how to fix]
      - [Specific improvement 3 with clear instructions on how to fix]
      
      ## Recommended Drills
      - [Specific drill 1 with description]
      - [Specific drill 2 with description]
      
      Be encouraging but specific, as if you're a real coach helping your student improve their padel game.`;
    } else {
      systemPrompt = `You are an expert ${sport} coach with years of experience training professionals. 
      
      Provide detailed, constructive feedback on a player's technique and suggest specific areas for improvement. 
      Focus on the fundamentals of ${sport} and common errors that players make.
      
      Structure your feedback in this EXACT format:
      
      ## Overall Assessment
      [1-2 sentences summarizing what you observe]
      
      ## Strengths
      - [Specific strength 1]
      - [Specific strength 2]
      - [Specific strength 3]
      
      ## Areas for Improvement
      - [Specific improvement 1 with clear instructions on how to fix]
      - [Specific improvement 2 with clear instructions on how to fix]
      - [Specific improvement 3 with clear instructions on how to fix]
      
      ## Recommended Drills
      - [Specific drill 1 with description]
      - [Specific drill 2 with description]
      
      Be encouraging but specific, as if you're a real coach helping your student improve their ${sport} game.`;
    }

    // Adding more specific user prompt for better analysis
    const userPrompt = `Analyze this ${sport} video and provide coaching feedback on technique, form, and areas for improvement. 
    The video URL is: ${videoUrl}
    
    Since you can't actually see the video, simulate an analysis for an intermediate ${sport} player with some common technique issues.
    Focus on providing actionable, specific feedback that would help them improve their game.`;

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
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error (${response.status}):`, errorText);
      throw new Error(`OpenAI API error: Status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response format from OpenAI API");
    }
    
    const analysis = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in analyze-sports-video function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred", analysis: "As your virtual padel coach, I apologize that I couldn't analyze your video at this moment. Please try uploading again, or contact support if this issue persists. In the meantime, focus on key padel fundamentals: proper grip, court positioning, and maintaining good footwork." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
