import { useState, useEffect } from "react";
// import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
// import { User, Session } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: 'admin' | 'manager' | 'vendeur';
  is_active: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false); // Désactivé temporairement
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      // TODO: Implémenter l'authentification plus tard
      console.log("Authentification désactivée temporairement");
    } catch (error: any) {
      console.error("Erreur lors de la récupération du profil:", error);
    }
  };

  useEffect(() => {
    // TODO: Implémenter l'authentification plus tard
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      // TODO: Implémenter l'inscription plus tard
      toast({
        title: "Information",
        description: "Authentification désactivée temporairement",
      });
      return { user: null, error: null };
    } catch (error: any) {
      toast({
        title: "Erreur d'inscription",
        description: error.message,
        variant: "destructive",
      });
      return { user: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // TODO: Implémenter la connexion plus tard
      toast({
        title: "Information",
        description: "Authentification désactivée temporairement",
      });
      return { user: null, error: null };
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",
      });
      return { user: null, error };
    }
  };

  const signOut = async () => {
    try {
      // TODO: Implémenter la déconnexion plus tard
      setUser(null);
      setSession(null);
      setProfile(null);
      
      toast({
        title: "Déconnexion",
        description: "À bientôt !",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (profileData: Partial<Profile>) => {
    try {
      // TODO: Implémenter la mise à jour du profil plus tard
      toast({
        title: "Information",
        description: "Mise à jour de profil désactivée temporairement",
      });
      return null;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
      throw error;
    }
  };

  const isAdmin = profile?.role === 'admin';
  const isManager = profile?.role === 'manager';
  const canManage = isAdmin || isManager;

  return {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAdmin,
    isManager,
    canManage,
    refetchProfile: () => user && fetchProfile(user.id),
  };
};