
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Match = Tables<"matches">;
type Player = Tables<"players">;
type BookingSlot = {
  date: string;
  startTime: string;
  endTime: string;
  facilityId: string;
  courtId: string;
  price: number;
  available: boolean;
  bookingUrl: string;
};

/**
 * Retrieves available court slots from the Matchi API
 */
export async function getAvailableCourts(
  facilityId: string,
  date: string
): Promise<BookingSlot[]> {
  try {
    const { data, error } = await supabase.functions.invoke("matchi-booking", {
      body: { 
        action: "getAvailableSlots",
        facilityId,
        date
      },
    });

    if (error) {
      console.error("Error getting available slots:", error);
      throw new Error(`Error getting available slots: ${error.message}`);
    }

    return data.slots.map((slot: any) => ({
      date: slot.date,
      startTime: slot.start_time,
      endTime: slot.end_time,
      facilityId: slot.facility_id,
      courtId: slot.court_id,
      price: slot.price,
      available: slot.available,
      bookingUrl: slot.booking_url
    }));
  } catch (error) {
    console.error("Failed to get available courts:", error);
    throw error;
  }
}

/**
 * Books a court at the specified facility
 */
export async function bookCourt(
  facilityId: string,
  date: string,
  startTime: string,
  endTime: string,
  playerIds: string[]
): Promise<{bookingId: string, success: boolean}> {
  try {
    const { data, error } = await supabase.functions.invoke("matchi-booking", {
      body: {
        action: "bookCourt",
        facilityId,
        date,
        startTime,
        endTime,
        playerIds
      },
    });

    if (error) {
      console.error("Error booking court:", error);
      throw new Error(`Error booking court: ${error.message}`);
    }

    // Update the match with booking details
    if (data.booking && data.booking.id) {
      await updateMatchWithBooking(data.booking.id, data.booking);
    }

    return {
      bookingId: data.booking.id,
      success: true
    };
  } catch (error) {
    console.error("Failed to book court:", error);
    throw error;
  }
}

/**
 * Confirms a match when all players have accepted
 */
export async function confirmMatch(matchId: string, playerIds: string[]): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("matchi-booking", {
      body: {
        action: "confirmMatch",
        matchId,
        playerIds
      },
    });

    if (error) {
      console.error("Error confirming match:", error);
      throw new Error(`Error confirming match: ${error.message}`);
    }

    return data.success;
  } catch (error) {
    console.error("Failed to confirm match:", error);
    throw error;
  }
}

/**
 * Updates a match with booking details
 */
async function updateMatchWithBooking(matchId: string, bookingDetails: any): Promise<void> {
  try {
    const { error } = await supabase
      .from("matches")
      .update({
        booking_id: bookingDetails.id,
        booking_details: bookingDetails,
        status: "booked"
      })
      .eq("id", matchId);

    if (error) {
      console.error("Error updating match with booking:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to update match with booking:", error);
    throw error;
  }
}

/**
 * Checks if all players have confirmed a match
 */
export async function checkAllPlayersConfirmed(matchId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("match_players")
      .select("has_confirmed")
      .eq("match_id", matchId);

    if (error) {
      console.error("Error checking player confirmations:", error);
      throw error;
    }

    // Return true only if all players have confirmed
    return data.every(player => player.has_confirmed);
  } catch (error) {
    console.error("Failed to check player confirmations:", error);
    throw error;
  }
}
