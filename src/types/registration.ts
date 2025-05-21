
export type Registration = {
  id: string;
  player_id: string;
  admin_notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  player: {
    name: string;
    sport: string;
    industry: string; // Changed from occupation
    city: string;
    email: string;
    phone_number: string;
    gender: string;
    play_time: string;
    budget_range: string;
    club: string;
    rating?: number;
  };
};
