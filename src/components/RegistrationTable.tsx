
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Registration } from "@/types/registration";
import { StatusSelect } from "./StatusSelect";
import { RegistrationNotes } from "./RegistrationNotes";
import { ApproveButton } from "./ApproveButton";
import { Button } from "./ui/button";
import { FileSpreadsheet } from "lucide-react";

type RegistrationTableProps = {
  registrations: Registration[];
  onUpdateRegistration: (id: string, updates: Partial<Registration>) => Promise<void>;
};

export const RegistrationTable = ({ registrations, onUpdateRegistration }: RegistrationTableProps) => {
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button 
          onClick={handleExport}
          className="flex items-center gap-2"
          variant="outline"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export to CSV
        </Button>
      </div>
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
          {registrations.map((reg) => (
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
  );
};
