
import { useState } from "react";
import { AdminRegistrations } from "@/components/AdminRegistrations";
import { AdminLeaderboard } from "@/components/AdminLeaderboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("registrations");

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
