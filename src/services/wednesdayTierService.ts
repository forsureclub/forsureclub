
import { supabase } from "@/integrations/supabase/client";
import { addDays, subDays, startOfMonth, endOfMonth, differenceInMonths } from "date-fns";

export type WednesdayTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legend';

export interface PlayerTierStatus {
  currentTier: WednesdayTier;
  wednesdayCount: number;
  streakCount: number;
  monthsActive: number;
  totalWednesdays: number;
  nextTierProgress: number;
  seasonResetDate: string;
}

export interface TierBenefits {
  tier: WednesdayTier;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
  perks: string[];
  requirements: {
    wednesdaysThisMonth: number;
    minimumStreak: number;
    monthsActive?: number;
  };
}

const TIER_DEFINITIONS: TierBenefits[] = [
  {
    tier: 'bronze',
    name: 'Bronze Warrior',
    description: 'Welcome to Wednesday Warriors!',
    color: 'text-amber-700',
    bgColor: 'bg-gradient-to-r from-amber-100 to-amber-200',
    icon: '🥉',
    perks: [
      'Wednesday reminder notifications',
      'Basic leaderboard access',
      'Community access'
    ],
    requirements: {
      wednesdaysThisMonth: 1,
      minimumStreak: 1
    }
  },
  {
    tier: 'silver',
    name: 'Silver Champion',
    description: 'Consistent Wednesday warrior',
    color: 'text-gray-700',
    bgColor: 'bg-gradient-to-r from-gray-100 to-gray-200',
    icon: '🥈',
    perks: [
      'All Bronze perks',
      '5% discount on Wednesday bookings',
      'Priority booking 24h ahead',
      'Silver badge on profile'
    ],
    requirements: {
      wednesdaysThisMonth: 3,
      minimumStreak: 2
    }
  },
  {
    tier: 'gold',
    name: 'Gold Elite',
    description: 'Dedicated Wednesday player',
    color: 'text-yellow-700',
    bgColor: 'bg-gradient-to-r from-yellow-100 to-yellow-200',
    icon: '🥇',
    perks: [
      'All Silver perks',
      '10% discount on Wednesday bookings',
      'Free court upgrade when available',
      'Gold badge and profile frame',
      'Access to exclusive Wednesday events'
    ],
    requirements: {
      wednesdaysThisMonth: 4,
      minimumStreak: 3
    }
  },
  {
    tier: 'platinum',
    name: 'Platinum Master',
    description: 'Elite Wednesday warrior',
    color: 'text-purple-700',
    bgColor: 'bg-gradient-to-r from-purple-100 to-purple-200',
    icon: '💎',
    perks: [
      'All Gold perks',
      '15% discount on Wednesday bookings',
      'Priority customer support',
      'Platinum badge with animated effects',
      'Monthly coaching session credit',
      'VIP tournament access'
    ],
    requirements: {
      wednesdaysThisMonth: 4,
      minimumStreak: 4
    }
  },
  {
    tier: 'legend',
    name: 'Wednesday Legend',
    description: 'Legendary dedication to Wednesday play',
    color: 'text-orange-700',
    bgColor: 'bg-gradient-to-r from-orange-100 to-orange-200',
    icon: '👑',
    perks: [
      'All Platinum perks',
      '20% discount on all bookings',
      'Lifetime Wednesday Warrior status',
      'Legendary crown badge',
      'Personal concierge service',
      'Featured player spotlight',
      'Exclusive Legend-only events'
    ],
    requirements: {
      wednesdaysThisMonth: 4,
      minimumStreak: 6,
      monthsActive: 6
    }
  }
];

/**
 * Calculate player's current tier based on their Wednesday activity
 */
export async function calculatePlayerTier(playerEmail: string): Promise<PlayerTierStatus> {
  try {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const sixMonthsAgo = subDays(now, 180);

    // Get all Wednesday bookings for the player
    const { data: allBookings, error } = await supabase
      .from("court_bookings")
      .select("booking_date, created_at")
      .eq("player_email", playerEmail)
      .eq("status", "confirmed")
      .gte("booking_date", sixMonthsAgo.toISOString().split('T')[0])
      .order("booking_date", { ascending: true });

    if (error) throw error;

    // Filter for Wednesday bookings
    const wednesdayBookings = (allBookings || []).filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      return bookingDate.getDay() === 3; // Wednesday is day 3
    });

    // Calculate current month Wednesdays
    const thisMonthWednesdays = wednesdayBookings.filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      return bookingDate >= monthStart && bookingDate <= monthEnd;
    }).length;

    // Calculate current streak
    let currentStreak = 0;
    const sortedBookings = wednesdayBookings.sort((a, b) => 
      new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
    );

    if (sortedBookings.length > 0) {
      let expectedDate = new Date(sortedBookings[0].booking_date);
      
      for (const booking of sortedBookings) {
        const bookingDate = new Date(booking.booking_date);
        if (bookingDate.getTime() === expectedDate.getTime()) {
          currentStreak++;
          expectedDate = subDays(expectedDate, 7); // Previous Wednesday
        } else {
          break;
        }
      }
    }

    // Calculate months active
    const firstBooking = wednesdayBookings[0];
    const monthsActive = firstBooking 
      ? differenceInMonths(now, new Date(firstBooking.created_at)) + 1
      : 0;

    // Determine current tier
    let currentTier: WednesdayTier = 'bronze';
    
    for (let i = TIER_DEFINITIONS.length - 1; i >= 0; i--) {
      const tier = TIER_DEFINITIONS[i];
      const meetsWednesdayRequirement = thisMonthWednesdays >= tier.requirements.wednesdaysThisMonth;
      const meetsStreakRequirement = currentStreak >= tier.requirements.minimumStreak;
      const meetsMonthsRequirement = !tier.requirements.monthsActive || monthsActive >= tier.requirements.monthsActive;
      
      if (meetsWednesdayRequirement && meetsStreakRequirement && meetsMonthsRequirement) {
        currentTier = tier.tier;
        break;
      }
    }

    // Calculate next tier progress
    const currentTierIndex = TIER_DEFINITIONS.findIndex(t => t.tier === currentTier);
    const nextTier = TIER_DEFINITIONS[currentTierIndex + 1];
    let nextTierProgress = 100;

    if (nextTier) {
      const wednesdayProgress = (thisMonthWednesdays / nextTier.requirements.wednesdaysThisMonth) * 50;
      const streakProgress = (currentStreak / nextTier.requirements.minimumStreak) * 30;
      const monthsProgress = nextTier.requirements.monthsActive 
        ? (monthsActive / nextTier.requirements.monthsActive) * 20
        : 20;
      
      nextTierProgress = Math.min(100, wednesdayProgress + streakProgress + monthsProgress);
    }

    return {
      currentTier,
      wednesdayCount: thisMonthWednesdays,
      streakCount: currentStreak,
      monthsActive,
      totalWednesdays: wednesdayBookings.length,
      nextTierProgress: Math.round(nextTierProgress),
      seasonResetDate: endOfMonth(addDays(now, 90)).toISOString().split('T')[0] // Next quarter
    };
  } catch (error) {
    console.error("Error calculating player tier:", error);
    return {
      currentTier: 'bronze',
      wednesdayCount: 0,
      streakCount: 0,
      monthsActive: 0,
      totalWednesdays: 0,
      nextTierProgress: 0,
      seasonResetDate: endOfMonth(addDays(new Date(), 90)).toISOString().split('T')[0]
    };
  }
}

/**
 * Get tier benefits for a specific tier
 */
export function getTierBenefits(tier: WednesdayTier): TierBenefits {
  return TIER_DEFINITIONS.find(t => t.tier === tier) || TIER_DEFINITIONS[0];
}

/**
 * Get all tier definitions
 */
export function getAllTiers(): TierBenefits[] {
  return TIER_DEFINITIONS;
}

/**
 * Check if player qualifies for tier upgrade
 */
export function checkTierUpgrade(oldTier: WednesdayTier, newTier: WednesdayTier): boolean {
  const oldIndex = TIER_DEFINITIONS.findIndex(t => t.tier === oldTier);
  const newIndex = TIER_DEFINITIONS.findIndex(t => t.tier === newTier);
  return newIndex > oldIndex;
}
