
import { useParams } from "react-router-dom";
import { PlayerMessaging } from "@/components/PlayerMessaging";

const PlayerMessagePage = () => {
  const params = useParams();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <PlayerMessaging matchId={params.matchId} recipientId={params.playerId} />
    </div>
  );
};

export default PlayerMessagePage;
