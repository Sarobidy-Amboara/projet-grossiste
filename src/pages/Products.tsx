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
  Building
} from "lucide-react";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useUnits } from "@/hooks/useUnits";
import { useToast } from "@/hooks/use-toast";

const ProductsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
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
    supplier_id: "",
    unite_base_id: "",
    barcode: "",
  });

  const { products, loading, createProduct, updateProduct, deleteProduct } = useProducts();
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories();
  const { suppliers } = useSuppliers();
  const { units } = useUnits();
  const { toast } = useToast();

  const categoriesWithAll = [
    { id: "all", name: "Toutes catégories" },
    ...categories
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category_id: "",
      supplier_id: "",
      unite_base_id: "",
      barcode: "",
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      category_id: product.category_id || "",
      supplier_id: product.supplier_id || "",
      unite_base_id: product.unite_base_id || "",
      barcode: product.barcode || "",
    });
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

    const productData = {
      name: formData.name,
      description: formData.description,
      category_id: formData.category_id || null,
      supplier_id: formData.supplier_id || null,
      unite_base_id: formData.unite_base_id || null,
      barcode: formData.barcode,
      is_active: true,
      tax_rate: 20.00,
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await createProduct(productData as any);
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      await deleteProduct(id);
    }
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Produit
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
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
                  <Label htmlFor="supplier">Fournisseur</Label>
                  <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
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
                </div>

                <div>
                  <Label htmlFor="unit_base">Unité de base</Label>
                  <Select value={formData.unite_base_id} onValueChange={(value) => setFormData({ ...formData, unite_base_id: value })}>
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
              </div>
              
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
                  {product.category_name && (
                    <Badge variant="secondary" className="mt-1">
                      {product.category_name}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {product.supplier_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>{product.supplier_name}</span>
                </div>
              )}
              
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