import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Registration } from "@/types/registration";
import { RegistrationTable } from "./RegistrationTable";
import { Button } from "./ui/button";
import { Download } from "lucide-react";

export const AdminRegistrations = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<'none' | 'location' | 'sport' | 'skill'>('none');
  const { toast } = useToast();

  const fetchRegistrations = async () => {
    try {
      console.log("Fetching registrations...");
      const { data, error } = await supabase
        .from('player_registrations')
        .select(`
          id,
          player_id,
          admin_notes,
          status,
          created_at,
          updated_at,
          player:players(name, sport, occupation, city, email, phone_number, gender, play_time, budget_range, club, rating)
        `)
        .eq('player:players.sport', 'Padel')
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
      const formattedData = data.map(reg => {
        // Normalize email and phone values to ensure consistency
        const email = reg.player?.email || null;
        const phone = reg.player?.phone_number || null;
        
        return {
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
            email: email,
            phone_number: phone,
            gender: reg.player?.gender || '',
            play_time: reg.player?.play_time || '',
            budget_range: reg.player?.budget_range || '',
            club: reg.player?.club || '',
            rating: reg.player?.rating || 0
          }
        };
      });

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
      // Create CSV header row
      let csvContent = "Player,Sport,Location,Email,Phone,Gender,Play Time,Budget,Rating\n";
      
      // Add data rows
      registrations.forEach(reg => {
        const player = reg.player;
        const email = player.email && player.email !== "null" && player.email !== "no-email@provided.com" 
          ? player.email 
          : "";
        const phone = player.phone_number && player.phone_number !== "null" && player.phone_number !== "no-number-provided" 
          ? player.phone_number 
          : "";
          
        const row = [
          player.name,
          player.sport,
          player.city,
          email,
          phone,
          player.gender,
          player.play_time,
          player.budget_range,
          player.rating || 0
        ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
        
        csvContent += row + "\n";
      });
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `player-registrations-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      toast({
        title: "Export Failed",
        description: "Could not export data to CSV",
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
        <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
          <Download size={16} />
          Export to CSV
        </Button>
      </div>
      <RegistrationTable
        registrations={registrations}
        onUpdateRegistration={updateRegistration}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        renderPlayerName={(player, playerId) => (
          <Link to={`/player/${playerId}`} className="text-blue-600 hover:underline">
            {player.name}
          </Link>
        )}
      />
    </div>
  );
};
