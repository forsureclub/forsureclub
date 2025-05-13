
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { DatePicker } from "./ui/date-picker";
import { getAvailableCourts, bookCourt, confirmMatch, checkAllPlayersConfirmed } from "@/services/courtBookingService";
import { Loader2, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

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

interface CourtBookingProps {
  matchId: string;
  sport: string;
  location: string;
  playerIds: string[];
}

export const CourtBooking = ({ matchId, sport, location, playerIds }: CourtBookingProps) => {
  const [loading, setLoading] = useState(false);
  const [bookingSlots, setBookingSlots] = useState<BookingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [confirming, setConfirming] = useState(false);
  const [allConfirmed, setAllConfirmed] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Facility mapping - in a real app, this could come from an API or configuration
  const facilityMap: {[key: string]: string} = {
    "Stockholm": "facility-123",
    "Gothenburg": "facility-456",
    "Malmö": "facility-789",
    // Add more locations as needed
  };

  // Map the location to a facility ID
  const facilityId = facilityMap[location] || "facility-123"; // Default to Stockholm facility

  useEffect(() => {
    // Check if all players have confirmed
    const checkConfirmations = async () => {
      try {
        const confirmed = await checkAllPlayersConfirmed(matchId);
        setAllConfirmed(confirmed);
      } catch (error) {
        console.error("Error checking confirmations:", error);
      }
    };

    checkConfirmations();
  }, [matchId]);

  // Load available slots for the selected date
  useEffect(() => {
    if (!selectedDate) return;

    const fetchSlots = async () => {
      setLoading(true);
      try {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        const slots = await getAvailableCourts(facilityId, formattedDate);
        
        // Filter for the current sport if needed
        const filteredSlots = sport.toLowerCase() === "padel" 
          ? slots 
          : slots.filter(slot => slot.bookingUrl.toLowerCase().includes(sport.toLowerCase()));
        
        setBookingSlots(filteredSlots);
      } catch (error: any) {
        toast({
          title: "Failed to load available slots",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [selectedDate, facilityId, sport, toast]);

  // Confirm player's participation in the match
  const handleConfirm = async () => {
    if (!user) return;
    
    setConfirming(true);
    try {
      const { error } = await supabase
        .from("match_players")
        .update({ has_confirmed: true })
        .eq("match_id", matchId)
        .eq("player_id", user.id);

      if (error) throw error;

      toast({
        title: "Confirmation successful",
        description: "You have confirmed your participation in this match.",
      });

      // Check if all players have confirmed now
      const confirmed = await checkAllPlayersConfirmed(matchId);
      setAllConfirmed(confirmed);
      
      if (confirmed) {
        toast({
          title: "All players confirmed!",
          description: "Now you can book a court for this match.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Confirmation failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setConfirming(false);
    }
  };

  // Book the selected court
  const handleBooking = async () => {
    if (!selectedSlot || !allConfirmed) return;
    
    setLoading(true);
    try {
      // First confirm the match in our system
      await confirmMatch(matchId, playerIds);
      
      // Then book the court
      const result = await bookCourt(
        selectedSlot.facilityId,
        selectedSlot.date,
        selectedSlot.startTime,
        selectedSlot.endTime,
        playerIds
      );

      if (result.success) {
        setBookingComplete(true);
        toast({
          title: "Booking successful!",
          description: `Your ${sport} court has been booked for ${selectedSlot.date} at ${selectedSlot.startTime}.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (bookingComplete) {
    return (
      <Card className="p-6 bg-white shadow-lg rounded-xl max-w-md w-full">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h2>
          <p className="text-gray-600">
            Your {sport} court has been booked at {location}.
          </p>
          <div className="bg-green-50 p-4 rounded-lg text-left">
            <p className="font-medium text-green-800 mb-2">Booking Details:</p>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Date: {selectedSlot?.date}</li>
              <li>• Time: {selectedSlot?.startTime} - {selectedSlot?.endTime}</li>
              <li>• Location: {location}</li>
              <li>• Sport: {sport}</li>
              <li>• Players: {playerIds.length}</li>
            </ul>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white shadow-lg rounded-xl max-w-md w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Book {sport} Court</h2>
      
      {!allConfirmed ? (
        <div className="space-y-4">
          <p className="text-gray-600">
            All players need to confirm before booking a court.
          </p>
          <Button 
            onClick={handleConfirm} 
            disabled={confirming}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {confirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              "Confirm Your Participation"
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">
            All players have confirmed! Select a date and time to book your {sport} court.
          </p>
          
          <div className="mb-4">
            <Label className="text-sm font-medium text-gray-700">Select Date</Label>
            <div className="mt-1">
              <DatePicker
                date={selectedDate}
                setDate={setSelectedDate}
                className="w-full"
              />
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : bookingSlots.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Available Slots</h3>
              <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                <ul className="space-y-2">
                  {bookingSlots.map((slot, index) => (
                    <li 
                      key={index}
                      className={`p-3 rounded-md border ${
                        selectedSlot === slot 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={`slot-${index}`}
                          checked={selectedSlot === slot}
                          onCheckedChange={() => setSelectedSlot(slot === selectedSlot ? null : slot)}
                          className="mt-1"
                        />
                        <div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                            <span className="text-sm font-medium">{slot.date}</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <Clock className="h-4 w-4 mr-1 text-gray-500" />
                            <span className="text-sm">{slot.startTime} - {slot.endTime}</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Price: ${slot.price}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Button
                onClick={handleBooking}
                disabled={!selectedSlot || loading}
                className="w-full bg-orange-600 hover:bg-orange-700 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Book Court"
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No available slots found for this date. Please try another date.
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
