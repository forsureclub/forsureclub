
import React from "react";
import { Trophy, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Achievement {
  type: "winner" | "runnerUp" | "semifinalist";
  tournamentName: string;
  date: string;
}

interface RecentAchievementsProps {
  achievements: Achievement[];
}

export const RecentAchievements = ({ achievements }: RecentAchievementsProps) => {
  if (!achievements || achievements.length === 0) {
    return null;
  }

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case "winner":
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case "runnerUp":
        return <Medal className="h-4 w-4 text-gray-400" />;
      case "semifinalist":
        return <Medal className="h-4 w-4 text-amber-700" />;
      default:
        return null;
    }
  };

  const getAchievementLabel = (type: string) => {
    switch (type) {
      case "winner":
        return "Winner";
      case "runnerUp":
        return "Runner-up";
      case "semifinalist":
        return "Semifinalist";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-2 mt-2">
      <h5 className="text-sm font-medium">Recent Achievements</h5>
      <div className="flex flex-wrap gap-2">
        {achievements.slice(0, 3).map((achievement, index) => (
          <Badge 
            key={index} 
            variant="outline"
            className="flex items-center gap-1 py-1"
          >
            {getAchievementIcon(achievement.type)}
            <span>
              {getAchievementLabel(achievement.type)}: {achievement.tournamentName}
            </span>
          </Badge>
        ))}
      </div>
    </div>
  );
};
