/**
 * Auth Management Hook
 * 
 * Handles authentication checking and session management.
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAuthManagement = () => {
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setAuthChecked(true);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Auth state updated
    });

    return () => subscription.unsubscribe();
  }, []);

  return { authChecked };
};
