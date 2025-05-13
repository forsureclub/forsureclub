
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn, user, resetPassword } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  // If user is already logged in, redirect to dashboard
  if (user) {
    navigate("/player-dashboard");
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await signIn(email, password);

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      navigate("/player-dashboard");
    } catch (error: any) {
      console.error("Sign in error:", error);
      setErrorMessage(error.message || "Failed to sign in. Please check your credentials.");
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await resetPassword(resetEmail);
      
      if (error) throw error;
      
      setResetSent(true);
      toast({
        title: "Password reset email sent",
        description: "Check your inbox for password reset instructions.",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      setErrorMessage(error.message || "Failed to send reset email. Please try again.");
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/lovable-uploads/af55ac11-46f4-41cd-9cdb-e68e3c019154.png"
              alt="For Sure Club"
              className="h-12 mr-2"
            />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">For Sure Club</h2>
          </div>
          <CardTitle className="text-xl text-center">Welcome</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {activeTab === "login" ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="hello@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button 
                    type="button"
                    className="text-xs text-orange-500 hover:text-orange-600" 
                    onClick={() => setActiveTab("reset")}
                  >
                    Forgot Password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          ) : (
            <div>
              {resetSent ? (
                <div className="space-y-4 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="text-lg font-medium">Check your email</h3>
                  <p className="text-sm text-gray-500">
                    We've sent password reset instructions to your email address.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setResetSent(false);
                      setActiveTab("login");
                    }}
                  >
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500">
                      Enter your email and we'll send you instructions to reset your password
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setActiveTab("login")}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" asChild className="w-full">
            <Link to="/">Back to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
