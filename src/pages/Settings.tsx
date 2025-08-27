import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Save, 
  Building, 
  MapPin, 
  Phone, 
  Mail,
  Percent,
  DollarSign,
  Shield,
  Bell,
  Palette
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingItem {
  key: string;
  value: string;
  description?: string;
}

const SettingsPage = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    company_name: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    company_website: "",
    tax_rate: "",
    currency: "",
    receipt_footer: "",
    low_stock_threshold: "",
    enable_notifications: true,
    auto_backup: true,
    theme_color: "tropical",
  });

  const fetchSettings = async () => {
    try {
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update all settings
      await Promise.all([
        updateSetting("company_name", formData.company_name),
        updateSetting("company_address", formData.company_address),
        updateSetting("company_phone", formData.company_phone),
        updateSetting("company_email", formData.company_email),
        updateSetting("company_website", formData.company_website),
        updateSetting("tax_rate", formData.tax_rate),
        updateSetting("currency", formData.currency),
        updateSetting("receipt_footer", formData.receipt_footer),
        updateSetting("low_stock_threshold", formData.low_stock_threshold),
        updateSetting("enable_notifications", formData.enable_notifications.toString()),
        updateSetting("auto_backup", formData.auto_backup.toString()),
        updateSetting("theme_color", formData.theme_color),
      ]);

      toast({
        title: "Paramètres sauvegardés",
        description: "Vos paramètres ont été mis à jour avec succès",
      });

      fetchSettings(); // Refresh settings
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Chargement des paramètres...</p>
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
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground">Configurez votre application</p>
        </div>
        
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Informations de l'entreprise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company_name">Nom de l'entreprise</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Nom de votre entreprise"
              />
            </div>

            <div>
              <Label htmlFor="company_address">Adresse</Label>
              <Textarea
                id="company_address"
                value={formData.company_address}
                onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                placeholder="Adresse complète"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="company_phone">Téléphone</Label>
              <Input
                id="company_phone"
                value={formData.company_phone}
                onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                placeholder="+261 20 22 123 45"
              />
            </div>

            <div>
              <Label htmlFor="company_email">Email</Label>
              <Input
                id="company_email"
                type="email"
                value={formData.company_email}
                onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                placeholder="contact@entreprise.mg"
              />
            </div>

            <div>
              <Label htmlFor="company_website">Site web</Label>
              <Input
                id="company_website"
                value={formData.company_website}
                onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
                placeholder="https://www.entreprise.mg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Paramètres financiers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currency">Devise</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="MGA"
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ariary malgache (MGA) uniquement pour cette version
              </p>
            </div>

            <div>
              <Label htmlFor="tax_rate">Taux de TVA (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                placeholder="20.00"
              />
            </div>

            <div>
              <Label htmlFor="receipt_footer">Message de pied de ticket</Label>
              <Textarea
                id="receipt_footer"
                value={formData.receipt_footer}
                onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
                placeholder="Message affiché en bas du ticket de caisse"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stock Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Gestion des stocks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="low_stock_threshold">Seuil d'alerte stock faible</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                min="0"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Afficher une alerte quand le stock descend en dessous de cette valeur
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications de stock</Label>
                <p className="text-xs text-muted-foreground">
                  Recevoir des alertes pour les stocks faibles
                </p>
              </div>
              <Switch
                checked={formData.enable_notifications}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, enable_notifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sauvegarde automatique</Label>
                <p className="text-xs text-muted-foreground">
                  Sauvegarde quotidienne des données
                </p>
              </div>
              <Switch
                checked={formData.auto_backup}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, auto_backup: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Apparence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="theme_color">Couleur du thème</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { value: "tropical", label: "Tropical", color: "bg-gradient-to-r from-amber-400 to-orange-500" },
                  { value: "ocean", label: "Océan", color: "bg-gradient-to-r from-blue-400 to-cyan-500" },
                  { value: "forest", label: "Forêt", color: "bg-gradient-to-r from-green-400 to-emerald-500" },
                  { value: "sunset", label: "Coucher", color: "bg-gradient-to-r from-pink-400 to-red-500" },
                  { value: "purple", label: "Violet", color: "bg-gradient-to-r from-purple-400 to-indigo-500" },
                  { value: "classic", label: "Classique", color: "bg-gradient-to-r from-gray-400 to-slate-500" },
                ].map((theme) => (
                  <button
                    key={theme.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, theme_color: theme.value })}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      formData.theme_color === theme.value 
                        ? "border-primary" 
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <div className={`w-full h-8 rounded ${theme.color} mb-1`} />
                    <p className="text-xs font-medium">{theme.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Informations système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Version</Label>
              <p className="font-medium">Mada Brew Boss v1.0</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Base de données</Label>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Dernière sauvegarde</Label>
              <p className="font-medium">Aujourd'hui</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Statut</Label>
              <p className="font-medium text-green-600">En ligne</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;