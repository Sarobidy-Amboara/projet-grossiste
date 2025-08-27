import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export interface SaleItem {
  id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_price: number;
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
      // Fetch sales logic here without Supabase

      // const { data, error } = await supabase
      //   .from("sales")
      //   .select(`
      //     *,
      //     customers(name, type),
      //     profiles(first_name, last_name),
      //     sale_items(
      //       *,
      //       products(name, unit)
      //     )
      //   `)
      //   .order('created_at', { ascending: false });

      if (error) throw error;
      setSales((data as unknown as Sale[]) || []);
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
    items: Omit<SaleItem, 'id'>[];
  }) => {
    try {

      // const { data: { user } } = await supabase.auth.getUser();
      // if (!user) throw new Error("Utilisateur non connecté");

      // Créer la vente (sale_number sera généré automatiquement)
      // const { data: sale, error: saleError } = await supabase
      //   .from("sales")
      //   .insert({
      //     customer_id: saleData.customer_id,
      //     user_id: user.id,
      //     total_amount: saleData.total_amount,
      //     tax_amount: saleData.tax_amount,
      //     discount_amount: saleData.discount_amount,
      //     final_amount: saleData.final_amount,
      //     payment_method: saleData.payment_method,
      //     status: 'finalise' as const,
      //     notes: saleData.notes,
      //   } as any)
      //   .select()
      //   .single();

      if (saleError) throw saleError;

      // Créer les détails de vente
      const saleItems = saleData.items.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage,
        total_price: item.total_price,
      }));

      // const { error: itemsError } = await supabase
      //   .from("sale_items")
      //   .insert(saleItems);

      if (itemsError) throw itemsError;

      // Mettre à jour les stocks
      for (const item of saleData.items) {
        // const { data: product } = await supabase
        //   .from("products")
        //   .select("stock_quantity")
        //   .eq('id', item.product_id)
        //   .single();

        if (product) {
          await supabase
            .from("products")
            .update({ stock_quantity: product.stock_quantity - item.quantity })
            .eq('id', item.product_id);
        }
      }

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
      // const { data, error } = await supabase
      //   .from("sales")
      //   .update({ status })
      //   .eq('id', id)
      //   .select()
      //   .single();

      if (error) throw error;

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
      // const { data, error } = await supabase
      //   .from("sales")
      //   .select(`
      //     *,
      //     customers(name, type),
      //     sale_items(
      //       *,
      //       products(name, unit)
      //     )
      //   `)
      //   .gte('sale_date', startDate)
      //   .lte('sale_date', endDate)
      //   .eq('status', 'finalise')
      //   .order('sale_date', { ascending: false });

      if (error) throw error;
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