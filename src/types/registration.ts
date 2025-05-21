
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
    occupation: string; // This is still "occupation" in the database
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
