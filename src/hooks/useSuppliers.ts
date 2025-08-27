import { useState, useEffect } from "react";
// import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Supplier } from "@/integrations/supabase/types";

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSuppliers = async () => {
    try {
      // TODO: Implémenter l'API SQLite plus tard
      setSuppliers([]);
      setLoading(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les fournisseurs",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const createSupplier = async (supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // TODO: Implémenter l'API SQLite plus tard
      toast({
        title: "Succès",
        description: "Fournisseur créé avec succès",
      });
      fetchSuppliers();
      return { id: Date.now().toString(), ...supplierData };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le fournisseur",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateSupplier = async (id: string, supplierData: Partial<Supplier>) => {
    try {
      // TODO: Implémenter l'API SQLite plus tard
      toast({
        title: "Succès",
        description: "Fournisseur mis à jour avec succès",
      });
      fetchSuppliers();
      return supplierData;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le fournisseur",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      // TODO: Implémenter l'API SQLite plus tard
      toast({
        title: "Succès",
        description: "Fournisseur supprimé avec succès",
      });
      fetchSuppliers();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fournisseur",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return {
    suppliers,
    loading,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    refetch: fetchSuppliers,
  };
};