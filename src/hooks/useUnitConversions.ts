import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export interface UnitConversion {
  id: string;
  product_id: string;
  unit_id: string;
  equivalent_quantity: number;
  unit_name?: string;
  unit_abbreviation?: string;
  product_name?: string;
  created_at?: string;
  updated_at?: string;
}

const API_BASE_URL = 'http://localhost:3001/api';

export const useUnitConversions = () => {
  const [conversions, setConversions] = useState<UnitConversion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConversions = async (productId?: string) => {
    try {
      setLoading(true);
      
      const url = productId 
        ? `${API_BASE_URL}/unit-conversions?product_id=${productId}`
        : `${API_BASE_URL}/unit-conversions`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des conversions');
      }
      
      const data = await response.json();
      setConversions(data);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les conversions d'unités",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createConversion = async (conversionData: Omit<UnitConversion, 'id' | 'created_at' | 'updated_at' | 'unit_name' | 'unit_abbreviation' | 'product_name'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/unit-conversions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversionData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la conversion');
      }

      toast({
        title: "Succès",
        description: "Conversion d'unité créée avec succès",
      });

      fetchConversions();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la conversion d'unité",
        variant: "destructive",
      });
    }
  };

  const updateConversion = async (id: string, conversionData: Partial<UnitConversion>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/unit-conversions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversionData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la modification de la conversion');
      }

      toast({
        title: "Succès",
        description: "Conversion d'unité modifiée avec succès",
      });

      fetchConversions();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la conversion d'unité",
        variant: "destructive",
      });
    }
  };

  const deleteConversion = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/unit-conversions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de la conversion');
      }

      toast({
        title: "Succès",
        description: "Conversion d'unité supprimée avec succès",
      });

      fetchConversions();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la conversion d'unité",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchConversions();
  }, []);

  return {
    conversions,
    loading,
    createConversion,
    updateConversion,
    deleteConversion,
    fetchConversions,
  };
};
