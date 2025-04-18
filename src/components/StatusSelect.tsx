
import { select } from "@/lib/utils";

type StatusSelectProps = {
  status: string;
  onChange: (value: string) => void;
};

export const StatusSelect = ({ status, onChange }: StatusSelectProps) => {
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded p-1"
    >
      <option value="pending">Pending</option>
      <option value="approved">Approved</option>
      <option value="rejected">Rejected</option>
    </select>
  );
};
