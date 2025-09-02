import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = 'http://localhost:3001';

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/suppliers`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des fournisseurs');
      }
      
      const data = await response.json();
      setSuppliers(data);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les fournisseurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createSupplier = async (supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du fournisseur');
      }

      toast({
        title: "Succès",
        description: "Fournisseur créé avec succès",
      });

      fetchSuppliers();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le fournisseur",
        variant: "destructive",
      });
    }
  };

  const updateSupplier = async (id: string, supplierData: Partial<Supplier>) => {
    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du fournisseur');
      }

      toast({
        title: "Succès",
        description: "Fournisseur mis à jour avec succès",
      });

      fetchSuppliers();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le fournisseur",
        variant: "destructive",
      });
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du fournisseur');
      }

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