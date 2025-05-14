
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface MatchTypeSelectorProps {
  matchType: 'singles' | 'doubles';
  onMatchTypeChange: (value: 'singles' | 'doubles') => void;
}

export const MatchTypeSelector = ({ matchType, onMatchTypeChange }: MatchTypeSelectorProps) => {
  return (
    <div>
      <Label htmlFor="match-type" className="text-sm font-medium text-gray-700">Match Type</Label>
      <RadioGroup
        value={matchType}
        onValueChange={(value) => onMatchTypeChange(value as 'singles' | 'doubles')}
        className="mt-2 flex space-x-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="singles" id="singles" />
          <Label htmlFor="singles" className="cursor-pointer">Singles (2 players)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="doubles" id="doubles" />
          <Label htmlFor="doubles" className="cursor-pointer">Doubles (4 players)</Label>
        </div>
      </RadioGroup>
    </div>
  );
};
