
import { useToast } from "@/hooks/use-toast";

export const useFormValidation = () => {
  const { toast } = useToast();

  const validateForm = (
    playerName: string,
    abilityLevel: string,
    industry: string,
    location: string,
    isClubMember: boolean,
    clubName: string,
    email: string,
    phoneNumber: string,
    password: string,
    confirmPassword: string
  ): boolean => {
    // Check required fields
    if (!playerName) {
      toast({
        title: "Missing Information",
        description: "Please enter your name",
        variant: "destructive",
      });
      return false;
    }

    if (!abilityLevel) {
      toast({
        title: "Missing Information",
        description: "Please select your experience level",
        variant: "destructive",
      });
      return false;
    }

    if (!industry) {
      toast({
        title: "Missing Information",
        description: "Please enter your industry",
        variant: "destructive",
      });
      return false;
    }

    if (!location) {
      toast({
        title: "Missing Information",
        description: "Please enter your location",
        variant: "destructive",
      });
      return false;
    }

    if (isClubMember && !clubName) {
      toast({
        title: "Missing Information",
        description: "Please enter your club name",
        variant: "destructive",
      });
      return false;
    }

    if (!email) {
      toast({
        title: "Missing Information",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    if (!password) {
      toast({
        title: "Missing Information",
        description: "Please enter a password",
        variant: "destructive",
      });
      return false;
    }

    if (password.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return false;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  return { validateForm };
};
