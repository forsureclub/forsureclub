
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

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setCheckingAdmin(false);
        return;
      }

      try {
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
  }, [user, loading]);

  // Redirect unauthorized users
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

  if (loading || checkingAdmin) {
    return <div className="container mx-auto py-8 text-center">Checking permissions...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have administrator privileges to access this page.
          </AlertDescription>
        </Alert>
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
