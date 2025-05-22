import { useState, useEffect } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { db, UserData } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash, UserIcon, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const UsersPage = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<Partial<UserData>>({
    name: "",
    email: "",
    password: "",
    role: "cashier"
  });
  
  useEffect(() => {
    loadUsers();
  }, []);
  
  const loadUsers = async () => {
    try {
      const allUsers = await db.users.toArray();
      setUsers(allUsers);
    } catch (error) {
      console.error("Failed to load users", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários",
        variant: "destructive",
      });
    }
  };
  
  const openAddUserDialog = () => {
    setEditUserId(null);
    setUserForm({
      name: "",
      email: "",
      password: "",
      role: "cashier"
    });
    setIsUserDialogOpen(true);
  };
  
  const openEditUserDialog = (user: UserData) => {
    setEditUserId(user.id!);
    setUserForm({
      name: user.name,
      email: user.email,
      password: "", // Don't show the current password
      role: user.role
    });
    setIsUserDialogOpen(true);
  };
  
  const handleUserFormChange = (field: string, value: any) => {
    setUserForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const validateForm = () => {
    if (!userForm.name?.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome é obrigatório",
        variant: "destructive",
      });
      return false;
    }
    
    if (!userForm.email?.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O email é obrigatório",
        variant: "destructive",
      });
      return false;
    }
    
    if (!editUserId && !userForm.password?.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "A senha é obrigatória para novos usuários",
        variant: "destructive",
      });
      return false;
    }
    
    if (!userForm.role) {
      toast({
        title: "Campo obrigatório",
        description: "A função é obrigatória",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const saveUser = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      const now = new Date().toISOString();
      
      if (editUserId) {
        // Update existing user
        const currentUserData = await db.users.get(editUserId);
        
        if (!currentUserData) {
          toast({
            title: "Erro",
            description: "Usuário não encontrado",
            variant: "destructive",
          });
          return;
        }
        
        // Keep the old password if a new one was not provided
        const password = userForm.password?.trim() ? userForm.password : currentUserData.password;
        
        await db.users.update(editUserId, {
          ...currentUserData,
          name: userForm.name!,
          email: userForm.email!,
          password,
          role: userForm.role!
        });
        
        toast({
          title: "Usuário atualizado",
          description: `${userForm.name} foi atualizado com sucesso`,
        });
      } else {
        // Check if email already exists
        const existingUser = await db.users.where({ email: userForm.email }).first();
        
        if (existingUser) {
          toast({
            title: "Email já cadastrado",
            description: "Este email já está sendo utilizado por outro usuário",
            variant: "destructive",
          });
          return;
        }
        
        // Add new user
        const userId = `user-${Date.now()}`;
        await db.users.add({
          id: userId,
          name: userForm.name!,
          email: userForm.email!,
          password: userForm.password!,
          role: userForm.role!,
          createdAt: now
        });
        
        toast({
          title: "Usuário adicionado",
          description: `${userForm.name} foi adicionado com sucesso`,
        });
      }
      
      loadUsers();
      setIsUserDialogOpen(false);
    } catch (error) {
      console.error("Failed to save user", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o usuário",
        variant: "destructive",
      });
    }
  };
  
  const deleteUser = async (id: string) => {
    // Prevent deleting the currently logged in user
    if (id === currentUser?.id) {
      toast({
        title: "Operação não permitida",
        description: "Você não pode excluir o usuário que está logado",
        variant: "destructive",
      });
      return;
    }
    
    // Check if this is the only admin
    if (users.find(u => u.id === id)?.role === "admin") {
      const adminCount = users.filter(u => u.role === "admin").length;
      
      if (adminCount <= 1) {
        toast({
          title: "Operação não permitida",
          description: "Você não pode excluir o único usuário administrador",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (window.confirm("Tem certeza que deseja excluir este usuário?")) {
      try {
        await db.users.delete(id);
        
        toast({
          title: "Usuário excluído",
          description: "O usuário foi excluído com sucesso",
        });
        
        loadUsers();
      } catch (error) {
        console.error("Failed to delete user", error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o usuário",
          variant: "destructive",
        });
      }
    }
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Gerenciamento de Usuários</h1>
          <Button onClick={openAddUserDialog}>
            <Plus className="h-4 w-4 mr-2" /> Novo Usuário
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className={user.id === currentUser?.id ? "bg-accent/30" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-gray-500" />
                          <span>{user.name}</span>
                          {user.id === currentUser?.id && (
                            <span className="text-xs text-gray-500">(Você)</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.role === "admin" ? "bg-primary-light text-primary-dark" : "bg-gray-100 text-gray-700"
                        }`}>
                          {user.role === "admin" ? "Administrador" : "Vendedor"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditUserDialog(user)}>
                            Editar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => deleteUser(user.id!)}
                            disabled={user.id === currentUser?.id}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editUserId ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
            <DialogDescription>
              Preencha os campos para {editUserId ? "editar o" : "adicionar um novo"} usuário
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={userForm.name || ""}
                onChange={(e) => handleUserFormChange("name", e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={userForm.email || ""}
                onChange={(e) => handleUserFormChange("email", e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="password">
                {editUserId ? "Nova Senha (deixe em branco para manter)" : "Senha *"}
              </Label>
              <Input
                id="password"
                type="password"
                value={userForm.password || ""}
                onChange={(e) => handleUserFormChange("password", e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="role">Função *</Label>
              <RadioGroup
                value={userForm.role || "cashier"}
                onValueChange={(value) => handleUserFormChange("role", value)}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admin" id="admin" />
                  <Label htmlFor="admin">Administrador</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cashier" id="cashier" />
                  <Label htmlFor="cashier">Vendedor</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveUser}>
              <Save className="h-4 w-4 mr-2" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default UsersPage;
