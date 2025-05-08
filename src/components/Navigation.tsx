
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { User } from "lucide-react";

export const Navigation = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img
              src="/lovable-uploads/af55ac11-46f4-41cd-9cdb-e68e3c019154.png"
              alt="For Sure Club"
              className="h-10 mr-2"
            />
            <span className="text-xl font-bold">For Sure Club</span>
          </Link>

          {user && (
            <NavigationMenu className="ml-6">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Navigate</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[400px] gap-3 p-4">
                      <NavigationMenuLink asChild>
                        <Link
                          to="/player-dashboard"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">Dashboard</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            View your profile and game history
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/chat"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">AI Game Finder</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Chat with AI to find your next match
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">Find Players</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Browse and match with other players
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          )}
        </div>

        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/player-dashboard" className="flex items-center">
                <Button variant="outline" className="flex items-center gap-2">
                  <User size={18} />
                  <span>Profile</span>
                </Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
