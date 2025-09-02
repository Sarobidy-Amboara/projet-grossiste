import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:3001';

interface PriceTier {
  id: string;
  product_id: string;
  tier_name: string;
  min_quantity: number;
  max_quantity?: number;
  unit_price: number;
  is_active: boolean;
  created_at: string;
}

interface PriceCalculation {
  unit_price: number;
  tier_name: string;
}

interface CreatePriceTiersData {
  product_id: string;
  tiers: {
    tier_name: string;
    min_quantity: number;
    max_quantity?: number;
    unit_price: number;
  }[];
}

export const usePriceTiers = () => {
  const [priceTiers, setPriceTiers] = useState<Record<string, PriceTier[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPriceTiers = async (productId: string): Promise<PriceTier[]> => {
    setLoading(true);
    setError(null);
    try {
      console.log('Récupération des paliers pour:', productId);
      const response = await fetch(`${API_BASE_URL}/api/price-tiers/${productId}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des prix par paliers');
      }
      const data = await response.json();
      console.log('Réponse API:', data);
      setPriceTiers(prev => ({ ...prev, [productId]: data }));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('Erreur lors de la récupération des prix par paliers:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = async (productId: string, quantity: number): Promise<PriceCalculation> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/price-tiers/${productId}/calculate/${quantity}`);
      if (!response.ok) {
        throw new Error('Erreur lors du calcul du prix');
      }
      return await response.json();
    } catch (err) {
      console.error('Erreur lors du calcul du prix:', err);
      return { unit_price: 0, tier_name: 'detail' };
    }
  };

  const createPriceTiers = async (tiersData: CreatePriceTiersData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/price-tiers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tiersData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création des prix par paliers');
      }

      // Refresh les données pour ce produit
      await fetchPriceTiers(tiersData.product_id);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur lors de la création des prix par paliers:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deletePriceTier = async (tierId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/price-tiers/${tierId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du palier');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur lors de la suppression du palier:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getTierForQuantity = (productId: string, quantity: number): PriceTier | null => {
    const tiers = priceTiers[productId];
    if (!tiers) return null;

    // Trouver le palier approprié pour la quantité
    return tiers
      .filter(tier => 
        tier.is_active && 
        quantity >= tier.min_quantity && 
        (!tier.max_quantity || quantity <= tier.max_quantity)
      )
      .sort((a, b) => b.min_quantity - a.min_quantity)[0] || null;
  };

  const formatTierName = (tierName: string): string => {
    const translations: Record<string, string> = {
      'detail': 'Détail',
      'demi_gros': 'Demi-gros',
      'gros': 'Gros',
      'super_gros': 'Super gros'
    };
    return translations[tierName] || tierName;
  };

  const calculateSavings = (basePrice: number, tierPrice: number, quantity: number): number => {
    return (basePrice - tierPrice) * quantity;
  };

  return {
    priceTiers,
    loading,
    error,
    fetchPriceTiers,
    calculatePrice,
    createPriceTiers,
    deletePriceTier,
    getTierForQuantity,
    formatTierName,
    calculateSavings,
  };
};
