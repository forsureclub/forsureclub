
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";

type Registration = {
  id: string;
  player_id: string;
  admin_notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  player: {
    name: string;
    sport: string;
    occupation: string;
    city: string;
  };
};

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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Sport</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrations.map((reg) => (
            <TableRow key={reg.id}>
              <TableCell>{reg.player?.name}</TableCell>
              <TableCell>{reg.player?.sport}</TableCell>
              <TableCell>{reg.player?.city}</TableCell>
              <TableCell>
                <select
                  value={reg.status}
                  onChange={(e) => updateRegistration(reg.id, { status: e.target.value })}
                  className="border rounded p-1"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </TableCell>
              <TableCell>
                <Textarea
                  value={reg.admin_notes || ''}
                  onChange={(e) => updateRegistration(reg.id, { admin_notes: e.target.value })}
                  placeholder="Add notes..."
                  className="min-h-[80px] w-full"
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateRegistration(reg.id, { status: 'approved' })}
                >
                  Approve
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
