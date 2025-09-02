import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  Archive
} from "lucide-react";

const LayoutNoAuth = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const navigation = [
    { name: "Point de Vente", href: "/", icon: ShoppingCart },
    { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
    { name: "Produits", href: "/products", icon: Package },
    { name: "Stock", href: "/stock", icon: Archive },
    { name: "Clients", href: "/customers", icon: Users },
    { name: "Ventes", href: "/sales", icon: CreditCard },
    { name: "Achats", href: "/purchases", icon: Truck },
    { name: "Unités", href: "/units", icon: Ruler },
    { name: "Paramètres", href: "/settings", icon: Settings },
  ];

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
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-5 w-5" />
                {sidebarOpen && <span className="ml-3">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-border">
          {sidebarOpen && (
            <div className="mb-2 text-sm text-muted-foreground">
              <p className="font-medium">Utilisateur</p>
              <p className="capitalize">admin</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LayoutNoAuth;
