
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/db";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "cashier";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  switchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to check for browser environment
const isBrowser = typeof window !== 'undefined';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isBrowser) {
          const storedUser = localStorage.getItem("acaizen_user");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error("Failed to restore authentication", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initialize default admin user if no users exist
    const initializeDefaultAdmin = async () => {
      try {
        if (isBrowser) {
          const usersCount = await db.users.count();
          
          if (usersCount === 0) {
            await db.users.add({
              id: "admin-1",
              email: "pdvzen1@gmail.com",
              password: "Zen2024", // In a real app, always hash passwords
              name: "Administrador",
              role: "admin",
              createdAt: new Date().toISOString()
            });
            console.log("Default admin created");
          }
        }
      } catch (error) {
        console.error("Failed to create default admin", error);
      }
    };

    initializeDefaultAdmin();
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      if (!isBrowser) {
        toast({
          title: "Erro de ambiente",
          description: "Funcionalidade disponível apenas no navegador",
          variant: "destructive",
        });
        return false;
      }

      const user = await db.users.where({ email }).first();

      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Usuário não encontrado",
          variant: "destructive",
        });
        return false;
      }

      if (user.password !== password) {
        toast({
          title: "Erro de autenticação",
          description: "Senha incorreta",
          variant: "destructive",
        });
        return false;
      }

      const { password: _, ...userWithoutPassword } = user;
      
      // Ensure the id is not undefined to match the User interface
      const userToSet: User = {
        id: userWithoutPassword.id!,
        email: userWithoutPassword.email,
        name: userWithoutPassword.name,
        role: userWithoutPassword.role,
      };
      
      setUser(userToSet);
      localStorage.setItem("acaizen_user", JSON.stringify(userToSet));
      
      toast({
        title: "Login realizado",
        description: `Bem-vindo, ${user.name}!`,
      });
      
      return true;
    } catch (error) {
      console.error("Login error", error);
      toast({
        title: "Erro de autenticação",
        description: "Ocorreu um erro ao tentar fazer login",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    if (isBrowser) {
      localStorage.removeItem("acaizen_user");
    }
    navigate("/login");
  };

  const switchUser = () => {
    setUser(null);
    if (isBrowser) {
      localStorage.removeItem("acaizen_user");
    }
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
