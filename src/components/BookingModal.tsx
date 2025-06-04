
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, addHours } from "date-fns";

interface BookingModalProps {
  club: any;
  onClose: () => void;
}

export const BookingModal = ({ club, onClose }: BookingModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCourt, setSelectedCourt] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [playerInfo, setPlayerInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const timeSlots = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00", "21:00", "22:00"
  ];

  const handleBooking = async () => {
    if (!selectedCourt || !selectedTime || !playerInfo.name || !playerInfo.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const startTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":").map(Number);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = addHours(startTime, 1);

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from("court_bookings")
        .insert({
          club_id: club.id,
          court_id: selectedCourt,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          booking_date: selectedDate.toISOString().split('T')[0],
          total_price: club.price_per_hour,
          player_name: playerInfo.name,
          player_email: playerInfo.email,
          player_phone: playerInfo.phone,
          status: 'confirmed'
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Store player contact information for the club
      await supabase
        .from("player_contacts")
        .insert({
          club_id: club.id,
          booking_id: booking.id,
          player_name: playerInfo.name,
          email: playerInfo.email,
          phone: playerInfo.phone,
        });

      toast({
        title: "Booking Confirmed!",
        description: `Court booked for ${format(startTime, "MMM d, yyyy 'at' h:mm a")}`,
      });

      onClose();
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: "Unable to complete booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book a Padel Court at {club.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Selection */}
          <div>
            <Label>Select Date</Label>
            <DatePicker
              date={selectedDate}
              onDateChange={(date) => setSelectedDate(date || new Date())}
            />
          </div>

          {/* Court Selection */}
          <div>
            <Label>Select Court</Label>
            <Select value={selectedCourt} onValueChange={setSelectedCourt}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a court" />
              </SelectTrigger>
              <SelectContent>
                {club.courts?.map((court: any) => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Selection */}
          <div>
            <Label>Select Time</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Player Information */}
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium">Player Information</h4>
            
            <div>
              <Label htmlFor="playerName">Full Name *</Label>
              <Input
                id="playerName"
                value={playerInfo.name}
                onChange={(e) => setPlayerInfo({ ...playerInfo, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="playerEmail">Email *</Label>
              <Input
                id="playerEmail"
                type="email"
                value={playerInfo.email}
                onChange={(e) => setPlayerInfo({ ...playerInfo, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="playerPhone">Phone Number</Label>
              <Input
                id="playerPhone"
                type="tel"
                value={playerInfo.phone}
                onChange={(e) => setPlayerInfo({ ...playerInfo, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Booking Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Booking Summary</h4>
            <p className="text-sm text-gray-600">
              Date: {format(selectedDate, "MMM d, yyyy")}
            </p>
            <p className="text-sm text-gray-600">
              Time: {selectedTime || "Not selected"}
            </p>
            <p className="text-sm text-gray-600">
              Duration: 1 hour
            </p>
            <p className="text-sm font-medium">
              Total: £{club.price_per_hour}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleBooking}
              disabled={loading}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {loading ? "Booking..." : "Confirm Booking"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
