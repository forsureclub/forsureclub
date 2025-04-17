
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
  preferredDays: 'weekdays' | 'weekends' | 'both';
  gender: 'male' | 'female' | 'other';
  email: string;
};
