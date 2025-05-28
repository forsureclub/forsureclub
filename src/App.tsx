
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import PlayerProfile from "./pages/PlayerProfile";
import PlayerDashboard from "./pages/PlayerDashboard";
import { TournamentResults } from "./pages/TournamentResults";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Coaching from "./pages/Coaching";
import PlayerMessagePage from "./pages/PlayerMessagePage";
import PaymentSuccess from "./pages/PaymentSuccess";
import CourtBooking from "./pages/CourtBooking";
import ClubDashboard from "./pages/ClubDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navigation />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/player/:id" element={<PlayerProfile />} />
            <Route path="/player-dashboard" element={<PlayerDashboard />} />
            <Route path="/tournament-results" element={<TournamentResults />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/coaching" element={<Coaching />} />
            <Route path="/messages/:type/:id" element={<PlayerMessagePage />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/book-court" element={<CourtBooking />} />
            <Route path="/club-dashboard" element={<ClubDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
