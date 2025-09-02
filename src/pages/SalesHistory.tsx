import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Eye, 
  Download,
  RefreshCw,
  Calendar,
  TrendingUp,
  Banknote,
  CreditCard
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
  sale_date: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  payment_method: string;
  status: string;
  items: any[];
}

const SalesHistory = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("month");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const dateOptions = [
    { value: "today", label: "Aujourd'hui" },
    { value: "yesterday", label: "Hier" },
    { value: "week", label: "Cette semaine" },
    { value: "month", label: "Ce mois" },
    { value: "all", label: "Tout l'historique" },
  ];

  const paymentOptions = [
    { value: "all", label: "Tous les paiements" },
    { value: "especes", label: "Espèces" },
    { value: "virement", label: "Virement" },
    { value: "mobile_money", label: "Mobile Money" },
    { value: "credit", label: "Crédit" },
    { value: "mixte", label: "Mixte" },
  ];

  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "completed", label: "Terminée" },
    { value: "pending", label: "En attente" },
    { value: "cancelled", label: "Annulée" },
  ];

  const loadSales = async () => {
    try {
      setLoading(true);
      let url = '/api/sales/history';
      
      const params = new URLSearchParams();
      if (dateRange !== 'all') params.append('period', dateRange);
      if (paymentFilter !== 'all') params.append('payment_method', paymentFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      if (params.toString()) {
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
  }, [dateRange, paymentFilter, statusFilter]);

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.sale_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (sale.customer_name && sale.customer_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const exportSales = () => {
    const exportData = filteredSales.map(sale => ({
      'Numéro de vente': sale.sale_number,
      'Date': formatDateForExcel(sale.sale_date),
      'Client': sale.customer_name || 'Client DIVERS',
      'Mode de paiement': sale.payment_method === 'especes' ? 'Espèces' :
                          sale.payment_method === 'virement' ? 'Virement' :
                          sale.payment_method === 'mobile_money' ? 'Mobile Money' :
                          sale.payment_method === 'credit' ? 'Crédit' : 'Mixte',
      'Sous-total': formatCurrencyForExcel(sale.subtotal_amount),
      'TVA': formatCurrencyForExcel(sale.tax_amount),
      'Total': formatCurrencyForExcel(sale.total_amount),
      'Statut': sale.status === 'completed' ? 'Terminée' :
                sale.status === 'pending' ? 'En attente' : 'Annulée'
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Terminée</Badge>;
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'especes':
        return <Banknote className="w-4 h-4" />;
      case 'virement':
      case 'mobile_money':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalSales = filteredSales.length;
  const averageOrder = totalSales > 0 ? totalRevenue / totalSales : 0;

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">Chargement de l'historique...</p>
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
          <p className="text-muted-foreground">Consultez et analysez vos transactions</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} MGA</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageOrder).toLocaleString()} MGA</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher une vente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ventes ({filteredSales.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucune vente trouvée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.sale_number}</TableCell>
                    <TableCell>
                      {format(new Date(sale.sale_date), "dd/MM/yyyy HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell>{sale.customer_name || "Client DIVERS"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPaymentIcon(sale.payment_method)}
                        <span className="capitalize">
                          {sale.payment_method === 'especes' ? 'Espèces' :
                           sale.payment_method === 'virement' ? 'Virement' :
                           sale.payment_method === 'mobile_money' ? 'Mobile Money' :
                           sale.payment_method === 'credit' ? 'Crédit' : 'Mixte'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {sale.total_amount.toLocaleString()} MGA
                    </TableCell>
                    <TableCell>{getStatusBadge(sale.status)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesHistory;
