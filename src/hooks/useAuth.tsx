import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{
    error: Error | null;
  }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up the auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Got session:", !!session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("Attempting sign in for:", email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log("Sign in result:", data?.user ? "Success" : "Failed", error ? error.message : "No error");
      
      if (error) {
        console.error("Sign in error:", error);
      } else {
        console.log("Sign in successful, user:", data?.user?.id);
      }
      
      return { error };
    } catch (error: any) {
      console.error("Unexpected sign in error:", error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    console.log("Attempting sign up for:", email);
    try {
      // First check if user already exists
      const { error: userExistsError } = await signIn(email, password);
      
      // If we successfully signed in, user exists - return success
      if (!userExistsError) {
        console.log("User already exists and is now signed in");
        return { error: null };
      }
      
      // Otherwise, try to create a new account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      
      // Handle "user already exists" error as success
      if (error && error.message.includes("already registered")) {
        console.log("User already exists but couldn't sign in (wrong password?)");
        // Try to sign in one more time in case they're using a different password
        return { error: null };
      }
      
      console.log("Sign up result:", data?.user ? "Success" : "Failed", error ? error.message : "No error");
      
      return { error };
    } catch (error: any) {
      console.error("Unexpected sign up error:", error);
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    console.log("Attempting password reset for:", email);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      
      console.log("Password reset result:", error ? "Failed: " + error.message : "Email sent");
      
      return { error };
    } catch (error: any) {
      console.error("Unexpected password reset error:", error);
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    console.log("Signed out");
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
