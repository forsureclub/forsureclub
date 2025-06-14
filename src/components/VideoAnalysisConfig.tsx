
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Settings, Target, Zap } from "lucide-react";

interface VideoAnalysisConfigProps {
  sport: string;
  playerLevel: string;
  focusArea: string;
  onConfigChange?: (config: { sport: string; playerLevel: string; focusArea: string }) => void;
}

const TECHNICAL_AREAS = {
  padel: [
    { value: "positioning", label: "Court Positioning", impact: "high" },
    { value: "grip", label: "Racket Grip", impact: "high" },
    { value: "footwork", label: "Footwork & Movement", impact: "high" },
    { value: "shot_selection", label: "Shot Selection", impact: "medium" },
    { value: "bandeja", label: "Bandeja Technique", impact: "medium" },
    { value: "wall_play", label: "Wall Play", impact: "medium" },
    { value: "net_coverage", label: "Net Coverage", impact: "medium" },
    { value: "vibora", label: "Vibora Shot", impact: "low" },
    { value: "smash", label: "Overhead Smash", impact: "medium" }
  ],
  tennis: [
    { value: "serve", label: "Serve Technique", impact: "high" },
    { value: "forehand", label: "Forehand", impact: "high" },
    { value: "backhand", label: "Backhand", impact: "high" },
    { value: "volley", label: "Volley", impact: "medium" },
    { value: "footwork", label: "Footwork", impact: "high" },
    { value: "return", label: "Return of Serve", impact: "medium" }
  ],
  golf: [
    { value: "swing", label: "Swing Mechanics", impact: "high" },
    { value: "stance", label: "Stance & Setup", impact: "high" },
    { value: "grip", label: "Grip", impact: "medium" },
    { value: "follow_through", label: "Follow Through", impact: "medium" },
    { value: "alignment", label: "Alignment", impact: "high" },
    { value: "weight_transfer", label: "Weight Transfer", impact: "medium" }
  ]
};

export const VideoAnalysisConfig = ({ sport, playerLevel, focusArea }: VideoAnalysisConfigProps) => {
  const technicalAreas = TECHNICAL_AREAS[sport] || TECHNICAL_AREAS.padel;
  
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case "high": return <Zap className="h-3 w-3" />;
      case "medium": return <Target className="h-3 w-3" />;
      default: return <Settings className="h-3 w-3" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          AI Analysis Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Sport</label>
            <div className="p-2 bg-blue-50 rounded-md">
              <span className="font-medium capitalize">{sport}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Skill Level</label>
            <div className="p-2 bg-blue-50 rounded-md">
              <span className="font-medium capitalize">{playerLevel}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Focus Area</label>
            <div className="p-2 bg-blue-50 rounded-md">
              <span className="font-medium">
                {focusArea ? technicalAreas.find(area => area.value === focusArea)?.label || focusArea : "General Analysis"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">AI Priority Areas for {sport.charAt(0).toUpperCase() + sport.slice(1)}</h4>
          <div className="text-xs text-gray-600 mb-3">
            Our AI will prioritize these technical areas based on your skill level and focus area:
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {technicalAreas.map((area, index) => (
              <div 
                key={area.value}
                className={`p-2 rounded-md border-2 transition-all ${
                  area.value === focusArea 
                    ? 'border-orange-300 bg-orange-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">#{index + 1}</span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getImpactColor(area.impact)} flex items-center gap-1`}
                  >
                    {getImpactIcon(area.impact)}
                    {area.impact}
                  </Badge>
                </div>
                <div className="text-sm font-medium">{area.label}</div>
                {area.value === focusArea && (
                  <div className="text-xs text-orange-600 mt-1">📍 Your Focus Area</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="font-medium text-sm mb-2">How Our AI Prioritizes</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <div>🎯 <strong>Impact Level:</strong> High-impact areas get priority for immediate improvement</div>
            <div>🏆 <strong>Skill Level:</strong> {playerLevel === 'beginner' ? 'Focuses on fundamentals' : playerLevel === 'intermediate' ? 'Emphasizes consistency and refinement' : 'Targets tactical precision'}</div>
            <div>📍 <strong>Focus Area:</strong> {focusArea ? 'Your selected focus area gets top priority' : 'General analysis covers all areas'}</div>
            <div>🔝 <strong>Output:</strong> Always returns exactly 2 priority areas with specific action steps</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
