
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EnhancedMatchmaker, EnhancedMatchingResult } from "@/services/matchmaking/enhancedMatchmaking";
import { MatchQualityIndicator } from "./MatchQualityIndicator";
import { Loader2, Users, Target, Gamepad2 } from "lucide-react";

interface EnhancedMatchmakingCardProps {
  selectedSport: string;
}

export const EnhancedMatchmakingCard = ({ selectedSport }: EnhancedMatchmakingCardProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [matchType, setMatchType] = useState<'competitive' | 'casual' | 'training'>('competitive');
  const [playerCount, setPlayerCount] = useState<number>(1);
  const [matchResult, setMatchResult] = useState<EnhancedMatchingResult | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFindMatch = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to find matches",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSearching(true);
      setMatchResult(null);

      // Get current player
      const { data: player, error: playerError } = await supabase
        .from("players")
        .select("*")
        .eq("email", user.email)
        .single();

      if (playerError || !player) {
        toast({
          title: "Profile Required",
          description: "Please complete your player profile first",
          variant: "destructive",
        });
        return;
      }

      setCurrentPlayer(player);

      // Get all players for matching
      const { data: allPlayers, error: playersError } = await supabase
        .from("players")
        .select("*");

      if (playersError) throw playersError;

      // Use enhanced matchmaking algorithm
      const result = await EnhancedMatchmaker.findEnhancedMatches(
        allPlayers || [],
        selectedSport,
        player.city,
        player.rating.toString(),
        player.gender,
        player.id,
        playerCount,
        matchType
      );

      setMatchResult(result);

      if (result.foundMatch) {
        toast({
          title: "🎾 Great Matches Found!",
          description: `Found ${result.matchedPlayers.length} high-quality match${result.matchedPlayers.length > 1 ? 'es' : ''} for you`,
        });
      } else {
        toast({
          title: "No Optimal Matches",
          description: "Try adjusting match type or expanding your search criteria",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("Enhanced matchmaking error:", error);
      toast({
        title: "Search Failed",
        description: "Unable to find matches at this time",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const getMatchTypeIcon = (type: string) => {
    switch (type) {
      case 'competitive': return <Target className="h-4 w-4" />;
      case 'casual': return <Users className="h-4 w-4" />;
      case 'training': return <Gamepad2 className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Enhanced Smart Matchmaking
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              AI-Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Match Type</label>
              <Select value={matchType} onValueChange={(value: 'competitive' | 'casual' | 'training') => setMatchType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="competitive" className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Competitive
                    </div>
                  </SelectItem>
                  <SelectItem value="casual" className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Casual
                    </div>
                  </SelectItem>
                  <SelectItem value="training" className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="h-4 w-4" />
                      Training
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {matchType === 'competitive' && "Strict skill matching for balanced competition"}
                {matchType === 'casual' && "Relaxed matching focused on fun and social play"}
                {matchType === 'training' && "Varied skill levels for learning opportunities"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Players Needed</label>
              <Select value={playerCount.toString()} onValueChange={(value) => setPlayerCount(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Player (Singles)</SelectItem>
                  <SelectItem value="3">3 Players (Doubles)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleFindMatch}
                disabled={isSearching}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  getMatchTypeIcon(matchType)
                )}
                {isSearching ? "Analyzing..." : "Find Smart Matches"}
              </Button>
            </div>
          </div>

          {currentPlayer && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">Your Profile</span>
              </div>
              <div className="text-xs text-blue-700">
                Rating: {currentPlayer.rating.toFixed(1)}/5.0 • {currentPlayer.city} • Looking for {matchType} matches
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {matchResult && (
        <div className="space-y-4">
          <MatchQualityIndicator 
            qualityMetrics={matchResult.qualityMetrics}
            confidenceLevel={matchResult.confidenceLevel}
            recommendedMatchType={matchResult.recommendedMatchType}
          />

          {matchResult.foundMatch && matchResult.matchedPlayers.length > 0 && (
            <div className="space-y-3">
              {matchResult.matchedPlayers.map((player, index) => (
                <Card key={player.id} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 font-semibold">
                            {player.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold">{player.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Rating: {player.rating.toFixed(1)}/5.0</span>
                            <span>•</span>
                            <span>{player.city}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800">
                          {matchResult.matchScore.toFixed(0)}% Match
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {matchResult.confidenceLevel} confidence
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
