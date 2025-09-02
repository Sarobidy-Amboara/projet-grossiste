import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:3001';

interface PackItem {
  product_id: string;
  quantity: number;
  product_name?: string;
}

interface ProductPack {
  id: string;
  name: string;
  description?: string;
  pack_price: number;
  is_active: boolean;
  items?: PackItem[];
  created_at: string;
  updated_at: string;
}

interface CreatePackData {
  name: string;
  description?: string;
  pack_price: number;
  items: PackItem[];
}

export const useProductPacks = () => {
  const [packs, setPacks] = useState<ProductPack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPacks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/packs`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des packs');
      }
      const data = await response.json();
      
      // Parser les items qui sont retournés en JSON string
      const parsedPacks = data.map((pack: any) => ({
        ...pack,
        items: pack.items ? JSON.parse(`[${pack.items}]`) : []
      }));
      
      setPacks(parsedPacks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('Erreur lors de la récupération des packs:', err);
    } finally {
      setLoading(false);
    }
  };

  const createPack = async (packData: CreatePackData): Promise<ProductPack> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/packs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(packData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du pack');
      }

      const newPack = await response.json();
      setPacks(prev => [newPack, ...prev]);
      return newPack;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur lors de la création du pack:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculatePackSavings = (pack: ProductPack, individualPrices: Record<string, number>): number => {
    if (!pack.items) return 0;
    
    const totalIndividualPrice = pack.items.reduce((total, item) => {
      const itemPrice = individualPrices[item.product_id] || 0;
      return total + (itemPrice * item.quantity);
    }, 0);
    
    return totalIndividualPrice - pack.pack_price;
  };

  const validatePackStock = (pack: ProductPack, stockLevels: Record<string, number>): boolean => {
    if (!pack.items) return false;
    
    return pack.items.every(item => {
      const availableStock = stockLevels[item.product_id] || 0;
      return availableStock >= item.quantity;
    });
  };

  useEffect(() => {
    fetchPacks();
  }, []);

  return {
    packs,
    loading,
    error,
    fetchPacks,
    createPack,
    calculatePackSavings,
    validatePackStock,
  };
};
