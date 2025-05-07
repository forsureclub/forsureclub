
import { supabase } from "@/integrations/supabase/client";

export async function createOrFetchPlayer({
  playerName,
  selectedSport,
  location,
  clubName,
  isClubMember,
  occupation,
  gender,
  preferredDays,
  spendingLevel,
  email,
  phoneNumber
}: {
  playerName: string;
  selectedSport: string;
  location: string;
  clubName: string;
  isClubMember: boolean;
  occupation: string;
  gender: string;
  preferredDays: string;
  spendingLevel: string;
  email: string;
  phoneNumber: string;
}) {
  // Look for existing player by name and sport
  const { data: existingPlayers, error: findError } = await supabase
    .from('players')
    .select('id')
    .eq('name', playerName)
    .eq('sport', selectedSport);

  if (findError) {
    throw new Error(`Could not check for existing player: ${findError.message}`);
  }

  if (existingPlayers && existingPlayers.length > 0) {
    return existingPlayers[0].id;
  }

  // Transform empty strings to actual empty strings for storage in DB
  // This is critical to ensure consistency in data display
  const emailValue = email || "";
  const phoneValue = phoneNumber || "";

  // Log the values being saved
  console.log("Saving player with email:", emailValue || "empty string");
  console.log("Saving player with phone:", phoneValue || "empty string");

  const newPlayer = {
    name: playerName,
    sport: selectedSport,
    city: location,
    club: isClubMember ? clubName : "",
    occupation,
    gender,
    play_time: preferredDays,
    budget_range: spendingLevel,
    rating: 0,
    user_id: null,
    email: emailValue,
    phone_number: phoneValue,
  };

  const { data: insertedPlayer, error: playerError } = await supabase
    .from('players')
    .insert(newPlayer)
    .select()
    .single();

  if (playerError) {
    throw new Error(playerError.message);
  }

  return insertedPlayer.id;
}

export async function registerPlayer(playerId: string, selectedSport: string) {
  const { error: registrationError } = await supabase
    .from('player_registrations')
    .insert({
      player_id: playerId,
      status: 'pending',
      admin_notes: `Registered for ${selectedSport}`
    });

  if (registrationError) {
    throw new Error(registrationError.message);
  }
}

export async function updatePlayerSkillLevel(playerId: string, rating: number) {
  const { error } = await supabase
    .from('players')
    .update({ rating })
    .eq('id', playerId);

  if (error) {
    throw new Error(`Could not update player skill level: ${error.message}`);
  }
}

export async function getPlayersByLocation(location: string) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('city', location);

  if (error) {
    throw new Error(`Could not fetch players by location: ${error.message}`);
  }

  return data || [];
}

export async function getPlayersBySport(sport: string) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('sport', sport);

  if (error) {
    throw new Error(`Could not fetch players by sport: ${error.message}`);
  }

  return data || [];
}

export async function getPlayersBySkillLevel(sport: string, minRating: number, maxRating: number) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('sport', sport)
    .gte('rating', minRating)
    .lte('rating', maxRating);

  if (error) {
    throw new Error(`Could not fetch players by skill level: ${error.message}`);
  }

  return data || [];
}
