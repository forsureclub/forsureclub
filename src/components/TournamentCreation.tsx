import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TournamentBracket } from "./TournamentBracket";

export const TournamentCreation = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sport, setSport] = useState<string>("Tennis");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [minRating, setMinRating] = useState<string>("0");
  const [maxRating, setMaxRating] = useState<string>("5");
  const [format, setFormat] = useState<string>("round-robin");
  const [isCreating, setIsCreating] = useState(false);
  const [createdTournamentId, setCreatedTournamentId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleCreate = async () => {
    if (!name || !sport || !location || !startDate) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // Create tournament record
      const { data, error } = await supabase
        .from('tournaments')
        .insert({
          name,
          description,
          sport,
          location,
          start_date: startDate.toISOString(),
          end_date: endDate?.toISOString(),
          min_rating: parseFloat(minRating),
          max_rating: parseFloat(maxRating),
          format,
          status: 'registration_open',
          bracket_data: null, // Initialize with null bracket data
        })
        .select();
      
      if (error) throw error;
      
      // Set the created tournament ID
      if (data && data.length > 0) {
        setCreatedTournamentId(data[0].id);
      }
      
      toast({
        title: "Tournament Created",
        description: "The tournament has been successfully created"
      });
      
      // Reset form
      setName("");
      setDescription("");
      setSport("Tennis");
      setLocation("");
      setStartDate(undefined);
      setEndDate(undefined);
      setFormat("single-elimination"); // Updated default to match our new implementation
      
    } catch (error) {
      console.error("Error creating tournament:", error);
      toast({
        title: "Error",
        description: "Failed to create tournament. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <Card className="p-6 space-y-6">
      {!createdTournamentId ? (
        <>
          <h3 className="text-xl font-semibold">Create New Tournament</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Tournament Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter tournament name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter tournament description"
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sport">Sport</Label>
                <Select value={sport} onValueChange={setSport}>
                  <SelectTrigger id="sport">
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tennis">Tennis</SelectItem>
                    <SelectItem value="Golf">Golf</SelectItem>
                    <SelectItem value="Padel">Padel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter location"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <DatePicker 
                  date={startDate}
                  onDateChange={setStartDate}
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <DatePicker 
                  date={endDate}
                  onDateChange={setEndDate}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="format">Tournament Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round-robin">Round Robin</SelectItem>
                    <SelectItem value="single-elimination">Single Elimination</SelectItem>
                    <SelectItem value="double-elimination">Double Elimination</SelectItem>
                    <SelectItem value="swiss">Swiss System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="min-rating">Min Rating</Label>
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger id="min-rating">
                    <SelectValue placeholder="Min rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="max-rating">Max Rating</Label>
                <Select value={maxRating} onValueChange={setMaxRating}>
                  <SelectTrigger id="max-rating">
                    <SelectValue placeholder="Max rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={handleCreate} 
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? "Creating..." : "Create Tournament"}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Tournament Bracket</h3>
            <Button variant="outline" onClick={() => setCreatedTournamentId(null)}>
              Create Another Tournament
            </Button>
          </div>
          <TournamentBracket tournamentId={createdTournamentId} editable={true} />
        </>
      )}
    </Card>
  );
};
