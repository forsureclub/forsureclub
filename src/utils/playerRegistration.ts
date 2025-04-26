
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

  // Process email and phone number
  // Only use null if the values are empty, never use placeholder text
  const cleanEmail = email && email.trim() ? email.trim() : null;
  const cleanPhone = phoneNumber && phoneNumber.trim() ? phoneNumber.trim() : null;

  // Log the values being saved to help debug
  console.log("Saving player with email:", cleanEmail);
  console.log("Saving player with phone:", cleanPhone);

  const newPlayer = {
    name: playerName,
    sport: selectedSport,
    city: location,
    club: isClubMember ? clubName : null,
    occupation,
    gender,
    play_time: preferredDays,
    budget_range: spendingLevel,
    rating: 0,
    user_id: null,
    email: cleanEmail,
    phone_number: cleanPhone,
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
