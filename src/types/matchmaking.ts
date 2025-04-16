
export type PlayerProfile = {
  name: string;
  sport: string;
  abilityLevel: string;
  spendingLevel: '1' | '2' | '3';
  isClubMember: boolean;
  occupation: string;
  clubName: string;
  location: string;
  preferredDates: Date[];
  preferredTimes: string[];
};
