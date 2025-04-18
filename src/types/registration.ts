
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
  };
};
