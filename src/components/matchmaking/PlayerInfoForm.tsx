
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useRef, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocationSearch } from "@/hooks/useLocationSearch";

interface PlayerInfoFormProps {
  playerName: string;
  setPlayerName: (value: string) => void;
  occupation: string;
  setOccupation: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  abilityLevel: string;
  setAbilityLevel: (value: string) => void;
  abilityOptions: string[];
  abilityLabel: string;
  spendingLevel: '1' | '2' | '3';
  setSpendingLevel: (value: '1' | '2' | '3') => void;
  isClubMember: boolean;
  setIsClubMember: (value: boolean) => void;
  clubName: string;
  setClubName: (value: string) => void;
  gender: 'male' | 'female' | 'other';
  setGender: (value: 'male' | 'female' | 'other') => void;
  email: string;
  setEmail: (value: string) => void;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  skillLevel?: number;
  setSkillLevel?: (value: number) => void;
}

export const PlayerInfoForm = ({
  playerName,
  setPlayerName,
  occupation,
  setOccupation,
  location,
  setLocation,
  abilityLevel,
  setAbilityLevel,
  abilityOptions,
  abilityLabel,
  spendingLevel,
  setSpendingLevel,
  isClubMember,
  setIsClubMember,
  clubName,
  setClubName,
  gender,
  setGender,
  email,
  setEmail,
  phoneNumber,
  setPhoneNumber,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  skillLevel = 1,
  setSkillLevel = () => {}
}: PlayerInfoFormProps) => {
  const [open, setOpen] = useState(false);
  const { query, setQuery, suggestions, isLoading } = useLocationSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Initialize the search query with the current location value if it exists
  useEffect(() => {
    if (location) {
      setQuery(location);
    }
  }, []);

  return (
    <>
      <div>
        <Label htmlFor="name" className="text-sm font-medium text-gray-700">Your Name</Label>
        <Input
          id="name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor="industry" className="text-sm font-medium text-gray-700">Industry</Label>
        <Input
          id="industry"
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          placeholder="Enter your industry"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="location" className="text-sm font-medium text-gray-700">Location</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="flex items-center mt-1 space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <Input
                ref={inputRef}
                id="location"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a city or town in the UK"
                className="flex-1"
                onClick={() => setOpen(true)}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[300px] max-h-[400px] overflow-hidden" align="start">
            <Command>
              <CommandInput 
                placeholder="Search locations..." 
                value={query}
                onValueChange={setQuery}
              />
              <CommandList className="max-h-[300px] overflow-auto">
                <CommandEmpty>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin h-5 w-5 border-2 border-gray-300 rounded-full border-t-gray-600" />
                      <span className="ml-2">Searching...</span>
                    </div>
                  ) : 'No locations found. Try a different search term.'}
                </CommandEmpty>
                <CommandGroup>
                  {suggestions.map((location) => (
                    <CommandItem
                      key={location.id}
                      onSelect={() => {
                        setLocation(location.name);
                        setQuery(location.name);
                        setOpen(false);
                      }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            location.name === query ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="font-medium">{location.name}</span>
                      </div>
                      {location.country && (
                        <span className="text-xs text-gray-500 ml-2">
                          {location.country}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      <div>
        <Label htmlFor="ability" className="text-sm font-medium text-gray-700">{abilityLabel}</Label>
        <Select 
          value={abilityLevel} 
          onValueChange={setAbilityLevel}
        >
          <SelectTrigger id="ability" className="w-full">
            <SelectValue placeholder={`Select your ${abilityLabel}`} />
          </SelectTrigger>
          <SelectContent>
            {abilityOptions.map((level) => (
              <SelectItem key={level} value={level}>{level}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="spending" className="text-sm font-medium text-gray-700">Willing to Pay</Label>
        <Select 
          value={spendingLevel} 
          onValueChange={(value) => setSpendingLevel(value as '1' | '2' | '3')}
        >
          <SelectTrigger id="spending" className="w-full">
            <SelectValue placeholder="Select your budget" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">💰</SelectItem>
            <SelectItem value="2">💰💰</SelectItem>
            <SelectItem value="3">💰💰💰</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="club-member" 
            checked={isClubMember}
            onCheckedChange={(checked) => setIsClubMember(checked as boolean)}
          />
          <Label htmlFor="club-member" className="text-sm font-medium text-gray-700">
            I am a member of a club
          </Label>
        </div>
        
        {isClubMember && (
          <div className="mt-2">
            <Input
              id="club-name"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="Enter your club name"
              className="mt-1"
            />
          </div>
        )}
      </div>
      
      <div>
        <Label className="text-sm font-medium text-gray-700">Gender</Label>
        <RadioGroup
          value={gender}
          onValueChange={(value) => setGender(value as 'male' | 'female' | 'other')}
          className="mt-2 flex flex-col space-y-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="male" id="male" />
            <Label htmlFor="male" className="cursor-pointer">Male</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="female" id="female" />
            <Label htmlFor="female" className="cursor-pointer">Female</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="other" id="other" />
            <Label htmlFor="other" className="cursor-pointer">Other</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div>
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="mt-1"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter your phone number"
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password *</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a password"
          className="mt-1"
          required
          minLength={6}
        />
      </div>
      
      <div>
        <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">Confirm Password *</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          className="mt-1"
          required
          minLength={6}
        />
        <p className="text-xs text-gray-500 mt-1">
          Password must be at least 6 characters long
        </p>
      </div>
    </>
  );
};
