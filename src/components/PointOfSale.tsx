import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Smartphone, 
  Banknote,
  Calculator,
  Search,
  User
} from "lucide-react";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useCustomers } from "@/hooks/useCustomers";
import { useSales } from "@/hooks/useSales";
import { useToast } from "@/hooks/use-toast";

interface CartItem extends Product {
  quantity: number;
}

const PointOfSale = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [defaultCustomer, setDefaultCustomer] = useState<any>(null);

  const { products, loading: productsLoading } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();
  const { getDefaultCustomer } = useCustomers();
  const { createSale } = useSales();
  const { toast } = useToast();

  useEffect(() => {
    const fetchDefaultCustomer = async () => {
      const customer = await getDefaultCustomer();
      setDefaultCustomer(customer);
    };
    fetchDefaultCustomer();
  }, []);

  const categoriesWithAll = [
    { id: "all", name: "Tous", color: "amber" },
    ...categories
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory && product.is_active && product.stock_quantity > 0;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id 
            ? { ...item, quantity: Math.min(item.quantity + 1, item.stock_quantity) }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
      return;
    }
    
    setCart(prev => prev.map(item => 
      item.id === id 
        ? { ...item, quantity: Math.min(quantity, item.stock_quantity) }
        : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const taxAmount = Math.round(cartTotal * 0.2);
  const finalAmount = cartTotal + taxAmount;

  const handlePayment = async (method: 'especes' | 'mobile_money' | 'virement' | 'credit' | 'mixte') => {
    if (cart.length === 0 || !defaultCustomer) return;
    
    try {
      const saleData = {
        customer_id: defaultCustomer.id,
        total_amount: cartTotal,
        tax_amount: taxAmount,
        discount_amount: 0,
        final_amount: finalAmount,
        payment_method: method,
        notes: `Vente au comptoir - ${cart.length} article(s)`,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percentage: 0,
          total_price: item.unit_price * item.quantity,
        }))
      };

      const sale = await createSale(saleData);
      
      // Vider le panier après paiement réussi
      setCart([]);
      
      toast({
        title: "Vente effectuée",
        description: `Ticket ${sale.sale_number} généré avec succès`,
      });
    } catch (error) {
      console.error("Erreur lors de la vente:", error);
    }
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Colonne Produits */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">Point de Vente</h2>
          
          {/* Barre de recherche */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Catégories */}
          <div className="flex flex-wrap gap-2">
            {categoriesWithAll.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "tropical" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Grille de produits */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <Card 
                key={product.id} 
                className="cursor-pointer hover:shadow-primary transition-all duration-300 shadow-ambient"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-sm">{product.name}</h3>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {product.categories?.name || 'Sans catégorie'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-primary">
                      {product.unit_price.toLocaleString()} MGA
                    </span>
                    <Badge 
                      variant={product.stock_quantity < product.min_stock_level ? "destructive" : "default"}
                      className="text-xs"
                    >
                      Stock: {product.stock_quantity}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Colonne Panier */}
      <div className="w-96 bg-card border-l border-border p-6 flex flex-col shadow-ambient">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Panier</h3>
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Client DIVERS</span>
          </div>
        </div>

        {/* Articles du panier */}
        <div className="flex-1 overflow-auto mb-6">
          {cart.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Panier vide</p>
              <p className="text-sm">Sélectionnez des produits</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {item.unit_price.toLocaleString()} MGA × {item.quantity}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock_quantity}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Résumé et paiement */}
        {cart.length > 0 && (
          <>
            <Separator className="mb-4" />
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Articles ({cartItems})</span>
                <span>{cartTotal.toLocaleString()} MGA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>TVA (20%)</span>
                <span>{taxAmount.toLocaleString()} MGA</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total TTC</span>
                <span className="text-primary">
                  {finalAmount.toLocaleString()} MGA
                </span>
              </div>
            </div>

            {/* Boutons de paiement */}
            <div className="space-y-2">
              <Button 
                variant="tropical" 
                className="w-full"
                onClick={() => handlePayment("especes")}
              >
                <Banknote className="w-4 h-4 mr-2" />
                Payer en Espèces
              </Button>
              
              <Button 
                variant="amber" 
                className="w-full"
                onClick={() => handlePayment("mobile_money")}
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Mobile Money
              </Button>
              
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => handlePayment("virement")}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Carte Bancaire
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full mt-2"
                onClick={clearCart}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Vider le panier
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PointOfSale;