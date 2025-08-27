import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CreditCard, 
  Search, 
  Eye, 
  Calendar,
  User,
  Receipt,
  TrendingUp,
  Banknote,
  Smartphone
} from "lucide-react";
import { useSales, Sale } from "@/hooks/useSales";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const SalesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState("all");
  const [dateRange, setDateRange] = useState("today");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const { sales, loading, getSalesByDateRange } = useSales();

  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "finalise", label: "Finalisées" },
    { value: "en_cours", label: "En cours" },
    { value: "annule", label: "Annulées" },
  ];

  const paymentOptions = [
    { value: "all", label: "Tous les paiements" },
    { value: "especes", label: "Espèces" },
    { value: "mobile_money", label: "Mobile Money" },
    { value: "virement", label: "Virement" },
    { value: "credit", label: "Crédit" },
    { value: "mixte", label: "Mixte" },
  ];

  const dateRangeOptions = [
    { value: "today", label: "Aujourd'hui" },
    { value: "week", label: "Cette semaine" },
    { value: "month", label: "Ce mois" },
    { value: "all", label: "Toutes les ventes" },
  ];

  const getDateRange = (range: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case "today":
        return {
          start: today.toISOString(),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return {
          start: weekStart.toISOString(),
          end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };
      case "month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return {
          start: monthStart.toISOString(),
          end: new Date(monthEnd.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      default:
        return null;
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.sale_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sale.customers?.name && sale.customers.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = selectedStatus === "all" || sale.status === selectedStatus;
    const matchesPayment = selectedPayment === "all" || sale.payment_method === selectedPayment;
    
    let matchesDate = true;
    if (dateRange !== "all") {
      const range = getDateRange(dateRange);
      if (range) {
        const saleDate = new Date(sale.sale_date);
        matchesDate = saleDate >= new Date(range.start) && saleDate <= new Date(range.end);
      }
    }
    
    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "especes":
        return <Banknote className="h-4 w-4" />;
      case "mobile_money":
        return <Smartphone className="h-4 w-4" />;
      case "virement":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "finalise":
        return "default";
      case "en_cours":
        return "secondary";
      case "annule":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "finalise":
        return "Finalisée";
      case "en_cours":
        return "En cours";
      case "annule":
        return "Annulée";
      default:
        return status;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "especes":
        return "Espèces";
      case "mobile_money":
        return "Mobile Money";
      case "virement":
        return "Virement";
      case "credit":
        return "Crédit";
      case "mixte":
        return "Mixte";
      default:
        return method;
    }
  };

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setDetailsDialogOpen(true);
  };

  // Calculs des statistiques
  const totalSales = filteredSales.filter(s => s.status === 'finalise').length;
  const totalRevenue = filteredSales
    .filter(s => s.status === 'finalise')
    .reduce((sum, s) => sum + s.final_amount, 0);
  const averageOrder = totalSales > 0 ? totalRevenue / totalSales : 0;
  const totalTax = filteredSales
    .filter(s => s.status === 'finalise')
    .reduce((sum, s) => sum + s.tax_amount, 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Chargement des ventes...</p>
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
          <h1 className="text-3xl font-bold">Historique des Ventes</h1>
          <p className="text-muted-foreground">Consultez et gérez vos transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher par numéro ou client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedPayment} onValueChange={setSelectedPayment}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {paymentOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dateRangeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Total Ventes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Chiffre d'Affaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} MGA</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Panier Moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageOrder).toLocaleString()} MGA</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              TVA Collectée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTax.toLocaleString()} MGA</div>
          </CardContent>
        </Card>
      </div>

      {/* Sales List */}
      <div className="space-y-4">
        {filteredSales.map((sale) => (
          <Card key={sale.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{sale.sale_number}</h3>
                      <Badge variant={getStatusColor(sale.status)}>
                        {getStatusLabel(sale.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(sale.sale_date), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {sale.customers?.name || "Client non spécifié"}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {getPaymentMethodIcon(sale.payment_method)}
                        {getPaymentMethodLabel(sale.payment_method)}
                      </div>
                    </div>

                    {sale.notes && (
                      <p className="text-sm text-muted-foreground">{sale.notes}</p>
                    )}
                  </div>
                </div>
                
                <div className="text-right space-y-2">
                  <div className="text-2xl font-bold text-primary">
                    {sale.final_amount.toLocaleString()} MGA
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    HT: {sale.total_amount.toLocaleString()} MGA
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(sale)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Détails
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSales.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Aucune vente trouvée</h3>
          <p className="text-muted-foreground">
            {searchQuery ? "Essayez de modifier vos critères de recherche" : "Aucune vente pour cette période"}
          </p>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la vente {selectedSale?.sale_number}</DialogTitle>
            <DialogDescription>
              Informations complètes de la transaction
            </DialogDescription>
          </DialogHeader>
          
          {selectedSale && (
            <div className="space-y-6">
              {/* Sale Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Date de vente</Label>
                  <p className="text-sm">
                    {format(new Date(selectedSale.sale_date), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Client</Label>
                  <p className="text-sm">{selectedSale.customers?.name || "Client non spécifié"}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Mode de paiement</Label>
                  <p className="text-sm">{getPaymentMethodLabel(selectedSale.payment_method)}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Statut</Label>
                  <Badge variant={getStatusColor(selectedSale.status)}>
                    {getStatusLabel(selectedSale.status)}
                  </Badge>
                </div>
              </div>

              {/* Items */}
              <div>
                <Label className="text-sm font-medium">Articles vendus</Label>
                <div className="mt-2 space-y-2">
                  {selectedSale.sale_items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{item.products?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} × {item.unit_price.toLocaleString()} MGA
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.total_price.toLocaleString()} MGA</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Sous-total HT:</span>
                  <span>{selectedSale.total_amount.toLocaleString()} MGA</span>
                </div>
                <div className="flex justify-between">
                  <span>TVA (20%):</span>
                  <span>{selectedSale.tax_amount.toLocaleString()} MGA</span>
                </div>
                {selectedSale.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Remise:</span>
                    <span>-{selectedSale.discount_amount.toLocaleString()} MGA</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total TTC:</span>
                  <span>{selectedSale.final_amount.toLocaleString()} MGA</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesPage;