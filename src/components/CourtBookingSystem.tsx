
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Calendar, Clock, MapPin, Star, Filter, Search } from "lucide-react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "./ui/date-picker";
import { format, addHours } from "date-fns";

interface Club {
  id: string;
  name: string;
  location: string;
  price_per_hour: number;
  amenities: string[];
  rating: number;
  courts: Court[];
  images: string[];
}

interface Court {
  id: string;
  name: string;
  sport: string;
  surface: string;
  available: boolean;
  hourly_rate: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
  price: number;
}

export const CourtBookingSystem = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const timeSlots: string[] = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00", "21:00", "22:00"
  ];

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    filterClubs();
  }, [clubs, selectedSport, searchQuery, priceRange]);

  const fetchClubs = async () => {
    try {
      const { data, error } = await supabase
        .from("clubs")
        .select(`
          *,
          courts (*)
        `);

      if (error) throw error;
      setClubs(data || []);
    } catch (error) {
      console.error("Error fetching clubs:", error);
      toast({
        title: "Error",
        description: "Failed to load clubs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterClubs = () => {
    let filtered = clubs;

    if (searchQuery) {
      filtered = filtered.filter(club =>
        club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedSport !== "all") {
      filtered = filtered.filter(club =>
        club.courts?.some(court => court.sport.toLowerCase() === selectedSport.toLowerCase())
      );
    }

    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      filtered = filtered.filter(club =>
        club.price_per_hour >= min && (max ? club.price_per_hour <= max : true)
      );
    }

    setFilteredClubs(filtered);
  };

  const bookCourt = async (clubId: string, courtId: string, timeSlot: string) => {
    try {
      const startTime = new Date(selectedDate);
      const [hours, minutes] = timeSlot.split(":").map(Number);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = addHours(startTime, 1);

      const { data, error } = await supabase
        .from("court_bookings")
        .insert({
          club_id: clubId,
          court_id: courtId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          booking_date: selectedDate.toISOString().split('T')[0],
          status: 'confirmed'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Booking Confirmed!",
        description: `Court booked for ${format(startTime, "MMM d, yyyy 'at' h:mm a")}`,
      });

      // Redirect to payment processing
      await processPayment(data.id, clubId);
    } catch (error) {
      console.error("Error booking court:", error);
      toast({
        title: "Booking Failed",
        description: "Unable to book court. Please try again.",
        variant: "destructive",
      });
    }
  };

  const processPayment = async (bookingId: string, clubId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("process-court-payment", {
        body: {
          bookingId,
          clubId,
          returnUrl: window.location.origin + "/booking-success"
        }
      });

      if (error) throw error;

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Payment Error",
        description: "Unable to process payment. Please contact support.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading courts...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Courts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search clubs or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger>
                <SelectValue placeholder="Sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                <SelectItem value="tennis">Tennis</SelectItem>
                <SelectItem value="padel">Padel</SelectItem>
                <SelectItem value="squash">Squash</SelectItem>
                <SelectItem value="badminton">Badminton</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger>
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="0-20">£0 - £20</SelectItem>
                <SelectItem value="20-40">£20 - £40</SelectItem>
                <SelectItem value="40-60">£40 - £60</SelectItem>
                <SelectItem value="60">£60+</SelectItem>
              </SelectContent>
            </Select>

            <DatePicker
              date={selectedDate}
              onDateChange={(date) => setSelectedDate(date || new Date())}
            />
          </div>
        </CardContent>
      </Card>

      {/* Club Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredClubs.map((club) => (
          <ClubCard
            key={club.id}
            club={club}
            selectedDate={selectedDate}
            timeSlots={timeSlots}
            onBookCourt={bookCourt}
          />
        ))}
      </div>

      {filteredClubs.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No clubs found matching your criteria.</p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setSelectedSport("all");
              setPriceRange("all");
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const ClubCard = ({ club, selectedDate, timeSlots, onBookCourt }: {
  club: Club;
  selectedDate: Date;
  timeSlots: string[];
  onBookCourt: (clubId: string, courtId: string, timeSlot: string) => void;
}) => {
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [expandedTimeSlots, setExpandedTimeSlots] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gradient-to-r from-orange-500 to-orange-600 relative">
        <div className="absolute top-4 left-4">
          <Badge className="bg-white text-orange-600">
            {club.courts?.length || 0} courts
          </Badge>
        </div>
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/90 rounded px-2 py-1">
          <Star className="h-4 w-4 text-yellow-500 fill-current" />
          <span className="text-sm font-medium">{club.rating || 4.5}</span>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold">{club.name}</h3>
            <div className="flex items-center text-gray-500 mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">{club.location}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {club.amenities?.slice(0, 4).map((amenity, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {amenity}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-orange-600">
              From £{club.price_per_hour}/hour
            </span>
            <Button
              variant="outline"
              onClick={() => setExpandedTimeSlots(!expandedTimeSlots)}
            >
              {expandedTimeSlots ? "Hide" : "Show"} Availability
            </Button>
          </div>

          {expandedTimeSlots && (
            <div className="space-y-4 border-t pt-4">
              {/* Court Selection */}
              <div>
                <h4 className="font-medium mb-2">Select Court:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {club.courts?.map((court) => (
                    <Button
                      key={court.id}
                      variant={selectedCourt?.id === court.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCourt(court)}
                      className="justify-start"
                    >
                      {court.name} - {court.sport}
                    </Button>
                  ))}
                </div>
              </div>

              {selectedCourt && (
                <div>
                  <h4 className="font-medium mb-2">
                    Available times for {format(selectedDate, "MMM d, yyyy")}:
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        variant="outline"
                        size="sm"
                        onClick={() => onBookCourt(club.id, selectedCourt.id, time)}
                        className="hover:bg-orange-50 hover:border-orange-300"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
