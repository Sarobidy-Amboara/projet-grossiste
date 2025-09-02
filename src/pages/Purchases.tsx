import { useState, useEffect } from 'react';
import { Plus, ShoppingCart, Trash2, Edit2, Users, Search, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useProducts } from '@/hooks/useProducts';
import { useUnits } from '@/hooks/useUnits';
import { usePurchases } from '@/hooks/usePurchases';
import { useCategories } from '@/hooks/useCategories';
import { useUnitConversions } from '@/hooks/useUnitConversions';
import { PurchaseDetailsModal } from '@/components/PurchaseDetailsModal';
import { exportToExcel, formatDateForExcel, formatCurrencyForExcel } from '@/lib/excel-export';

interface PurchaseItem {
  id: string;
  product: any;
  quantity: number;
  unit: any;
  unitPrice: number;
  totalPrice: number;
}

interface PurchaseOrder {
  id: string;
  supplier: any;
  items: PurchaseItem[];
  totalAmount: number;
  date: string;
  status: 'pending' | 'confirmed' | 'received';
}

export default function Purchases() {
  const { toast } = useToast();
  const { suppliers, loading: suppliersLoading, createSupplier, updateSupplier, deleteSupplier, refetch: fetchSuppliers } = useSuppliers();
  const { products, loading: productsLoading, refetch: fetchProducts } = useProducts();
  const { units } = useUnits();
  const { purchases, loading: purchasesLoading, createPurchase, fetchPurchases, getPurchaseById } = usePurchases();
  const { categories, loading: categoriesLoading } = useCategories();
  const { conversions } = useUnitConversions();

  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Purchase details modal state
  const [selectedPurchaseDetails, setSelectedPurchaseDetails] = useState<any>(null);
  const [isPurchaseDetailsModalOpen, setIsPurchaseDetailsModalOpen] = useState(false);

  // New item form state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);

  // Supplier management state
  const [isAddSupplierDialogOpen, setIsAddSupplierDialogOpen] = useState(false);
  const [isEditSupplierDialogOpen, setIsEditSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
  });

  // Product search and filtering
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'all' || product.category_id === selectedCategoryFilter;
    return matchesSearch && matchesCategory && product.is_active;
  });

  // Fonction utilitaire pour calculer le stock dans une unité spécifique
  const getStockInUnit = (product: any, targetUnitId?: string) => {
    const baseStock = product.stock_quantity || 0;
    
    if (!targetUnitId || targetUnitId === product.unite_base_id) {
      return {
        quantity: baseStock,
        unit: product.unit_base_abbreviation || 'u'
      };
    }

    // Chercher la conversion pour l'unité cible
    const conversion = conversions.find(c => 
      c.product_id === product.id && c.unit_id === targetUnitId
    );

    if (conversion && conversion.equivalent_quantity > 0) {
      const convertedStock = Math.floor(baseStock / conversion.equivalent_quantity);
      const unit = units.find(u => u.id === targetUnitId);
      return {
        quantity: convertedStock,
        unit: unit?.abbreviation || 'u'
      };
    }

    return {
      quantity: baseStock,
      unit: product.unit_base_abbreviation || 'u'
    };
  };

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
    fetchPurchases();
    // Charger toutes les conversions d'unités
    conversions; // Le hook useUnitConversions charge automatiquement les données
  }, []); // Dépendances vides pour éviter la boucle infinie

  const addItemToCart = () => {
    if (!selectedProduct || !selectedUnit || quantity <= 0 || unitPrice <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      product: selectedProduct,
      quantity,
      unit: selectedUnit,
      unitPrice,
      totalPrice: quantity * unitPrice,
    };

    setPurchaseItems([...purchaseItems, newItem]);
    
    // Reset form
    setSelectedProduct(null);
    setSelectedUnit(null);
    setQuantity(1);
    setUnitPrice(0);
    setIsAddItemDialogOpen(false);

    toast({
      title: "Succès",
      description: "Produit ajouté au panier",
    });
  };

  // Nouvelle fonction pour ajouter directement un produit au panier (style Point de Vente)
  const addProductToCart = (product: any) => {
    // Trouver l'unité de base du produit
    const baseUnit = units.find(u => u.id === product.unite_base_id) || units[0];
    
    if (!baseUnit) {
      toast({
        title: "Erreur",
        description: "Aucune unité disponible pour ce produit",
        variant: "destructive",
      });
      return;
    }

    const existingItem = purchaseItems.find(item => item.product.id === product.id && item.unit.id === baseUnit.id);
    
    if (existingItem) {
      // Si le produit avec la même unité est déjà dans le panier, augmenter la quantité
      updateItemQuantity(existingItem.id, existingItem.quantity + 1);
      toast({
        title: "Quantité mise à jour",
        description: `${product.name} - Quantité: ${existingItem.quantity + 1}`,
      });
    } else {
      // Sinon, ajouter le produit avec des valeurs par défaut
      const newItem: PurchaseItem = {
        id: Date.now().toString(),
        product: product,
        quantity: 1,
        unit: baseUnit,
        unitPrice: 0, // Prix à saisir dans le panier
        totalPrice: 0,
      };

      setPurchaseItems([...purchaseItems, newItem]);
      
      toast({
        title: "Produit ajouté",
        description: `${product.name} ajouté au panier`,
      });
    }
  };

  const removeItemFromCart = (itemId: string) => {
    setPurchaseItems(purchaseItems.filter(item => item.id !== itemId));
    toast({
      title: "Succès",
      description: "Produit retiré du panier",
    });
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    setPurchaseItems(purchaseItems.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice }
        : item
    ));
  };

  const updateItemUnitPrice = (itemId: string, newUnitPrice: number) => {
    if (newUnitPrice < 0) return;
    
    setPurchaseItems(purchaseItems.map(item => 
      item.id === itemId 
        ? { ...item, unitPrice: newUnitPrice, totalPrice: item.quantity * newUnitPrice }
        : item
    ));
  };

  const getTotalAmount = () => {
    return purchaseItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const createPurchaseOrder = async () => {
    // Validation du fournisseur
    if (!selectedSupplier) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fournisseur",
        variant: "destructive",
      });
      return;
    }

    // Validation des articles
    if (purchaseItems.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un produit",
        variant: "destructive",
      });
      return;
    }

    // Validation de chaque article
    const invalidItems = purchaseItems.filter(item => 
      !item.product || !item.unit || item.quantity <= 0 || item.unitPrice <= 0
    );

    if (invalidItems.length > 0) {
      toast({
        title: "Erreur",
        description: "Tous les articles doivent avoir une quantité et un prix valides",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('📦 Création de la commande d\'achat avec:', {
        supplier: selectedSupplier.name,
        items: purchaseItems.length,
        total: getTotalAmount()
      });

      const purchaseData = {
        supplier_id: selectedSupplier.id,
        items: purchaseItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_id: item.unit.id,
          unit_price: item.unitPrice,
        }))
      };

      const result = await createPurchase(purchaseData);
      
      console.log('✅ Commande créée avec succès:', result);

      // Reset form
      setSelectedSupplier(null);
      setPurchaseItems([]);

      // Refresh data to update stock display and purchases list
      await Promise.all([
        fetchProducts(),
        fetchPurchases()
      ]);

      toast({
        title: "Succès",
        description: `Commande d'achat créée avec succès. Stock mis à jour.`,
      });
    } catch (error) {
      console.error('❌ Erreur lors de la création de la commande:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de la commande",
        variant: "destructive",
      });
    }
  };

  const handleViewPurchaseDetails = async (purchaseId: string) => {
    try {
      const purchaseDetails = await getPurchaseById(purchaseId);
      setSelectedPurchaseDetails(purchaseDetails);
      setIsPurchaseDetailsModalOpen(true);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de l'achat",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'En attente', variant: 'secondary' as const },
      confirmed: { label: 'Confirmée', variant: 'default' as const },
      received: { label: 'Reçue', variant: 'default' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Supplier management functions
  const handleCreateSupplier = async () => {
    if (!supplierForm.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du fournisseur est requis",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSupplier({
        ...supplierForm,
        is_active: true,
      });
      
      // Actualiser la liste des fournisseurs
      await fetchSuppliers();
      
      setSupplierForm({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
      });
      setIsAddSupplierDialogOpen(false);
      
      toast({
        title: "Succès",
        description: "Fournisseur créé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du fournisseur",
        variant: "destructive",
      });
    }
  };

  const handleEditSupplier = (supplier: any) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name || '',
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
    });
    setIsEditSupplierDialogOpen(true);
  };

  const handleUpdateSupplier = async () => {
    if (!supplierForm.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du fournisseur est requis",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateSupplier(editingSupplier.id, supplierForm);
      
      // Actualiser la liste des fournisseurs
      await fetchSuppliers();
      
      setSupplierForm({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
      });
      setIsEditSupplierDialogOpen(false);
      setEditingSupplier(null);
      
      toast({
        title: "Succès",
        description: "Fournisseur modifié avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification du fournisseur",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    try {
      await deleteSupplier(supplierId);
      
      // Actualiser la liste des fournisseurs
      await fetchSuppliers();
      
      toast({
        title: "Succès",
        description: "Fournisseur supprimé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du fournisseur",
        variant: "destructive",
      });
    }
  };

  const exportPurchases = () => {
    const exportData = purchases.map(purchase => ({
      'Numéro Commande': purchase.id,
      'Fournisseur': purchase.supplier_name || `Fournisseur #${purchase.supplier_id}`,
      'Date': formatDateForExcel(purchase.date),
      'Statut': purchase.status === 'pending' ? 'En attente' :
                purchase.status === 'confirmed' ? 'Confirmée' : 'Reçue',
      'Montant Total': formatCurrencyForExcel(purchase.total_amount),
      'Nombre d\'articles': purchase.items?.length || 0
    }));

    const success = exportToExcel({
      filename: `historique_achats_${new Date().toISOString().split('T')[0]}`,
      data: exportData,
      sheetName: 'Historique Achats'
    });

    if (success) {
      toast({
        title: "Export réussi",
        description: "L'historique des achats a été exporté vers Excel",
      });
    } else {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les données",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Achats</h1>
      </div>

      <Tabs defaultValue="purchases" className="w-full">
        <TabsList>
          <TabsTrigger value="purchases">Nouvelle Commande</TabsTrigger>
          <TabsTrigger value="suppliers">Gestion Fournisseurs</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="space-y-6">
          <div className="flex h-[calc(100vh-200px)] gap-6">
            {/* Colonne Produits - Gauche */}
            <div className="flex-1 flex flex-col bg-card border border-border rounded-lg shadow-ambient">
              <div className="p-4 border-b border-border">
                <h3 className="text-lg font-semibold mb-4">Sélection des Produits</h3>
                
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

                {/* Filtres par catégorie */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Catégories</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedCategoryFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategoryFilter('all')}
                      className="text-xs"
                    >
                      Tous
                    </Button>
                    {categoriesLoading ? (
                      <Badge variant="secondary" className="text-xs">Chargement...</Badge>
                    ) : (
                      categories.map(category => (
                        <Button
                          key={category.id}
                          variant={selectedCategoryFilter === category.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedCategoryFilter(category.id)}
                          className="text-xs"
                        >
                          {category.name}
                        </Button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Grille de produits */}
              <div className="flex-1 overflow-auto p-4">
                {productsLoading ? (
                  <div className="text-center text-muted-foreground py-8">
                    Chargement des produits...
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Aucun produit disponible
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map(product => (
                      <Card 
                        key={product.id} 
                        className="cursor-pointer hover:shadow-primary transition-all duration-300 shadow-ambient"
                        onClick={() => addProductToCart(product)}
                      >
                        <CardContent className="p-4">
                          <div className="mb-3">
                            <h3 className="font-semibold text-sm">{product.name}</h3>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {product.category_name || 'Sans catégorie'}
                            </Badge>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Stock:</span>
                              <Badge 
                                variant={product.stock_quantity > 10 ? "default" : product.stock_quantity > 0 ? "secondary" : "destructive"}
                                className="text-xs font-medium"
                              >
                                {product.stock_quantity || 0} {product.unit_base_abbreviation || 'u'}
                              </Badge>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {product.unit_base_name || 'unité'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Colonne Panier d'Achat - Droite */}
            <div className="w-96 bg-card border border-border rounded-lg flex flex-col shadow-ambient h-full">
              <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
                <h3 className="text-xl font-bold">Commande d'Achat</h3>
                <ShoppingCart className="h-5 w-5" />
              </div>

              {/* Sélection Fournisseur */}
              <div className="p-6 pb-4">
                <Label htmlFor="supplier">Fournisseur *</Label>
                <Select value={selectedSupplier?.id || ""} onValueChange={(value) => {
                  const supplier = suppliers.find(s => s.id === value);
                  setSelectedSupplier(supplier);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedSupplier && (
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    <p><strong>Contact:</strong> {selectedSupplier.contact_person}</p>
                    <p><strong>Tél:</strong> {selectedSupplier.phone}</p>
                  </div>
                )}
              </div>

              {/* Articles du panier */}
              <div className="flex-1 overflow-auto px-6">
                {purchaseItems.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Panier vide</p>
                    <p className="text-sm">Sélectionnez des produits</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {purchaseItems.map(item => (
                      <div key={item.id} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{item.product.name}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => removeItemFromCart(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <Label className="text-xs">Quantité</Label>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.id, parseFloat(e.target.value) || 1)}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Prix unitaire (MGA)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItemUnitPrice(item.id, parseFloat(e.target.value) || 0)}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                        
                        <div className="mb-2">
                          <Label className="text-xs">Unité d'achat</Label>
                          <Select 
                            value={item.unit.id} 
                            onValueChange={(value) => {
                              const newUnit = units.find(u => u.id === value);
                              if (newUnit) {
                                setPurchaseItems(purchaseItems.map(cartItem => 
                                  cartItem.id === item.id 
                                    ? { ...cartItem, unit: newUnit }
                                    : cartItem
                                ));
                              }
                            }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {/* Unité de base toujours en premier */}
                              {units.filter(u => u.id == item.product.unite_base_id || u.id === String(item.product.unite_base_id)).map((unit) => (
                                <SelectItem key={`base-${unit.id}`} value={unit.id}>
                                  {unit.name} ({unit.abbreviation}) - Unité de base
                                </SelectItem>
                              ))}
                              
                              {/* Unités de conversion configurées */}
                              {conversions
                                .filter(c => c.product_id === item.product.id && c.unit_id != item.product.unite_base_id && c.unit_id !== String(item.product.unite_base_id))
                                .map(conversion => {
                                  const unit = units.find(u => u.id === conversion.unit_id);
                                  return unit ? (
                                    <SelectItem key={`conv-${unit.id}`} value={unit.id}>
                                      {unit.name} ({unit.abbreviation}) - 1 {unit.abbreviation} = {conversion.equivalent_quantity} {item.product.unit_base_abbreviation || 'unité'}
                                    </SelectItem>
                                  ) : null;
                                })
                              }
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            {(() => {
                              // Affichage de l'impact sur le stock selon l'unité sélectionnée
                              const conversion = conversions.find(c => 
                                c.product_id === item.product.id && c.unit_id === item.unit.id
                              );
                              if (conversion && conversion.unit_id !== item.product.unite_base_id) {
                                const totalUnitsAdded = item.quantity * conversion.equivalent_quantity;
                                return `Cette commande ajoutera ${totalUnitsAdded} ${item.product.unit_base_abbreviation || 'unité'}(s) au stock`;
                              } else {
                                return `Cette commande ajoutera ${item.quantity} ${item.product.unit_base_abbreviation || 'unité'}(s) au stock`;
                              }
                            })()}
                          </p>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Total:</span>
                          <span className="font-medium text-sm">{item.totalPrice.toLocaleString()} MGA</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total et validation */}
              {purchaseItems.length > 0 && (
                <div className="border-t border-border p-6 pt-4 mt-auto">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Articles ({purchaseItems.length})</span>
                      <span>{getTotalAmount().toLocaleString()} MGA</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total de la commande</span>
                      <span className="text-primary">
                        {getTotalAmount().toLocaleString()} MGA
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={createPurchaseOrder} 
                    className="w-full"
                    disabled={!selectedSupplier || purchaseItems.length === 0 || purchasesLoading}
                  >
                    {purchasesLoading ? "Création..." : "Créer la Commande d'Achat"}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full mt-2"
                    onClick={() => setPurchaseItems([])}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Vider le panier
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

    <TabsContent value="suppliers" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion des Fournisseurs
            <Dialog open={isAddSupplierDialogOpen} onOpenChange={setIsAddSupplierDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="ml-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Fournisseur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un Fournisseur</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom *</Label>
                    <Input
                      id="name"
                      value={supplierForm.name}
                      onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                      placeholder="Nom du fournisseur"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">Personne de contact</Label>
                    <Input
                      id="contact"
                      value={supplierForm.contact_person}
                      onChange={(e) => setSupplierForm({...supplierForm, contact_person: e.target.value})}
                      placeholder="Nom du contact"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={supplierForm.email}
                      onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                      placeholder="email@exemple.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={supplierForm.phone}
                      onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                      placeholder="Numéro de téléphone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      value={supplierForm.address}
                      onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                      placeholder="Adresse complète"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddSupplierDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateSupplier}>
                    Créer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suppliersLoading ? (
            <p className="text-center text-muted-foreground py-8">
              Chargement des fournisseurs...
            </p>
          ) : suppliers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun fournisseur trouvé. Ajoutez-en un pour commencer.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.contact_person || '-'}</TableCell>
                    <TableCell>{supplier.email || '-'}</TableCell>
                    <TableCell>{supplier.phone || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSupplier(supplier)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSupplier(supplier.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Supplier Dialog */}
      <Dialog open={isEditSupplierDialogOpen} onOpenChange={setIsEditSupplierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le Fournisseur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom *</Label>
              <Input
                id="edit-name"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                placeholder="Nom du fournisseur"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact">Personne de contact</Label>
              <Input
                id="edit-contact"
                value={supplierForm.contact_person}
                onChange={(e) => setSupplierForm({...supplierForm, contact_person: e.target.value})}
                placeholder="Nom du contact"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                placeholder="email@exemple.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Téléphone</Label>
              <Input
                id="edit-phone"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                placeholder="Numéro de téléphone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Adresse</Label>
              <Input
                id="edit-address"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                placeholder="Adresse complète"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditSupplierDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateSupplier}>
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>

    <TabsContent value="history" className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Historique des Commandes d'Achat</CardTitle>
            <Button variant="outline" onClick={exportPurchases} disabled={purchases.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exporter Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {purchasesLoading ? (
            <p className="text-center text-muted-foreground py-8">
              Chargement des commandes...
            </p>
          ) : purchases.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune commande d'achat trouvée
            </p>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <Card key={purchase.id} className="border border-border">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-medium">{purchase.supplier_name || `Fournisseur #${purchase.supplier_id}`}</p>
                        <p className="text-sm text-muted-foreground">Commande #{purchase.id}</p>
                        <p className="text-sm text-muted-foreground">{purchase.date}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(purchase.status)}
                        <p className="text-lg font-bold mt-1">{purchase.total_amount.toLocaleString()} MGA</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => handleViewPurchaseDetails(purchase.id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Détails
                        </Button>
                      </div>
                    </div>
                    
                    {purchase.items && purchase.items.length > 0 && (
                      <div className="text-sm">
                        <p className="text-muted-foreground mb-2">{purchase.items.length} produit(s):</p>
                        <div className="max-h-32 overflow-y-auto">
                          {purchase.items.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex justify-between py-1">
                              <span className="truncate">{item.product_name} ({item.quantity} {item.unit_abbreviation})</span>
                              <span className="ml-2">{(item.quantity * item.unit_price).toLocaleString()} MGA</span>
                            </div>
                          ))}
                          {purchase.items.length > 3 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              +{purchase.items.length - 3} autres produits...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>

      {/* Modal des détails d'achat */}
      <PurchaseDetailsModal
        purchase={selectedPurchaseDetails}
        isOpen={isPurchaseDetailsModalOpen}
        onClose={() => {
          setIsPurchaseDetailsModalOpen(false);
          setSelectedPurchaseDetails(null);
        }}
      />
    </div>
  );
}
