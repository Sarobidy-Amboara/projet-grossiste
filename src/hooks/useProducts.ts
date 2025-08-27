import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Définition locale du type Product pour éviter les dépendances Supabase
export interface Product {
  id: string;
  name: string;
  description?: string;
  category_id: string;
  supplier_id?: string;
  unite_base_id?: string;
  unit?: string;
  barcode?: string;
  batch_number?: string;
  expiry_date?: string;
  image_url?: string;
  is_active: boolean;
  tax_rate?: number;
  category_name?: string;
  category_color?: string;
  supplier_name?: string;
  unit_base_name?: string;
  unit_base_abbreviation?: string;
  created_at?: string;
  updated_at?: string;
}

const API_BASE_URL = 'http://localhost:3001/api';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/products`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des produits');
      }
      
      const data = await response.json();
      
      // Transformer les données pour correspondre au type Product
      const normalizedProducts = data.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        category_id: row.category_id,
        supplier_id: row.supplier_id,
        unite_base_id: row.unite_base_id,
        unit: row.unit,
        barcode: row.barcode,
        batch_number: row.batch_number,
        expiry_date: row.expiry_date,
        image_url: row.image_url,
        is_active: Boolean(row.is_active),
        tax_rate: row.tax_rate,
        category_name: row.category_name,
        category_color: row.category_color,
        supplier_name: row.supplier_name,
        unit_base_name: row.unit_base_name,
        unit_base_abbreviation: row.unit_base_abbreviation,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      setProducts(normalizedProducts);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du produit');
      }

      const result = await response.json();

      toast({
        title: "Succès",
        description: "Produit créé avec succès",
      });

      fetchProducts();
      return result;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le produit",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du produit');
      }

      toast({
        title: "Succès",
        description: "Produit mis à jour avec succès",
      });

      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le produit",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du produit');
      }

      toast({
        title: "Succès",
        description: "Produit supprimé avec succès",
      });

      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts,
  };
};