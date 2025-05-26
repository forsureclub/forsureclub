
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import Index from "./pages/Index";
import PlayerProfile from "./pages/PlayerProfile";
import PlayerDashboard from "./pages/PlayerDashboard";
import { TournamentResults } from "./pages/TournamentResults";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Coaching from "./pages/Coaching";
import PlayerMessagePage from "./pages/PlayerMessagePage";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/player/:id" element={<PlayerProfile />} />
          <Route path="/dashboard" element={<PlayerDashboard />} />
          <Route path="/tournament-results" element={<TournamentResults />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/coaching" element={<Coaching />} />
          <Route path="/messages/:type/:id" element={<PlayerMessagePage />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
