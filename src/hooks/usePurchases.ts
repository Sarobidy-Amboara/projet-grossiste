import { useState, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:3001/api';

export interface PurchaseItem {
  product_id: string;
  quantity: number;
  unit_id: string;
  unit_price: number;
}

export interface CreatePurchaseRequest {
  supplier_id: string;
  items: PurchaseItem[];
}

export interface Purchase {
  id: string;
  supplier_id: string;
  total_amount: number;
  date: string;
  status: 'pending' | 'confirmed' | 'received';
  supplier_name?: string;
  items?: any[];
}

export const usePurchases = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
            const response = await fetch(`${API_BASE_URL}/purchases`);
      if (!response.ok) {
        throw new Error('Failed to fetch purchases');
      }
      const data = await response.json();
      setPurchases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching purchases:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPurchase = useCallback(async (purchaseData: CreatePurchaseRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create purchase');
      }

      const newPurchase = await response.json();
      
      // Refresh the purchases list
      await fetchPurchases();
      
      return newPurchase;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error creating purchase:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPurchases]);

  const getPurchaseById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/purchases/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch purchase');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching purchase:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePurchaseStatus = useCallback(async (id: string, status: 'pending' | 'confirmed' | 'received') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/purchases/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update purchase status');
      }

      // Refresh the purchases list
      await fetchPurchases();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error updating purchase status:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPurchases]);

  return {
    purchases,
    loading,
    error,
    fetchPurchases,
    createPurchase,
    getPurchaseById,
    updatePurchaseStatus,
    refetch: fetchPurchases,
  };
};
