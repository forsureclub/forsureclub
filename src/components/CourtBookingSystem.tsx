import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Calendar, Clock, MapPin, Star, Search, Users, Phone, Mail } from "lucide-react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "./ui/date-picker";
import { format, isWednesday } from "date-fns";
import { BookingModal } from "./BookingModal";
import { WednesdayBookingCard } from "./WednesdayBookingCard";

interface Club {
  id: string;
  name: string;
  location: string;
  price_per_hour: number;
  amenities: string[];
  rating: number;
  courts: Court[];
  images: string[];
  slug?: string;
  phone?: string;
  contact_email?: string;
}

interface Court {
  id: string;
  name: string;
  sport: string;
  surface: string;
  available: boolean;
  hourly_rate: number;
}

export const CourtBookingSystem = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const { toast } = useToast();

  // Check if selected date is Wednesday
  const isWednesdaySelected = isWednesday(selectedDate);

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    filterClubs();
  }, [clubs, searchQuery]);

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

    setFilteredClubs(filtered);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <p className="text-gray-600">Finding the best padel courts for you...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      {/* Hero Section */}
      <div className="text-center space-y-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-8 rounded-2xl">
        <h1 className="text-4xl font-bold">Find Your Perfect Padel Court</h1>
        <p className="text-xl opacity-90">Book premium courts in minutes</p>
        {isWednesdaySelected && (
          <Badge className="bg-white/20 text-white text-lg px-4 py-2 mt-2">
            ⭐ Wednesday Warriors Special Day! ⭐
          </Badge>
        )}
      </div>

      {/* Wednesday Special Banner */}
      {isWednesdaySelected && (
        <div className="bg-gradient-to-r from-orange-100 to-orange-200 p-6 rounded-xl border-2 border-orange-300">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-orange-800">🎯 Wednesday Warriors Mode Activated!</h2>
            <p className="text-orange-700">Smart scheduling, easy rebooking, and group booking tools available below</p>
          </div>
        </div>
      )}

      {/* Simple Search */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Where do you want to play?</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by club name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">When?</label>
              <DatePicker
                date={selectedDate}
                onDateChange={(date) => setSelectedDate(date || new Date())}
                className="h-12 text-lg"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wednesday Special Features */}
      {isWednesdaySelected && filteredClubs.length > 0 && (
        <WednesdayBookingCard 
          club={filteredClubs[0]} 
          onBookingComplete={() => {
            toast({
              title: "Wednesday Booking Complete!",
              description: "Your Wednesday Warriors session is confirmed",
            });
          }}
        />
      )}

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Available Courts {searchQuery && `in "${searchQuery}"`}
            {isWednesdaySelected && " - Wednesday Warriors"}
          </h2>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {filteredClubs.length} clubs found
          </Badge>
        </div>

        {filteredClubs.length === 0 ? (
          <Card className="text-center p-12">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">No courts found</h3>
              <p className="text-gray-600">Try adjusting your search or location</p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
                className="mt-4"
              >
                View All Courts
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredClubs.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                selectedDate={selectedDate}
                onBookCourt={() => setSelectedClub(club)}
                isWednesday={isWednesdaySelected}
              />
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedClub && (
        <BookingModal
          club={selectedClub}
          onClose={() => setSelectedClub(null)}
        />
      )}
    </div>
  );
};

const ClubCard = ({ club, selectedDate, onBookCourt, isWednesday }: {
  club: Club;
  selectedDate: Date;
  onBookCourt: () => void;
  isWednesday?: boolean;
}) => {
  return (
    <Card className={`overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-lg ${
      isWednesday ? 'ring-2 ring-orange-300 bg-gradient-to-br from-orange-50 to-white' : ''
    }`}>
      {/* Club Image/Header */}
      <div className={`h-48 relative ${
        isWednesday 
          ? 'bg-gradient-to-br from-orange-400 to-orange-600' 
          : 'bg-gradient-to-br from-orange-400 to-orange-600'
      }`}>
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge className="bg-white text-orange-600 font-semibold">
            <Users className="h-3 w-3 mr-1" />
            {club.courts?.length || 0} courts
          </Badge>
          <Badge className="bg-white/90 text-gray-800 font-semibold">
            <Star className="h-3 w-3 mr-1 text-yellow-500 fill-current" />
            {club.rating || 4.5}
          </Badge>
          {isWednesday && (
            <Badge className="bg-white text-orange-600 font-semibold animate-pulse">
              ⭐ Wednesday Special
            </Badge>
          )}
        </div>
        
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-2xl font-bold mb-1">{club.name}</h3>
          <div className="flex items-center text-white/90">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{club.location}</span>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xl font-bold text-orange-600">£{club.price_per_hour}</span>
              <span className="text-gray-500 ml-1">/hour</span>
              {isWednesday && (
                <Badge className="ml-2 bg-orange-100 text-orange-600 text-xs">
                  Wednesday Rate
                </Badge>
              )}
            </div>
            <div className="text-right text-sm text-gray-500">
              Available {format(selectedDate, "MMM d")}
            </div>
          </div>

          {/* Quick Info */}
          <div className="flex flex-wrap gap-2">
            {club.amenities?.slice(0, 3).map((amenity, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {amenity}
              </Badge>
            ))}
            {club.amenities?.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{club.amenities.length - 3} more
              </Badge>
            )}
          </div>

          {/* Contact Info */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {club.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{club.phone}</span>
              </div>
            )}
            {club.contact_email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span>{club.contact_email}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              asChild
            >
              <a href={`/club/${club.slug || club.id}`}>
                View Details
              </a>
            </Button>
            <Button 
              onClick={onBookCourt}
              className={`flex-1 ${
                isWednesday 
                  ? 'bg-orange-600 hover:bg-orange-700 shadow-lg' 
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isWednesday ? '⭐ Book Wednesday' : 'Book Now'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
