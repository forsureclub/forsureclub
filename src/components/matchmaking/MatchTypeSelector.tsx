
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface MatchTypeSelectorProps {
  matchType: 'singles' | 'doubles';
  onMatchTypeChange: (value: 'singles' | 'doubles') => void;
  playerCount: '1' | '2' | '3';
  onPlayerCountChange: (value: '1' | '2' | '3') => void;
}

export const MatchTypeSelector = ({ 
  matchType, 
  onMatchTypeChange, 
  playerCount, 
  onPlayerCountChange 
}: MatchTypeSelectorProps) => {
  return (
    <div className="space-y-4">
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
      
      <div>
        <Label htmlFor="player-count" className="text-sm font-medium text-gray-700">Players Needed</Label>
        <RadioGroup
          value={playerCount}
          onValueChange={(value) => onPlayerCountChange(value as '1' | '2' | '3')}
          className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3"
        >
          <div className="flex items-center space-x-2 border rounded-md p-2">
            <RadioGroupItem value="1" id="one-player" />
            <Label htmlFor="one-player" className="cursor-pointer">1 Partner</Label>
          </div>
          <div className="flex items-center space-x-2 border rounded-md p-2">
            <RadioGroupItem value="2" id="two-players" />
            <Label htmlFor="two-players" className="cursor-pointer">2 Players</Label>
          </div>
          <div className="flex items-center space-x-2 border rounded-md p-2">
            <RadioGroupItem value="3" id="three-players" />
            <Label htmlFor="three-players" className="cursor-pointer">3 Players</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};
