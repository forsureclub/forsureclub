
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const ClubAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    clubName: "",
    location: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Handle club login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        // Check if user is a club user
        const { data: clubUser, error: clubError } = await supabase
          .from("club_users")
          .select("club_id")
          .eq("email", formData.email)
          .single();

        if (clubError || !clubUser) {
          await supabase.auth.signOut();
          throw new Error("Invalid club credentials");
        }

        toast({
          title: "Welcome back!",
          description: "Successfully logged in to your club dashboard.",
        });

        navigate("/club-dashboard");
      } else {
        // Handle club registration
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;

        if (authData.user) {
          // Create club
          const { data: clubData, error: clubError } = await supabase
            .from("clubs")
            .insert({
              name: formData.clubName,
              location: formData.location,
              slug: formData.clubName.toLowerCase().replace(/\s+/g, '-'),
            })
            .select()
            .single();

          if (clubError) throw clubError;

          // Create club user
          const { error: clubUserError } = await supabase
            .from("club_users")
            .insert({
              email: formData.email,
              password_hash: "managed_by_auth",
              club_id: clubData.id,
            });

          if (clubUserError) throw clubUserError;

          toast({
            title: "Club created successfully!",
            description: "Your club has been registered. You can now manage your facilities.",
          });

          navigate("/club-dashboard");
        }
      }
    } catch (error: any) {
      console.error("Club auth error:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-orange-600">
            {isLogin ? "Club Login" : "Register Your Club"}
          </CardTitle>
          <p className="text-gray-600">
            {isLogin ? "Access your club dashboard" : "Join our padel network"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="clubName">Club Name</Label>
                  <Input
                    id="clubName"
                    value={formData.clubName}
                    onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700"
              disabled={loading}
            >
              {loading ? "Processing..." : isLogin ? "Login" : "Register Club"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-orange-600 hover:underline"
            >
              {isLogin ? "New club? Register here" : "Already have an account? Login"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubAuth;
