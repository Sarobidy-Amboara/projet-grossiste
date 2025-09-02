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

const Layout = () => {
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

      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;