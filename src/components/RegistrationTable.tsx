
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Registration } from "@/types/registration";
import { StatusSelect } from "./StatusSelect";
import { RegistrationNotes } from "./RegistrationNotes";
import { ApproveButton } from "./ApproveButton";

type RegistrationTableProps = {
  registrations: Registration[];
  onUpdateRegistration: (id: string, updates: Partial<Registration>) => Promise<void>;
};

export const RegistrationTable = ({ registrations, onUpdateRegistration }: RegistrationTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Sport</TableHead>
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
            <TableCell>{reg.player?.city}</TableCell>
            <TableCell>{reg.player?.email || <span className="text-muted-foreground">-</span>}</TableCell>
            <TableCell>{reg.player?.phone_number || <span className="text-muted-foreground">-</span>}</TableCell>
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
  );
};
