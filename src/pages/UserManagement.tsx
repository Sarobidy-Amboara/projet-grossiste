import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Shield, 
  Eye, 
  EyeOff,
  UserCheck,
  UserX
} from 'lucide-react';
import { useAuth, useUserManagement, User } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const UserManagement: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { getUsers, createUser, updateUser, deleteUser } = useUserManagement();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'cashier' as 'admin' | 'manager' | 'cashier',
    isActive: true
  });

  // Vérifier les permissions
  if (!hasPermission('users')) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas les permissions pour accéder à cette page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(getUsers());
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      role: 'cashier',
      isActive: true
    });
    setEditingUser(null);
  };

  const handleEdit = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setFormData({
      username: userToEdit.username,
      password: '', // Ne pas pré-remplir le mot de passe pour la sécurité
      fullName: userToEdit.fullName,
      email: userToEdit.email || '',
      role: userToEdit.role,
      isActive: userToEdit.isActive
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.fullName) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (!editingUser && !formData.password) {
      toast({
        title: "Erreur",
        description: "Le mot de passe est obligatoire pour un nouvel utilisateur",
        variant: "destructive"
      });
      return;
    }

    // Vérifier l'unicité du nom d'utilisateur
    const existingUser = users.find(u => 
      u.username === formData.username && 
      u.id !== editingUser?.id
    );
    
    if (existingUser) {
      toast({
        title: "Erreur",
        description: "Ce nom d'utilisateur existe déjà",
        variant: "destructive"
      });
      return;
    }

    let success = false;

    if (editingUser) {
      // Mise à jour
      const updateData: Partial<User> = {
        username: formData.username,
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive
      };
      
      // Inclure le mot de passe seulement s'il est fourni
      if (formData.password) {
        updateData.password = formData.password;
      }

      success = updateUser(editingUser.id, updateData);
    } else {
      // Création
      success = createUser({
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive
      });
    }

    if (success) {
      toast({
        title: "Succès",
        description: editingUser ? "Utilisateur modifié avec succès" : "Utilisateur créé avec succès"
      });
      loadUsers();
      setDialogOpen(false);
      resetForm();
    } else {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    }
  };

  const handleDelete = (userId: string, userName: string) => {
    if (userId === 'admin-001') {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'administrateur principal",
        variant: "destructive"
      });
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${userName}" ?`)) {
      const success = deleteUser(userId);
      if (success) {
        toast({
          title: "Succès",
          description: "Utilisateur supprimé avec succès"
        });
        loadUsers();
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la suppression",
          variant: "destructive"
        });
      }
    }
  };

  const toggleUserStatus = (userId: string, currentStatus: boolean) => {
    if (userId === 'admin-001') {
      toast({
        title: "Erreur",
        description: "Impossible de désactiver l'administrateur principal",
        variant: "destructive"
      });
      return;
    }

    const success = updateUser(userId, { isActive: !currentStatus });
    if (success) {
      toast({
        title: "Succès",
        description: `Utilisateur ${!currentStatus ? 'activé' : 'désactivé'} avec succès`
      });
      loadUsers();
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'destructive',
      manager: 'default',
      cashier: 'secondary'
    } as const;

    const labels = {
      admin: 'Admin',
      manager: 'Gérant',
      cashier: 'Caissier'
    };

    return (
      <Badge variant={variants[role as keyof typeof variants]}>
        {labels[role as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">Gérez les comptes utilisateurs et leurs permissions</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Utilisateur
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
              </DialogTitle>
              <DialogDescription>
                {editingUser ? "Modifier les informations de l'utilisateur" : "Créer un nouveau compte utilisateur"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Nom d'utilisateur *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="nom_utilisateur"
                />
              </div>
              
              <div>
                <Label htmlFor="password">
                  Mot de passe {editingUser ? "(laisser vide pour ne pas changer)" : "*"}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? "Nouveau mot de passe" : "Mot de passe"}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="fullName">Nom complet *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Nom Prénom"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemple.com"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Rôle *</Label>
                <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Caissier</SelectItem>
                    <SelectItem value="manager">Gérant</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Compte actif</Label>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingUser ? "Modifier" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Liste des Utilisateurs ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((userItem) => (
                <TableRow key={userItem.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{userItem.fullName}</p>
                      <p className="text-sm text-muted-foreground">@{userItem.username}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(userItem.role)}</TableCell>
                  <TableCell>{userItem.email || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={userItem.isActive}
                        onCheckedChange={() => toggleUserStatus(userItem.id, userItem.isActive)}
                        disabled={userItem.id === 'admin-001'}
                      />
                      <Badge variant={userItem.isActive ? 'default' : 'secondary'}>
                        {userItem.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {userItem.lastLogin 
                      ? new Date(userItem.lastLogin).toLocaleDateString('fr-FR')
                      : 'Jamais'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(userItem)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {userItem.id !== 'admin-001' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(userItem.id, userItem.fullName)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Informations sur les rôles */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions par Rôle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Caissier</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Tableau de bord</li>
                <li>• Point de vente</li>
                <li>• Historique des ventes</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="default">Gérant</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Toutes les permissions du caissier</li>
                <li>• Gestion des achats</li>
                <li>• Gestion du stock</li>
                <li>• Produits et catégories</li>
                <li>• Clients et fournisseurs</li>
                <li>• Paramètres</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Admin</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Toutes les permissions</li>
                <li>• Gestion des utilisateurs</li>
                <li>• Gestion des unités</li>
                <li>• Configuration avancée</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
