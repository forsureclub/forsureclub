
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
};

export const SKILL_LEVELS: SkillLevelDescription[] = [
  {
    level: 1,
    range: '1.0 to 1.49',
    description: 'Beginner'
  },
  {
    level: 2,
    range: '1.5 to 2.49',
    description: 'Beginner Advanced'
  },
  {
    level: 3,
    range: '2.5 to 3.49',
    description: 'Intermediate'
  },
  {
    level: 4,
    range: '3.5 to 4.49',
    description: 'Intermediate High'
  },
  {
    level: 5,
    range: '4.5 to 5.49',
    description: 'Intermediate Advanced'
  },
  {
    level: 6,
    range: '5.5 to 6.49',
    description: 'Competition'
  },
  {
    level: 7,
    range: '6.5 to 7.0',
    description: 'Professional'
  }
];

export function getSkillLevelDescription(skillLevel: number): string {
  if (!skillLevel) return 'Unrated';
  
  const level = SKILL_LEVELS.find(
    l => skillLevel >= parseFloat(l.range.split(' to ')[0]) && 
         skillLevel <= parseFloat(l.range.split(' to ')[1])
  );
  
  return level ? `${level.description} (${skillLevel})` : 'Unknown';
}
