
import { Textarea } from "@/components/ui/textarea";

type RegistrationNotesProps = {
  notes: string | null;
  onUpdate: (value: string) => void;
};

export const RegistrationNotes = ({ notes, onUpdate }: RegistrationNotesProps) => {
  return (
    <Textarea
      value={notes || ''}
      onChange={(e) => onUpdate(e.target.value)}
      placeholder="Add notes..."
      className="min-h-[80px] w-full"
    />
  );
};
