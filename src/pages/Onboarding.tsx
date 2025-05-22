
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { MapPin } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [skillLevel, setSkillLevel] = useState(2.5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const { query, setQuery, locationSuggestions, isLoading } = useLocationSearch();

  // Find the current skill level description
  const getCurrentLevelDescription = () => {
    const levels = [
      { level: 0, description: "Complete Beginner", category: "Beginner" },
      { level: 1, description: "Some experience with racket sports", category: "Beginner" },
      { level: 2, description: "Casual player, basic knowledge of rules", category: "Casual" },
      { level: 3, description: "Regular player, knows techniques", category: "Intermediate" },
      { level: 4, description: "Advanced player, consistent shots", category: "Advanced" },
      { level: 5, description: "Expert player, excellent technique", category: "Expert" }
    ];
    
    // Find the closest level based on the skill level
    const closestLevel = levels.reduce((prev, curr) => {
      return (Math.abs(curr.level - skillLevel) < Math.abs(prev.level - skillLevel) ? curr : prev);
    });
    
    return closestLevel;
  };

  const handleSubmit = () => {
    if (!name) {
      toast({
        title: "Missing Information",
        description: "Please provide your name",
        variant: "destructive",
      });
      return;
    }

    if (!query) {
      toast({
        title: "Missing Information",
        description: "Please provide your location",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Store information in localStorage for later use during signup
    localStorage.setItem("playerOnboarding", JSON.stringify({
      name,
      location: query,
      skillLevel,
      sport: "Padel" // Default to Padel
    }));
    
    // Redirect to auth page for registration
    navigate("/auth", { state: { fromOnboarding: true } });
  };

  const handleSkipForNow = () => {
    navigate("/auth");
  };

  const currentLevel = getCurrentLevelDescription();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Tell Us About Yourself</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input 
              id="name" 
              placeholder="Enter your name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Your Location</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {query ? (
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {query}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Select a location...</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search location..."
                    value={query}
                    onValueChange={setQuery}
                  />
                  <CommandList>
                    <CommandEmpty>{isLoading ? "Searching..." : "No locations found."}</CommandEmpty>
                    <CommandGroup>
                      {locationSuggestions.map((location) => (
                        <CommandItem
                          key={location}
                          value={location}
                          onSelect={(currentValue) => {
                            setQuery(currentValue);
                            setOpen(false);
                          }}
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          <span>{location}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Your Padel Skill Level</Label>
            <div className="pt-6 pb-2">
              <Slider 
                min={0} 
                max={5} 
                step={0.5}
                value={[skillLevel]} 
                onValueChange={(value) => setSkillLevel(value[0])}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span>Beginner (0)</span>
              <span>Expert (5)</span>
            </div>
            <div className="mt-2 p-3 bg-muted rounded-md">
              <p className="font-medium">Level: {skillLevel} - {currentLevel.category}</p>
              <p className="text-sm text-muted-foreground">{currentLevel.description}</p>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <Button 
              onClick={handleSubmit}
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Continue to Registration"}
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleSkipForNow}
              className="w-full"
            >
              Skip for now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
