
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Phone, Mail, Globe, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookingModal } from "@/components/BookingModal";

interface Club {
  id: string;
  name: string;
  location: string;
  description: string;
  founding_story: string;
  about_courts: string;
  about_club: string;
  operating_hours: string;
  price_per_hour: number;
  contact_email: string;
  phone: string;
  website_url: string;
  amenities: string[];
  facilities: string[];
  images: string[];
  rating: number;
  coaching_available: boolean;
  membership_options: string[];
  courts: any[];
}

const ClubProfile = () => {
  const { slug } = useParams();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClubProfile();
  }, [slug]);

  const fetchClubProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("clubs")
        .select(`
          *,
          courts (*)
        `)
        .eq("slug", slug)
        .single();

      if (error) throw error;
      setClub(data);
    } catch (error) {
      console.error("Error fetching club profile:", error);
      toast({
        title: "Error",
        description: "Failed to load club profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading club profile...</div>;
  }

  if (!club) {
    return <div className="text-center p-8">Club not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">{club.name}</h1>
            <div className="flex items-center justify-center gap-2 mb-6">
              <MapPin className="h-5 w-5" />
              <span className="text-xl">{club.location}</span>
            </div>
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 text-yellow-300 fill-current" />
                <span className="text-lg">{club.rating}</span>
              </div>
              <div className="text-lg">£{club.price_per_hour}/hour</div>
              <div>{club.courts?.length} Padel Courts</div>
            </div>
            <Button
              size="lg"
              className="bg-white text-orange-600 hover:bg-gray-100"
              onClick={() => setShowBookingModal(true)}
            >
              Book a Court
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle>About {club.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{club.about_club}</p>
              </CardContent>
            </Card>

            {/* Founding Story */}
            {club.founding_story && (
              <Card>
                <CardHeader>
                  <CardTitle>Our Story</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{club.founding_story}</p>
                </CardContent>
              </Card>
            )}

            {/* Courts Section */}
            <Card>
              <CardHeader>
                <CardTitle>Our Padel Courts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{club.about_courts}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {club.courts?.map((court: any) => (
                    <div key={court.id} className="border rounded-lg p-4">
                      <h4 className="font-semibold">{court.name}</h4>
                      <p className="text-sm text-gray-600">Surface: {court.surface}</p>
                      <p className="text-sm text-gray-600">
                        Rate: £{court.hourly_rate || club.price_per_hour}/hour
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Facilities */}
            <Card>
              <CardHeader>
                <CardTitle>Facilities & Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {club.facilities?.map((facility, index) => (
                    <Badge key={index} variant="secondary">
                      {facility}
                    </Badge>
                  ))}
                  {club.amenities?.map((amenity, index) => (
                    <Badge key={index} variant="outline">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Operating Hours</p>
                    <p className="text-sm text-gray-600">{club.operating_hours}</p>
                  </div>
                </div>

                {club.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-gray-600">{club.phone}</p>
                    </div>
                  </div>
                )}

                {club.contact_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-gray-600">{club.contact_email}</p>
                    </div>
                  </div>
                )}

                {club.website_url && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Website</p>
                      <a
                        href={club.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-orange-600 hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Membership Options */}
            {club.membership_options && club.membership_options.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Membership Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {club.membership_options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-sm">{option}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Coaching */}
            {club.coaching_available && (
              <Card>
                <CardHeader>
                  <CardTitle>Professional Coaching</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Professional padel coaching available. Contact us for more information.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {showBookingModal && (
        <BookingModal
          club={club}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </div>
  );
};

export default ClubProfile;
