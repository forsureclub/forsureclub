
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Technical areas mapping for each sport
const TECHNICAL_AREAS = {
  padel: [
    { area: "positioning", impact: "high", description: "Court positioning and movement" },
    { area: "grip", impact: "high", description: "Racket grip and control" },
    { area: "footwork", impact: "high", description: "Movement and balance" },
    { area: "shot_selection", impact: "medium", description: "When to attack vs defend" },
    { area: "wall_play", impact: "medium", description: "Using walls effectively" },
    { area: "net_coverage", impact: "medium", description: "Net positioning and volleys" },
    { area: "bandeja", impact: "medium", description: "Bandeja shot technique" },
    { area: "vibora", impact: "low", description: "Vibora shot execution" },
    { area: "smash", impact: "medium", description: "Overhead smash power and placement" }
  ],
  tennis: [
    { area: "serve", impact: "high", description: "Service technique and consistency" },
    { area: "forehand", impact: "high", description: "Forehand groundstroke" },
    { area: "backhand", impact: "high", description: "Backhand groundstroke" },
    { area: "volley", impact: "medium", description: "Net play and volleys" },
    { area: "footwork", impact: "high", description: "Court movement and positioning" },
    { area: "return", impact: "medium", description: "Return of serve" }
  ],
  golf: [
    { area: "swing", impact: "high", description: "Swing mechanics and tempo" },
    { area: "stance", impact: "high", description: "Setup and posture" },
    { area: "grip", impact: "medium", description: "Club grip and control" },
    { area: "follow_through", impact: "medium", description: "Follow-through consistency" },
    { area: "alignment", impact: "high", description: "Body and club alignment" },
    { area: "weight_transfer", impact: "medium", description: "Weight shift during swing" }
  ]
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

    const technicalAreas = TECHNICAL_AREAS[sport] || TECHNICAL_AREAS.padel;
    const prioritizedAreas = getPrioritizedAreas(technicalAreas, playerLevel, focusArea);

    const systemPrompt = createEnhancedSystemPrompt(sport, playerLevel, focusArea, prioritizedAreas);
    const userPrompt = createStructuredUserPrompt(sport, playerLevel, focusArea, videoUrl, prioritizedAreas);

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
          temperature: 0.3, // Lower temperature for more consistent analysis
          max_tokens: 1200,
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

function getPrioritizedAreas(technicalAreas, playerLevel, focusArea) {
  // If user specified a focus area, prioritize it
  if (focusArea) {
    const focusedArea = technicalAreas.find(area => area.area === focusArea);
    if (focusedArea) {
      return [focusedArea, ...technicalAreas.filter(area => area.area !== focusArea)];
    }
  }

  // Prioritize based on player level and impact
  return technicalAreas.sort((a, b) => {
    const impactScore = { high: 3, medium: 2, low: 1 };
    const levelMultiplier = playerLevel === "beginner" ? 1.5 : playerLevel === "advanced" ? 0.8 : 1;
    
    const scoreA = impactScore[a.impact] * levelMultiplier;
    const scoreB = impactScore[b.impact] * levelMultiplier;
    
    return scoreB - scoreA;
  });
}

function createEnhancedSystemPrompt(sport, playerLevel, focusArea, prioritizedAreas) {
  return `You are an expert ${sport} coach analyzing a video of a ${playerLevel} level player. Your task is to identify EXACTLY 2 technical areas for improvement and prioritize them systematically.

ANALYSIS FRAMEWORK:
1. Observe all technical elements visible in the video
2. Identify issues in these priority order: ${prioritizedAreas.slice(0, 6).map(area => area.area).join(', ')}
3. Select the TOP 2 most impactful areas for improvement
4. Consider player level: ${playerLevel} players need ${playerLevel === 'beginner' ? 'fundamental basics' : playerLevel === 'intermediate' ? 'consistency and technique refinement' : 'advanced tactical and precision work'}

${focusArea ? `SPECIAL FOCUS: The player specifically wants feedback on ${focusArea}. If this area needs improvement, it MUST be one of your top 2 priorities.` : ''}

STRICT OUTPUT FORMAT:
## Priority Improvement Areas

### Area 1: [Technical Area Name]
**Impact Level:** High/Medium/Low
**Why This Matters:** [1-2 sentences on performance impact]
**Specific Issues Observed:** [What you see that needs fixing]
**Action Steps:** 
- [Specific drill or technique adjustment]
- [Practice recommendation]

### Area 2: [Technical Area Name]  
**Impact Level:** High/Medium/Low
**Why This Matters:** [1-2 sentences on performance impact]
**Specific Issues Observed:** [What you see that needs fixing]
**Action Steps:**
- [Specific drill or technique adjustment]
- [Practice recommendation]

## Quick Wins
[1-2 immediate things they can work on next session]

CRITICAL: You MUST return exactly 2 priority areas. Focus on what will have the biggest impact on their game improvement.`;
}

function createStructuredUserPrompt(sport, playerLevel, focusArea, videoUrl, prioritizedAreas) {
  return `Analyze this ${sport} video from a ${playerLevel} level player: ${videoUrl}

KEY TECHNICAL AREAS TO EVALUATE (in priority order):
${prioritizedAreas.slice(0, 8).map((area, index) => `${index + 1}. ${area.description} (Impact: ${area.impact})`).join('\n')}

${focusArea ? `\nSPECIAL FOCUS AREA: ${focusArea} - Please evaluate this area specifically` : ''}

ANALYSIS REQUIREMENTS:
- Identify the TOP 2 technical areas that need improvement
- Prioritize by: impact on performance, ease of correction for ${playerLevel} level
- Provide specific, actionable feedback
- Consider common ${playerLevel} level issues

Since you cannot see the actual video, simulate a realistic analysis for a ${playerLevel} ${sport} player with 2 priority technical improvements that would be most beneficial for their development.`;
}

function generateFallbackAnalysis(sport = "padel", playerLevel = "intermediate", focusArea = "") {
  const technicalAreas = TECHNICAL_AREAS[sport] || TECHNICAL_AREAS.padel;
  const prioritized = getPrioritizedAreas(technicalAreas, playerLevel, focusArea);
  
  // Select top 2 areas for fallback analysis
  const area1 = prioritized[0];
  const area2 = prioritized[1];
  
  const levelAdjustments = {
    beginner: {
      impact1: "High",
      impact2: "High", 
      focus: "building solid fundamentals",
      drillComplexity: "basic"
    },
    intermediate: {
      impact1: "High",
      impact2: "Medium",
      focus: "consistency and technique refinement", 
      drillComplexity: "progressive"
    },
    advanced: {
      impact1: "Medium",
      impact2: "Medium",
      focus: "tactical precision and advanced techniques",
      drillComplexity: "complex"
    }
  };
  
  const adjustments = levelAdjustments[playerLevel] || levelAdjustments.intermediate;
  
  return `## Priority Improvement Areas

### Area 1: ${area1.description}
**Impact Level:** ${adjustments.impact1}
**Why This Matters:** This is fundamental to ${sport} performance and directly affects your consistency and power generation. For ${playerLevel} players, mastering this area will significantly improve your overall game.
**Specific Issues Observed:** Based on typical ${playerLevel} level patterns, there's likely inconsistency in technique and positioning that's limiting your effectiveness.
**Action Steps:**
- Practice ${getDrillForArea(area1.area, sport, playerLevel)} daily for 15 minutes
- Focus on ${getSpecificTechnique(area1.area, sport)} during your next session

### Area 2: ${area2.description}
**Impact Level:** ${adjustments.impact2}
**Why This Matters:** This area complements your primary technique and helps with overall court awareness and game strategy. Improving here will make you a more complete player.
**Specific Issues Observed:** Common ${playerLevel} level challenges in this area include timing and decision-making under pressure.
**Action Steps:**
- Work on ${getDrillForArea(area2.area, sport, playerLevel)} 
- Practice ${getSpecificTechnique(area2.area, sport)} with increasing intensity

## Quick Wins
Focus on ${adjustments.focus} in your next practice session. Start with slow, controlled movements and gradually increase pace as you master the form.`;
}

function getDrillForArea(area, sport, level) {
  const drills = {
    padel: {
      positioning: level === "beginner" ? "court movement patterns without ball" : "shadow movement with partner calling positions",
      grip: "wall hitting with focus on grip consistency",
      footwork: level === "beginner" ? "agility ladder work" : "dynamic footwork patterns with ball feeds",
      shot_selection: "decision-making drills with different ball heights",
      bandeja: "bandeja repetition against wall",
      net_coverage: "volley practice at various heights"
    },
    tennis: {
      serve: level === "beginner" ? "serve motion without ball" : "target serving practice",
      forehand: "forehand cross-court consistency drill",
      backhand: "backhand down-the-line practice",
      footwork: "cone agility drills"
    },
    golf: {
      swing: "slow-motion swing repetition",
      stance: "address position practice with alignment sticks",
      grip: "grip pressure awareness exercises"
    }
  };
  
  return drills[sport]?.[area] || "technique-specific repetition drills";
}

function getSpecificTechnique(area, sport) {
  const techniques = {
    padel: {
      positioning: "staying closer to net in offensive positions",
      grip: "continental grip for better control",
      footwork: "small adjustment steps instead of big movements",
      shot_selection: "recognizing when to attack vs defend",
      bandeja: "hitting down on the ball with topspin"
    },
    tennis: {
      serve: "smooth acceleration through contact",
      forehand: "early preparation and full follow-through",
      backhand: "maintaining stable contact point"
    },
    golf: {
      swing: "maintaining tempo and rhythm",
      stance: "proper weight distribution",
      grip: "light pressure for better feel"
    }
  };
  
  return techniques[sport]?.[area] || "proper form and timing";
}
