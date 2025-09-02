import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package,
  AlertTriangle,
  Boxes,
  Archive,
  ArrowDownCircle,
  DollarSign,
  Tag,
  TrendingUp,
  Filter,
  Download
} from "lucide-react";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useUnits } from "@/hooks/useUnits";
import { usePriceTiers } from "@/hooks/usePriceTiers";
import { useUnitConversions } from "@/hooks/useUnitConversions";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/excel-export";

const ProductsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // Nouveau filtre pour le statut
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  });
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    unite_base_id: "",
    barcode: "",
    unit_price: 0,
    is_active: true, // Ajout du champ actif/inactif
  });

  // États pour la gestion des prix et conversions
  const [priceTiers, setPriceTiers] = useState([
    { tier_name: "Prix unitaire", min_quantity: 1, max_quantity: null, unit_price: 0 }
  ]);
  const [unitConversions, setUnitConversions] = useState([]);
  const [showPricingSection, setShowPricingSection] = useState(false);
  
  // États pour l'affichage des prix et conversions dans la liste
  const [productPricesDisplay, setProductPricesDisplay] = useState<{[key: string]: any[]}>({});
  const [productConversionsDisplay, setProductConversionsDisplay] = useState<{[key: string]: any[]}>({});

  const { products, loading, createProduct, updateProduct, deleteProduct, refetch } = useProducts();
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories();
  const { units } = useUnits();
  const { createPriceTiers, fetchPriceTiers } = usePriceTiers();
  const { createConversion, fetchConversions } = useUnitConversions();

  // Fonction pour charger les prix et conversions pour l'affichage
  const loadProductPricesAndConversions = async () => {
    try {
      const pricesData: {[key: string]: any[]} = {};
      const conversionsData: {[key: string]: any[]} = {};
      
      for (const product of products) {
        // Charger les prix
        try {
          const prices = await fetchPriceTiers(product.id);
          if (prices && prices.length > 0) {
            pricesData[product.id] = prices;
          }
        } catch (error) {
          console.error(`Erreur lors du chargement des prix pour ${product.name}:`, error);
        }
        
        // Charger les conversions
        try {
          const response = await fetch(`/api/unit-conversions/product/${product.id}`);
          if (response.ok) {
            const conversions = await response.json();
            if (conversions && conversions.length > 0) {
              conversionsData[product.id] = conversions;
            }
          }
        } catch (error) {
          console.error(`Erreur lors du chargement des conversions pour ${product.name}:`, error);
        }
      }
      
      setProductPricesDisplay(pricesData);
      setProductConversionsDisplay(conversionsData);
    } catch (error) {
      console.error('Erreur lors du chargement des prix et conversions:', error);
    }
  };
  const { toast } = useToast();

  const categoriesWithAll = [
    { id: "all", name: "Toutes catégories" },
    ...categories
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? product.is_active : !product.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Charger les prix et conversions quand les produits changent
  useEffect(() => {
    if (products.length > 0) {
      loadProductPricesAndConversions();
    }
  }, [products]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category_id: "",
      unite_base_id: "",
      barcode: "",
      unit_price: 0,
      is_active: true, // Défaut: actif
    });
    setPriceTiers([
      { tier_name: "Prix unitaire", min_quantity: 1, max_quantity: null, unit_price: 0 }
    ]);
    setUnitConversions([]);
    setShowPricingSection(false);
    setEditingProduct(null);
  };

  const handleEdit = async (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      category_id: product.category_id || "",
      unite_base_id: product.unite_base_id || "",
      barcode: product.barcode || "",
      unit_price: product.unit_price || 0,
      is_active: product.is_active !== undefined ? product.is_active : true, // Inclure le statut actif
    });
    
    // Charger les prix et conversions existants
    try {
      console.log('🔍 Chargement des données existantes pour le produit:', product.id);
      const existingPriceTiers = await fetchPriceTiers(product.id);
      console.log('📊 Prix existants reçus:', existingPriceTiers);
      
      // Récupérer les conversions via API directe
      const conversionsResponse = await fetch(`/api/unit-conversions?product_id=${product.id}`);
      const existingConversions = conversionsResponse.ok ? await conversionsResponse.json() : [];
      console.log('🔄 Conversions existantes reçues:', existingConversions);
      
      if (existingPriceTiers && existingPriceTiers.length > 0) {
        const mappedTiers = existingPriceTiers.map(tier => ({
          tier_name: tier.tier_name,
          min_quantity: tier.min_quantity,
          max_quantity: tier.max_quantity,
          unit_price: tier.unit_price
        }));
        console.log('📋 Prix transformés pour le state:', mappedTiers);
        setPriceTiers(mappedTiers);
      } else {
        // Si pas de prix existants, garder le prix unitaire par défaut
        setPriceTiers([
          { tier_name: "Prix unitaire", min_quantity: 1, max_quantity: null, unit_price: product.unit_price || 0 }
        ]);
      }
      
      if (existingConversions && existingConversions.length > 0) {
        const mappedConversions = existingConversions.map(conv => ({
          unit_id: conv.unit_id,
          equivalent_quantity: conv.equivalent_quantity,
          prix_unitaire: conv.prix_unitaire || 0
        }));
        console.log('🔄 Conversions transformées pour le state:', mappedConversions);
        console.log('🔍 Détail de chaque conversion:');
        mappedConversions.forEach((conv, index) => {
          console.log(`  Conversion ${index}:`, {
            unit_id: conv.unit_id,
            equivalent_quantity: conv.equivalent_quantity,
            prix_unitaire: conv.prix_unitaire,
            type_prix: typeof conv.prix_unitaire
          });
        });
        setUnitConversions(mappedConversions);
      } else {
        setUnitConversions([]);
      }
      
      setShowPricingSection(true);
    } catch (error) {
      console.error('Erreur lors du chargement des prix/conversions:', error);
    }
    
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: "Erreur",
        description: "Le nom du produit est obligatoire",
        variant: "destructive",
      });
      return;
    }

    // Récupérer le nom de l'unité de base sélectionnée
    const selectedUnit = units.find(u => u.id === formData.unite_base_id);
    const productData = {
      name: formData.name,
      description: formData.description,
      category_id: formData.category_id || null,
      unite_base_id: formData.unite_base_id || null,
      unit: selectedUnit ? selectedUnit.name : '',
      barcode: formData.barcode,
      unit_price: formData.unit_price || 0,
      is_active: formData.is_active, // Utiliser la valeur du formulaire
      tax_rate: 20.00,
    };

    try {
      let productId;
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        productId = editingProduct.id;
      } else {
        const newProduct = await createProduct(productData as any);
        productId = newProduct.id;
      }

      // Sauvegarder les prix si configurés
      console.log('🔍 Vérification des conditions de sauvegarde des prix:');
      console.log('📊 showPricingSection:', showPricingSection);
      console.log('💰 priceTiers:', priceTiers);
      console.log('✅ Certains prix > 0:', priceTiers.some(tier => tier.unit_price > 0));
      
      if (showPricingSection) {
        const validTiers = priceTiers.filter(tier => tier.unit_price > 0);
        console.log('💰 Sauvegarde des prix pour le produit:', productId);
        console.log('📋 Prix valides à sauvegarder:', validTiers);
        
        // Toujours faire l'appel à l'API pour mettre à jour les paliers
        // (même si validTiers est vide, cela supprimera les anciens paliers)
        const tiersData = {
          product_id: productId,
          tiers: validTiers
        };
        console.log('📤 Données envoyées à l\'API price-tiers:', tiersData);
        
        await createPriceTiers(tiersData);
        console.log('✅ Prix sauvegardés avec succès');
      } else {
        console.log('❌ showPricingSection est false - pas de sauvegarde des prix');
      }

      // Sauvegarder les conversions si configurées
      if (unitConversions.length > 0) {
        // Si on modifie un produit, supprimer d'abord les anciennes conversions
        if (editingProduct) {
          try {
            const existingConversionsResponse = await fetch(`/api/unit-conversions?product_id=${productId}`);
            if (existingConversionsResponse.ok) {
              const existingConversions = await existingConversionsResponse.json();
              for (const conv of existingConversions) {
                await fetch(`/api/unit-conversions/${conv.id}`, { method: 'DELETE' });
              }
            }
          } catch (error) {
            console.error('Erreur lors de la suppression des anciennes conversions:', error);
          }
        }
        
        // Créer les nouvelles conversions
        for (const conversion of unitConversions) {
          if (conversion.unit_id && conversion.equivalent_quantity > 0) {
            console.log('🔍 Données de conversion envoyées:', {
              product_id: productId,
              unit_id: conversion.unit_id,
              equivalent_quantity: conversion.equivalent_quantity,
              prix_unitaire: conversion.prix_unitaire || 0
            });
            await createConversion({
              product_id: productId,
              unit_id: conversion.unit_id,
              equivalent_quantity: conversion.equivalent_quantity,
              prix_unitaire: conversion.prix_unitaire || 0
            });
          }
        }
      }

      toast({
        title: "Succès",
        description: editingProduct ? "Produit modifié avec succès" : "Produit créé avec succès",
      });

      setDialogOpen(false);
      resetForm();
      refetch();
      
      // Recharger les prix et conversions pour l'affichage
      setTimeout(() => {
        loadProductPricesAndConversions();
      }, 500);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde du produit",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      await deleteProduct(id);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const updatedProduct = {
        ...product,
        is_active: !Boolean(product.is_active) // Assurer la conversion en boolean
      };

      await updateProduct(product.id, updatedProduct);
      
      toast({
        title: "Succès",
        description: `Produit ${updatedProduct.is_active ? 'activé' : 'désactivé'} avec succès`,
      });

      refetch();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du statut",
        variant: "destructive",
      });
    }
  };

  // Fonctions pour gérer les prix par paliers
  const addPriceTier = () => {
    setPriceTiers([...priceTiers, {
      tier_name: "",
      min_quantity: 1,
      max_quantity: null,
      unit_price: 0
    }]);
  };

  const updatePriceTier = (index: number, field: string, value: any) => {
    const updatedTiers = [...priceTiers];
    updatedTiers[index] = { ...updatedTiers[index], [field]: value };
    setPriceTiers(updatedTiers);
  };

  const removePriceTier = (index: number) => {
    const updatedTiers = priceTiers.filter((_, i) => i !== index);
    setPriceTiers(updatedTiers);
    console.log('🗑️ Palier supprimé, tiers restants:', updatedTiers);
  };

  // Fonctions pour gérer les conversions d'unités
  const addUnitConversion = () => {
    setUnitConversions([...unitConversions, {
      unit_id: "",
      equivalent_quantity: 1,
      prix_unitaire: 0
    }]);
  };

  const updateUnitConversion = (index: number, field: string, value: any) => {
    const updatedConversions = [...unitConversions];
    updatedConversions[index] = { ...updatedConversions[index], [field]: value };
    console.log(`🔄 Mise à jour conversion ${index}, champ ${field}:`, value);
    console.log('📊 Conversions après mise à jour:', updatedConversions);
    setUnitConversions(updatedConversions);
  };

  const removeUnitConversion = (index: number) => {
    setUnitConversions(unitConversions.filter((_, i) => i !== index));
  };

  // Fonctions pour gérer les catégories
  const resetCategoryForm = () => {
    setCategoryFormData({
      name: "",
      description: "",
      color: "#3B82F6",
    });
    setEditingCategory(null);
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || "",
      color: category.color || "#3B82F6",
    });
    setCategoryDialogOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryFormData.name) {
      toast({
        title: "Erreur",
        description: "Le nom de la catégorie est obligatoire",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryFormData);
      } else {
        await createCategory(categoryFormData);
      }
      setCategoryDialogOpen(false);
      resetCategoryForm();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la catégorie:", error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
      await deleteCategory(id);
    }
  };

  // Fonction d'export Excel des produits
  const handleExportProducts = () => {
    const exportData = filteredProducts.map(product => ({
      'Nom du produit': product.name,
      'Catégorie': product.category_name || 'Sans catégorie',
      'Description': product.description || '',
      'Code-barres': product.barcode || '',
      'Unité de base': product.unit_base_name || '',
      'Quantité en stock': product.stock_quantity || 0,
      'Statut': product.is_active ? 'Actif' : 'Inactif',
      'Fournisseur': product.supplier_name || '',
      'Date de création': product.created_at ? new Date(product.created_at).toLocaleDateString('fr-FR') : '',
      'Date de modification': product.updated_at ? new Date(product.updated_at).toLocaleDateString('fr-FR') : ''
    }));

    const success = exportToExcel({
      filename: `produits_${new Date().toISOString().split('T')[0]}`,
      data: exportData,
      sheetName: 'Produits'
    });

    if (success) {
      toast({
        title: "Export réussi",
        description: "La liste des produits a été exportée vers Excel",
      });
    } else {
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export",
        variant: "destructive"
      });
    }
  };

  // Calculs des statistiques
  const totalProducts = products.length;
  const activeCategories = categories.length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Chargement des produits...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Produits</h1>
          <p className="text-muted-foreground">Gérez votre catalogue de produits</p>
        </div>
        
        <div className="flex gap-2">
          {/* Bouton Export Excel */}
          <Button variant="outline" onClick={handleExportProducts}>
            <Download className="h-4 w-4 mr-2" />
            Exporter Excel
          </Button>
          
          {/* Bouton Nouvelle Catégorie */}
          <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={resetCategoryForm}>
                <Tag className="h-4 w-4 mr-2" />
                Nouvelle Catégorie
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory ? "Modifier les informations de la catégorie" : "Créer une nouvelle catégorie de produits"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <Label htmlFor="category-name">Nom de la catégorie *</Label>
                  <Input
                    id="category-name"
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                    placeholder="Ex: Bières, Boissons gazeuses..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="category-description">Description</Label>
                  <Textarea
                    id="category-description"
                    value={categoryFormData.description}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                    placeholder="Description de la catégorie (optionnel)"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category-color">Couleur</Label>
                  <Input
                    id="category-color"
                    type="color"
                    value={categoryFormData.color}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingCategory ? "Modifier" : "Créer"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          {/* Bouton Nouveau Produit */}
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Produit
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Modifier le produit" : "Nouveau produit"}
              </DialogTitle>
              <DialogDescription>
                Remplissez les informations du produit
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Nom du produit *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: THB Pilsener 65cl"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description du produit"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select 
                    key={`category-${formData.category_id}`}
                    value={formData.category_id} 
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="unit_base">Unité de base</Label>
                  <Select 
                    key={`unit-base-${formData.unite_base_id}`}
                    value={formData.unite_base_id} 
                    onValueChange={(value) => setFormData({ ...formData, unite_base_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une unité de base" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name} ({unit.abbreviation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="barcode">Code-barres</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Code-barres du produit"
                  />
                </div>
                
                <div>
                  <Label htmlFor="unit_price">Prix unitaire (MGA) *</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    min="0"
                    value={formData.unit_price || 0}
                    onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                    placeholder="Prix de vente par unité de base"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Prix de vente pour l'unité de base sélectionnée
                  </p>
                </div>

                {/* Champ Actif/Inactif */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="text-sm font-medium">
                    Produit actif
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {formData.is_active ? "Visible dans les ventes et achats" : "Masqué des ventes et achats"}
                  </p>
                </div>
              </div>

              {/* Bouton pour afficher la configuration des prix */}
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <h3 className="font-medium">Configuration des prix et conversions</h3>
                  <p className="text-sm text-muted-foreground">
                    Configurez les prix par paliers et les conversions d'unités
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPricingSection(!showPricingSection)}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  {showPricingSection ? "Masquer" : "Configurer"}
                </Button>
              </div>

              {/* Section de configuration des prix */}
              {showPricingSection && (
                <div className="space-y-6 border-t pt-4">
                  {/* Prix par paliers */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Prix par paliers
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addPriceTier}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {priceTiers.map((tier, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-4">
                            <Label>Nom du palier</Label>
                            <Input
                              value={tier.tier_name}
                              onChange={(e) => updatePriceTier(index, 'tier_name', e.target.value)}
                              placeholder="Ex: Prix unitaire"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Qté min</Label>
                            <Input
                              type="number"
                              min="1"
                              value={tier.min_quantity}
                              onChange={(e) => updatePriceTier(index, 'min_quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Qté max</Label>
                            <Input
                              type="number"
                              value={tier.max_quantity || ""}
                              onChange={(e) => updatePriceTier(index, 'max_quantity', e.target.value ? parseInt(e.target.value) : null)}
                              placeholder="Illimité"
                            />
                          </div>
                          <div className="col-span-3">
                            <Label>Prix (MGA)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={tier.unit_price}
                              onChange={(e) => updatePriceTier(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removePriceTier(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conversions d'unités */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Conversions d'unités
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addUnitConversion}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {unitConversions.map((conversion, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-4">
                            <Label>Unité de vente</Label>
                            <Select
                              value={conversion.unit_id}
                              onValueChange={(value) => updateUnitConversion(index, 'unit_id', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une unité" />
                              </SelectTrigger>
                              <SelectContent>
                                {units.filter(unit => unit.id !== formData.unite_base_id).map((unit) => (
                                  <SelectItem key={unit.id} value={unit.id}>
                                    {unit.name} ({unit.abbreviation})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-3">
                            <Label>Quantité équivalente</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">1 =</span>
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={conversion.equivalent_quantity}
                                onChange={(e) => updateUnitConversion(index, 'equivalent_quantity', parseFloat(e.target.value) || 1)}
                              />
                              <span className="text-sm text-muted-foreground">
                                {units.find(u => u.id === formData.unite_base_id)?.abbreviation || 'base'}
                              </span>
                            </div>
                          </div>
                          <div className="col-span-4">
                            <Label>Prix de vente (MGA)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="100"
                              value={conversion.prix_unitaire || 0}
                              onChange={(e) => updateUnitConversion(index, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                              placeholder="Prix pour cette unité"
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeUnitConversion(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {unitConversions.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucune conversion configurée. Les conversions permettent de vendre le produit dans différentes unités.
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingProduct ? "Modifier" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoriesWithAll.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Catégories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCategories}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="shadow-ambient">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <span className="font-medium">Recherche & Filtres</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              {/* Barre de recherche */}
              <div className="relative min-w-0 flex-1 sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              {/* Filtre par catégorie */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Toutes catégories" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesWithAll.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <Tag className="h-3 w-3" />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtre par statut */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3 w-3" />
                      Tous
                    </div>
                  </SelectItem>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3 text-green-600" />
                      Actifs
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <div className="flex items-center gap-2">
                      <Archive className="h-3 w-3 text-orange-600" />
                      Inactifs
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Indicateur de résultats */}
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Categories Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gestion des Catégories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: category.color || '#3B82F6' }}
                  ></div>
                  <div>
                    <div className="font-medium">{category.name}</div>
                    {category.description && (
                      <div className="text-sm text-muted-foreground">{category.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCategory(category)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.category_name && (
                      <Badge variant="secondary">
                        {product.category_name}
                      </Badge>
                    )}
                    
                    {/* Badge pour les prix configurés */}
                    {productPricesDisplay[product.id] && productPricesDisplay[product.id].length > 0 && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        {productPricesDisplay[product.id].length} prix configuré{productPricesDisplay[product.id].length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    
                    {/* Badge pour les conversions configurées */}
                    {productConversionsDisplay[product.id] && productConversionsDisplay[product.id].length > 0 && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {productConversionsDisplay[product.id].length} conversion{productConversionsDisplay[product.id].length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {product.description && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="truncate">{product.description}</span>
                </div>
              )}

              {product.unit_base_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>Unité de base: {product.unit_base_name} ({product.unit_base_abbreviation})</span>
                </div>
              )}

              {product.barcode && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Code-barres: {product.barcode}</span>
                </div>
              )}

              {/* Affichage des prix configurés */}
              {productPricesDisplay[product.id] && productPricesDisplay[product.id].length > 0 && (
                <div className="border-t pt-2">
                  <h4 className="text-sm font-medium mb-1">Prix configurés:</h4>
                  <div className="flex flex-wrap gap-1">
                    {productPricesDisplay[product.id].slice(0, 3).map((price: any, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {price.tier_name}: {price.unit_price?.toLocaleString()} MGA
                      </Badge>
                    ))}
                    {productPricesDisplay[product.id].length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{productPricesDisplay[product.id].length - 3} autre{productPricesDisplay[product.id].length - 3 > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Affichage des conversions configurées */}
              {productConversionsDisplay[product.id] && productConversionsDisplay[product.id].length > 0 && (
                <div className="border-t pt-2">
                  <h4 className="text-sm font-medium mb-1">Conversions:</h4>
                  <div className="flex flex-wrap gap-1">
                    {productConversionsDisplay[product.id].slice(0, 2).map((conversion: any, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        1 {conversion.unit_name} = {conversion.equivalent_quantity} {product.unit_base_abbreviation}
                      </Badge>
                    ))}
                    {productConversionsDisplay[product.id].length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{productConversionsDisplay[product.id].length - 2} autre{productConversionsDisplay[product.id].length - 2 > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(product)} className="flex-1">
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDelete(product.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Aucun produit trouvé</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "Essayez de modifier votre recherche" : "Commencez par ajouter votre premier produit"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un produit
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;