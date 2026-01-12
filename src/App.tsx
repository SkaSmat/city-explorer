import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import MapView from "./pages/MapView";
import Profile from "./pages/Profile";
import SelectCity from "./pages/SelectCity";
import Cities from "./pages/Cities";
import Settings from "./pages/Settings";
import EditProfile from "./pages/EditProfile";
import NotFound from "./pages/NotFound";
import { testSupabaseConnection } from './lib/testConnection';

const queryClient = new QueryClient();

// Test connection to external Supabase on app startup
testSupabaseConnection();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/home" element={<Home />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/select-city" element={<SelectCity />} />
            <Route path="/cities" element={<Cities />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
