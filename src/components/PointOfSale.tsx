// Déclaration pour TypeScript de la propriété lastCashReceived sur window
declare global {
  interface Window {
    lastCashReceived?: number;
  }
}
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useUnits } from "@/hooks/useUnits";
import { useUnitConversions } from "@/hooks/useUnitConversions";
import { useToast } from "@/hooks/use-toast";

interface CartItem extends Product {
  quantity: number;
  selected_unit_id: string;
  selected_unit_name: string;
  unit_price: number; // Prix de vente selon l'unité et la quantité
  is_wholesale: boolean;
  tier_name: string;
  available_prices: PriceTier[]; // Prix disponibles pour ce produit
}

interface PriceTier {
  id?: string;
  tier_name: string;
  unit_price: number;
  min_quantity: number;
  max_quantity?: number;
  unit_id?: string;
  unit_name?: string;
  unit_abbreviation?: string;
}

const PointOfSale = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCashPayment, setShowCashPayment] = useState(false);
  const [cashReceived, setCashReceived] = useState<string>("");
  const [cashChange, setCashChange] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [productPrices, setProductPrices] = useState<{[key: string]: any[]}>({});
  const [productConversions, setProductConversions] = useState<{[key: string]: any[]}>({});
  const [defaultCustomer, setDefaultCustomer] = useState<any>(null);
  const [taxSettings, setTaxSettings] = useState({ enable_tax: true, tax_rate: 20 });
  const [companySettings, setCompanySettings] = useState({ 
    company_name: "MADA BREW BOSS", 
    company_nif: "", 
    company_stat: "",
    receipt_footer: "" 
  });

  const { products, loading: productsLoading, refetch: refetchProducts } = useProducts(true); // Seulement les produits actifs
  const { categories, loading: categoriesLoading } = useCategories();
  const { customers, getDefaultCustomer } = useCustomers();
  const { createSale } = useSales();
  const { units } = useUnits();
  const { conversions } = useUnitConversions();
  const { toast } = useToast();

  // Charger les paramètres de TVA et de l'entreprise
  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        const enableTax = data.find((s: any) => s.key === 'enable_tax');
        const taxRate = data.find((s: any) => s.key === 'tax_rate');
        const companyName = data.find((s: any) => s.key === 'company_name');
        const companyNif = data.find((s: any) => s.key === 'company_nif');
        const companyStat = data.find((s: any) => s.key === 'company_stat');
        const receiptFooter = data.find((s: any) => s.key === 'receipt_footer');
        
        setTaxSettings({
          enable_tax: enableTax ? enableTax.value === 'true' : true,
          tax_rate: taxRate ? parseFloat(taxRate.value) : 20
        });
        
        setCompanySettings({
          company_name: companyName ? companyName.value : "MADA BREW BOSS",
          company_nif: companyNif ? companyNif.value : "",
          company_stat: companyStat ? companyStat.value : "",
          receipt_footer: receiptFooter ? receiptFooter.value : ""
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  };

  useEffect(() => {
    const fetchDefaultCustomer = async () => {
      const customer = await getDefaultCustomer();
      setDefaultCustomer(customer);
      setSelectedCustomer(customer); // Par défaut, sélectionner "Client DIVERS"
    };
    fetchDefaultCustomer();
    loadSettings();
  }, []);

  const categoriesWithAll = [
    { id: "all", name: "Tous", color: "amber" },
    ...categories
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory && product.stock_quantity > 0; // Plus besoin de filtrer par is_active
  });

  // Charger les prix configurés pour tous les produits (optimisé)
  useEffect(() => {
    const loadProductPrices = async () => {
      const pricesMap: {[key: string]: any[]} = {};
      const conversionsMap: {[key: string]: any[]} = {};
      
      for (const product of products) {
        try {
          // Charger les prix
          const priceResponse = await fetch(`/api/price-tiers/${product.id}`);
          if (priceResponse.ok) {
            const prices = await priceResponse.json();
            if (prices && prices.length > 0) {
              pricesMap[product.id] = prices;
            }
          }
          
          // Charger les conversions d'unités
          const conversionResponse = await fetch(`/api/unit-conversions?product_id=${product.id}`);
          if (conversionResponse.ok) {
            const conversionsData = await conversionResponse.json();
            conversionsMap[product.id] = conversionsData;
          }
        } catch (error) {
          console.error(`Erreur pour le produit ${product.id}:`, error);
        }
      }
      setProductPrices(pricesMap);
      setProductConversions(conversionsMap);
    };

    if (products.length > 0) {
      loadProductPrices();
    }
  }, [products]);

  // Récupérer les prix configurés pour un produit
  const getProductPrices = async (productId: string): Promise<PriceTier[]> => {
    try {
      const response = await fetch(`/api/price-tiers/${productId}`);
      if (response.ok) {
        const prices = await response.json();
        if (prices && prices.length > 0) {
          return prices;
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des prix:', error);
    }
    // Prix par défaut si pas de configuration - utiliser le prix de base du produit
    const product = products.find(p => p.id === productId);
    const defaultPrice = product?.unit_price || 1000; // Utiliser le prix unitaire du produit
    return [{ tier_name: 'Prix unitaire', unit_price: defaultPrice, min_quantity: 1 }];
  };

  // Obtenir les unités disponibles pour un produit (unité de base + conversions)
  const getAvailableUnits = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return [];

    // Unité de base
    const baseUnit = {
      unit_id: product.unite_base_id || '1',
      unit_name: product.unit || 'bouteille',
      equivalent_quantity: 1,
      prix_unitaire: product.unit_price || 0
    };

    // Unités de conversion depuis les données chargées avec leurs prix
    const productConversions = conversions.filter(c => c.product_id === productId);
    const conversionUnits = productConversions.map(c => ({
      unit_id: c.unit_id,
      unit_name: c.unit_name || 'pack',
      equivalent_quantity: c.equivalent_quantity || 1,
      prix_unitaire: c.prix_unitaire || 0
    }));
    
    return [baseUnit, ...conversionUnits];
  };

  const addToCart = async (product: Product) => {
    // Vérifier le stock disponible
    if (!product.stock_quantity || product.stock_quantity <= 0) {
      toast({
        title: "Stock insuffisant",
        description: `Le produit "${product.name}" n'est plus en stock`,
        variant: "destructive"
      });
      return;
    }

    // Vérifier si le produit est déjà dans le panier et calculer la quantité totale
    const existingItem = cart.find(item => item.id === product.id);
    const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
    
    if (currentQuantityInCart >= product.stock_quantity) {
      toast({
        title: "Stock insuffisant",
        description: `Stock disponible: ${product.stock_quantity}. Quantité dans le panier: ${currentQuantityInCart}`,
        variant: "destructive"
      });
      return;
    }

    // Créer la liste des prix disponibles
    const availablePrices = [];
    
    // 1. Prix unitaire (prix de base du produit)
    availablePrices.push({
      tier_name: 'Prix unitaire',
      unit_price: product.unit_price || 0,
      unit_id: product.unite_base_id,
      unit_name: product.unit,
      min_quantity: 1
    });
    
    // 2. Récupérer les paliers de prix
    try {
      const priceTiers = await getProductPrices(product.id);
      priceTiers.forEach(tier => {
        if (tier.tier_name !== 'Prix unitaire') {
          availablePrices.push({
            tier_name: tier.tier_name,
            unit_price: tier.unit_price,
            unit_id: product.unite_base_id,
            unit_name: product.unit,
            min_quantity: tier.min_quantity
          });
        }
      });
    } catch (error) {
      console.error('Erreur lors du chargement des paliers:', error);
    }
    
    // 3. Récupérer les conversions d'unités avec leurs prix
    const productConversions = conversions.filter(c => c.product_id === product.id);
    productConversions.forEach(conversion => {
      if (conversion.prix_unitaire && conversion.prix_unitaire > 0) {
        availablePrices.push({
          tier_name: `Prix par ${conversion.unit_name}`,
          unit_price: conversion.prix_unitaire,
          unit_id: conversion.unit_id,
          unit_name: conversion.unit_name,
          equivalent_quantity: conversion.equivalent_quantity,
          min_quantity: 1
        });
      }
    });
    
    // Prix par défaut : prix unitaire
    const defaultPrice = availablePrices[0];
    
    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id 
            ? { ...item, quantity: Math.min(item.quantity + 1, item.stock_quantity) }
            : item
        );
      }
      return [...prev, { 
        ...product, 
        quantity: 1,
        selected_unit_id: defaultPrice.unit_id,
        selected_unit_name: defaultPrice.unit_name,
        unit_price: defaultPrice.unit_price,
        is_wholesale: false,
        tier_name: defaultPrice.tier_name,
        available_prices: availablePrices
      }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
      return;
    }
    
    const product = products.find(p => p.id === id);
    if (product && quantity > product.stock_quantity) {
      toast({
        title: "Stock insuffisant",
        description: `Stock disponible: ${product.stock_quantity} pour "${product.name}"`,
        variant: "destructive"
      });
      return;
    }
    
    setCart(prev => prev.map(item => 
      item.id === id 
        ? { ...item, quantity: Math.min(quantity, item.stock_quantity) }
        : item
    ));
  };

  const updateUnit = (id: string, unitId: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const availableUnits = getAvailableUnits(item.id);
        const selectedUnit = availableUnits.find(u => u.unit_id === unitId);
        
        if (selectedUnit) {
          // Utiliser le prix configuré pour cette unité
          const unitPrice = (selectedUnit.prix_unitaire && selectedUnit.prix_unitaire > 0) 
            ? selectedUnit.prix_unitaire 
            : (item.unit_price || 0);
          
          return {
            ...item,
            selected_unit_id: unitId,
            selected_unit_name: selectedUnit.unit_name,
            unit_price: unitPrice,
            is_wholesale: false,
            tier_name: `Prix ${selectedUnit.unit_name}`
          };
        }
      }
      return item;
    }));
  };

  const updatePriceTier = (id: string, tierName: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const selectedPrice = item.available_prices.find(p => p.tier_name === tierName);
        if (selectedPrice) {
          return {
            ...item,
            tier_name: selectedPrice.tier_name,
            unit_price: selectedPrice.unit_price,
            selected_unit_id: selectedPrice.unit_id,
            selected_unit_name: selectedPrice.unit_name,
            is_wholesale: selectedPrice.tier_name !== 'Prix unitaire'
          };
        }
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calcul de la TVA basé sur les paramètres
  const isTaxEnabled = taxSettings.enable_tax;
  const taxRate = taxSettings.tax_rate / 100;
  const taxAmount = isTaxEnabled ? Math.round(cartTotal * taxRate) : 0;
  const finalAmount = cartTotal + taxAmount;

  useEffect(() => {
    if (showCashPayment) {
      const received = parseFloat(cashReceived);
      if (!isNaN(received)) {
        setCashChange(received - finalAmount);
      } else {
        setCashChange(0);
      }
    }
  }, [cashReceived, finalAmount, showCashPayment]);

  // Fonction pour générer et afficher le ticket de vente
  const generateSaleTicket = (sale: any, customer: any, items: CartItem[]) => {
    // Ajout montant payé et rendu si paiement en espèces
    let montantPaye = "-";
    let rendu = "-";
    if (sale.payment_method === "especes" && window.lastCashReceived) {
      montantPaye = `${window.lastCashReceived.toLocaleString()} MGA`;
      rendu = `${(window.lastCashReceived - finalAmount).toLocaleString()} MGA`;
    }
    const ticketContent = `
${companySettings.company_name}
${companySettings.company_nif ? `NIF: ${companySettings.company_nif}` : ''}
${companySettings.company_stat ? `STAT: ${companySettings.company_stat}` : ''}
================================
TICKET DE VENTE

N° Ticket: ${sale.sale_number}
Date: ${new Date().toLocaleString('fr-FR')}
Caissier: Admin

Client: ${customer.name}
${customer.phone ? `Tél: ${customer.phone}` : ''}
${customer.email ? `Email: ${customer.email}` : ''}

================================
DÉTAIL DE LA VENTE

${items.map(item => {
  const unitDisplay = item.selected_unit_name || item.unit || 'unité';
  
  return `${item.name}
${item.quantity} x ${item.unit_price.toLocaleString()} MGA/${unitDisplay}
  = ${(item.quantity * item.unit_price).toLocaleString()} MGA`;
}).join('\n\n')}

================================
RÉSUMÉ

Sous-total${isTaxEnabled ? ' HT' : ''}: ${cartTotal.toLocaleString()} MGA${isTaxEnabled ? `
TVA (${(taxRate * 100).toFixed(1)}%): ${taxAmount.toLocaleString()} MGA` : ''}
--------------------------------
TOTAL${isTaxEnabled ? ' TTC' : ''}: ${finalAmount.toLocaleString()} MGA

Mode de paiement: ${sale.payment_method.toUpperCase()}
${sale.payment_method === "especes" ? `\nMontant payé: ${montantPaye}\nRendu: ${rendu}` : ""}

================================
${companySettings.receipt_footer || 'Merci pour votre visite !'}
À bientôt chez ${companySettings.company_name}
    `.trim();

    // Ouvrir une nouvelle fenêtre pour imprimer le ticket
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket de vente ${sale.sale_number}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                margin: 20px;
                white-space: pre-line;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>${ticketContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handlePayment = async (method: 'especes' | 'mobile_money' | 'virement' | 'credit' | 'mixte') => {
    if (cart.length === 0 || !selectedCustomer) return;
    try {
      const saleData = {
        customer_id: selectedCustomer.id,
        total_amount: cartTotal,
        tax_amount: taxAmount,
        discount_amount: 0,
        final_amount: finalAmount,
        payment_method: method,
        notes: `Vente au comptoir - ${cart.length} article(s) - Client: ${selectedCustomer.name}`,
        sale_items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percentage: 0,
          total_price: item.unit_price * item.quantity,
          unit_id: item.selected_unit_id,
        }))
      };
      // Stocker le montant payé pour le ticket si paiement en espèces
      if (method === "especes") {
        window.lastCashReceived = parseFloat(cashReceived);
      } else {
        window.lastCashReceived = undefined;
      }
      const sale = await createSale(saleData);
      generateSaleTicket(sale, selectedCustomer, cart);
      setCart([]);
      refetchProducts();
      toast({
        title: "Vente effectuée",
        description: `Ticket ${sale.sale_number} généré avec succès`,
      });
    } catch (error) {
      console.error("Erreur lors de la vente:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la vente",
        variant: "destructive"
      });
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
            {filteredProducts.map(product => {
              const configuredPrices = productPrices[product.id] || [];
              const detailPrice = configuredPrices.find((p: any) => p.tier_name === 'detail');
              const hasGrosPrice = configuredPrices.some((p: any) => p.tier_name !== 'detail');
              
              return (
                <Card 
                  key={product.id} 
                  className="cursor-pointer hover:shadow-primary transition-all duration-300 shadow-ambient"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <h3 className="font-semibold text-sm">{product.name}</h3>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {product.category_name || 'Sans catégorie'}
                        </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        {detailPrice ? (
                          <>
                            <span className="text-lg font-bold text-green-600">
                              {detailPrice.unit_price.toLocaleString()} MGA
                            </span>
                            {hasGrosPrice && (
                              <Badge variant="secondary" className="text-xs mt-1 block w-fit">
                                Prix gros ✓
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-lg font-bold text-gray-600">
                            {(product.unit_price ?? 0).toLocaleString()} MGA
                          </span>
                        )}
                      </div>
                        <Badge 
                          variant={product.stock_quantity < 10 ? "destructive" : "default"}
                          className="text-xs"
                        >
                          Stock: {product.stock_quantity} {product.unit || "unités"}
                        </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Colonne Panier */}
      <div className="w-96 bg-card border-l border-border p-6 flex flex-col shadow-ambient">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Panier</h3>
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <Select
              value={selectedCustomer?.id || ""}
              onValueChange={(customerId) => {
                const customer = customers.find(c => c.id === customerId) || defaultCustomer;
                setSelectedCustomer(customer);
              }}
            >
              <SelectTrigger className="h-8 text-sm min-w-[120px]">
                <SelectValue placeholder="Client DIVERS" />
              </SelectTrigger>
              <SelectContent>
                {/* Client DIVERS par défaut */}
                {defaultCustomer && (
                  <SelectItem value={defaultCustomer.id}>
                    {defaultCustomer.name || 'Client DIVERS'}
                  </SelectItem>
                )}
                {/* Autres clients */}
                {customers
                  .filter(c => c.id !== defaultCustomer?.id)
                  .map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
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
                <div key={item.id} className="p-3 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {(() => {
                          // Utiliser selected_unit_name si disponible, sinon fallback sur la logique précédente
                          const unitDisplay = item.selected_unit_name || item.unit || 'unité';
                          return `${(item.unit_price || 0).toLocaleString()} MGA/${unitDisplay} × ${item.quantity}`;
                        })()}
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
                  
                  {/* Liste déroulante pour le type de prix */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">Type de prix:</span>
                    <Select
                      value={item.tier_name}
                      onValueChange={(value) => updatePriceTier(item.id, value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {item.available_prices.map((price) => (
                          <SelectItem key={price.tier_name} value={price.tier_name}>
                            <div className="flex items-center justify-between w-full">
                              <span>{price.tier_name}</span>
                              <span className="ml-2 text-muted-foreground">
                                {(price.unit_price || 0).toLocaleString()} MGA
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
              {isTaxEnabled && (
                <div className="flex justify-between text-sm">
                  <span>TVA ({(taxRate * 100).toFixed(1)}%)</span>
                  <span>{taxAmount.toLocaleString()} MGA</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total{isTaxEnabled ? ' TTC' : ''}</span>
                <span className="text-primary">
                  {finalAmount.toLocaleString()} MGA
                </span>
              </div>
            </div>

            {/* Paiement en espèces avec rendu */}
            {showCashPayment ? (
              <div className="space-y-2 mb-2">
                <label className="block text-sm font-medium mb-1">Montant payé par le client</label>
                <Input
                  type="number"
                  min={finalAmount}
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                  placeholder="Saisir le montant reçu"
                  className="mb-2"
                />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Rendu:</span>
                  <span className={cashChange < 0 ? "text-destructive" : "text-green-600"}>
                    {cashReceived ? (cashChange >= 0 ? `${cashChange.toLocaleString()} MGA` : "Montant insuffisant") : "-"}
                  </span>
                </div>
                <Button
                  variant="tropical"
                  className="w-full mt-2"
                  disabled={parseFloat(cashReceived) < finalAmount}
                  onClick={() => {
                    handlePayment("especes");
                    setShowCashPayment(false);
                    setCashReceived("");
                  }}
                >
                  Valider le paiement
                </Button>
                <Button
                  variant="ghost"
                  className="w-full mt-2"
                  onClick={() => {
                    setShowCashPayment(false);
                    setCashReceived("");
                  }}
                >
                  Annuler
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  variant="tropical"
                  className="w-full"
                  onClick={() => setShowCashPayment(true)}
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
                  Virement
                </Button>
                {selectedCustomer && selectedCustomer.name !== "Client Divers" && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handlePayment("credit")}
                  >
                    <User className="w-4 h-4 mr-2" />
                    À Crédit
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full mt-2"
                  onClick={clearCart}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Vider le panier
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PointOfSale;