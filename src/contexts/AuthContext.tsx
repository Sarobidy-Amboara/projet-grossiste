import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'manager' | 'cashier';
  fullName: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  canAccessMenu: (menuItem: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Permissions par rôle
const ROLE_PERMISSIONS = {
  admin: [
    'dashboard', 'sales', 'pos', 'purchases', 'stock', 'products', 'units', 
    'customers', 'suppliers', 'settings', 'users', 'reports', 'categories'
  ],
  manager: [
    'dashboard', 'sales', 'pos', 'purchases', 'stock', 'products', 
    'customers', 'suppliers', 'settings', 'reports', 'categories'
  ],
  cashier: [
    'dashboard', 'sales', 'pos'
  ]
};

// Utilisateurs par défaut
const DEFAULT_USERS: User[] = [
  {
    id: 'admin-001',
    username: 'admin',
    password: 'admin',
    role: 'admin',
    fullName: 'Administrateur',
    email: 'admin@madabrewboss.com',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les utilisateurs depuis localStorage ou utiliser les defaults
  const getUsers = (): User[] => {
    const stored = localStorage.getItem('mada_brew_users');
    return stored ? JSON.parse(stored) : DEFAULT_USERS;
  };

  // Sauvegarder les utilisateurs
  const saveUsers = (users: User[]) => {
    localStorage.setItem('mada_brew_users', JSON.stringify(users));
  };

  // Vérifier s'il y a une session active
  useEffect(() => {
    const checkSession = () => {
      const storedUser = localStorage.getItem('mada_brew_current_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const users = getUsers();
      const foundUser = users.find(u => 
        u.username === username && 
        u.password === password && 
        u.isActive
      );

      if (foundUser) {
        // Mettre à jour lastLogin
        const updatedUsers = users.map(u => 
          u.id === foundUser.id 
            ? { ...u, lastLogin: new Date().toISOString() }
            : u
        );
        saveUsers(updatedUsers);

        const loggedUser = { ...foundUser, lastLogin: new Date().toISOString() };
        setUser(loggedUser);
        localStorage.setItem('mada_brew_current_user', JSON.stringify(loggedUser));
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mada_brew_current_user');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role].includes(permission);
  };

  const canAccessMenu = (menuItem: string): boolean => {
    return hasPermission(menuItem);
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    hasPermission,
    canAccessMenu
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook pour la gestion des utilisateurs (admin seulement)
export const useUserManagement = () => {
  const { user, hasPermission } = useAuth();

  const getUsers = (): User[] => {
    if (!hasPermission('users')) return [];
    const stored = localStorage.getItem('mada_brew_users');
    return stored ? JSON.parse(stored) : DEFAULT_USERS;
  };

  const createUser = (userData: Omit<User, 'id' | 'createdAt'>): boolean => {
    if (!hasPermission('users')) return false;
    
    const users = getUsers();
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem('mada_brew_users', JSON.stringify(updatedUsers));
    return true;
  };

  const updateUser = (userId: string, userData: Partial<User>): boolean => {
    if (!hasPermission('users')) return false;
    
    const users = getUsers();
    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, ...userData } : u
    );
    
    localStorage.setItem('mada_brew_users', JSON.stringify(updatedUsers));
    return true;
  };

  const deleteUser = (userId: string): boolean => {
    if (!hasPermission('users') || userId === 'admin-001') return false; // Ne pas supprimer l'admin principal
    
    const users = getUsers();
    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('mada_brew_users', JSON.stringify(updatedUsers));
    return true;
  };

  return {
    getUsers,
    createUser,
    updateUser,
    deleteUser
  };
};
