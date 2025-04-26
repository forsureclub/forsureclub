
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Registration } from "@/types/registration";
import { StatusSelect } from "./StatusSelect";
import { RegistrationNotes } from "./RegistrationNotes";
import { ApproveButton } from "./ApproveButton";
import { Button } from "./ui/button";
import { FileSpreadsheet, Users, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type RegistrationTableProps = {
  registrations: Registration[];
  onUpdateRegistration: (id: string, updates: Partial<Registration>) => Promise<void>;
  groupBy: 'none' | 'location' | 'sport';
  setGroupBy: (value: 'none' | 'location' | 'sport') => void;
};

export const RegistrationTable = ({ registrations, onUpdateRegistration, groupBy, setGroupBy }: RegistrationTableProps) => {
  const handleExport = () => {
    // Create CSV content
    const headers = ["Name", "Sport", "Occupation", "Location", "Email", "Phone", "Gender", "Availability", "Budget", "Club", "Status"];
    const csvContent = [
      headers.join(","),
      ...registrations.map(reg => [
        reg.player?.name || "",
        reg.player?.sport || "",
        reg.player?.occupation || "",
        reg.player?.city || "",
        reg.player?.email || "",
        reg.player?.phone_number || "",
        reg.player?.gender || "",
        reg.player?.play_time || "",
        reg.player?.budget_range || "",
        reg.player?.club || "",
        reg.status || ""
      ].join(","))
    ].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", "player-registrations.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Group registrations if needed
  const groupedRegistrations = () => {
    if (groupBy === 'none') return { "All Players": registrations };
    
    const grouped: Record<string, Registration[]> = {};
    
    registrations.forEach((reg) => {
      const groupKey = groupBy === 'location' 
        ? (reg.player?.city || 'Unknown Location')
        : (reg.player?.sport || 'Unknown Sport');
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(reg);
    });
    
    return grouped;
  };

  const groupedData = groupedRegistrations();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <label htmlFor="group-by" className="font-medium">Group by:</label>
          <Select
            value={groupBy}
            onValueChange={(value) => setGroupBy(value as 'none' | 'location' | 'sport')}
          >
            <SelectTrigger id="group-by" className="w-[180px]">
              <SelectValue placeholder="Select grouping" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Grouping</SelectItem>
              <SelectItem value="location">Location</SelectItem>
              <SelectItem value="sport">Sport</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={handleExport}
          className="flex items-center gap-2"
          variant="outline"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      {Object.entries(groupedData).map(([groupName, groupRegistrations]) => (
        <div key={groupName} className="mb-8">
          {groupBy !== 'none' && (
            <div className="flex items-center gap-2 mb-4 bg-muted p-2 rounded-md">
              {groupBy === 'location' ? (
                <MapPin className="h-5 w-5" />
              ) : (
                <Users className="h-5 w-5" />
              )}
              <h2 className="text-xl font-semibold">{groupName}</h2>
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm">
                {groupRegistrations.length} players
              </span>
            </div>
          )}
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Sport</TableHead>
                <TableHead>Occupation</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Club</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupRegistrations.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell>{reg.player?.name}</TableCell>
                  <TableCell>{reg.player?.sport}</TableCell>
                  <TableCell>{reg.player?.occupation}</TableCell>
                  <TableCell>{reg.player?.city}</TableCell>
                  <TableCell>
                    {reg.player?.email ? 
                      <a href={`mailto:${reg.player.email}`} className="text-blue-500 hover:underline">
                        {reg.player.email}
                      </a> : 
                      <span className="text-muted-foreground">-</span>
                    }
                  </TableCell>
                  <TableCell>
                    {reg.player?.phone_number ? 
                      <a href={`tel:${reg.player.phone_number}`} className="text-blue-500 hover:underline">
                        {reg.player.phone_number}
                      </a> : 
                      <span className="text-muted-foreground">-</span>
                    }
                  </TableCell>
                  <TableCell>{reg.player?.gender || <span className="text-muted-foreground">-</span>}</TableCell>
                  <TableCell>{reg.player?.play_time || <span className="text-muted-foreground">-</span>}</TableCell>
                  <TableCell>{reg.player?.budget_range || <span className="text-muted-foreground">-</span>}</TableCell>
                  <TableCell>{reg.player?.club || <span className="text-muted-foreground">-</span>}</TableCell>
                  <TableCell>
                    <StatusSelect
                      status={reg.status}
                      onChange={(value) => onUpdateRegistration(reg.id, { status: value })}
                    />
                  </TableCell>
                  <TableCell>
                    <RegistrationNotes
                      notes={reg.admin_notes}
                      onChange={(value) => onUpdateRegistration(reg.id, { admin_notes: value })}
                    />
                  </TableCell>
                  <TableCell>
                    <ApproveButton
                      onClick={() => onUpdateRegistration(reg.id, { status: 'approved' })}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
};
