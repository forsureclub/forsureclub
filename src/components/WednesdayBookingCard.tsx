
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Calendar, Repeat, Users, Bell, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { rebookSameTimeNextWednesday, createWednesdayGroupBooking, GroupBookingRequest } from "@/services/wednesdaySchedulingService";
import { format, nextWednesday } from "date-fns";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface WednesdayBookingCardProps {
  club: any;
  onBookingComplete?: () => void;
}

export const WednesdayBookingCard = ({ club, onBookingComplete }: WednesdayBookingCardProps) => {
  const [showGroupBooking, setShowGroupBooking] = useState(false);
  const [showRebooking, setShowRebooking] = useState(false);
  const [groupBookingData, setGroupBookingData] = useState({
    groupName: "",
    organizerEmail: "",
    playerEmails: "",
    selectedCourt: "",
    selectedTime: "18:00"
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRebookNextWednesday = async () => {
    setLoading(true);
    try {
      // This would typically use a stored booking ID from user's history
      // For demo purposes, we'll show the concept
      toast({
        title: "Wednesday Rebooking",
        description: "Feature available for players with existing Wednesday bookings",
      });
    } catch (error) {
      toast({
        title: "Rebooking Failed",
        description: "Unable to rebook for next Wednesday",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGroupBooking = async () => {
    if (!groupBookingData.groupName || !groupBookingData.organizerEmail || !groupBookingData.playerEmails) {
      toast({
        title: "Missing Information",
        description: "Please fill in all group booking details",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const playerEmailList = groupBookingData.playerEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      const nextWed = nextWednesday(new Date());
      
      const groupRequest: GroupBookingRequest = {
        club_id: club.id,
        court_id: groupBookingData.selectedCourt || club.courts[0]?.id,
        start_time: `${groupBookingData.selectedTime}:00`,
        end_time: `${parseInt(groupBookingData.selectedTime) + 1}:00`,
        booking_date: format(nextWed, "yyyy-MM-dd"),
        group_name: groupBookingData.groupName,
        organizer_email: groupBookingData.organizerEmail,
        player_emails: playerEmailList
      };

      await createWednesdayGroupBooking(groupRequest);

      toast({
        title: "Wednesday League Booked!",
        description: `${groupBookingData.groupName} is set for ${format(nextWed, "MMM d")} at ${groupBookingData.selectedTime}`,
      });

      setShowGroupBooking(false);
      onBookingComplete?.();
    } catch (error) {
      toast({
        title: "Group Booking Failed",
        description: "Unable to create Wednesday league booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = ["17:00", "18:00", "19:00", "20:00", "21:00"];

  return (
    <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-orange-800 flex items-center gap-2">
            <Star className="h-5 w-5 text-orange-600 fill-current" />
            Wednesday Warriors at {club.name}
          </CardTitle>
          <Badge className="bg-orange-600 text-white">
            Special Day
          </Badge>
        </div>
        <p className="text-orange-700">Make your mid-week memorable with our Wednesday specials!</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Wednesday Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white/60 p-3 rounded-lg text-center">
            <Bell className="h-8 w-8 mx-auto text-orange-600 mb-2" />
            <h4 className="font-semibold text-sm text-orange-800">Smart Reminders</h4>
            <p className="text-xs text-orange-600">Never miss your Wednesday game</p>
          </div>
          
          <div className="bg-white/60 p-3 rounded-lg text-center">
            <Repeat className="h-8 w-8 mx-auto text-orange-600 mb-2" />
            <h4 className="font-semibold text-sm text-orange-800">Easy Rebooking</h4>
            <p className="text-xs text-orange-600">Same time, next Wednesday</p>
          </div>
          
          <div className="bg-white/60 p-3 rounded-lg text-center">
            <Users className="h-8 w-8 mx-auto text-orange-600 mb-2" />
            <h4 className="font-semibold text-sm text-orange-800">Group Bookings</h4>
            <p className="text-xs text-orange-600">Perfect for leagues</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => setShowRebooking(!showRebooking)}
            variant="outline"
            className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            <Repeat className="h-4 w-4 mr-2" />
            Rebook Same Time Next Wednesday
          </Button>

          <Button
            onClick={() => setShowGroupBooking(!showGroupBooking)}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            <Users className="h-4 w-4 mr-2" />
            Create Wednesday League Booking
          </Button>
        </div>

        {/* Group Booking Form */}
        {showGroupBooking && (
          <div className="bg-white/80 p-4 rounded-lg space-y-3 border border-orange-200">
            <h4 className="font-semibold text-orange-800 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Wednesday League Setup
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="groupName" className="text-sm font-medium">League Name</Label>
                <Input
                  id="groupName"
                  placeholder="e.g., Wednesday Warriors"
                  value={groupBookingData.groupName}
                  onChange={(e) => setGroupBookingData({...groupBookingData, groupName: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="organizerEmail" className="text-sm font-medium">Organizer Email</Label>
                <Input
                  id="organizerEmail"
                  type="email"
                  placeholder="organizer@email.com"
                  value={groupBookingData.organizerEmail}
                  onChange={(e) => setGroupBookingData({...groupBookingData, organizerEmail: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="playerEmails" className="text-sm font-medium">Player Emails (comma separated)</Label>
              <Textarea
                id="playerEmails"
                placeholder="player1@email.com, player2@email.com, player3@email.com"
                value={groupBookingData.playerEmails}
                onChange={(e) => setGroupBookingData({...groupBookingData, playerEmails: e.target.value})}
                rows={3}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Preferred Time</Label>
              <div className="flex gap-2 flex-wrap mt-1">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    variant={groupBookingData.selectedTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGroupBookingData({...groupBookingData, selectedTime: time})}
                    className={groupBookingData.selectedTime === time ? "bg-orange-600" : "border-orange-300"}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGroupBooking}
                disabled={loading}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {loading ? "Creating..." : "Book Wednesday League"}
              </Button>
              <Button
                onClick={() => setShowGroupBooking(false)}
                variant="outline"
                className="border-orange-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Quick Rebooking Info */}
        {showRebooking && (
          <div className="bg-white/80 p-4 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-800 mb-2">Quick Rebooking</h4>
            <p className="text-sm text-orange-600 mb-3">
              Next Wednesday: {format(nextWednesday(new Date()), "MMM d, yyyy")}
            </p>
            <Button
              onClick={handleRebookNextWednesday}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {loading ? "Booking..." : "Confirm Next Wednesday"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
