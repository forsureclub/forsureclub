
import { Button } from "./ui/button";
import { motion } from "framer-motion";

export const Hero = ({ onStartMatching }: { onStartMatching: () => void }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
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
          className="text-3xl md:text-5xl font-bold text-gray-900 mb-4"
        >
          Sports Matchmaking for Padel & Golf
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-600 mb-8"
        >
          Play smarter. Match better. Connect through sport.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button 
            onClick={onStartMatching}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 rounded-lg text-lg font-semibold shadow-lg transition-transform hover:scale-105"
          >
            Start Matching
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
