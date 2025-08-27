import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  Package, 
  Users,
  Store,
  Zap
} from "lucide-react";
import heroImage from "@/assets/hero-beverages.jpg";

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
  const todayStats = {
    sales: 2850000, // MGA
    transactions: 47,
    customers: 23,
    lowStock: 5
  };

  const topProducts = [
    { name: "THB Pilsener", sales: 145, revenue: 290000, trend: "up" },
    { name: "Dzama Rhum Vieux", sales: 23, revenue: 460000, trend: "up" },
    { name: "Coca-Cola 1.5L", sales: 89, revenue: 178000, trend: "down" },
    { name: "Eau Vive 1L", sales: 234, revenue: 234000, trend: "up" }
  ];

  const lowStockItems = [
    { name: "THB Pilsener", stock: 15, minimum: 50 },
    { name: "Fanta Orange", stock: 8, minimum: 30 },
    { name: "Dzama Blanc", stock: 12, minimum: 25 },
    { name: "Eau Cristalline", stock: 22, minimum: 100 },
    { name: "Sprite 2L", stock: 5, minimum: 40 }
  ];

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-ambient hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes Aujourd'hui</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {todayStats.sales.toLocaleString()} MGA
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1 text-secondary" />
              +12% vs hier
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-ambient hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{todayStats.transactions}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1 text-secondary" />
              +8% vs hier
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-ambient hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{todayStats.customers}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1 text-secondary" />
              +3 nouveaux
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-ambient hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{todayStats.lowStock}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Package className="w-3 h-3 mr-1" />
              articles à réapprovisionner
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="shadow-ambient">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Top Produits Aujourd'hui
              <Button variant="ghost" size="sm" onClick={() => onNavigate?.("products")}>
                Voir tout
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
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
                        {product.trend === "up" ? "+5%" : "-3%"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
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
              <Button variant="secondary" size="sm" onClick={() => onNavigate?.("products")}>
                Gérer Stock
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.map((item, index) => (
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-ambient">
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="tropical" onClick={() => onNavigate?.("pos")} className="h-20 flex-col">
              <Store className="w-6 h-6 mb-2" />
              <span>Nouvelle Vente</span>
            </Button>
            <Button variant="amber" onClick={() => onNavigate?.("customers")} className="h-20 flex-col">
              <Users className="w-6 h-6 mb-2" />
              <span>Nouveau Client</span>
            </Button>
            <Button variant="success" onClick={() => onNavigate?.("products")} className="h-20 flex-col">
              <Package className="w-6 h-6 mb-2" />
              <span>Gérer Stock</span>
            </Button>
            <Button variant="secondary" onClick={() => onNavigate?.("payments")} className="h-20 flex-col">
              <DollarSign className="w-6 h-6 mb-2" />
              <span>Encaissements</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;