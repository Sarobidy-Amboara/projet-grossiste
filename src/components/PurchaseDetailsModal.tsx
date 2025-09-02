import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Package, User, Receipt, Hash } from "lucide-react";

interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_id: string;
  unit_name: string;
  unit_abbreviation: string;
  unit_price: number;
  total_price: number;
}

interface Purchase {
  id: string;
  supplier_id: string;
  supplier_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  notes?: string;
  items?: PurchaseItem[];
}

interface PurchaseDetailsModalProps {
  purchase: Purchase | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PurchaseDetailsModal({ purchase, isOpen, onClose }: PurchaseDetailsModalProps) {
  if (!purchase) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} MGA`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Détails de l'achat #{purchase.id}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Informations générales */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Fournisseur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{purchase.supplier_name}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Date d'achat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{formatDate(purchase.created_at)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Statut
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={purchase.status === 'completed' ? 'default' : 'secondary'}>
                  {purchase.status === 'completed' ? 'Terminé' : purchase.status}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Montant total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(purchase.total_amount)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {purchase.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{purchase.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Articles achetés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Articles achetés ({purchase.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {purchase.items && purchase.items.length > 0 ? (
                <div className="space-y-3">
                  {purchase.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit_abbreviation} × {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(item.total_price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Aucun article trouvé
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
