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
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package,
  Ruler,
  Tags
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Unit {
  id: string;
  name: string;
  abbreviation: string;
  description?: string;
  created_at?: string;
}

const API_BASE_URL = 'http://localhost:3001';

const Units = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const { toast } = useToast();
  
  const [unitFormData, setUnitFormData] = useState({
    name: "",
    abbreviation: "",
    description: "",
  });

  // Charger les unités
  const fetchUnits = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/units`);
      if (response.ok) {
        const data = await response.json();
        setUnits(data);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les unités",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des unités:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion au serveur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const filteredUnits = units.filter(unit => 
    unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    unit.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())
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
      const url = editingUnit 
        ? `${API_BASE_URL}/api/units/${editingUnit.id}`
        : `${API_BASE_URL}/api/units`;
      
      const method = editingUnit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(unitFormData),
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: editingUnit ? "Unité modifiée avec succès" : "Unité créée avec succès",
        });
        setUnitDialogOpen(false);
        resetUnitForm();
        fetchUnits(); // Recharger la liste
      } else {
        toast({
          title: "Erreur",
          description: "Erreur lors de la sauvegarde",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'unité:", error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion au serveur",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUnit = async (unit: Unit) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'unité "${unit.name}" ?`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/units/${unit.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast({
            title: "Succès",
            description: "Unité supprimée avec succès",
          });
          fetchUnits(); // Recharger la liste
        } else {
          toast({
            title: "Erreur",
            description: "Erreur lors de la suppression",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Erreur lors de la suppression de l'unité:", error);
        toast({
          title: "Erreur",
          description: "Erreur de connexion au serveur",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Chargement des unités...</p>
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
          <p className="text-muted-foreground">Gérez les unités de mesure de vos produits</p>
        </div>
        
        <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetUnitForm}>
              <Plus className="h-4 w-4 mr-2" />
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
      </div>

      {/* Search */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher une unité..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredUnits.length} unité{filteredUnits.length > 1 ? 's' : ''} trouvée{filteredUnits.length > 1 ? 's' : ''}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Units Grid */}
      {filteredUnits.length > 0 ? (
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
                    onClick={() => handleDeleteUnit(unit)}
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
        <div className="text-center py-12">
          <Tags className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">
            {searchQuery ? "Aucune unité trouvée" : "Aucune unité"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? "Essayez de modifier votre recherche" 
              : "Commencez par ajouter votre première unité de mesure"
            }
          </p>
          {!searchQuery && (
            <Button onClick={() => setUnitDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une unité
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Units;

