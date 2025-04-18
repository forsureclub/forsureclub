
import { Button } from "@/components/ui/button";

type ApproveButtonProps = {
  onClick: () => void;
};

export const ApproveButton = ({ onClick }: ApproveButtonProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
    >
      Approve
    </Button>
  );
};
