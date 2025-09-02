import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Package, 
  Users, 
  CreditCard, 
  Settings, 
  BarChart3,
  Menu,
  Ruler,
  Truck,
  Archive,
  LogOut,
  User,
  Shield
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { user, logout, canAccessMenu } = useAuth();

  // Si pas d'utilisateur connecté, ne rien afficher (sera géré par App.tsx)
  if (!user) return null;

  const allNavigation = [
    { name: "Point de Vente", href: "/", icon: ShoppingCart, permission: "pos" },
    { name: "Dashboard", href: "/dashboard", icon: BarChart3, permission: "dashboard" },
    { name: "Ventes", href: "/sales", icon: CreditCard, permission: "sales" },
    { name: "Achats", href: "/purchases", icon: Truck, permission: "purchases" },
    { name: "Stock", href: "/stock", icon: Archive, permission: "stock" },
    { name: "Produits", href: "/products", icon: Package, permission: "products" },
    { name: "Clients", href: "/customers", icon: Users, permission: "customers" },
    { name: "Unités", href: "/units", icon: Ruler, permission: "units" },
    { name: "Utilisateurs", href: "/users", icon: Shield, permission: "users" },
    { name: "Paramètres", href: "/settings", icon: Settings, permission: "settings" },
  ];

  // Filtrer la navigation selon les permissions de l'utilisateur
  const navigation = allNavigation.filter(item => canAccessMenu(item.permission));

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-card border-r border-border transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-xl font-bold text-primary">Mada Brew Boss</h1>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} to={item.href}>
                  <Button
                    variant={isActive(item.href) ? "tropical" : "ghost"}
                    className={`w-full justify-start ${!sidebarOpen && 'px-2'}`}
                  >
                    <Icon className="h-5 w-5" />
                    {sidebarOpen && <span className="ml-3">{item.name}</span>}
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-border">
          {sidebarOpen ? (
            <div className="space-y-3">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.fullName}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'manager' ? 'default' : 'secondary'} className="text-xs">
                      {user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Gérant' : 'Caissier'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-1">
                <Link to="/profile">
                  <Button variant="ghost" className="w-full justify-start">
                    <User className="h-4 w-4" />
                    <span className="ml-3">Mon Profil</span>
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="ml-3">Déconnexion</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Link to="/profile">
                <Button variant="ghost" size="icon" className="w-full">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-full text-destructive hover:text-destructive"
                onClick={logout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;