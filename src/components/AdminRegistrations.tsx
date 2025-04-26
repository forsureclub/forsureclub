
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Registration } from "@/types/registration";
import { RegistrationTable } from "./RegistrationTable";

export const AdminRegistrations = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
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
          player:players(name, sport, occupation, city, email, phone_number, gender, play_time, budget_range, club)
        `)
        .order('created_at', { ascending: false });

      // Add debug log for raw supabase data to help verify values received from backend
      console.log("[DEBUG] Fetched Supabase data:", data);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch registrations. You might not have admin access.",
          variant: "destructive"
        });
        console.error("Registration error:", error);
        return;
      }

      console.log("Fetched data:", data);

      // Transform the data to match our Registration type
      const formattedData = data.map(reg => {
        // Log each player's email and phone to debug
        console.log(`Player ${reg.player?.name} - email: ${reg.player?.email}, phone: ${reg.player?.phone_number}`);
        
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
            // Don't use default values here, let null values be null
            email: reg.player?.email,
            phone_number: reg.player?.phone_number,
            gender: reg.player?.gender,
            play_time: reg.player?.play_time,
            budget_range: reg.player?.budget_range,
            club: reg.player?.club
          }
        };
      });

      console.log("Formatted data:", formattedData);
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

  useEffect(() => {
    fetchRegistrations();
  }, []);

  if (loading) {
    return <div className="p-8">Loading registrations...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Player Registrations</h1>
      <RegistrationTable
        registrations={registrations}
        onUpdateRegistration={updateRegistration}
      />
    </div>
  );
};
