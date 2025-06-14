
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { getDefaultElo } from "./eloSystem";

type Player = Tables<"players">;

export interface MatchQualityMetrics {
  skillBalance: number;
  experienceBalance: number;
  playStyleCompatibility: number;
  recentPerformanceBalance: number;
  overallQuality: number;
}

export interface EnhancedMatchingResult {
  matchedPlayers: Player[];
  foundMatch: boolean;
  matchScore: number;
  qualityMetrics: MatchQualityMetrics;
  confidenceLevel: 'high' | 'medium' | 'low';
  recommendedMatchType: 'competitive' | 'casual' | 'training';
}

/**
 * Enhanced AI matchmaking with dynamic skill tolerance and quality optimization
 */
export class EnhancedMatchmaker {
  private static readonly MAX_SKILL_TOLERANCE = 1.5;
  private static readonly MIN_SKILL_TOLERANCE = 0.3;
  private static readonly QUALITY_THRESHOLD = 75;

  /**
   * Find enhanced matches with dynamic skill tolerance and quality scoring
   */
  static async findEnhancedMatches(
    players: Player[],
    sport: string,
    location: string,
    skillLevel: string,
    gender: string,
    playerId: string,
    desiredPlayerCount: number = 1,
    matchType: 'competitive' | 'casual' | 'training' = 'competitive'
  ): Promise<EnhancedMatchingResult> {
    const initiatorPlayer = players.find(p => p.id === playerId);
    if (!initiatorPlayer) {
      return this.createEmptyResult();
    }

    // Get recent match history for performance analysis
    const recentMatches = await this.getRecentMatchHistory(playerId);
    const performanceTrend = this.calculatePerformanceTrend(recentMatches);

    // Dynamic skill tolerance based on match type and availability
    const skillTolerance = this.calculateDynamicSkillTolerance(
      players,
      initiatorPlayer,
      matchType,
      gender,
      location
    );

    // Filter potential matches with dynamic tolerance
    const potentialMatches = this.filterPotentialMatches(
      players,
      initiatorPlayer,
      gender,
      location,
      skillTolerance
    );

    if (potentialMatches.length === 0) {
      return this.createEmptyResult();
    }

    // Score and rank matches with enhanced metrics
    const scoredMatches = await this.scoreMatches(
      potentialMatches,
      initiatorPlayer,
      performanceTrend,
      matchType
    );

    // Select best matches with quality optimization
    const bestMatches = this.selectOptimalMatches(
      scoredMatches,
      desiredPlayerCount,
      matchType
    );

    return this.createEnhancedResult(bestMatches, matchType);
  }

  /**
   * Calculate dynamic skill tolerance based on context
   */
  private static calculateDynamicSkillTolerance(
    players: Player[],
    initiator: Player,
    matchType: 'competitive' | 'casual' | 'training',
    gender: string,
    location: string
  ): number {
    // Base tolerance by match type
    let baseTolerance = matchType === 'competitive' ? 0.5 : 
                       matchType === 'casual' ? 1.0 : 1.2;

    // Available players in area
    const localPlayers = players.filter(p => 
      p.gender === gender && 
      p.city === location && 
      p.id !== initiator.id
    );

    // Adjust based on player pool size
    if (localPlayers.length < 5) {
      baseTolerance = Math.min(baseTolerance * 1.5, this.MAX_SKILL_TOLERANCE);
    } else if (localPlayers.length > 20) {
      baseTolerance = Math.max(baseTolerance * 0.8, this.MIN_SKILL_TOLERANCE);
    }

    // Consider skill level - more tolerance for beginners
    if (initiator.rating < 2.0) {
      baseTolerance += 0.3;
    } else if (initiator.rating > 4.0) {
      baseTolerance -= 0.2;
    }

    return Math.max(this.MIN_SKILL_TOLERANCE, 
           Math.min(this.MAX_SKILL_TOLERANCE, baseTolerance));
  }

  /**
   * Filter potential matches with dynamic criteria
   */
  private static filterPotentialMatches(
    players: Player[],
    initiator: Player,
    gender: string,
    location: string,
    skillTolerance: number
  ): Player[] {
    return players.filter(player => 
      player.id !== initiator.id &&
      player.gender === gender &&
      player.city === location &&
      Math.abs(player.rating - initiator.rating) <= skillTolerance
    );
  }

  /**
   * Score matches with comprehensive quality metrics
   */
  private static async scoreMatches(
    potentialMatches: Player[],
    initiator: Player,
    performanceTrend: number,
    matchType: 'competitive' | 'casual' | 'training'
  ): Promise<Array<{ player: Player; qualityMetrics: MatchQualityMetrics; totalScore: number }>> {
    const scoredMatches = [];

    for (const player of potentialMatches) {
      const playerPerformanceTrend = await this.getPlayerPerformanceTrend(player.id);
      const qualityMetrics = this.calculateMatchQuality(
        initiator,
        player,
        performanceTrend,
        playerPerformanceTrend,
        matchType
      );

      const totalScore = this.calculateWeightedScore(qualityMetrics, matchType);

      scoredMatches.push({
        player,
        qualityMetrics,
        totalScore
      });
    }

    return scoredMatches.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Calculate comprehensive match quality metrics
   */
  private static calculateMatchQuality(
    player1: Player,
    player2: Player,
    trend1: number,
    trend2: number,
    matchType: 'competitive' | 'casual' | 'training'
  ): MatchQualityMetrics {
    // Skill balance (closer ratings = better)
    const skillDiff = Math.abs(player1.rating - player2.rating);
    const skillBalance = Math.max(0, 100 - (skillDiff * 30));

    // ELO balance
    const elo1 = player1.elo_rating || getDefaultElo();
    const elo2 = player2.elo_rating || getDefaultElo();
    const eloDiff = Math.abs(elo1 - elo2);
    const experienceBalance = Math.max(0, 100 - (eloDiff / 20));

    // Play style compatibility (simplified)
    const playStyleCompatibility = this.calculatePlayStyleCompatibility(player1, player2);

    // Recent performance balance
    const performanceDiff = Math.abs(trend1 - trend2);
    const recentPerformanceBalance = Math.max(0, 100 - (performanceDiff * 20));

    // Overall quality with match type weighting
    const weights = this.getQualityWeights(matchType);
    const overallQuality = (
      skillBalance * weights.skill +
      experienceBalance * weights.experience +
      playStyleCompatibility * weights.playStyle +
      recentPerformanceBalance * weights.performance
    ) / 100;

    return {
      skillBalance,
      experienceBalance,
      playStyleCompatibility,
      recentPerformanceBalance,
      overallQuality
    };
  }

  /**
   * Calculate play style compatibility
   */
  private static calculatePlayStyleCompatibility(player1: Player, player2: Player): number {
    // Simplified compatibility based on play_time preferences
    if (player1.play_time === player2.play_time) return 90;
    if (player1.play_time === 'both' || player2.play_time === 'both') return 80;
    return 70; // Different but compatible
  }

  /**
   * Get quality weights based on match type
   */
  private static getQualityWeights(matchType: 'competitive' | 'casual' | 'training') {
    switch (matchType) {
      case 'competitive':
        return { skill: 0.4, experience: 0.3, playStyle: 0.1, performance: 0.2 };
      case 'casual':
        return { skill: 0.3, experience: 0.2, playStyle: 0.3, performance: 0.2 };
      case 'training':
        return { skill: 0.2, experience: 0.3, playStyle: 0.2, performance: 0.3 };
      default:
        return { skill: 0.35, experience: 0.25, playStyle: 0.2, performance: 0.2 };
    }
  }

  /**
   * Calculate weighted total score
   */
  private static calculateWeightedScore(
    metrics: MatchQualityMetrics,
    matchType: 'competitive' | 'casual' | 'training'
  ): number {
    // Base score from overall quality
    let score = metrics.overallQuality;

    // Bonus for high skill balance in competitive matches
    if (matchType === 'competitive' && metrics.skillBalance > 85) {
      score += 10;
    }

    // Bonus for play style compatibility in casual matches
    if (matchType === 'casual' && metrics.playStyleCompatibility > 85) {
      score += 8;
    }

    return Math.min(100, score);
  }

  /**
   * Select optimal matches with diversity
   */
  private static selectOptimalMatches(
    scoredMatches: Array<{ player: Player; qualityMetrics: MatchQualityMetrics; totalScore: number }>,
    desiredCount: number,
    matchType: 'competitive' | 'casual' | 'training'
  ): Array<{ player: Player; qualityMetrics: MatchQualityMetrics; totalScore: number }> {
    if (scoredMatches.length === 0) return [];

    // For competitive matches, prioritize highest quality
    if (matchType === 'competitive') {
      return scoredMatches
        .filter(match => match.totalScore >= this.QUALITY_THRESHOLD)
        .slice(0, desiredCount);
    }

    // For casual/training, add some variety while maintaining quality
    const highQuality = scoredMatches.filter(match => match.totalScore >= this.QUALITY_THRESHOLD);
    const mediumQuality = scoredMatches.filter(match => 
      match.totalScore >= 60 && match.totalScore < this.QUALITY_THRESHOLD
    );

    const selected = [];
    const targetHigh = Math.ceil(desiredCount * 0.7);
    const targetMedium = desiredCount - targetHigh;

    selected.push(...highQuality.slice(0, targetHigh));
    if (selected.length < desiredCount) {
      selected.push(...mediumQuality.slice(0, targetMedium));
    }

    return selected.slice(0, desiredCount);
  }

  /**
   * Get recent match history for performance analysis
   */
  private static async getRecentMatchHistory(playerId: string): Promise<any[]> {
    try {
      const { data } = await supabase
        .from('match_players')
        .select('performance_rating, play_rating, created_at')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      return data || [];
    } catch (error) {
      console.error('Error fetching match history:', error);
      return [];
    }
  }

  /**
   * Calculate performance trend from recent matches
   */
  private static calculatePerformanceTrend(recentMatches: any[]): number {
    if (recentMatches.length < 2) return 0;

    const recent = recentMatches.slice(0, 3);
    const older = recentMatches.slice(3, 6);

    const recentAvg = recent.reduce((sum, match) => 
      sum + (match.performance_rating || 3), 0) / recent.length;
    const olderAvg = older.length > 0 ? 
      older.reduce((sum, match) => sum + (match.performance_rating || 3), 0) / older.length : recentAvg;

    return recentAvg - olderAvg; // Positive = improving, Negative = declining
  }

  /**
   * Get performance trend for a specific player
   */
  private static async getPlayerPerformanceTrend(playerId: string): Promise<number> {
    const matches = await this.getRecentMatchHistory(playerId);
    return this.calculatePerformanceTrend(matches);
  }

  /**
   * Create enhanced result with quality metrics
   */
  private static createEnhancedResult(
    bestMatches: Array<{ player: Player; qualityMetrics: MatchQualityMetrics; totalScore: number }>,
    matchType: 'competitive' | 'casual' | 'training'
  ): EnhancedMatchingResult {
    if (bestMatches.length === 0) {
      return this.createEmptyResult();
    }

    const topMatch = bestMatches[0];
    const avgQuality = bestMatches.reduce((sum, match) => sum + match.totalScore, 0) / bestMatches.length;

    const confidenceLevel: 'high' | 'medium' | 'low' = 
      avgQuality >= 85 ? 'high' : avgQuality >= 70 ? 'medium' : 'low';

    return {
      matchedPlayers: bestMatches.map(m => m.player),
      foundMatch: avgQuality >= 60,
      matchScore: avgQuality,
      qualityMetrics: topMatch.qualityMetrics,
      confidenceLevel,
      recommendedMatchType: matchType
    };
  }

  /**
   * Create empty result for no matches found
   */
  private static createEmptyResult(): EnhancedMatchingResult {
    return {
      matchedPlayers: [],
      foundMatch: false,
      matchScore: 0,
      qualityMetrics: {
        skillBalance: 0,
        experienceBalance: 0,
        playStyleCompatibility: 0,
        recentPerformanceBalance: 0,
        overallQuality: 0
      },
      confidenceLevel: 'low',
      recommendedMatchType: 'casual'
    };
  }
}
