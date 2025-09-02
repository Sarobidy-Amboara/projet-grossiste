import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = 'http://localhost:3001';

export interface SaleItem {
  id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_price: number;
  unit_id?: string; // Unité utilisée pour la vente
  products?: {
    name: string;
    unit: string;
  };
}

export interface Sale {
  id: string;
  sale_number: string;
  customer_id?: string;
  user_id?: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: 'especes' | 'mobile_money' | 'virement' | 'credit' | 'mixte';
  status: 'en_cours' | 'finalise' | 'annule';
  notes?: string;
  sale_date: string;
  created_at: string;
  updated_at: string;
  customers?: {
    name: string;
    type: string;
  };
  profiles?: {
    first_name?: string;
    last_name?: string;
  };
  sale_items?: SaleItem[];
}

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSales = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des ventes');
      }
      
      const data = await response.json();
      setSales(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les ventes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSale = async (saleData: {
    customer_id?: string;
    total_amount: number;
    tax_amount: number;
    discount_amount: number;
    final_amount: number;
    payment_method: 'especes' | 'mobile_money' | 'virement' | 'credit' | 'mixte';
    notes?: string;
    sale_items: Omit<SaleItem, 'id'>[];
  }) => {
    try {
      // Utiliser l'API REST au lieu de Supabase
      const response = await fetch(`${API_BASE_URL}/api/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la vente');
      }

      const sale = await response.json();

      toast({
        title: "Succès",
        description: `Vente ${sale.sale_number} créée avec succès`,
      });

      fetchSales();
      return sale;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la vente",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateSaleStatus = async (id: string, status: 'en_cours' | 'finalise' | 'annule') => {
    try {
      const response = await fetch(`/api/sales/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du statut');
      }

      const data = await response.json();

      toast({
        title: "Succès",
        description: "Statut de la vente mis à jour",
      });

      fetchSales();
      return data;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getSalesByDateRange = async (startDate: string, endDate: string) => {
    try {
      const response = await fetch(`/api/sales?startDate=${startDate}&endDate=${endDate}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des ventes');
      }
      
      const data = await response.json();
      return data || [];
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les ventes par période",
        variant: "destructive",
      });
      return [];
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  return {
    sales,
    loading,
    createSale,
    updateSaleStatus,
    getSalesByDateRange,
    refetch: fetchSales,
  };
};