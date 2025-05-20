
export type PlayerProfile = {
  name: string;
  sport: string;
  abilityLevel: string;
  spendingLevel: '1' | '2' | '3';
  isClubMember: boolean;
  occupation: string;
  clubName: string;
  location: string;
  preferredTimes: string[];
  preferredDays?: 'weekdays' | 'weekends' | 'both'; // Made optional
  gender: 'male' | 'female' | 'other';
  email: string;
  phoneNumber?: string;
  eloRating?: number; // Added ELO rating field
  skillLevel?: number; // Added skill level field
};

export interface EloRatingChange {
  oldRating: number;
  newRating: number;
  change: number;
}

export type SkillLevelDescription = {
  level: number;
  range: string;
  description: string;
  category?: string;
};

export const SKILL_LEVELS: SkillLevelDescription[] = [
  {
    level: 0,
    range: '0.0',
    description: 'Has never played any racket sports.',
    category: 'INITIATION'
  },
  {
    level: 0.5,
    range: '0.5',
    description: 'No classes. Less than 6 months playing. No technique or tactics.',
    category: 'INITIATION'
  },
  {
    level: 1,
    range: '1.0',
    description: 'No classes or only few. Less than 12 months playing. No technique or tactics.',
    category: 'INITIATION'
  },
  {
    level: 1.5,
    range: '1.5',
    description: 'Few classes. A couple of games a month. Rally and return at low speed.',
    category: 'INITIATION/INTERMEDIATE'
  },
  {
    level: 2,
    range: '2.0',
    description: 'Few classes. At least 1 year of play. A couple of games a month. Rally and return at low speed.',
    category: 'INITIATION/INTERMEDIATE'
  },
  {
    level: 2.5,
    range: '2.5',
    description: 'Has almost mastered most of the strokes and controls the directions at a normal pace.',
    category: 'INTERMEDIATE'
  },
  {
    level: 3,
    range: '3.0',
    description: 'Dominates most strokes, plays flat and drives the ball. Makes many unforced errors.',
    category: 'INTERMEDIATE'
  },
  {
    level: 3.5,
    range: '3.5',
    description: 'Dominates most strokes. Can play slice forehand, slice backhand and flat. Can direct the ball correctly. Makes a lot of unforced errors.',
    category: 'INTERMEDIATE'
  },
  {
    level: 4,
    range: '4.0',
    description: 'Masters most strokes. Controls the directions. Is able to play slice forehand, slice backhand or flat and direct the ball. Makes a few unforced errors.',
    category: 'INTERMEDIATE HIGH'
  },
  {
    level: 4.5,
    range: '4.5',
    description: 'Masters the stroke. Controls the directions. Is able to play slice forehand, slice backhand or flat and direct the ball where wanted. Puts the ball at speed but has difficulties finishing points.',
    category: 'INTERMEDIATE HIGH'
  },
  {
    level: 5,
    range: '5.0',
    description: 'Medium technique and high tactical mindset. Is ready to play matches with good pace.',
    category: 'INTERMEDIATE ADVANCED'
  },
  {
    level: 5.5,
    range: '5.5',
    description: 'Dominates technical and tactical skills. Prepared to play matches at high pace.',
    category: 'ADVANCED'
  },
  {
    level: 6,
    range: '6.0',
    description: 'Advanced technical and tactical skills with good control. Plays difficult volleys, hard hitting with control, manages to read the game.',
    category: 'ADVANCED'
  },
  {
    level: 7,
    range: '7.0',
    description: 'Professional player. Top 30 WPT',
    category: 'ELITE'
  }
];

export function getSkillLevelDescription(skillLevel: number): string {
  if (!skillLevel && skillLevel !== 0) return 'Unrated';
  
  // Find the exact level match
  const level = SKILL_LEVELS.find(l => l.level === skillLevel);
  
  if (level) {
    return `${level.category} (${level.level})`;
  }
  
  // If no exact match, find the closest level below
  const closestLevel = SKILL_LEVELS.filter(l => l.level <= skillLevel)
    .sort((a, b) => b.level - a.level)[0];
  
  return closestLevel ? `${closestLevel.category} (${skillLevel})` : 'Unknown';
}
