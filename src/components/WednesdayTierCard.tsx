
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Crown, Star, Trophy, Award, Gem } from "lucide-react";
import { calculatePlayerTier, getTierBenefits, getAllTiers, PlayerTierStatus, WednesdayTier } from "@/services/wednesdayTierService";

interface WednesdayTierCardProps {
  playerEmail: string;
}

export const WednesdayTierCard = ({ playerEmail }: WednesdayTierCardProps) => {
  const [tierStatus, setTierStatus] = useState<PlayerTierStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (playerEmail) {
      loadTierStatus();
    }
  }, [playerEmail]);

  const loadTierStatus = async () => {
    try {
      setLoading(true);
      const status = await calculatePlayerTier(playerEmail);
      setTierStatus(status);
    } catch (error) {
      console.error("Error loading tier status:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (tier: WednesdayTier) => {
    switch (tier) {
      case 'bronze': return <Award className="h-5 w-5" />;
      case 'silver': return <Star className="h-5 w-5" />;
      case 'gold': return <Trophy className="h-5 w-5" />;
      case 'platinum': return <Gem className="h-5 w-5" />;
      case 'legend': return <Crown className="h-5 w-5" />;
      default: return <Award className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-20 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!tierStatus) {
    return null;
  }

  const currentTierBenefits = getTierBenefits(tierStatus.currentTier);
  const allTiers = getAllTiers();
  const currentTierIndex = allTiers.findIndex(t => t.tier === tierStatus.currentTier);
  const nextTier = allTiers[currentTierIndex + 1];

  return (
    <Card className={`border-2 ${currentTierBenefits.bgColor} border-opacity-50`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-xl ${currentTierBenefits.color} flex items-center gap-2`}>
            {getTierIcon(tierStatus.currentTier)}
            {currentTierBenefits.icon} {currentTierBenefits.name}
          </CardTitle>
          <Badge className={`${currentTierBenefits.color} bg-white/60`}>
            Tier {currentTierIndex + 1}/5
          </Badge>
        </div>
        <p className={`${currentTierBenefits.color} opacity-80`}>
          {currentTierBenefits.description}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/60 p-3 rounded-lg text-center">
            <div className={`text-2xl font-bold ${currentTierBenefits.color}`}>
              {tierStatus.wednesdayCount}
            </div>
            <div className="text-xs text-gray-600">This Month</div>
          </div>
          
          <div className="bg-white/60 p-3 rounded-lg text-center">
            <div className={`text-2xl font-bold ${currentTierBenefits.color}`}>
              {tierStatus.streakCount}
            </div>
            <div className="text-xs text-gray-600">Week Streak</div>
          </div>
          
          <div className="bg-white/60 p-3 rounded-lg text-center">
            <div className={`text-2xl font-bold ${currentTierBenefits.color}`}>
              {tierStatus.monthsActive}
            </div>
            <div className="text-xs text-gray-600">Months Active</div>
          </div>
          
          <div className="bg-white/60 p-3 rounded-lg text-center">
            <div className={`text-2xl font-bold ${currentTierBenefits.color}`}>
              {tierStatus.totalWednesdays}
            </div>
            <div className="text-xs text-gray-600">Total Played</div>
          </div>
        </div>

        {/* Next Tier Progress */}
        {nextTier && (
          <div className="bg-white/60 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                {getTierIcon(nextTier.tier)}
                Progress to {nextTier.name}
              </h4>
              <span className="text-sm font-medium">{tierStatus.nextTierProgress}%</span>
            </div>
            <Progress value={tierStatus.nextTierProgress} className="h-2 mb-2" />
            <div className="text-xs text-gray-600">
              <div>Need: {nextTier.requirements.wednesdaysThisMonth} Wednesdays/month, {nextTier.requirements.minimumStreak} week streak</div>
              {nextTier.requirements.monthsActive && (
                <div>{nextTier.requirements.monthsActive} months active</div>
              )}
            </div>
          </div>
        )}

        {/* Current Tier Perks */}
        <div className="bg-white/60 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3">Your Current Perks:</h4>
          <div className="space-y-2">
            {currentTierBenefits.perks.map((perk, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${currentTierBenefits.color.replace('text-', 'bg-')}`}></div>
                <span>{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Season Info */}
        <div className="bg-white/60 p-3 rounded-lg text-center">
          <div className="text-sm text-gray-600">
            Season resets: <span className="font-medium">{new Date(tierStatus.seasonResetDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Tier Ladder Preview */}
        <div className="bg-white/60 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3">Tier Ladder:</h4>
          <div className="space-y-2">
            {allTiers.map((tier, index) => (
              <div 
                key={tier.tier}
                className={`flex items-center gap-3 p-2 rounded ${
                  tier.tier === tierStatus.currentTier 
                    ? 'bg-white/80 border-2 border-current' 
                    : 'opacity-60'
                }`}
              >
                <span className="text-lg">{tier.icon}</span>
                <span className={`font-medium ${tier.color}`}>{tier.name}</span>
                {tier.tier === tierStatus.currentTier && (
                  <Badge variant="secondary" className="ml-auto">Current</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
