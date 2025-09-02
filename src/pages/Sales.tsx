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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
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
  Smartphone,
  XCircle,
  Printer,
  RefreshCw,
  Edit,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel, formatDateForExcel, formatCurrencyForExcel } from "@/lib/excel-export";

interface Sale {
  id: string;
  sale_number: string;
  customer_id?: string;
  customer_name?: string;
  total_amount: number;
  subtotal_amount: number;
  tax_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: 'especes' | 'mobile_money' | 'virement' | 'credit' | 'mixte';
  status: 'en_cours' | 'finalise' | 'annule' | 'pending' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  sale_date: string;
  updated_at: string;
  items_count?: number;
  items?: any[];
}

interface SaleItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

const Sales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState("all");
  const [dateRange, setDateRange] = useState("today");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // États pour la modification
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [modifySale, setModifySale] = useState<Sale | null>(null);
  const [modifyItems, setModifyItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const { toast } = useToast();

  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "finalise", label: "Finalisées" },
    { value: "annule", label: "Annulées" },
    { value: "en_cours", label: "En cours" },
  ];

  const paymentOptions = [
    { value: "all", label: "Tous les paiements" },
    { value: "especes", label: "Espèces" },
    { value: "virement", label: "Virement" },
    { value: "mobile_money", label: "Mobile Money" },
    { value: "credit", label: "Crédit" },
    { value: "mixte", label: "Mixte" },
  ];

  const dateOptions = [
    { value: "today", label: "Aujourd'hui" },
    { value: "yesterday", label: "Hier" },
    { value: "week", label: "Cette semaine" },
    { value: "month", label: "Ce mois" },
    { value: "all", label: "Tout l'historique" },
  ];

  const loadSales = async () => {
    try {
      setLoading(true);
      let url = '/api/sales/history';
      
      if (dateRange !== 'all') {
        const params = new URLSearchParams();
        params.append('period', dateRange);
        url += '?' + params.toString();
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSales(data);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger l'historique des ventes",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des ventes:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [dateRange]);

  const exportSales = () => {
    const exportData = filteredSales.map(sale => ({
      'Numéro de vente': sale.sale_number,
      'Date': formatDateForExcel(sale.sale_date || sale.created_at),
      'Client': sale.customer_name || 'Client DIVERS',
      'Mode de paiement': sale.payment_method === 'especes' ? 'Espèces' :
                          sale.payment_method === 'virement' ? 'Virement' :
                          sale.payment_method === 'mobile_money' ? 'Mobile Money' :
                          sale.payment_method === 'credit' ? 'Crédit' : 'Mixte',
      'Sous-total': formatCurrencyForExcel(sale.subtotal_amount || (sale.total_amount - sale.tax_amount)),
      'TVA': formatCurrencyForExcel(sale.tax_amount),
      'Total': formatCurrencyForExcel(sale.total_amount),
      'Statut': sale.status === 'finalise' ? 'Terminée' :
                sale.status === 'en_cours' ? 'En cours' :
                sale.status === 'pending' ? 'En attente' :
                sale.status === 'completed' ? 'Terminée' : 'Annulée'
    }));

    const success = exportToExcel({
      filename: `historique_ventes_${new Date().toISOString().split('T')[0]}`,
      data: exportData,
      sheetName: 'Historique Ventes'
    });

    if (success) {
      toast({
        title: "Export réussi",
        description: "L'historique des ventes a été exporté vers Excel",
      });
    } else {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les données",
        variant: "destructive",
      });
    }
  };

  const handleCancelSale = async (saleId: string) => {
    try {
      const response = await fetch(`/api/sales/${saleId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Erreur de caisse',
          cancelled_by: 'admin',
          refund_method: 'especes',
          notes: 'Annulation depuis interface'
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Succès",
          description: "Vente annulée avec succès",
        });
        loadSales();
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.message || "Impossible d'annuler la vente",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive",
      });
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    }
  };

  const handleModifySale = async (sale: Sale) => {
    setModifySale(sale);
    
    // Charger les détails de la vente
    try {
      const response = await fetch(`/api/sales/${sale.id}`);
      if (response.ok) {
        const saleDetails = await response.json();
        setModifyItems(saleDetails.items || []);
        await loadProducts();
        setModifyDialogOpen(true);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la vente",
        variant: "destructive",
      });
    }
  };

  const handleSaveModification = async () => {
    if (!modifySale) return;

    try {
      const response = await fetch(`/api/sales/${modifySale.id}/modify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: modifyItems,
          reason: 'Correction de quantité',
          modified_by: 'admin'
        }),
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Vente modifiée avec succès",
        });
        setModifyDialogOpen(false);
        loadSales();
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.message || "Impossible de modifier la vente",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive",
      });
    }
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const newItems = [...modifyItems];
    newItems[index].quantity = quantity;
    newItems[index].total_price = quantity * newItems[index].unit_price;
    setModifyItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = modifyItems.filter((_, i) => i !== index);
    setModifyItems(newItems);
  };

  const handleViewDetails = async (sale: Sale) => {
    try {
      const response = await fetch(`/api/sales/${sale.id}`);
      if (response.ok) {
        const saleDetails = await response.json();
        setSelectedSale({ ...sale, items: saleDetails.items });
        setDetailsDialogOpen(true);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les détails de la vente",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive",
      });
    }
  };

  const handlePrintTicket = async (saleId: string) => {
    try {
      const response = await fetch(`/api/sales/${saleId}/ticket`);
      if (response.ok) {
        const ticketData = await response.json();
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Ticket de Vente #${saleId}</title>
                <style>
                  body { font-family: monospace; font-size: 12px; width: 300px; margin: 0; padding: 20px; }
                  .header { text-align: center; margin-bottom: 20px; }
                  .line { border-bottom: 1px dashed #000; margin: 10px 0; }
                  .total { font-weight: bold; font-size: 14px; }
                  .item { display: flex; justify-content: space-between; margin: 5px 0; }
                </style>
              </head>
              <body>
                <div class="header">
                  <h2>MADA BREW BOSS</h2>
                  <p>Ticket de Vente #${ticketData.id}</p>
                  <p>${new Date(ticketData.date_vente).toLocaleString('fr-FR')}</p>
                </div>
                <div class="line"></div>
                ${ticketData.items.map((item: any) => `
                  <div class="item">
                    <span>${item.product_name} x${item.quantity}</span>
                    <span>${item.total_price.toLocaleString()} MGA</span>
                  </div>
                `).join('')}
                <div class="line"></div>
                <div class="item total">
                  <span>TOTAL</span>
                  <span>${ticketData.final_amount.toLocaleString()} MGA</span>
                </div>
                ${ticketData.customer_name ? `<p>Client: ${ticketData.customer_name}</p>` : ''}
                <div class="line"></div>
                <p style="text-align: center; margin-top: 20px;">Merci de votre visite!</p>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'imprimer le ticket",
        variant: "destructive",
      });
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = !searchQuery || 
      sale.sale_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || sale.status === selectedStatus;
    const matchesPayment = selectedPayment === "all" || sale.payment_method === selectedPayment;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'finalise':
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Finalisée</Badge>;
      case 'annule':
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Annulée</Badge>;
      case 'en_cours':
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En cours</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getPaymentIcon = (method?: string) => {
    switch (method) {
      case 'especes':
        return <Banknote className="w-4 h-4" />;
      case 'virement':
        return <CreditCard className="w-4 h-4" />;
      case 'mobile_money':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Receipt className="w-4 h-4" />;
    }
  };

  const getPaymentLabel = (method?: string) => {
    switch (method) {
      case 'especes':
        return 'Espèces';
      case 'virement':
        return 'Virement';
      case 'mobile_money':
        return 'Mobile Money';
      case 'credit':
        return 'Crédit';
      case 'mixte':
        return 'Mixte';
      default:
        return method || 'Non spécifié';
    }
  };

  const totalAmount = filteredSales.reduce((sum, sale) => sum + (sale.final_amount || 0), 0);
  const todayAmount = sales
    .filter(sale => sale.created_at && sale.created_at.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((sum, sale) => sum + (sale.final_amount || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Historique des Ventes</h1>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historique des Ventes</h1>
          <p className="text-muted-foreground">Consultez et gérez vos transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportSales} disabled={filteredSales.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exporter Excel
          </Button>
          <Button onClick={loadSales} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventes</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredSales.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAmount.toLocaleString()} MGA</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredSales.length > 0 ? Math.round(totalAmount / filteredSales.length).toLocaleString() : 0} MGA
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TVA Collectée</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totalAmount * 0.2).toLocaleString()} MGA</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro ou client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPayment} onValueChange={setSelectedPayment}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les paiements" />
              </SelectTrigger>
              <SelectContent>
                {paymentOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Aujourd'hui" />
              </SelectTrigger>
              <SelectContent>
                {dateOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sales List */}
      <Card>
        <CardHeader>
          <CardTitle>Ventes ({filteredSales.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucune vente trouvée</p>
              <p>Aucune vente pour cette période</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSales.map((sale) => (
                <div key={sale.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{sale.sale_number}</span>
                          {getStatusBadge(sale.status)}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                            </span>
                            {sale.customer_name && (
                              <span className="flex items-center">
                                <User className="w-4 h-4 mr-1" />
                                {sale.customer_name}
                              </span>
                            )}
                            {sale.payment_method && (
                              <span className="flex items-center">
                                {getPaymentIcon(sale.payment_method)}
                                <span className="ml-1">{getPaymentLabel(sale.payment_method)}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {sale.final_amount.toLocaleString()} MGA
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {sale.items_count || 0} article{(sale.items_count || 0) > 1 ? 's' : ''}
                        </div>
                      </div>

                      <div className="flex space-x-1">
                        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDetails(sale)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Détails de la vente #{selectedSale?.sale_number}</DialogTitle>
                              <DialogDescription>
                                {selectedSale && format(new Date(selectedSale.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              {selectedSale?.customer_name && (
                                <div>
                                  <h4 className="font-semibold mb-2">Client</h4>
                                  <p>{selectedSale.customer_name}</p>
                                </div>
                              )}

                              {selectedSale?.items && selectedSale.items.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2">Articles achetés</h4>
                                  <div className="space-y-2">
                                    {selectedSale.items.map((item: any, idx: number) => (
                                      <div key={idx} className="flex justify-between text-sm">
                                        <span>
                                          {item.product_name} × {item.quantity}
                                        </span>
                                        <span>
                                          {item.unit_price?.toLocaleString()} MGA
                                          {item.total_price ? ` | Total: ${item.total_price.toLocaleString()} MGA` : ''}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div>
                                <h4 className="font-semibold mb-2">Informations</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span>Montant total:</span>
                                    <span className="font-semibold">{selectedSale?.total_amount.toLocaleString()} MGA</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Remise:</span>
                                    <span className="font-semibold">{selectedSale?.discount_amount.toLocaleString()} MGA</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>TVA:</span>
                                    <span className="font-semibold">{selectedSale?.tax_amount.toLocaleString()} MGA</span>
                                  </div>
                                  <div className="flex justify-between border-t pt-2">
                                    <span className="font-bold">Montant final:</span>
                                    <span className="font-bold">{selectedSale?.final_amount.toLocaleString()} MGA</span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">Paiement</h4>
                                <div className="flex items-center space-x-2">
                                  {selectedSale && getPaymentIcon(selectedSale.payment_method)}
                                  <span>{selectedSale && getPaymentLabel(selectedSale.payment_method)}</span>
                                </div>
                              </div>

                              {selectedSale?.notes && (
                                <div>
                                  <h4 className="font-semibold mb-2">Notes</h4>
                                  <p className="text-muted-foreground">{selectedSale.notes}</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePrintTicket(sale.id)}
                        >
                          <Printer className="w-4 h-4" />
                        </Button>

                        {(sale.status === 'finalise' || sale.status === 'completed') && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleModifySale(sale)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Annuler la vente</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir annuler la vente #{sale.sale_number} ? 
                                  Cette action restaurera le stock des produits vendus.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Retour</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleCancelSale(sale.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Annuler la vente
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de modification */}
      <Dialog open={modifyDialogOpen} onOpenChange={setModifyDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la vente #{modifySale?.id}</DialogTitle>
            <DialogDescription>
              Ajustez les quantités ou supprimez des articles de cette vente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-2 text-sm font-medium border-b pb-2">
              <div className="col-span-5">Produit</div>
              <div className="col-span-2">Prix unitaire</div>
              <div className="col-span-2">Quantité</div>
              <div className="col-span-2">Total</div>
              <div className="col-span-1">Action</div>
            </div>

            {modifyItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <span className="font-medium">{item.product_name}</span>
                </div>
                <div className="col-span-2">
                  <span>{item.unit_price.toLocaleString()} MGA</span>
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full"
                  />
                </div>
                <div className="col-span-2">
                  <span className="font-medium">{(item.quantity * item.unit_price).toLocaleString()} MGA</span>
                </div>
                <div className="col-span-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {modifyItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucun article dans cette vente
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total:</span>
                <span>
                  {modifyItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toLocaleString()} MGA
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setModifyDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveModification}>
                Sauvegarder les modifications
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
