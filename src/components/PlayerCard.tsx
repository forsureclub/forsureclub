
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star, Calendar, Clock, User } from "lucide-react";
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

  const getSkillLevel = (rating: number) => {
    if (rating <= 1.5) return "Beginner";
    if (rating <= 2.5) return "Intermediate";
    if (rating <= 3.5) return "Advanced";
    if (rating <= 4.5) return "Expert";
    return "Professional";
  };

  const getSkillColor = (rating: number) => {
    if (rating <= 1.5) return "bg-green-100 text-green-800 border-green-200";
    if (rating <= 2.5) return "bg-blue-100 text-blue-800 border-blue-200";
    if (rating <= 3.5) return "bg-purple-100 text-purple-800 border-purple-200";
    if (rating <= 4.5) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden border-0 shadow-xl bg-white">
      <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 h-20" />
      <CardContent className="relative pt-12 p-6">
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
          <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
            {player.club && player.club.startsWith('http') ? (
              <AvatarImage src={player.club} alt={player.name} className="object-cover" />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-orange-100 to-orange-200 text-xl text-orange-600 font-bold">
                <User className="h-8 w-8" />
              </AvatarFallback>
            )}
          </Avatar>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{player.name}</h3>
          <div className="flex items-center justify-center text-gray-500 text-sm mb-3">
            <MapPin size={14} className="mr-1" />
            <span>{player.city}</span>
          </div>
          
          {/* Skill Level Badge */}
          <Badge className={`${getSkillColor(player.rating)} font-medium px-3 py-1`}>
            {getSkillLevel(player.rating)} • {player.rating.toFixed(1)}
          </Badge>
        </div>

        <div className="space-y-4 mb-6">
          {/* Rating Display */}
          <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className="flex mr-2">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i}
                    size={16}
                    fill={i < Math.round(player.rating) ? "#FB923C" : "none"}
                    stroke={i < Math.round(player.rating) ? "#FB923C" : "#D1D5DB"}
                    className="mr-1"
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {player.rating.toFixed(1)}/5.0
              </span>
            </div>
          </div>

          {/* Player Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center justify-center p-2 bg-orange-50 rounded-lg">
              <Calendar size={14} className="mr-2 text-orange-600" />
              <span className="capitalize text-orange-700 font-medium">{player.play_time}</span>
            </div>
            
            <div className="flex items-center justify-center p-2 bg-blue-50 rounded-lg">
              <Clock size={14} className="mr-2 text-blue-600" />
              <span className="text-blue-700 font-medium">Flexible</span>
            </div>
          </div>

          {/* Sport Badge */}
          <div className="flex justify-center">
            <Badge variant="outline" className="bg-white text-gray-700 border-gray-300 font-medium px-4 py-1">
              {player.sport}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 hover:bg-gray-50 border-gray-300" 
            onClick={() => onSkip(player.id)}
          >
            Skip
          </Button>
          <Button 
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white shadow-md" 
            onClick={() => onLike(player.id)}
          >
            Match
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
