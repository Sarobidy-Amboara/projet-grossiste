import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

const API_BASE_URL = 'http://localhost:3001';

export const useUnits = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUnits = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/units`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des unités');
      }
      
      const data = await response.json();
      setUnits(data);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les unités",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUnit = async (unitData: Omit<Unit, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/units`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(unitData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de l\'unité');
      }

      toast({
        title: "Succès",
        description: "Unité créée avec succès",
      });

      fetchUnits();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'unité",
        variant: "destructive",
      });
    }
  };

  const updateUnit = async (id: string, unitData: Partial<Unit>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/units/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(unitData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la modification de l\'unité');
      }

      toast({
        title: "Succès",
        description: "Unité modifiée avec succès",
      });

      fetchUnits();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'unité",
        variant: "destructive",
      });
    }
  };

  const deleteUnit = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/units/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de l\'unité');
      }

      toast({
        title: "Succès",
        description: "Unité supprimée avec succès",
      });

      fetchUnits();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'unité",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  return {
    units,
    loading,
    createUnit,
    updateUnit,
    deleteUnit,
    fetchUnits,
  };
};
