
import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Logo from "@/components/Logo";
import { LogOut, ShoppingCart, Package, BarChart2, User, Settings } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, logout, switchUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) {
    navigate("/login");
    return null;
  }

  const menuItems = [
    {
      title: "PDV",
      url: "/pos",
      icon: ShoppingCart,
      roles: ["admin", "cashier"],
    },
    {
      title: "Produtos",
      url: "/products",
      icon: Package,
      roles: ["admin"],
    },
    {
      title: "Relatórios",
      url: "/reports",
      icon: BarChart2,
      roles: ["admin"],
    },
    {
      title: "Usuários",
      url: "/users",
      icon: User,
      roles: ["admin"],
    },
    {
      title: "Configurações",
      url: "/settings",
      icon: Settings,
      roles: ["admin"],
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar className="bg-white border-r border-gray-200">
          <SidebarHeader className="p-4">
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild
                        active={location.pathname === item.url}
                      >
                        <Button
                          variant="ghost"
                          className={`w-full justify-start ${location.pathname === item.url ? 'bg-accent text-primary-dark' : ''}`}
                          onClick={() => navigate(item.url)}
                        >
                          <item.icon className="mr-2 h-5 w-5" />
                          <span>{item.title}</span>
                        </Button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs bg-primary-light text-primary-dark px-2 py-1 rounded-full">
                  {user.role === "admin" ? "Administrador" : "Vendedor"}
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={switchUser}
                >
                  Trocar
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="flex-1"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4 mr-1" /> Sair
                </Button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
