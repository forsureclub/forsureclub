
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star, Calendar, Clock } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    rating: number;
    city: string;
    club?: string;
    play_time: string;
    sport: string;
  };
  onLike: (playerId: string) => void;
  onSkip: (playerId: string) => void;
}

export const PlayerCard = ({ player, onLike, onSkip }: PlayerCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden border-0 shadow-lg">
      <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 h-24" />
      <CardContent className="relative pt-16 p-6">
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
          <Avatar className="h-24 w-24 border-4 border-white">
            {player.club && player.club.startsWith('http') ? (
              <AvatarImage src={player.club} alt={player.name} />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-orange-100 to-orange-200 text-2xl text-orange-600 font-bold">
                {getInitials(player.name)}
              </AvatarFallback>
            )}
          </Avatar>
        </div>

        <div className="text-center mb-4">
          <h3 className="text-xl font-bold">{player.name}</h3>
          <div className="flex items-center justify-center mt-1 text-gray-500 text-sm">
            <MapPin size={14} className="mr-1" />
            <span>{player.city}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i}
                  size={16}
                  fill={i < Math.round(player.rating) ? "#FB923C" : "none"}
                  stroke={i < Math.round(player.rating) ? "#FB923C" : "#D1D5DB"}
                />
              ))}
            </div>
            <span className="ml-2 text-sm font-medium">
              {player.rating.toFixed(1)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <Calendar size={14} className="mr-2 text-gray-500" />
              <span className="capitalize">{player.play_time}</span>
            </div>
            
            <div className="flex items-center">
              <Clock size={14} className="mr-2 text-gray-500" />
              <span>Flexible</span>
            </div>
          </div>

          <div className="flex justify-center">
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              {player.sport}
            </Badge>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <Button 
            variant="outline" 
            className="flex-1 mr-2" 
            onClick={() => onSkip(player.id)}
          >
            Skip
          </Button>
          <Button 
            className="flex-1 ml-2 bg-orange-600 hover:bg-orange-700" 
            onClick={() => onLike(player.id)}
          >
            Match
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
