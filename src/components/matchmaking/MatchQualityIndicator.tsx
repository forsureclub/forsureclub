
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MatchQualityMetrics } from "@/services/matchmaking/enhancedMatchmaking";
import { TrendingUp, TrendingDown, Minus, Target, Users, Gamepad2, Activity } from "lucide-react";

interface MatchQualityIndicatorProps {
  qualityMetrics: MatchQualityMetrics;
  confidenceLevel: 'high' | 'medium' | 'low';
  recommendedMatchType: 'competitive' | 'casual' | 'training';
  className?: string;
}

export const MatchQualityIndicator = ({
  qualityMetrics,
  confidenceLevel,
  recommendedMatchType,
  className = ""
}: MatchQualityIndicatorProps) => {
  const getConfidenceBadge = () => {
    const colors = {
      high: "bg-green-100 text-green-800 border-green-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-red-100 text-red-800 border-red-200"
    };

    const icons = {
      high: <TrendingUp className="h-3 w-3" />,
      medium: <Minus className="h-3 w-3" />,
      low: <TrendingDown className="h-3 w-3" />
    };

    return (
      <Badge className={`${colors[confidenceLevel]} flex items-center gap-1`}>
        {icons[confidenceLevel]}
        {confidenceLevel.charAt(0).toUpperCase() + confidenceLevel.slice(1)} Quality
      </Badge>
    );
  };

  const getMatchTypeBadge = () => {
    const colors = {
      competitive: "bg-blue-100 text-blue-800 border-blue-200",
      casual: "bg-purple-100 text-purple-800 border-purple-200",
      training: "bg-orange-100 text-orange-800 border-orange-200"
    };

    const icons = {
      competitive: <Target className="h-3 w-3" />,
      casual: <Users className="h-3 w-3" />,
      training: <Gamepad2 className="h-3 w-3" />
    };

    return (
      <Badge className={`${colors[recommendedMatchType]} flex items-center gap-1`}>
        {icons[recommendedMatchType]}
        {recommendedMatchType.charAt(0).toUpperCase() + recommendedMatchType.slice(1)}
      </Badge>
    );
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return "bg-green-500";
    if (value >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className={`border-l-4 ${confidenceLevel === 'high' ? 'border-l-green-500' : 
      confidenceLevel === 'medium' ? 'border-l-yellow-500' : 'border-l-red-500'} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-600" />
            <span className="font-semibold text-gray-900">Match Quality Analysis</span>
          </div>
          <div className="flex gap-2">
            {getConfidenceBadge()}
            {getMatchTypeBadge()}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Overall Quality</span>
            <span className="text-sm font-medium">{qualityMetrics.overallQuality.toFixed(0)}%</span>
          </div>
          <Progress 
            value={qualityMetrics.overallQuality} 
            className={`h-2 ${getProgressColor(qualityMetrics.overallQuality)}`}
          />

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Skill Balance</span>
                <span className="text-xs font-medium">{qualityMetrics.skillBalance.toFixed(0)}%</span>
              </div>
              <Progress value={qualityMetrics.skillBalance} className="h-1" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Experience</span>
                <span className="text-xs font-medium">{qualityMetrics.experienceBalance.toFixed(0)}%</span>
              </div>
              <Progress value={qualityMetrics.experienceBalance} className="h-1" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Compatibility</span>
                <span className="text-xs font-medium">{qualityMetrics.playStyleCompatibility.toFixed(0)}%</span>
              </div>
              <Progress value={qualityMetrics.playStyleCompatibility} className="h-1" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Recent Form</span>
                <span className="text-xs font-medium">{qualityMetrics.recentPerformanceBalance.toFixed(0)}%</span>
              </div>
              <Progress value={qualityMetrics.recentPerformanceBalance} className="h-1" />
            </div>
          </div>

          {qualityMetrics.overallQuality < 70 && (
            <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
              💡 Consider adjusting match type or expanding search criteria for better matches
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
