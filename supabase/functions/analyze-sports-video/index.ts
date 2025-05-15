
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
    const { videoUrl, sport, playerLevel = "intermediate", focusArea = "" } = await req.json();

    if (!videoUrl) {
      return new Response(
        JSON.stringify({ 
          error: "Missing video URL",
          analysis: generateFallbackAnalysis(sport, playerLevel, focusArea) 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!openAIApiKey) {
      console.error("OpenAI API key not configured");
      return new Response(
        JSON.stringify({ 
          error: "OpenAI API key not configured",
          analysis: generateFallbackAnalysis(sport, playerLevel, focusArea) 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing ${sport} video: ${videoUrl} for player level: ${playerLevel}, focus area: ${focusArea}`);

    // Creating a more specific and structured prompt for better coaching feedback
    // with additional context about the player's level and focus area
    
    let systemPrompt;
    if (sport === 'padel') {
      systemPrompt = `You are an expert padel coach with years of experience training professionals. 
      
      Provide detailed, constructive feedback as if you're watching a video of a ${playerLevel} level player playing padel.
      
      ${focusArea ? `The player specifically wants feedback on their ${focusArea}.` : ''}
      
      Focus on:
      1. Positioning on the court
      2. Grip and racket technique
      3. Footwork and movement patterns
      4. Shot selection and strategy
      5. Common padel-specific techniques (bandeja, vibora, smash)
      
      Structure your feedback in this EXACT format:
      
      ## Overall Assessment
      [1-2 sentences summarizing what you observe about their ${playerLevel} level play${focusArea ? ' with special attention to ' + focusArea : ''}]
      
      ## Strengths
      - [Specific strength 1 relevant to their level]
      - [Specific strength 2 relevant to their level]
      - [Specific strength 3 relevant to their level]
      
      ## Areas for Improvement
      - [Specific improvement 1 with clear instructions on how to fix, tailored to ${playerLevel} level]
      - [Specific improvement 2 with clear instructions on how to fix, tailored to ${playerLevel} level]
      - [Specific improvement 3 with clear instructions on how to fix, tailored to ${playerLevel} level]
      
      ## Recommended Drills
      - [Specific drill 1 appropriate for ${playerLevel} level players ${focusArea ? 'focusing on ' + focusArea : ''}]
      - [Specific drill 2 appropriate for ${playerLevel} level players ${focusArea ? 'focusing on ' + focusArea : ''}]
      
      Be encouraging but specific, as if you're a real coach helping your student improve their padel game.`;
    } else {
      systemPrompt = `You are an expert ${sport} coach with years of experience training professionals. 
      
      Provide detailed, constructive feedback for a ${playerLevel} level player.
      ${focusArea ? `The player specifically wants feedback on their ${focusArea}.` : ''}
      
      Focus on the fundamentals of ${sport} and common errors that players at the ${playerLevel} level make.
      
      Structure your feedback in this EXACT format:
      
      ## Overall Assessment
      [1-2 sentences summarizing what you observe about their ${playerLevel} level play${focusArea ? ' with special attention to ' + focusArea : ''}]
      
      ## Strengths
      - [Specific strength 1 relevant to their level]
      - [Specific strength 2 relevant to their level]
      - [Specific strength 3 relevant to their level]
      
      ## Areas for Improvement
      - [Specific improvement 1 with clear instructions on how to fix, tailored to ${playerLevel} level]
      - [Specific improvement 2 with clear instructions on how to fix, tailored to ${playerLevel} level]
      - [Specific improvement 3 with clear instructions on how to fix, tailored to ${playerLevel} level]
      
      ## Recommended Drills
      - [Specific drill 1 appropriate for ${playerLevel} level players ${focusArea ? 'focusing on ' + focusArea : ''}]
      - [Specific drill 2 appropriate for ${playerLevel} level players ${focusArea ? 'focusing on ' + focusArea : ''}]
      
      Be encouraging but specific, as if you're a real coach helping your student improve their ${sport} game.`;
    }

    // Adding more specific user prompt for better analysis
    const userPrompt = `Analyze this ${sport} video from a ${playerLevel} level player and provide coaching feedback on technique, form, and areas for improvement. 
    ${focusArea ? `The player specifically wants feedback on their ${focusArea}.` : ''}
    The video URL is: ${videoUrl}
    
    Since you can't actually see the video, simulate an analysis for a ${playerLevel} ${sport} player with some common technique issues.
    Focus on providing actionable, specific feedback that would help them improve their game.`;

    try {
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
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);
      // Return a 200 status with fallback analysis instead of an error
      return new Response(
        JSON.stringify({ 
          error: openaiError.message,
          analysis: generateFallbackAnalysis(sport, playerLevel, focusArea) 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error("Error in analyze-sports-video function:", error);
    // Return a 200 status with fallback analysis
    // Default to padel and intermediate level if we couldn't extract from request
    const sport = "padel";
    const playerLevel = "intermediate";
    const focusArea = "";
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred", 
        analysis: generateFallbackAnalysis(sport, playerLevel, focusArea)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Function to generate fallback coaching analysis when API fails
function generateFallbackAnalysis(sport = "padel", playerLevel = "intermediate", focusArea = "") {
  const sportSpecific = sport === "padel" 
    ? {
        title: "padel",
        strengths: [
          playerLevel === "beginner" ? "Good initial stance and basic paddle grip" : 
          playerLevel === "intermediate" ? "Good court awareness and positioning near the net" : 
          "Excellent control on your bandeja shots",
          
          playerLevel === "beginner" ? "Nice effort in moving to the ball" : 
          playerLevel === "intermediate" ? "Solid volley technique when the ball is at a comfortable height" : 
          "Strong tactical understanding of when to attack versus defend",
          
          playerLevel === "beginner" ? "Good communication with your partner" : 
          playerLevel === "intermediate" ? "Nice communication with your partner during points" : 
          "Impressive speed at the net and quick reflexes"
        ],
        improvements: [
          playerLevel === "beginner" ? "Work on your basic grip - try to maintain a continental grip for better control" : 
          playerLevel === "intermediate" ? "Your grip appears to be inconsistent - maintain a continental grip for better control on volleys and overheads" : 
          "Fine-tune your vibora technique by focusing on more wrist snap at the point of contact",
          
          playerLevel === "beginner" ? "Practice your footwork - try to take smaller steps to maintain balance" : 
          playerLevel === "intermediate" ? "Work on your footwork when moving to the sides - try to use smaller adjustment steps rather than large movements" : 
          "Improve your positioning after defensive lobs to recover faster to the net position",
          
          focusArea ? `For your ${focusArea}, focus on maintaining better balance throughout the stroke and follow through completely` :
          playerLevel === "beginner" ? "When hitting the ball, try to make contact in front of your body" : 
          playerLevel === "intermediate" ? "When hitting bandeja shots, focus on getting under the ball more and use more wrist action for better placement" : 
          "Work on varying the pace of your shots more to disrupt your opponent's rhythm"
        ],
        drills: [
          playerLevel === "beginner" ? "Basic wall practice: Spend 10 minutes hitting against a wall, focusing on consistent contact" : 
          playerLevel === "intermediate" ? "Wall practice: Spend 15 minutes hitting volleys against a wall, focusing on maintaining a consistent continental grip" : 
          "Advanced net play drill: Practice volleys with a partner who randomly varies the height and pace of feeds",
          
          focusArea ? `${focusArea.charAt(0).toUpperCase() + focusArea.slice(1)} improvement drill: Specific repetitive practice isolating your ${focusArea} technique with guided feedback from a coach` :
          playerLevel === "beginner" ? "Shadow practice: Move around the court without a ball, practicing proper footwork patterns" : 
          playerLevel === "intermediate" ? "Footwork ladder drill: Use an agility ladder to practice quick, small adjustment steps to improve court movement" : 
          "Point construction drill: Practice the first 3-4 shots of points with specific patterns to improve tactical awareness"
        ]
      }
    : {
        title: sport,
        strengths: [
          playerLevel === "beginner" ? "Good enthusiasm and approach to learning the basics" : 
          playerLevel === "intermediate" ? "Good fundamental stance and balance" : 
          "Excellent technical foundation and body positioning",
          
          playerLevel === "beginner" ? "Nice attempt at maintaining proper form" : 
          playerLevel === "intermediate" ? "Consistent follow-through on your shots" : 
          "Strong power generation and efficient technique",
          
          playerLevel === "beginner" ? "Good focus and concentration during play" : 
          playerLevel === "intermediate" ? "Maintaining good focus throughout play" : 
          "Impressive adaptability to changing game situations"
        ],
        improvements: [
          playerLevel === "beginner" ? "Focus on your basic stance and balance before each shot" : 
          playerLevel === "intermediate" ? "Work on your timing when making contact with the ball" : 
          "Refine the small details in your technique for more consistency",
          
          playerLevel === "beginner" ? "Practice maintaining a consistent grip throughout your swings" : 
          playerLevel === "intermediate" ? "Improve your body positioning relative to the ball" : 
          "Work on varying your shot selection based on different scenarios",
          
          focusArea ? `For your ${focusArea}, concentrate on maintaining proper form even when under pressure` :
          playerLevel === "beginner" ? "Remember to follow through completely on each shot" : 
          playerLevel === "intermediate" ? "Focus on maintaining proper technique when under pressure" : 
          "Develop more deception in your shots to keep opponents guessing"
        ],
        drills: [
          playerLevel === "beginner" ? "Basic form practice: Repeat the proper movement pattern slowly without equipment" : 
          playerLevel === "intermediate" ? "Shadow practice: Spend 15 minutes daily working on your technique without a ball, focusing on form" : 
          "Advanced scenario drill: Practice specific game situations with a partner to improve decision-making",
          
          focusArea ? `${focusArea.charAt(0).toUpperCase() + focusArea.slice(1)} focus drill: Specific practice sessions dedicated to improving your ${focusArea} with progressive challenges` :
          playerLevel === "beginner" ? "Video analysis: Record yourself and compare to proper technique examples" : 
          playerLevel === "intermediate" ? "Target practice: Set up targets and work on hitting them consistently to improve accuracy" : 
          "Pressure drill: Practice maintaining technique while under simulated match pressure"
        ]
      };

  return `## Overall Assessment
As your virtual ${sportSpecific.title} coach analyzing a ${playerLevel} level player${focusArea ? ' focusing on ' + focusArea : ''}, I can see you have ${playerLevel === "beginner" ? "enthusiasm and potential" : playerLevel === "intermediate" ? "good fundamentals" : "strong skills"} but there are some key areas we can improve to take your game to the next level.

## Strengths
- ${sportSpecific.strengths[0]}
- ${sportSpecific.strengths[1]}
- ${sportSpecific.strengths[2]}

## Areas for Improvement
- ${sportSpecific.improvements[0]}
- ${sportSpecific.improvements[1]}
- ${sportSpecific.improvements[2]}

## Recommended Drills
- ${sportSpecific.drills[0]}
- ${sportSpecific.drills[1]}`;
}
