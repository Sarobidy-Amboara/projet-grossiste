import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  Package, 
  Users,
  Store,
  Zap,
  Calendar
} from "lucide-react";
import heroImage from "@/assets/hero-beverages.jpg";

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

interface DashboardStats {
  todayStats: {
    sales: number;
    transactions: number;
    customers: number;
    lowStock: number;
  };
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
    trend: string;
  }>;
  lowStockItems: Array<{
    name: string;
    stock: number;
    minimum: number;
  }>;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
  const [stats, setStats] = useState<DashboardStats>({
    todayStats: {
      sales: 0,
      transactions: 0,
      customers: 0,
      lowStock: 0
    },
    topProducts: [],
    lowStockItems: []
  });
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [chartPeriod, setChartPeriod] = useState('30');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [creditCustomers, setCreditCustomers] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadCreditCustomers = async () => {
      try {
        const response = await fetch('/api/customers/with-credit');
        if (response.ok) {
          const data = await response.json();
          setCreditCustomers(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des clients avec crédit:', error);
      }
    };

    const loadRevenueData = async () => {
      try {
        let url = `/api/dashboard/revenue-chart?period=${chartPeriod}`;
        if (customStartDate && customEndDate) {
          url = `/api/dashboard/revenue-chart?startDate=${customStartDate}&endDate=${customEndDate}`;
        }
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setRevenueData(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données de revenus:', error);
      }
    };

    loadDashboardStats();
    loadRevenueData();
    loadCreditCustomers();
    
    // Actualiser les stats toutes les 5 minutes
    const interval = setInterval(() => {
      loadDashboardStats();
      loadRevenueData();
    }, 300000);
    return () => clearInterval(interval);
  }, [chartPeriod, customStartDate, customEndDate]);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div 
        className="relative h-48 rounded-xl overflow-hidden bg-gradient-tropical"
        style={{
          backgroundImage: `linear-gradient(rgba(220, 38, 127, 0.8), rgba(251, 146, 60, 0.8)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 flex items-center justify-between p-8">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-2">Bienvenue dans Mada Brew Boss</h2>
            <p className="text-lg opacity-90">Système de gestion pour grossiste de boissons</p>
            <p className="text-sm opacity-75 mt-1">Madagascar • Ariary (MGA) • TVA 20%</p>
          </div>
          <Button 
            variant="success" 
            size="lg"
            onClick={() => onNavigate?.("pos")}
            className="shadow-glow"
          >
            <Store className="w-5 h-5 mr-2" />
            Nouvelle Vente
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des statistiques...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-ambient hover:shadow-primary transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ventes Aujourd'hui</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {stats.todayStats.sales.toLocaleString()} MGA
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 mr-1 text-secondary" />
                  Chiffre d'affaires du jour
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-ambient hover:shadow-primary transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.todayStats.transactions}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 mr-1 text-secondary" />
                  Ventes réalisées
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-ambient hover:shadow-primary transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.todayStats.customers}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 mr-1 text-secondary" />
                  Clients différents
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-ambient hover:shadow-primary transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.todayStats.lowStock}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Package className="w-3 h-3 mr-1" />
                  articles à réapprovisionner
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Products */}
            <Card className="shadow-ambient">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Top Produits Aujourd'hui
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-amber rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-amber-foreground">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.sales} vendus</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{product.revenue.toLocaleString()} MGA</p>
                        <div className="flex items-center">
                          {product.trend === "up" ? (
                            <TrendingUp className="w-3 h-3 text-secondary mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-destructive mr-1" />
                          )}
                          <span className={`text-xs ${product.trend === "up" ? "text-secondary" : "text-destructive"}`}>
                            Tendance
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stats.topProducts.length === 0 && (
                    <p className="text-center text-gray-500 py-4">Aucune vente aujourd'hui</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Low Stock Alert */}
            <Card className="shadow-ambient border-destructive/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-destructive">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Alertes Stock Minimum
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.lowStockItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Stock: {item.stock} | Min: {item.minimum}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        Stock faible
                      </Badge>
                    </div>
                  ))}
                  {stats.lowStockItems.length === 0 && (
                    <p className="text-center text-green-600 py-4">✓ Tous les stocks sont suffisants</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Clients avec crédit */}
            <Card className="shadow-ambient border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-orange-600">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Clients avec Crédit
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {creditCustomers.slice(0, 5).map((customer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-100">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.phone} • {customer.credit_sales_count} vente(s) à crédit
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          {customer.current_balance.toLocaleString()} MGA
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Limite: {customer.credit_limit?.toLocaleString() || 'Non défini'} MGA
                        </p>
                      </div>
                    </div>
                  ))}
                  {creditCustomers.length === 0 && (
                    <p className="text-center text-green-600 py-4">✓ Aucun client en crédit</p>
                  )}
                  {creditCustomers.length > 5 && (
                    <Button variant="ghost" className="w-full mt-2" onClick={() => onNavigate?.("customers")}>
                      Voir tous les clients ({creditCustomers.length})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card className="shadow-ambient">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Évolution du Chiffre d'Affaires
                </CardTitle>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="period">Période:</Label>
                    <Select value={chartPeriod} onValueChange={setChartPeriod}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 jours</SelectItem>
                        <SelectItem value="15">15 jours</SelectItem>
                        <SelectItem value="30">30 jours</SelectItem>
                        <SelectItem value="90">90 jours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="startDate">Du:</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-32"
                    />
                    <Label htmlFor="endDate">Au:</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-32"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        `${value.toLocaleString()} MGA`, 
                        name === 'revenue' ? 'Chiffre d\'affaires' : 'Transactions'
                      ]}
                      labelFormatter={(value) => new Date(value).toLocaleDateString('fr-FR')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {revenueData.length === 0 && (
                <div className="flex items-center justify-center h-80 text-muted-foreground">
                  <div className="text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune donnée de vente pour cette période</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;