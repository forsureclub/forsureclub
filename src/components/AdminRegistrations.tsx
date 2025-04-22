
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Registration } from "@/types/registration";
import { RegistrationTable } from "./RegistrationTable";
import { Button } from "./ui/button";
import { Download } from "lucide-react";

export const AdminRegistrations = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('player_registrations')
        .select(`
          id,
          player_id,
          admin_notes,
          status,
          created_at,
          updated_at,
          player:players(name, sport, occupation, city, email, phone_number)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch registrations. You might not have admin access.",
          variant: "destructive"
        });
        console.error("Registration error:", error);
        return;
      }

      // Transform the data to match our Registration type
      const formattedData = data.map(reg => ({
        id: reg.id,
        player_id: reg.player_id,
        admin_notes: reg.admin_notes,
        status: reg.status,
        created_at: reg.created_at,
        updated_at: reg.updated_at,
        player: {
          name: reg.player?.name || '',
          sport: reg.player?.sport || '',
          occupation: reg.player?.occupation || '',
          city: reg.player?.city || '',
          email: reg.player?.email || '',
          phone_number: reg.player?.phone_number || ''
        }
      }));

      console.log("Fetched registrations:", formattedData);
      setRegistrations(formattedData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching registrations:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching registrations.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const updateRegistration = async (id: string, updates: Partial<Registration>) => {
    const { error } = await supabase
      .from('player_registrations')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update registration",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Registration updated successfully"
    });

    fetchRegistrations();
  };

  const exportToCSV = () => {
    try {
      // Create CSV content
      const headers = ["Name", "Sport", "Location", "Email", "Phone", "Status", "Notes"];
      const csvRows = [headers];
      
      registrations.forEach(reg => {
        const row = [
          reg.player.name,
          reg.player.sport,
          reg.player.city,
          reg.player.email,
          reg.player.phone_number,
          reg.status,
          reg.admin_notes || ""
        ];
        csvRows.push(row);
      });
      
      // Convert to CSV string
      const csvContent = csvRows.map(row => 
        row.map(cell => {
          // Escape quotes and wrap in quotes
          const escaped = String(cell).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      ).join('\n');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `player-registrations-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: "Registration data exported successfully"
      });
    } catch (err) {
      console.error("Error exporting data:", err);
      toast({
        title: "Error",
        description: "Failed to export registration data",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  if (loading) {
    return <div className="p-8">Loading registrations...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Player Registrations</h1>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <Download size={16} />
          Export to CSV
        </Button>
      </div>
      <RegistrationTable
        registrations={registrations}
        onUpdateRegistration={updateRegistration}
      />
    </div>
  );
};
