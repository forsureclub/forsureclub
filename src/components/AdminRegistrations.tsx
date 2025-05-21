
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Registration } from "@/types/registration";
import { RegistrationTable } from "./RegistrationTable";
import { Button } from "./ui/button";
import { Download, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

export const AdminRegistrations = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<'none' | 'location' | 'sport' | 'skill'>('none');
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchRegistrations = async () => {
    try {
      console.log("Fetching registrations as admin...");
      
      // Modified to work without authentication for admin key access
      const { data, error } = await supabase
        .from('player_registrations')
        .select(`
          id,
          player_id,
          admin_notes,
          status,
          created_at,
          updated_at,
          players!player_id(name, sport, occupation, city, email, phone_number, gender, play_time, budget_range, club, rating)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch registrations.",
          variant: "destructive"
        });
        console.error("Registration error:", error);
        return;
      }

      // Transform the data to match our Registration type
      const formattedData = data.map(reg => {
        const player = reg.players || {};
        
        // Type assertion to make TypeScript happy
        const typedPlayer = player as {
          name?: string;
          sport?: string;
          occupation?: string;
          city?: string;
          email?: string | null;
          phone_number?: string | null;
          gender?: string;
          play_time?: string;
          budget_range?: string;
          club?: string;
          rating?: number;
        };
        
        // Normalize email and phone values to ensure consistency
        const email = typedPlayer.email || null;
        const phone = typedPlayer.phone_number || null;
        
        return {
          id: reg.id,
          player_id: reg.player_id,
          admin_notes: reg.admin_notes,
          status: reg.status,
          created_at: reg.created_at,
          updated_at: reg.updated_at,
          player: {
            name: typedPlayer.name || '',
            sport: typedPlayer.sport || '',
            occupation: typedPlayer.occupation || '',
            city: typedPlayer.city || '',
            email: email,
            phone_number: phone,
            gender: typedPlayer.gender || '',
            play_time: typedPlayer.play_time || '',
            budget_range: typedPlayer.budget_range || '',
            club: typedPlayer.club || '',
            rating: typedPlayer.rating || 0
          }
        };
      });

      setRegistrations(formattedData);
      console.log("Registration data loaded:", formattedData.length, "records");
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
    return <div className="p-8 flex justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
        <div className="h-64 w-full max-w-4xl bg-gray-200 rounded-lg"></div>
      </div>
    </div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">Player Registrations</h1>
          <ShieldCheck className="ml-2 text-green-600" size={20} />
        </div>
        <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
          <Download size={16} />
          Export to CSV
        </Button>
      </div>
      
      <Alert className="mb-6 border-orange-200 bg-orange-50">
        <AlertDescription className="text-orange-800">
          This data is restricted to admin users only. It contains sensitive player information including contact details.
        </AlertDescription>
      </Alert>
      
      {registrations.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">No player registrations found. Players will appear here once they register.</p>
        </div>
      ) : (
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
      )}
    </div>
  );
};
