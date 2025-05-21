import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocationSearch } from "@/hooks/useLocationSearch";

interface PlayerInfoFormProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  occupation: string;
  setOccupation: (occupation: string) => void;
  location: string;
  setLocation: (location: string) => void;
  abilityLevel: string;
  setAbilityLevel: (level: string) => void;
  abilityOptions: string[];
  abilityLabel: string;
  spendingLevel: '1' | '2' | '3';
  setSpendingLevel: (level: '1' | '2' | '3') => void;
  isClubMember: boolean;
  setIsClubMember: (isMember: boolean) => void;
  clubName: string;
  setClubName: (clubName: string) => void;
  gender: 'male' | 'female' | 'other';
  setGender: (gender: 'male' | 'female' | 'other') => void;
  email: string;
  setEmail: (email: string) => void;
  phoneNumber: string;
  setPhoneNumber: (phoneNumber: string) => void;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  skillLevel: number;
  setSkillLevel: (skillLevel: number) => void;
}

const SKILL_LEVELS = [
  {
    level: 1,
    range: '1-2',
    category: 'Beginner',
    description: 'New to the sport, learning the basics.'
  },
  {
    level: 2,
    range: '2-3',
    category: 'Novice',
    description: 'Understands basic rules and can perform simple techniques.'
  },
  {
    level: 3,
    range: '3-4',
    category: 'Intermediate',
    description: 'Has a good understanding of the game and can execute a range of shots/techniques with consistency.'
  },
  {
    level: 4,
    range: '4-5',
    category: 'Advanced',
    description: 'Highly skilled player with excellent technique, tactical awareness, and consistency.'
  },
  {
    level: 5,
    range: '5-6',
    category: 'Expert',
    description: 'Mastery of the sport, with the ability to adapt to different situations and opponents.'
  },
  {
    level: 6,
    range: '6-7',
    category: 'Professional',
    description: 'Plays at a professional level, competing in tournaments and leagues.'
  },
  {
    level: 7,
    range: '7+',
    category: 'World-Class',
    description: 'One of the best players in the world, with exceptional skill, experience, and achievements.'
  }
];

export const PlayerInfoForm = ({ 
  playerName, setPlayerName,
  occupation, setOccupation,
  location, setLocation,
  abilityLevel, setAbilityLevel,
  abilityOptions,
  abilityLabel,
  spendingLevel, setSpendingLevel,
  isClubMember, setIsClubMember,
  clubName, setClubName,
  gender, setGender,
  email, setEmail,
  phoneNumber, setPhoneNumber,
  password, setPassword,
  confirmPassword, setConfirmPassword,
  skillLevel, setSkillLevel
}: PlayerInfoFormProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { locationSuggestions, fetchLocationSuggestions } = useLocationSearch();

  useEffect(() => {
    if (query.length > 2) {
      fetchLocationSuggestions(query);
    }

    // If a location is already set, use it as the initial query
    if (location && !query) {
      setQuery(location);
    }
  }, [query, fetchLocationSuggestions]);

  // Find the current skill level description
  const currentSkillLevel = SKILL_LEVELS.find(level => 
    level.level === skillLevel
  ) || SKILL_LEVELS.find(level => level.level === 1);

  return (
    <>
      <div>
        <Label htmlFor="name" className="text-sm font-medium text-gray-700">Your Name</Label>
        <Input
          id="name"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="occupation" className="text-sm font-medium text-gray-700">Occupation</Label>
        <Input
          id="occupation"
          placeholder="Enter your occupation"
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="location" className="text-sm font-medium text-gray-700">Location</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between mt-1"
            >
              {location || "Select location..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput 
                placeholder="Search location..." 
                value={query}
                onValueChange={setQuery}
              />
              <CommandEmpty>No location found.</CommandEmpty>
              <CommandGroup>
                {locationSuggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion}
                    onSelect={() => {
                      setLocation(suggestion);
                      setQuery(suggestion);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        location === suggestion ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {suggestion}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Skill Level Slider */}
      <div>
        <Label className="text-sm font-medium text-gray-700">Skill Level</Label>
        <div className="mt-1">
          <Slider
            defaultValue={[skillLevel]}
            max={7}
            step={0.5}
            onValueChange={([value]) => setSkillLevel(value)}
            className="my-4"
          />
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-orange-800">Level {currentSkillLevel?.range}</span>
              <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">
                {currentSkillLevel?.category || 'Intermediate'}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {currentSkillLevel?.description || 'Select your skill level using the slider above.'}
            </p>
          </div>
        </div>
      </div>
      
      <div>
        <Label htmlFor="spending" className="text-sm font-medium text-gray-700">Willing to Pay</Label>
        <Select value={spendingLevel} onValueChange={(value) => setSpendingLevel(value as '1' | '2' | '3')}>
          <SelectTrigger id="spending" className="mt-1">
            <SelectValue placeholder="Select your spending level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">$ - Basic court costs only</SelectItem>
            <SelectItem value="2">$$ - Premium facilities</SelectItem>
            <SelectItem value="3">$$$ - High-end clubs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Club Membership</Label>
        <div className="flex items-center space-x-2">
          <Switch checked={isClubMember} onCheckedChange={setIsClubMember} id="club-member" />
          <Label htmlFor="club-member">I'm a member of a club</Label>
        </div>

        {isClubMember && (
          <Input
            placeholder="Club name"
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
            className="mt-2"
          />
        )}
      </div>

      <div>
        <Label htmlFor="gender" className="text-sm font-medium text-gray-700">Gender</Label>
        <Select value={gender} onValueChange={(value) => setGender(value as 'male' | 'female' | 'other')}>
          <SelectTrigger id="gender" className="mt-1">
            <SelectValue placeholder="Select your gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="Enter your phone number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1"
        />
      </div>
    </>
  );
};
