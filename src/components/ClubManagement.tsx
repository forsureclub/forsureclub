
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Calendar, Clock, MapPin, Users, Settings, Plus, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface Club {
  id: string;
  name: string;
  location: string;
  description: string;
  courts: Court[];
  amenities: string[];
  operating_hours: string;
  price_per_hour: number;
  contact_email: string;
  phone: string;
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

export const ClubManagement = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClubs();
  }, []);

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

  const handleClubUpdate = async (clubData: Partial<Club>) => {
    try {
      const { error } = await supabase
        .from("clubs")
        .update(clubData)
        .eq("id", selectedClub?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Club updated successfully",
      });

      fetchClubs();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating club:", error);
      toast({
        title: "Error",
        description: "Failed to update club",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading clubs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Club Management</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Club
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Club</DialogTitle>
            </DialogHeader>
            <ClubForm onSubmit={(data) => handleClubUpdate(data)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map((club) => (
          <Card key={club.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{club.name}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedClub(club)}>
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center text-gray-500">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{club.location}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600 line-clamp-2">{club.description}</p>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{club.courts?.length || 0} courts</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{club.operating_hours}</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {club.amenities?.slice(0, 3).map((amenity, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                  {club.amenities?.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{club.amenities.length - 3} more
                    </Badge>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <span className="text-lg font-semibold text-orange-600">
                    £{club.price_per_hour}/hour
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const ClubForm = ({ club, onSubmit }: { club?: Club; onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    name: club?.name || "",
    location: club?.location || "",
    description: club?.description || "",
    operating_hours: club?.operating_hours || "6:00 AM - 11:00 PM",
    price_per_hour: club?.price_per_hour || 25,
    contact_email: club?.contact_email || "",
    phone: club?.phone || "",
    amenities: club?.amenities?.join(", ") || "Parking, Changing Rooms, Pro Shop",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amenities: formData.amenities.split(",").map(a => a.trim()),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Club Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="operating_hours">Operating Hours</Label>
          <Input
            id="operating_hours"
            value={formData.operating_hours}
            onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="price_per_hour">Price per Hour (£)</Label>
          <Input
            id="price_per_hour"
            type="number"
            value={formData.price_per_hour}
            onChange={(e) => setFormData({ ...formData, price_per_hour: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contact_email">Contact Email</Label>
          <Input
            id="contact_email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="amenities">Amenities (comma-separated)</Label>
        <Input
          id="amenities"
          value={formData.amenities}
          onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
          placeholder="Parking, Changing Rooms, Pro Shop"
        />
      </div>

      <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
        {club ? "Update Club" : "Create Club"}
      </Button>
    </form>
  );
};
