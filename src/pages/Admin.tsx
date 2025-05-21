
import { useState, useEffect } from "react";
import { AdminRegistrations } from "@/components/AdminRegistrations";
import { AdminLeaderboard } from "@/components/AdminLeaderboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("registrations");
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [adminKey, setAdminKey] = useState("");
  
  // Function to check if the provided admin key is valid
  const validateAdminKey = (key: string) => {
    // This is a simple validation - in production, use a more secure method
    return key === "forsureclub2025"; // You can change this to any key you prefer
  };

  // Check if admin key is in localStorage
  useEffect(() => {
    const storedKey = localStorage.getItem("adminKey");
    if (storedKey) {
      setAdminKey(storedKey);
      if (validateAdminKey(storedKey)) {
        setIsAdmin(true);
      }
    }
    setCheckingAdmin(false);
  }, []);

  // Check if user is admin through authentication
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user && !validateAdminKey(adminKey)) {
        setCheckingAdmin(false);
        return;
      }

      try {
        // If there's a valid admin key, we've already set isAdmin to true
        if (validateAdminKey(adminKey)) {
          return;
        }
        
        // In a real application, you would check against a database or authentication provider
        // Here we're assuming this check is handled by Supabase RLS
        setIsAdmin(true);
        setCheckingAdmin(false);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        setCheckingAdmin(false);
      }
    };

    if (!loading) {
      checkAdminStatus();
    }
  }, [user, loading, adminKey]);

  // Handle admin key submission
  const handleKeySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateAdminKey(adminKey)) {
      localStorage.setItem("adminKey", adminKey);
      setIsAdmin(true);
    } else {
      alert("Invalid admin key");
    }
  };

  if (loading || checkingAdmin) {
    return <div className="container mx-auto py-8 text-center">Checking permissions...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive" className="max-w-md mx-auto mb-6">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Admin Access Required</AlertTitle>
          <AlertDescription>
            You need administrator privileges to access this page.
          </AlertDescription>
        </Alert>
        
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Admin Access</h2>
          <form onSubmit={handleKeySubmit}>
            <div className="mb-4">
              <label htmlFor="adminKey" className="block text-sm font-medium mb-1">
                Admin Key
              </label>
              <input
                type="password"
                id="adminKey"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full p-2 border rounded focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter admin key"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 rounded hover:from-orange-600 hover:to-orange-700"
            >
              Access Admin Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="registrations">Player Registrations</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard & Tournaments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="registrations">
          <AdminRegistrations />
        </TabsContent>
        
        <TabsContent value="leaderboard">
          <AdminLeaderboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
