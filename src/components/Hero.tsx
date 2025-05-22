
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { Users, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const Hero = ({ onStartMatching }: { onStartMatching: () => void }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleClaimSpot = () => {
    if (user) {
      navigate("/player-dashboard?tab=find-game");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <img 
            src="/lovable-uploads/af55ac11-46f4-41cd-9cdb-e68e3c019154.png" 
            alt="For Sure Club" 
            className="h-32 mx-auto mb-4"
          />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl font-bold text-gray-900 mb-6"
        >
          Connecting Players Through Padel.
        </motion.h1>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row justify-center items-center gap-8 mb-8"
        >
          <div className="flex items-center gap-3 text-xl text-gray-600">
            <Users className="h-6 w-6 text-orange-500" />
            <p>Connect through competition</p>
          </div>
          <div className="flex items-center gap-3 text-xl text-gray-600">
            <TrendingUp className="h-6 w-6 text-orange-500" />
            <p>Paired by performance</p>
          </div>
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl text-gray-600 mb-8"
        >
          Find your next padel partner, play every Wednesday.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button 
            onClick={handleClaimSpot}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 rounded-lg text-lg font-semibold shadow-lg transition-transform hover:scale-105"
          >
            Claim Your Spot
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
