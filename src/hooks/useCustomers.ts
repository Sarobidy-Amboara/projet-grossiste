import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Définition locale du type Customer pour éviter les dépendances Supabase
export interface Customer {
  id: string;
  name: string;
  type: 'particulier' | 'professionnel';
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  tax_number?: string;
  credit_limit?: number;
  current_balance?: number;
  discount_percentage?: number;
  payment_terms?: number;
  is_active?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

const API_BASE_URL = 'http://localhost:3001/api';

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/customers`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des clients');
      }
      
      const data = await response.json();
      setCustomers(data);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des clients:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du client');
      }

      const newCustomer = await response.json();
      
      toast({
        title: "Succès",
        description: "Client créé avec succès",
      });
      
      await fetchCustomers();
      return newCustomer;
    } catch (error: any) {
      console.error('Erreur lors de la création du client:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le client",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du client');
      }

      const updatedCustomer = await response.json();
      
      toast({
        title: "Succès",
        description: "Client mis à jour avec succès",
      });
      
      await fetchCustomers();
      return updatedCustomer;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du client:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le client",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression du client');
      }
      
      toast({
        title: "Succès",
        description: "Client supprimé avec succès",
      });
      
      await fetchCustomers();
    } catch (error: any) {
      console.error('Erreur lors de la suppression du client:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le client",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getDefaultCustomer = async (): Promise<Customer | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/default`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du client par défaut');
      }
      
      const defaultCustomer = await response.json();
      return defaultCustomer;
    } catch (error: any) {
      console.error("Erreur lors de la récupération du client par défaut:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return {
    customers,
    loading,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getDefaultCustomer,
    refetch: fetchCustomers,
  };
};