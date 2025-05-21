
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    level: 0,
    category: 'Initiation',
    description: 'Has never played any racket sports.'
  },
  {
    level: 0.5,
    category: 'Initiation',
    description: 'No classes. Less than 6 months playing. No technique or tactics.'
  },
  {
    level: 1.0,
    category: 'Initiation',
    description: 'No classes or only few. Less than 12 months playing. No technique or tactics.'
  },
  {
    level: 1.5,
    category: 'Initiation/Intermediate',
    description: 'Few classes. A couple of games a month. Rally and return at low speed.'
  },
  {
    level: 2.0,
    category: 'Initiation/Intermediate',
    description: 'Few classes. At least 1 year of play. A couple of games a month. Rally and return at low speed.'
  },
  {
    level: 2.5,
    category: 'Intermediate',
    description: 'Has almost mastered most of the strokes and controls the directions at a normal pace.'
  },
  {
    level: 3.0,
    category: 'Intermediate',
    description: 'Dominates most strokes, plays flat and drives the ball. Makes many unforced errors.'
  },
  {
    level: 3.5,
    category: 'Intermediate',
    description: 'Dominates most strokes. Can play slice forehand, slice backhand and flat. Can direct the ball correctly. Makes a lot of unforced errors.'
  },
  {
    level: 4.0,
    category: 'Intermediate High',
    description: 'Masters most strokes. Controls the directions. Is able to play slice forehand, slice backhand or flat and direct the ball. Makes a few unforced errors.'
  },
  {
    level: 4.5,
    category: 'Intermediate High',
    description: 'Masters the stroke. Controls the directions. Is able to play slice forehand, slice backhand or flat and direct the ball where wanted. Puts the ball at speed but has difficulties finishing points.'
  },
  {
    level: 5.0,
    category: 'Intermediate Advanced',
    description: 'Medium technique and high tactical mindset. Is ready to play matches with good pace.'
  },
  {
    level: 5.5,
    category: 'Advanced',
    description: 'Dominates technical and tactical skills. Prepared to play matches at high pace.'
  },
  {
    level: 6.0,
    category: 'Advanced',
    description: 'Strong forehand/backhand, attacking strokes, and wall play. Solid teamwork, reads the game well.'
  },
  {
    level: 7.0,
    category: 'Elite',
    description: 'Professional player. Top 30 WPT.'
  },
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
  // Find the current skill level description
  const currentSkillLevel = SKILL_LEVELS.find(level => 
    level.level === skillLevel
  ) || SKILL_LEVELS.find(level => level.level === 2.5);

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
        <Label htmlFor="industry" className="text-sm font-medium text-gray-700">Industry</Label>
        <Input
          id="industry"
          placeholder="Enter your industry"
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="location" className="text-sm font-medium text-gray-700">Location</Label>
        <Input
          id="location"
          placeholder="Enter your location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="mt-1"
        />
      </div>
      
      {/* Skill Level Slider */}
      <div>
        <Label className="text-sm font-medium text-gray-700">Skill Level</Label>
        <div className="mt-1">
          <Slider
            defaultValue={[skillLevel]}
            min={0}
            max={7}
            step={0.5}
            onValueChange={([value]) => setSkillLevel(value)}
            className="my-4"
          />
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-orange-800">Level {skillLevel}</span>
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
        <Label htmlFor="spending" className="text-sm font-medium text-gray-700">Budget</Label>
        <Select value={spendingLevel} onValueChange={(value) => setSpendingLevel(value as '1' | '2' | '3')}>
          <SelectTrigger id="spending" className="mt-1">
            <SelectValue placeholder="Select your budget" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">💰 Basic</SelectItem>
            <SelectItem value="2">💰💰 Premium</SelectItem>
            <SelectItem value="3">💰💰💰 Luxury</SelectItem>
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
