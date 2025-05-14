
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";

export const useFormValidation = () => {
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    return /^[\d\+\-\(\) ]{7,15}$/.test(phone);
  };

  const validateForm = (
    playerName: string,
    abilityLevel: string,
    occupation: string,
    location: string,
    isClubMember: boolean,
    clubName: string,
    email: string,
    phoneNumber: string,
    password: string,
    confirmPassword: string
  ): boolean => {
    if (!playerName || !abilityLevel || !occupation || !location || 
        (isClubMember && !clubName) || !email) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields",
        variant: "destructive"
      });
      return false;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return false;
    }

    if (phoneNumber && !validatePhone(phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return false;
    }

    if (!password) {
      toast({
        title: "Password Required",
        description: "Please create a password for your account",
        variant: "destructive"
      });
      return false;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return false;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  return { validateForm };
};
