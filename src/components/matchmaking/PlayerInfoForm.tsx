
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SKILL_LEVELS } from "@/types/matchmaking";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

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
  const getCurrentLevelDescription = () => {
    // Find the exact level match or closest level
    const exactLevel = SKILL_LEVELS.find(l => l.level === skillLevel);
    
    if (exactLevel) {
      return {
        level: exactLevel.level,
        description: exactLevel.description,
        category: exactLevel.category
      };
    }
    
    // If no exact match, find the closest level below
    const closestLevel = SKILL_LEVELS.filter(l => l.level <= skillLevel)
      .sort((a, b) => b.level - a.level)[0];
    
    return closestLevel ? {
      level: skillLevel,
      description: closestLevel.description,
      category: closestLevel.category
    } : {
      level: skillLevel,
      description: 'Custom level',
      category: ''
    };
  };

  const currentLevelInfo = getCurrentLevelDescription();

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
        <Label htmlFor="occupation" className="text-sm font-medium text-gray-700">Occupation</Label>
        <Input
          id="occupation"
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          placeholder="Enter your occupation"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="location" className="text-sm font-medium text-gray-700">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter your city"
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor="skill-level" className="text-sm font-medium text-gray-700">Skill Level (0-7)</Label>
        <div className="pt-6 pb-2">
          <Slider 
            id="skillLevel"
            min={0} 
            max={7} 
            step={0.5}
            value={[skillLevel]} 
            onValueChange={(value) => setSkillLevel(value[0])}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Beginner (0)</span>
          <span>Elite (7)</span>
        </div>
        <div className="mt-2 p-3 bg-gray-50 rounded-md">
          <p className="text-sm font-medium">{currentLevelInfo.level} - {currentLevelInfo.category}</p>
          <p className="text-xs text-gray-500">{currentLevelInfo.description}</p>
        </div>
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
