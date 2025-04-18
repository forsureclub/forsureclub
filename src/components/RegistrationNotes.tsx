
import { Textarea } from "@/components/ui/textarea";

type RegistrationNotesProps = {
  notes: string | null;
  onChange: (value: string) => void;
};

export const RegistrationNotes = ({ notes, onChange }: RegistrationNotesProps) => {
  return (
    <Textarea
      value={notes || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Add notes..."
      className="min-h-[80px] w-full"
    />
  );
};
