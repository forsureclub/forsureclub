
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
          <TableHead>Contact</TableHead>
          <TableHead>Details</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {registrations.map((reg) => (
          <TableRow key={reg.id}>
            <TableCell>{reg.player.name}</TableCell>
            <TableCell>{reg.player.sport}</TableCell>
            <TableCell>{reg.player.city}</TableCell>
            <TableCell>
              <div className="space-y-1">
                <div>📧 {reg.player.email}</div>
                <div>📱 {reg.player.phone_number}</div>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1 text-sm">
                <div>Gender: {reg.player.gender}</div>
                <div>Occupation: {reg.player.occupation}</div>
                <div>Play Time: {reg.player.play_time}</div>
                <div>Budget: {reg.player.budget_range}</div>
                {reg.player.club && <div>Club: {reg.player.club}</div>}
              </div>
            </TableCell>
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
