
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
    const { data, error } = await supabase
      .from('player_registrations')
      .select(`
        *,
        player:players(name, sport, occupation, city)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch registrations. You might not have admin access.",
        variant: "destructive"
      });
      return;
    }

    setRegistrations(data || []);
    setLoading(false);
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
