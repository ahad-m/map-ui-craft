import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const FAVORITES_KEY = 'riyal_estate_favorites';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Check auth status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load favorites
  useEffect(() => {
    const loadFavorites = async () => {
      if (user) {
        // Load from database for authenticated users
        const { data, error } = await supabase
          .from('user_favorites')
          .select('property_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Failed to load favorites:', error);
          toast.error('Failed to load favorites');
        } else {
          setFavorites(data?.map(f => f.property_id) || []);
        }
      } else {
        // Load from localStorage for non-authenticated users
        const stored = localStorage.getItem(FAVORITES_KEY);
        if (stored) {
          try {
            setFavorites(JSON.parse(stored));
          } catch (e) {
            console.error('Failed to parse favorites:', e);
            setFavorites([]);
          }
        }
      }
      setLoading(false);
    };

    loadFavorites();
  }, [user]);

  const toggleFavorite = async (propertyId: string) => {
    if (user) {
      // Save to database for authenticated users
      const isFav = favorites.includes(propertyId);
      
      if (isFav) {
        // Remove favorite
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', propertyId);

        if (error) {
          console.error('Failed to remove favorite:', error);
          toast.error('Failed to remove favorite');
          return;
        }
        
        setFavorites(prev => prev.filter(id => id !== propertyId));
        toast.success('Removed from favorites');
      } else {
        // Add favorite
        const { error } = await supabase
          .from('user_favorites')
          .insert({ user_id: user.id, property_id: propertyId });

        if (error) {
          console.error('Failed to add favorite:', error);
          toast.error('Failed to add favorite');
          return;
        }
        
        setFavorites(prev => [...prev, propertyId]);
        toast.success('Added to favorites');
      }
    } else {
      // Save to localStorage for non-authenticated users
      setFavorites(prev => {
        const newFavorites = prev.includes(propertyId)
          ? prev.filter(id => id !== propertyId)
          : [...prev, propertyId];
        
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
        return newFavorites;
      });
    }
  };

  const isFavorite = (propertyId: string) => favorites.includes(propertyId);

  return { favorites, toggleFavorite, isFavorite, loading };
};
