
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import PlayerDashboard from "./pages/PlayerDashboard";
import Chat from "./pages/Chat";
import PlayerProfile from "./pages/PlayerProfile";
import NotFound from "./pages/NotFound";
import Coaching from "./pages/Coaching";
import { Toaster } from "./components/ui/toaster";
import { supabase } from "./integrations/supabase/client";
import { AuthProvider } from "./hooks/useAuth";
import { Navigation } from "./components/Navigation";
import { TournamentResults } from "./pages/TournamentResults";
import PlayerMessagePage from "./pages/PlayerMessagePage";
import "./App.css";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up the auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/auth" replace />
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
          <Navigation />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/player-dashboard" element={
                <ProtectedRoute>
                  <PlayerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } />
              <Route path="/coaching" element={
                <ProtectedRoute>
                  <Coaching />
                </ProtectedRoute>
              } />
              <Route path="/player/:id" element={<PlayerProfile />} />
              <Route path="/tournament-results" element={<TournamentResults />} />
              
              {/* New messaging routes */}
              <Route path="/messages/match/:matchId" element={
                <ProtectedRoute>
                  <PlayerMessagePage />
                </ProtectedRoute>
              } />
              <Route path="/messages/match/:matchId/player/:playerId" element={
                <ProtectedRoute>
                  <PlayerMessagePage />
                </ProtectedRoute>
              } />
              <Route path="/messages/player/:playerId" element={
                <ProtectedRoute>
                  <PlayerMessagePage />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
