
import { Card } from "./ui/card";
import { CreateMiniLeagueForm } from "./miniLeague/CreateMiniLeagueForm";

export const CreateMiniLeague = () => {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Create Mini-League</h2>
      <CreateMiniLeagueForm />
    </Card>
  );
};
