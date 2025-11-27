import { useState, useEffect } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { useAuthManagement } from "@/hooks/useAuthManagement";
import { OptimizedSearchContainer } from "@/components/realestate/OptimizedSearchContainer";

const RealEstateSearch = () => {
  const { t, i18n } = useTranslation();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const [transactionType, setTransactionType] = useState<"rent" | "sale">("sale");
  
  // Auth management
  const { authChecked } = useAuthManagement();

  // Language setup
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Loading state
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="relative h-screen w-full overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-light/20 via-background to-accent-light/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_hsl(142_76%_48%/0.08)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_hsl(142_76%_48%/0.05)_0%,_transparent_50%)]" />
        
        {/* Optimized main search container */}
        <OptimizedSearchContainer
          transactionType={transactionType}
          onTransactionTypeChange={setTransactionType}
        />
      </div>
    </APIProvider>
  );
};

export default RealEstateSearch;
