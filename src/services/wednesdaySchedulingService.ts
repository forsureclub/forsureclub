
import { supabase } from "@/integrations/supabase/client";
import { addDays, format, isWednesday, nextWednesday } from "date-fns";

export interface WednesdayBooking {
  id: string;
  club_id: string;
  court_id: string;
  player_email: string;
  player_name: string;
  start_time: string;
  end_time: string;
  booking_date: string;
}

export interface GroupBookingRequest {
  club_id: string;
  court_id: string;
  start_time: string;
  end_time: string;
  booking_date: string;
  group_name: string;
  organizer_email: string;
  player_emails: string[];
}

/**
 * Gets all Wednesday bookings for a player to enable reminders
 */
export async function getPlayerWednesdayBookings(playerEmail: string): Promise<WednesdayBooking[]> {
  try {
    const { data, error } = await supabase
      .from("court_bookings")
      .select(`
        id,
        club_id,
        court_id,
        player_email,
        player_name,
        start_time,
        end_time,
        booking_date
      `)
      .eq("player_email", playerEmail)
      .eq("status", "confirmed")
      .gte("booking_date", format(new Date(), "yyyy-MM-dd"));

    if (error) throw error;

    // Filter for Wednesday bookings
    const wednesdayBookings = data?.filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      return isWednesday(bookingDate);
    }) || [];

    return wednesdayBookings;
  } catch (error) {
    console.error("Error fetching Wednesday bookings:", error);
    throw error;
  }
}

/**
 * Creates a recurring Wednesday booking for the same time next week
 */
export async function rebookSameTimeNextWednesday(originalBookingId: string): Promise<string> {
  try {
    // Get the original booking details
    const { data: originalBooking, error: fetchError } = await supabase
      .from("court_bookings")
      .select("*")
      .eq("id", originalBookingId)
      .single();

    if (fetchError || !originalBooking) throw fetchError || new Error("Booking not found");

    // Calculate next Wednesday
    const originalDate = new Date(originalBooking.booking_date);
    const nextWednesdayDate = nextWednesday(originalDate);

    // Create new booking for next Wednesday
    const { data: newBooking, error: createError } = await supabase
      .from("court_bookings")
      .insert({
        club_id: originalBooking.club_id,
        court_id: originalBooking.court_id,
        start_time: originalBooking.start_time,
        end_time: originalBooking.end_time,
        booking_date: format(nextWednesdayDate, "yyyy-MM-dd"),
        total_price: originalBooking.total_price,
        player_name: originalBooking.player_name,
        player_email: originalBooking.player_email,
        player_phone: originalBooking.player_phone,
        status: "confirmed"
      })
      .select()
      .single();

    if (createError) throw createError;

    return newBooking.id;
  } catch (error) {
    console.error("Error rebooking for next Wednesday:", error);
    throw error;
  }
}

/**
 * Creates a group booking for Wednesday leagues
 */
export async function createWednesdayGroupBooking(request: GroupBookingRequest): Promise<string[]> {
  try {
    const bookingIds: string[] = [];

    // Create individual bookings for each player in the group
    for (const playerEmail of request.player_emails) {
      const { data: booking, error } = await supabase
        .from("court_bookings")
        .insert({
          club_id: request.club_id,
          court_id: request.court_id,
          start_time: request.start_time,
          end_time: request.end_time,
          booking_date: request.booking_date,
          total_price: 0, // Group bookings might have special pricing
          player_name: `${request.group_name} Member`,
          player_email: playerEmail,
          status: "confirmed"
        })
        .select()
        .single();

      if (error) throw error;
      bookingIds.push(booking.id);
    }

    return bookingIds;
  } catch (error) {
    console.error("Error creating group booking:", error);
    throw error;
  }
}

/**
 * Checks if a player should receive a Wednesday reminder
 */
export async function shouldSendWednesdayReminder(playerEmail: string): Promise<boolean> {
  try {
    const wednesdayBookings = await getPlayerWednesdayBookings(playerEmail);
    
    // Check if player has consistent Wednesday bookings (2+ in the past month)
    const pastMonth = addDays(new Date(), -30);
    const recentWednesdayBookings = wednesdayBookings.filter(booking => 
      new Date(booking.booking_date) >= pastMonth
    );

    return recentWednesdayBookings.length >= 2;
  } catch (error) {
    console.error("Error checking reminder eligibility:", error);
    return false;
  }
}
