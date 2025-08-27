import { useState } from "react";
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
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package,
  ArrowRightLeft,
  Calculator,
  Ruler,
  Tags
} from "lucide-react";
import { useUnits, Unit } from "@/hooks/useUnits";
import { useUnitConversions, UnitConversion } from "@/hooks/useUnitConversions";
import { useProducts } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";

const UnitsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"units" | "conversions">("units");
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [conversionDialogOpen, setConversionDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editingConversion, setEditingConversion] = useState<UnitConversion | null>(null);
  
  const [unitFormData, setUnitFormData] = useState({
    name: "",
    abbreviation: "",
    description: "",
  });

  const [conversionFormData, setConversionFormData] = useState({
    product_id: "",
    unit_id: "",
    equivalent_quantity: "",
  });

  const { units, loading: unitsLoading, createUnit, updateUnit, deleteUnit } = useUnits();
  const { conversions, loading: conversionsLoading, createConversion, updateConversion, deleteConversion, fetchConversions } = useUnitConversions();
  const { products } = useProducts();
  const { toast } = useToast();

  const filteredUnits = units.filter(unit => 
    unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    unit.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConversions = conversions.filter(conversion =>
    conversion.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversion.unit_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fonctions pour les unités
  const resetUnitForm = () => {
    setUnitFormData({
      name: "",
      abbreviation: "",
      description: "",
    });
    setEditingUnit(null);
  };

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setUnitFormData({
      name: unit.name,
      abbreviation: unit.abbreviation,
      description: unit.description || "",
    });
    setUnitDialogOpen(true);
  };

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!unitFormData.name || !unitFormData.abbreviation) {
      toast({
        title: "Erreur",
        description: "Le nom et l'abréviation sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingUnit) {
        await updateUnit(editingUnit.id, unitFormData);
      } else {
        await createUnit(unitFormData);
      }
      setUnitDialogOpen(false);
      resetUnitForm();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'unité:", error);
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette unité ?")) {
      await deleteUnit(id);
    }
  };

  // Fonctions pour les conversions
  const resetConversionForm = () => {
    setConversionFormData({
      product_id: "",
      unit_id: "",
      equivalent_quantity: "",
    });
    setEditingConversion(null);
  };

  const handleEditConversion = (conversion: UnitConversion) => {
    setEditingConversion(conversion);
    setConversionFormData({
      product_id: conversion.product_id,
      unit_id: conversion.unit_id,
      equivalent_quantity: conversion.equivalent_quantity.toString(),
    });
    setConversionDialogOpen(true);
  };

  const handleConversionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!conversionFormData.product_id || !conversionFormData.unit_id || !conversionFormData.equivalent_quantity) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    const conversionData = {
      product_id: conversionFormData.product_id,
      unit_id: conversionFormData.unit_id,
      equivalent_quantity: parseFloat(conversionFormData.equivalent_quantity),
    };

    try {
      if (editingConversion) {
        await updateConversion(editingConversion.id, conversionData);
      } else {
        await createConversion(conversionData);
      }
      setConversionDialogOpen(false);
      resetConversionForm();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la conversion:", error);
    }
  };

  const handleDeleteConversion = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette conversion ?")) {
      await deleteConversion(id);
    }
  };

  if (unitsLoading && conversionsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Chargement...</p>
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
          <h1 className="text-3xl font-bold">Gestion des Unités</h1>
          <p className="text-muted-foreground">Gérez les unités de mesure et leurs conversions</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={resetUnitForm}>
                <Ruler className="h-4 w-4 mr-2" />
                Nouvelle Unité
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingUnit ? "Modifier l'unité" : "Nouvelle unité"}
                </DialogTitle>
                <DialogDescription>
                  {editingUnit ? "Modifier les informations de l'unité" : "Créer une nouvelle unité de mesure"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleUnitSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="unit-name">Nom de l'unité *</Label>
                  <Input
                    id="unit-name"
                    value={unitFormData.name}
                    onChange={(e) => setUnitFormData({ ...unitFormData, name: e.target.value })}
                    placeholder="Ex: Bouteille, Pack, Carton..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="unit-abbreviation">Abréviation *</Label>
                  <Input
                    id="unit-abbreviation"
                    value={unitFormData.abbreviation}
                    onChange={(e) => setUnitFormData({ ...unitFormData, abbreviation: e.target.value })}
                    placeholder="Ex: btl, pk, ctn..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="unit-description">Description</Label>
                  <Textarea
                    id="unit-description"
                    value={unitFormData.description}
                    onChange={(e) => setUnitFormData({ ...unitFormData, description: e.target.value })}
                    placeholder="Description de l'unité (optionnel)"
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setUnitDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingUnit ? "Modifier" : "Créer"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={conversionDialogOpen} onOpenChange={setConversionDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetConversionForm}>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Nouvelle Conversion
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingConversion ? "Modifier la conversion" : "Nouvelle conversion"}
                </DialogTitle>
                <DialogDescription>
                  Définir comment une unité se convertit par rapport à l'unité de base d'un produit
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleConversionSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="conversion-product">Produit *</Label>
                  <Select value={conversionFormData.product_id} onValueChange={(value) => setConversionFormData({ ...conversionFormData, product_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="conversion-unit">Unité de conversion *</Label>
                  <Select value={conversionFormData.unit_id} onValueChange={(value) => setConversionFormData({ ...conversionFormData, unit_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une unité" />
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
                  <Label htmlFor="conversion-quantity">Quantité équivalente *</Label>
                  <Input
                    id="conversion-quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={conversionFormData.equivalent_quantity}
                    onChange={(e) => setConversionFormData({ ...conversionFormData, equivalent_quantity: e.target.value })}
                    placeholder="Ex: 6 (pour 1 pack = 6 bouteilles)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Nombre d'unités de base contenues dans cette unité
                  </p>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setConversionDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingConversion ? "Modifier" : "Créer"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === "units" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("units")}
        >
          <Tags className="h-4 w-4 mr-2" />
          Unités ({units.length})
        </Button>
        <Button
          variant={activeTab === "conversions" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("conversions")}
        >
          <Calculator className="h-4 w-4 mr-2" />
          Conversions ({conversions.length})
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={activeTab === "units" ? "Rechercher une unité..." : "Rechercher une conversion..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {activeTab === "units" 
                ? `${filteredUnits.length} unité${filteredUnits.length > 1 ? 's' : ''} trouvée${filteredUnits.length > 1 ? 's' : ''}`
                : `${filteredConversions.length} conversion${filteredConversions.length > 1 ? 's' : ''} trouvée${filteredConversions.length > 1 ? 's' : ''}`
              }
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Content */}
      {activeTab === "units" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.map((unit) => (
            <Card key={unit.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{unit.name}</CardTitle>
                  <Badge variant="secondary">{unit.abbreviation}</Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {unit.description && (
                  <div className="text-sm text-muted-foreground">
                    {unit.description}
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditUnit(unit)} className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteUnit(unit.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConversions.map((conversion) => (
            <Card key={conversion.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium">{conversion.product_name}</div>
                      <div className="text-sm text-muted-foreground">
                        1 {conversion.unit_name} = {conversion.equivalent_quantity} unité{conversion.equivalent_quantity > 1 ? 's' : ''} de base
                      </div>
                    </div>
                    <Badge variant="outline">
                      {conversion.unit_abbreviation}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditConversion(conversion)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteConversion(conversion.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty States */}
      {activeTab === "units" && filteredUnits.length === 0 && (
        <div className="text-center py-12">
          <Tags className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Aucune unité trouvée</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "Essayez de modifier votre recherche" : "Commencez par ajouter votre première unité"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setUnitDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une unité
            </Button>
          )}
        </div>
      )}

      {activeTab === "conversions" && filteredConversions.length === 0 && (
        <div className="text-center py-12">
          <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Aucune conversion trouvée</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "Essayez de modifier votre recherche" : "Commencez par ajouter votre première conversion"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setConversionDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une conversion
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default UnitsPage;
