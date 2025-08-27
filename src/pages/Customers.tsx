import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  Phone,
  Mail,
  MapPin,
  Building
} from "lucide-react";
import { useCustomers, Customer } from "@/hooks/useCustomers";
import { useToast } from "@/hooks/use-toast";

const CustomersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "particulier" as "particulier" | "professionnel",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    city: "Antananarivo",
    tax_number: "",
    credit_limit: "",
    discount_percentage: "",
    payment_terms: "",
    notes: "",
  });

  const { customers, loading, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { toast } = useToast();

  const typeOptions = [
    { value: "all", label: "Tous les types" },
    { value: "particulier", label: "Particuliers" },
    { value: "professionnel", label: "Professionnels" },
  ];

  const filteredCustomers = customers.filter(customer => {
    if (customer.name === "CLIENT DIVERS") return false; // Exclure le client par défaut
    
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchQuery)) ||
      (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedType === "all" || customer.type === selectedType;
    return matchesSearch && matchesType;
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "particulier",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      city: "Antananarivo",
      tax_number: "",
      credit_limit: "",
      discount_percentage: "",
      payment_terms: "30",
      notes: "",
    });
    setEditingCustomer(null);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      type: customer.type,
      contact_person: customer.contact_person || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      city: customer.city,
      tax_number: customer.tax_number || "",
      credit_limit: customer.credit_limit.toString(),
      discount_percentage: customer.discount_percentage.toString(),
      payment_terms: customer.payment_terms.toString(),
      notes: customer.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: "Erreur",
        description: "Le nom du client est obligatoire",
        variant: "destructive",
      });
      return;
    }

    const customerData = {
      name: formData.name,
      type: formData.type,
      contact_person: formData.contact_person,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      city: formData.city,
      tax_number: formData.tax_number,
      credit_limit: parseFloat(formData.credit_limit) || 0,
      current_balance: 0,
      discount_percentage: parseFloat(formData.discount_percentage) || 0,
      payment_terms: parseInt(formData.payment_terms) || 30,
      is_active: true,
      notes: formData.notes,
    };

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, customerData);
      } else {
        await createCustomer(customerData as any);
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      await deleteCustomer(id);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Chargement des clients...</p>
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
          <h1 className="text-3xl font-bold">Gestion des Clients</h1>
          <p className="text-muted-foreground">Gérez votre portefeuille clients</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Modifier le client" : "Nouveau client"}
              </DialogTitle>
              <DialogDescription>
                Remplissez les informations du client
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Nom / Raison sociale *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Hôtel Colbert ou Jean Dupont"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Type de client</Label>
                  <Select value={formData.type} onValueChange={(value: "particulier" | "professionnel") => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="particulier">Particulier</SelectItem>
                      <SelectItem value="professionnel">Professionnel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="contact_person">Personne de contact</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="Nom du responsable"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+261 34 12 345 67"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@client.mg"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Adresse complète"
                  />
                </div>

                <div>
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Antananarivo"
                  />
                </div>

                <div>
                  <Label htmlFor="tax_number">Numéro fiscal</Label>
                  <Input
                    id="tax_number"
                    value={formData.tax_number}
                    onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    placeholder="NIF ou CIN"
                  />
                </div>

                <div>
                  <Label htmlFor="credit_limit">Plafond crédit (MGA)</Label>
                  <Input
                    id="credit_limit"
                    type="number"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="discount_percentage">Remise (%)</Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="payment_terms">Délai de paiement (jours)</Label>
                  <Input
                    id="payment_terms"
                    type="number"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    placeholder="30"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Informations complémentaires"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingCustomer ? "Modifier" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher un client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
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
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCustomers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Particuliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.type === 'particulier' && c.name !== 'CLIENT DIVERS').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Professionnels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.type === 'professionnel').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Crédit Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.reduce((sum, c) => sum + c.current_balance, 0).toLocaleString()} MGA
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{customer.name}</CardTitle>
                  <Badge variant={customer.type === 'professionnel' ? 'default' : 'secondary'} className="mt-1">
                    {customer.type === 'professionnel' ? 'Professionnel' : 'Particulier'}
                  </Badge>
                </div>
                {customer.current_balance > 0 && (
                  <Badge variant="destructive">Crédit</Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {customer.contact_person && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{customer.contact_person}</span>
                </div>
              )}
              
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{customer.phone}</span>
                </div>
              )}
              
              {customer.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              
              {customer.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{customer.address}, {customer.city}</span>
                </div>
              )}

              <div className="space-y-1 pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>Plafond crédit:</span>
                  <span className="font-medium">{customer.credit_limit.toLocaleString()} MGA</span>
                </div>
                {customer.discount_percentage > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Remise:</span>
                    <span className="font-medium text-green-600">{customer.discount_percentage}%</span>
                  </div>
                )}
                {customer.current_balance > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Solde dû:</span>
                    <span className="font-medium text-destructive">
                      {customer.current_balance.toLocaleString()} MGA
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(customer)} className="flex-1">
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDelete(customer.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Aucun client trouvé</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "Essayez de modifier votre recherche" : "Commencez par ajouter votre premier client"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un client
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomersPage;