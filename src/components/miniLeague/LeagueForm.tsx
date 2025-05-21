
import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { DatePicker } from "../ui/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Loader2 } from "lucide-react";
import { useLocationSearch } from "@/hooks/useLocationSearch";

interface LeagueFormProps {
  leagueName: string;
  setLeagueName: React.Dispatch<React.SetStateAction<string>>;
  sport: string;
  setSport: React.Dispatch<React.SetStateAction<string>>;
  startDate: Date | undefined;
  setStartDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  suggestions: string[]; // Changed from any[] to string[]
  isLoading: boolean;
}

export const LeagueForm = ({
  leagueName,
  setLeagueName,
  sport,
  setSport,
  startDate,
  setStartDate,
  query,
  setQuery,
  suggestions,
  isLoading,
}: LeagueFormProps) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="league-name">League Name</Label>
        <Input
          id="league-name"
          placeholder="Enter league name"
          value={leagueName}
          onChange={(e) => setLeagueName(e.target.value)}
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="sport">Sport</Label>
        <Input
          id="sport"
          placeholder="Enter sport name"
          value={sport}
          onChange={(e) => setSport(e.target.value)}
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="location">Location</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="justify-between w-full"
            >
              {query || "Select location..."}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-full" style={{ width: "var(--radix-popover-trigger-width)" }}>
            <Command>
              <CommandInput
                placeholder="Search location..."
                value={query}
                onValueChange={setQuery}
              />
              <CommandList>
                <CommandEmpty>
                  {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    "No locations found."
                  )}
                </CommandEmpty>
                <CommandGroup heading="Locations">
                  {suggestions.map((suggestion, index) => (
                    <CommandItem
                      key={index}
                      value={suggestion}
                      onSelect={() => {
                        setQuery(suggestion);
                      }}
                    >
                      {suggestion}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="start-date">Start Date</Label>
        <DatePicker date={startDate} onDateChange={setStartDate} />
      </div>
    </div>
  );
};
