
import { supabase } from "@/integrations/supabase/client";

export interface PlayerRegistrationData {
  playerName: string;
  location: string;
  clubName: string;
  isClubMember: boolean;
  occupation: string; // We're keeping the field name in the data structure
  gender: string;
  preferredDays: string;
  spendingLevel: string;
  email: string;
  phoneNumber: string;
  initialRating?: number;
}

export const createOrFetchPlayer = async (data: PlayerRegistrationData): Promise<string> => {
  try {
    // Check if player already exists with this email
    const { data: existingPlayer, error: fetchError } = await supabase
      .from('players')
      .select('id')
      .eq('email', data.email)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (existingPlayer) {
      console.log("Player already exists, returning ID:", existingPlayer.id);
      return existingPlayer.id;
    }

    // Create new player - always set sport to "Padel"
    const { data: newPlayer, error: createError } = await supabase
      .from('players')
      .insert([
        {
          name: data.playerName,
          email: data.email || null,
          phone_number: data.phoneNumber || null,
          sport: "Padel",
          city: data.location,
          club: data.isClubMember ? data.clubName : null,
          occupation: data.occupation, // This field still exists in the database
          gender: data.gender,
          budget_range: data.spendingLevel,
          play_time: data.preferredDays,
          rating: data.initialRating || 2.5, // Default to 2.5 if not provided
        }
      ])
      .select('id')
      .single();

    if (createError) {
      throw createError;
    }

    console.log("New player created:", newPlayer.id);
    return newPlayer.id;
  } catch (error) {
    console.error("Error in createOrFetchPlayer:", error);
    throw error;
  }
};
