
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
      const { data, error } = await supabase
        .from('player_registrations')
        .select(`
          id,
          player_id,
          admin_notes,
          status,
          created_at,
          updated_at,
          player:players(name, sport, occupation, city)
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
          email: null, // Default to null since email might not exist in the table
          phone_number: null // Default to null since phone_number might not exist in the table
        }
      }));

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
