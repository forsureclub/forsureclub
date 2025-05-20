
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TournamentBracket } from "./TournamentBracket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Trophy } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

interface Tournament {
  id: string;
  name: string;
  description: string;
  sport: string;
  location: string;
  start_date: string;
  end_date?: string;
  format: string;
  status: string;
  min_rating: number;
  max_rating: number;
  bracket_data?: any;
}

export const TournamentView = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bracket");
  const { toast } = useToast();

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentDetails(tournamentId);
    }
  }, [tournamentId]);

  const fetchTournamentDetails = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setTournament(data as Tournament);
    } catch (error) {
      console.error("Error fetching tournament details:", error);
      toast({
        title: "Error",
        description: "Failed to load tournament details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTournamentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" }> = {
      "registration_open": { label: "Registration Open", variant: "secondary" },
      "registration_closed": { label: "Registration Closed", variant: "outline" },
      "in_progress": { label: "In Progress", variant: "default" },
      "completed": { label: "Completed", variant: "destructive" },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "outline" };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </CardContent>
      </Card>
    );
  }

  if (!tournament) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-muted-foreground">
            Tournament not found or has been deleted.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isAdmin = true; // In a real app, check if user is admin

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">{tournament.name}</CardTitle>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Trophy className="h-4 w-4" />
                <span className="capitalize">{tournament.sport}</span>
                <span>•</span>
                <MapPin className="h-4 w-4" />
                <span>{tournament.location}</span>
              </div>
            </div>
            {getTournamentStatusBadge(tournament.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <span className="font-medium">Start: </span>
                {format(new Date(tournament.start_date), "PPP")}
              </div>
            </div>
            {tournament.end_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="font-medium">End: </span>
                  {format(new Date(tournament.end_date), "PPP")}
                </div>
              </div>
            )}
          </div>

          <p className="text-muted-foreground mb-4">{tournament.description}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              Rating: {tournament.min_rating} - {tournament.max_rating}
            </Badge>
            <Badge variant="outline">
              Format: {tournament.format.replace(/-/g, " ")}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="bracket" className="flex-1">Bracket</TabsTrigger>
          <TabsTrigger value="participants" className="flex-1">Participants</TabsTrigger>
          <TabsTrigger value="schedule" className="flex-1">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="bracket" className="mt-4">
          <TournamentBracket tournamentId={tournament.id} editable={isAdmin} />
        </TabsContent>

        <TabsContent value="participants" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground py-8">
                Participant list will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground py-8">
                Tournament schedule will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
