import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { User, LogOut, Home, MessageSquare } from "lucide-react";

export const Navigation = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/3f9c0fbf-04f0-4d6d-8412-ea07f3d1aa25.png" 
              alt="ForSure Club" 
              className="h-8"
            />
          </Link>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/" className={location.pathname === "/" ? "bg-orange-50" : ""}>
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>

            {user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link 
                    to="/player-dashboard" 
                    className={location.pathname === "/player-dashboard" ? "bg-orange-50" : ""}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>

                <Button variant="ghost" asChild>
                  <Link 
                    to="/tournament-results" 
                    className={location.pathname === "/tournament-results" ? "bg-orange-50" : ""}
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Tournaments
                  </Link>
                </Button>

                <Button variant="ghost" asChild>
                  <Link 
                    to="/coaching" 
                    className={location.pathname === "/coaching" ? "bg-orange-50" : ""}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Coaching
                  </Link>
                </Button>

                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
