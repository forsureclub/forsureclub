
import { Link, useNavigate, useLocation } from "react-router-dom";
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
import { User, MessageSquare, LogOut, Menu, ChevronDown, Activity, Search } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navigation = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white dark:bg-gray-900 sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-4 h-16">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img
              src="/lovable-uploads/af55ac11-46f4-41cd-9cdb-e68e3c019154.png"
              alt="For Sure Club"
              className="h-10 mr-2"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              For Sure Club
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {user && (
            <NavigationMenu className="mr-2">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link to="/">
                    <Button 
                      variant={isActive("/") ? "secondary" : "ghost"} 
                      className="flex items-center gap-1.5 text-sm font-medium"
                    >
                      <Search size={16} />
                      Find Players
                    </Button>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/chat">
                    <Button 
                      variant={isActive("/chat") ? "secondary" : "ghost"} 
                      className="flex items-center gap-1.5 text-sm font-medium"
                    >
                      <MessageSquare size={16} />
                      AI Game Finder
                    </Button>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/player-dashboard">
                    <Button 
                      variant={isActive("/player-dashboard") ? "secondary" : "ghost"} 
                      className="flex items-center gap-1.5 text-sm font-medium"
                    >
                      <Activity size={16} />
                      Dashboard
                    </Button>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt={user.email?.split("@")[0]} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium">{user.email?.split("@")[0]}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/player-dashboard" className="cursor-pointer">
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85%] sm:w-[350px]">
              <div className="flex flex-col space-y-6 pt-6">
                <div className="space-y-1">
                  {user && (
                    <div className="pb-4">
                      <div className="flex items-center mb-4">
                        <Avatar className="h-10 w-10 mr-2">
                          <AvatarImage src="" alt={user.email?.split("@")[0]} />
                          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                            {user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.email?.split("@")[0]}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>

                      <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button 
                          variant={isActive("/") ? "secondary" : "ghost"} 
                          className="w-full justify-start text-left mb-1"
                        >
                          <Search size={16} className="mr-2" />
                          Find Players
                        </Button>
                      </Link>
                      
                      <Link to="/chat" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button 
                          variant={isActive("/chat") ? "secondary" : "ghost"} 
                          className="w-full justify-start text-left mb-1"
                        >
                          <MessageSquare size={16} className="mr-2" />
                          AI Game Finder
                        </Button>
                      </Link>
                      
                      <Link to="/player-dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button 
                          variant={isActive("/player-dashboard") ? "secondary" : "ghost"} 
                          className="w-full justify-start text-left mb-1"
                        >
                          <Activity size={16} className="mr-2" />
                          Dashboard
                        </Button>
                      </Link>
                    </div>
                  )}

                  {user ? (
                    <Button 
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }} 
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign Out
                    </Button>
                  ) : (
                    <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                        Sign In
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
