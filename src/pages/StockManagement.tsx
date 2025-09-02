import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Package,
  Minus,
  Search,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel, formatDateForExcel } from "@/lib/excel-export";

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  unite_base_id: string;
  minimum_stock_level: number;
}

interface Unit {
  id: string;
  name: string;
  abbreviation: string;
}

interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  movement_type: 'purchase' | 'sale' | 'adjustment';
  quantity: number;
  unit_id: string;
  unit_name: string;
  unit_abbreviation: string;
  reference_type: string;
  reference_id: string;
  notes: string;
  created_at: string;
}

const StockManagement = () => {
  // Recherche produit inventaire
  const [productInvSearch, setProductInvSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [movementsLoading, setMovementsLoading] = useState(false);

    // Recherche produit sortie manuelle
    const [productOutSearch, setProductOutSearch] = useState("");
  
  // États pour sortie manuelle
  const [outModalOpen, setOutModalOpen] = useState(false);
  const [selectedProductOut, setSelectedProductOut] = useState('');
  const [outQuantity, setOutQuantity] = useState('');
  const [outUnit, setOutUnit] = useState('');
  const [outReason, setOutReason] = useState('consommation interne');
  const [outNotes, setOutNotes] = useState('');
  
  // États pour inventaire
  const [invModalOpen, setInvModalOpen] = useState(false);
  const [selectedProductInv, setSelectedProductInv] = useState('');
  const [physicalQuantity, setPhysicalQuantity] = useState('');
  const [invUnit, setInvUnit] = useState('');
  const [invNotes, setInvNotes] = useState('');
  
  // États pour filtres historique
  const [filterProduct, setFilterProduct] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterReference, setFilterReference] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  const { toast } = useToast();

  const reasonOptions = [
    { value: 'consommation interne', label: 'Consommation interne' },
    { value: 'casse', label: 'Casse/Détérioration' },
    { value: 'don', label: 'Don' },
    { value: 'echantillon', label: 'Échantillon' },
    { value: 'vol', label: 'Vol/Perte' },
    { value: 'autre', label: 'Autre' },
  ];

  const typeOptions = [
    { value: 'all', label: 'Tous les types' },
    { value: 'purchase', label: 'Achat' },
    { value: 'sale', label: 'Vente' },
    { value: 'adjustment', label: 'Ajustement' },
  ];

  const referenceOptions = [
    { value: 'all', label: 'Toutes les références' },
    { value: 'consommation interne', label: 'Consommation interne' },
    { value: 'casse', label: 'Casse' },
    { value: 'inventaire', label: 'Inventaire' },
    { value: 'vente', label: 'Vente' },
    { value: 'achat', label: 'Achat' },
  ];

  useEffect(() => {
    loadData();
    loadMovements();
  }, []);

  useEffect(() => {
    loadMovements();
  }, [filterProduct, filterType, filterReference, filterStartDate, filterEndDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, unitsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/units')
      ]);
      
      if (productsRes.ok && unitsRes.ok) {
        const [productsData, unitsData] = await Promise.all([
          productsRes.json(),
          unitsRes.json()
        ]);
        setProducts(productsData);
        setUnits(unitsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    try {
      setMovementsLoading(true);
      const params = new URLSearchParams();
      if (filterProduct && filterProduct !== 'all') params.append('product_id', filterProduct);
      if (filterType && filterType !== 'all') params.append('movement_type', filterType);
      if (filterReference && filterReference !== 'all') params.append('reference_type', filterReference);
      if (filterStartDate) params.append('start_date', filterStartDate);
      if (filterEndDate) params.append('end_date', filterEndDate);
      
      const response = await fetch(`/api/stock-movements?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setMovements(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des mouvements:', error);
    } finally {
      setMovementsLoading(false);
    }
  };

  const handleManualOut = async () => {
    if (!selectedProductOut || !outQuantity || !outUnit) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/stock-movements/out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: selectedProductOut,
          quantity: parseFloat(outQuantity),
          unit_id: outUnit,
          reason: outReason,
          notes: outNotes,
        }),
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Sortie de stock enregistrée",
        });
        setOutModalOpen(false);
        resetOutForm();
        loadData();
        loadMovements();
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Impossible d'enregistrer la sortie",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sortie:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive",
      });
    }
  };

  const handleInventoryAdjustment = async () => {
    if (!selectedProductInv || !physicalQuantity || !invUnit) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/stock-movements/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: selectedProductInv,
          physical_quantity: parseFloat(physicalQuantity),
          unit_id: invUnit,
          notes: invNotes,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.difference === 0) {
          toast({
            title: "Information",
            description: "Aucun ajustement nécessaire - le stock est correct",
          });
        } else {
          toast({
            title: "Succès",
            description: `Stock ajusté: ${result.difference > 0 ? '+' : ''}${result.difference}`,
          });
        }
        setInvModalOpen(false);
        resetInvForm();
        loadData();
        loadMovements();
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Impossible d'ajuster le stock",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'inventaire:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive",
      });
    }
  };

  const resetOutForm = () => {
    setSelectedProductOut('');
    setOutQuantity('');
    setOutUnit('');
    setOutReason('consommation interne');
    setOutNotes('');
  };

  const resetInvForm = () => {
    setSelectedProductInv('');
    setPhysicalQuantity('');
    setInvUnit('');
    setInvNotes('');
  };

  const getMovementIcon = (type: string, quantity: number) => {
    if (quantity > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
  };

  const exportStockMovements = () => {
    const exportData = movements.map(movement => ({
      'Date': formatDateForExcel(movement.created_at),
      'Produit': movement.product_name,
      'Type': movement.movement_type === 'purchase' ? 'Achat' :
              movement.movement_type === 'sale' ? 'Vente' : 'Ajustement',
      'Mouvement': movement.quantity > 0 ? 'Entrée' : 'Sortie',
      'Quantité': Math.abs(movement.quantity),
      'Unité': movement.unit_abbreviation,
      'Référence': movement.reference_type,
      'Notes': movement.notes || ''
    }));

    const success = exportToExcel({
      filename: `mouvements_stock_${new Date().toISOString().split('T')[0]}`,
      data: exportData,
      sheetName: 'Mouvements Stock'
    });

    if (success) {
      toast({
        title: "Export réussi",
        description: "Les mouvements de stock ont été exportés vers Excel",
      });
    } else {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les données",
        variant: "destructive",
      });
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase': return 'Achat';
      case 'sale': return 'Vente';
      case 'adjustment': return 'Ajustement';
      default: return type;
    }
  };

  const getReferenceTypeLabel = (refType: string) => {
    switch (refType) {
      case 'consommation interne': return 'Consommation interne';
      case 'casse': return 'Casse';
      case 'inventaire': return 'Inventaire';
      case 'vente': return 'Vente';
      case 'achat': return 'Achat';
      case 'annulation_vente': return 'Annulation vente';
      case 'modification_vente': return 'Modification vente';
      default: return refType;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion du Stock</h2>
          <p className="text-muted-foreground">
            Sorties manuelles, inventaire et historique des mouvements
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Dialog open={outModalOpen} onOpenChange={setOutModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Minus className="w-4 h-4 mr-2" />
                Sortie Manuelle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sortie de Stock Manuelle</DialogTitle>
                <DialogDescription>
                  Enregistrer une sortie de stock (consommation, casse, etc.)
                </DialogDescription>
              </DialogHeader>
              
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="product-out-search">Rechercher un produit</Label>
                    <Input
                      id="product-out-search"
                      type="text"
                      placeholder="Nom ou code-barres..."
                      value={productOutSearch}
                      onChange={e => setProductOutSearch(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="product-out">Produit *</Label>
                    <Select value={selectedProductOut} onValueChange={setSelectedProductOut}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un produit" />
                      </SelectTrigger>
                      <SelectContent>
                        {products
                          .filter(product =>
                            product.name.toLowerCase().includes(productOutSearch.toLowerCase())
                            // Ajoutez ici d'autres critères si besoin (ex: code-barres)
                          )
                          .map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} (Stock: {product.stock_quantity})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity-out">Quantité *</Label>
                    <Input
                      id="quantity-out"
                      type="number"
                      min="0"
                      step="0.01"
                      value={outQuantity}
                      onChange={(e) => setOutQuantity(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="unit-out">Unité *</Label>
                    <Select value={outUnit} onValueChange={setOutUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Unité" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.name} ({unit.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="reason-out">Motif</Label>
                  <Select value={outReason} onValueChange={setOutReason}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reasonOptions.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes-out">Notes</Label>
                  <Textarea
                    id="notes-out"
                    value={outNotes}
                    onChange={(e) => setOutNotes(e.target.value)}
                    placeholder="Notes additionnelles..."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setOutModalOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleManualOut}>
                    Enregistrer la sortie
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={invModalOpen} onOpenChange={setInvModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <BarChart3 className="w-4 h-4 mr-2" />
                Inventaire
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajustement d'Inventaire</DialogTitle>
                <DialogDescription>
                  Ajuster le stock après comptage physique
                </DialogDescription>
              </DialogHeader>
              
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="product-inv-search">Rechercher un produit</Label>
                    <Input
                      id="product-inv-search"
                      type="text"
                      placeholder="Nom ou code-barres..."
                      value={productInvSearch}
                      onChange={e => setProductInvSearch(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="product-inv">Produit *</Label>
                    <Select value={selectedProductInv} onValueChange={setSelectedProductInv}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un produit" />
                      </SelectTrigger>
                      <SelectContent>
                        {products
                          .filter(product =>
                            product.name.toLowerCase().includes(productInvSearch.toLowerCase())
                          )
                          .map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} (Stock théorique: {product.stock_quantity})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="physical-qty">Stock physique *</Label>
                    <Input
                      id="physical-qty"
                      type="number"
                      min="0"
                      step="0.01"
                      value={physicalQuantity}
                      onChange={(e) => setPhysicalQuantity(e.target.value)}
                      placeholder="Quantité comptée"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="unit-inv">Unité *</Label>
                    <Select value={invUnit} onValueChange={setInvUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Unité" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.name} ({unit.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes-inv">Notes</Label>
                  <Textarea
                    id="notes-inv"
                    value={invNotes}
                    onChange={(e) => setInvNotes(e.target.value)}
                    placeholder="Commentaires sur l'inventaire..."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setInvModalOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleInventoryAdjustment}>
                    Ajuster le stock
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="movements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="movements">Historique des Mouvements</TabsTrigger>
          <TabsTrigger value="summary">Résumé par Produit</TabsTrigger>
        </TabsList>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="filter-product">Produit</Label>
                  <Select value={filterProduct} onValueChange={setFilterProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les produits" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les produits</SelectItem>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="filter-type">Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="filter-reference">Référence</Label>
                  <Select value={filterReference} onValueChange={setFilterReference}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {referenceOptions.map((ref) => (
                        <SelectItem key={ref.value} value={ref.value}>
                          {ref.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="filter-start">Date début</Label>
                  <Input
                    id="filter-start"
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="filter-end">Date fin</Label>
                  <Input
                    id="filter-end"
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4 space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilterProduct('all');
                    setFilterType('all');
                    setFilterReference('all');
                    setFilterStartDate('');
                    setFilterEndDate('');
                  }}
                >
                  Réinitialiser
                </Button>
                <Button variant="outline" onClick={loadMovements}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Mouvements de Stock</CardTitle>
                <Button variant="outline" onClick={exportStockMovements} disabled={movements.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {movementsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Mouvement</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{movement.product_name}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            movement.movement_type === 'purchase' ? 'default' :
                            movement.movement_type === 'sale' ? 'secondary' : 'outline'
                          }>
                            {getMovementTypeLabel(movement.movement_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getMovementIcon(movement.movement_type, movement.quantity)}
                            <span className={`ml-2 ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {Math.abs(movement.quantity)} {movement.unit_abbreviation}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getReferenceTypeLabel(movement.reference_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {movement.notes || '-'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {movements.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Aucun mouvement trouvé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Résumé par Produit</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Stock Actuel</TableHead>
                    <TableHead>Stock Minimum</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.stock_quantity}</TableCell>
                      <TableCell>{product.minimum_stock_level}</TableCell>
                      <TableCell>
                        {product.stock_quantity <= product.minimum_stock_level ? (
                          <Badge variant="destructive" className="flex items-center w-fit">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Stock faible
                          </Badge>
                        ) : (
                          <Badge variant="default">
                            Stock OK
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {products.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Aucun produit trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockManagement;