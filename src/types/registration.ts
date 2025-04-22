
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
    occupation: string;
    city: string;
    email?: string | null;
    phone_number?: string | null;
    gender?: string;
    play_time?: string;
    budget_range?: string;
    club?: string | null;
  };
};
