import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:3001';

interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: 'pourcentage' | 'montant_fixe' | 'achetez_x_obtenez_y' | 'pack_special';
  start_date: string;
  end_date: string;
  min_quantity: number;
  min_amount: number;
  discount_percentage?: number;
  discount_amount?: number;
  buy_quantity?: number;
  get_quantity?: number;
  max_uses_per_customer?: number;
  max_total_uses?: number;
  current_uses: number;
  applicable_products?: string[];
  applicable_categories?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreatePromotionData {
  name: string;
  description?: string;
  type: Promotion['type'];
  start_date: string;
  end_date: string;
  min_quantity?: number;
  min_amount?: number;
  discount_percentage?: number;
  discount_amount?: number;
  buy_quantity?: number;
  get_quantity?: number;
  max_uses_per_customer?: number;
  max_total_uses?: number;
  applicable_products?: string[];
  applicable_categories?: string[];
}

export const usePromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPromotions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/promotions`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des promotions');
      }
      const data = await response.json();
      setPromotions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('Erreur lors de la récupération des promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActivePromotions = async (productId: string): Promise<Promotion[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/promotions/active/${productId}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des promotions actives');
      }
      return await response.json();
    } catch (err) {
      console.error('Erreur lors de la récupération des promotions actives:', err);
      return [];
    }
  };

  const createPromotion = async (promotionData: CreatePromotionData): Promise<Promotion> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/promotions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promotionData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la promotion');
      }

      const newPromotion = await response.json();
      setPromotions(prev => [newPromotion, ...prev]);
      return newPromotion;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur lors de la création de la promotion:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculatePromotionDiscount = (
    promotion: Promotion, 
    totalAmount: number, 
    quantity: number
  ): number => {
    if (!promotion.is_active) return 0;
    
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);
    
    if (now < startDate || now > endDate) return 0;
    if (quantity < promotion.min_quantity) return 0;
    if (totalAmount < promotion.min_amount) return 0;
    
    switch (promotion.type) {
      case 'pourcentage':
        return totalAmount * (promotion.discount_percentage || 0) / 100;
      case 'montant_fixe':
        return promotion.discount_amount || 0;
      case 'achetez_x_obtenez_y':
        if (promotion.buy_quantity && quantity >= promotion.buy_quantity) {
          const freeItems = Math.floor(quantity / promotion.buy_quantity) * (promotion.get_quantity || 0);
          return freeItems * (totalAmount / quantity); // Prix unitaire * items gratuits
        }
        return 0;
      default:
        return 0;
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  return {
    promotions,
    loading,
    error,
    fetchPromotions,
    createPromotion,
    getActivePromotions,
    calculatePromotionDiscount,
  };
};
