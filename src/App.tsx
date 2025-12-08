import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import RealEstateSearch from "./pages/RealEstateSearch";
import AdminTables from "./pages/AdminTables";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { HeatmapProvider } from "./features/real-estate/context/HeatmapContext";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <HeatmapProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/search" element={<RealEstateSearch />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin/tables" element={<AdminTables />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </HeatmapProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
