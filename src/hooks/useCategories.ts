import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Définition locale du type Category pour éviter les dépendances Supabase
export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = 'http://localhost:3001';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des catégories');
      }
      
      const data = await response.json();
      
      const normalizedCategories = data.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        color: row.color,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      setCategories(normalizedCategories);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les catégories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la création de la catégorie');
      }
      
      const newCategory = await response.json();

      toast({
        title: "Succès",
        description: "Catégorie créée avec succès",
      });

      fetchCategories();
      return newCategory;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la catégorie",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<Category>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de la catégorie');
      }
      
      const updatedCategory = await response.json();

      toast({
        title: "Succès",
        description: "Catégorie mise à jour avec succès",
      });
      fetchCategories();
      return updatedCategory;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la catégorie",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de la catégorie');
      }

      toast({
        title: "Succès",
        description: "Catégorie supprimée avec succès",
      });
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la catégorie",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
};