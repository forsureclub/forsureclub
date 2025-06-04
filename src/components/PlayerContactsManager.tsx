
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PlayerContact {
  id: string;
  player_name: string;
  email: string;
  phone: string;
  notes: string;
  created_at: string;
  booking_id: string;
}

export const PlayerContactsManager = () => {
  const [contacts, setContacts] = useState<PlayerContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<PlayerContact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<PlayerContact | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlayerContacts();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [contacts, searchQuery]);

  const fetchPlayerContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("player_contacts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching player contacts:", error);
      toast({
        title: "Error",
        description: "Failed to load player contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterContacts = () => {
    if (!searchQuery) {
      setFilteredContacts(contacts);
      return;
    }

    const filtered = contacts.filter(contact =>
      contact.player_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredContacts(filtered);
  };

  const updateNotes = async (contactId: string, newNotes: string) => {
    try {
      const { error } = await supabase
        .from("player_contacts")
        .update({ notes: newNotes })
        .eq("id", contactId);

      if (error) throw error;

      setContacts(contacts.map(contact =>
        contact.id === contactId ? { ...contact, notes: newNotes } : contact
      ));

      toast({
        title: "Notes updated",
        description: "Player notes have been saved successfully.",
      });
    } catch (error) {
      console.error("Error updating notes:", error);
      toast({
        title: "Error",
        description: "Failed to update notes",
        variant: "destructive",
      });
    }
  };

  const exportContacts = () => {
    const csvContent = [
      ["Name", "Email", "Phone", "First Booking", "Notes"],
      ...filteredContacts.map(contact => [
        contact.player_name,
        contact.email,
        contact.phone || "",
        new Date(contact.created_at).toLocaleDateString(),
        contact.notes || ""
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "player-contacts.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading player contacts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Player Contacts</h2>
        <Button onClick={exportContacts} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contacts List */}
        <Card>
          <CardHeader>
            <CardTitle>All Contacts ({filteredContacts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedContact?.id === contact.id ? "bg-orange-50 border-orange-200" : "hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setSelectedContact(contact);
                    setNotes(contact.notes || "");
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{contact.player_name}</h4>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </div>
                      {contact.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              ))}

              {filteredContacts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No player contacts found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedContact ? `${selectedContact.player_name} Details` : "Select a Contact"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedContact ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Email:</strong> {selectedContact.email}</div>
                    {selectedContact.phone && (
                      <div><strong>Phone:</strong> {selectedContact.phone}</div>
                    )}
                    <div><strong>First Booking:</strong> {new Date(selectedContact.created_at).toLocaleDateString()}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this player..."
                    rows={4}
                  />
                  <Button
                    className="mt-2"
                    onClick={() => updateNotes(selectedContact.id, notes)}
                  >
                    Save Notes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select a player contact to view details and add notes
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
