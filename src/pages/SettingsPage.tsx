
import { useState, useEffect } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { db, StoreConfig } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Printer, Save } from "lucide-react";

const SettingsPage = () => {
  const { toast } = useToast();
  
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    id: 1,
    storeName: "Açaízen SmartHUB",
    address: "Rua Arthur Oscar, 220 - Vila Nova, Mansa - RJ",
    phone: "(24) 9933-9007",
    instagram: "@acaizenn",
    facebook: "@açaizen",
    printerIpAddress: "localhost",
    printerPort: 3333
  });
  
  const [printerTestStatus, setPrinterTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [backupStatus, setBackupStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await db.config.get(1);
        if (config) {
          setStoreConfig(config);
        }
      } catch (error) {
        console.error("Failed to load store configuration", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as configurações da loja",
          variant: "destructive",
        });
      }
    };
    
    loadConfig();
  }, [toast]);
  
  const handleConfigChange = (field: keyof StoreConfig, value: string | number) => {
    setStoreConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const saveConfig = async () => {
    try {
      await db.config.put(storeConfig);
      
      toast({
        title: "Configurações salvas",
        description: "As configurações da loja foram salvas com sucesso",
      });
    } catch (error) {
      console.error("Failed to save store configuration", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações da loja",
        variant: "destructive",
      });
    }
  };
  
  const testPrinter = async () => {
    if (!storeConfig.printerIpAddress) {
      toast({
        title: "Endereço da impressora não definido",
        description: "Por favor, preencha o endereço IP da impressora",
        variant: "destructive",
      });
      return;
    }
    
    setPrinterTestStatus("testing");
    
    try {
      const response = await fetch(`http://${storeConfig.printerIpAddress}:${storeConfig.printerPort || 3333}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receipt: "*** TESTE DE IMPRESSORA ***\n\n" +
                  "Açaízen SmartHUB\n" +
                  "Sistema de PDV\n\n" +
                  "Impressora configurada com sucesso!\n\n" +
                  "Data/Hora: " + new Date().toLocaleString() + "\n\n" +
                  "*** FIM DO TESTE ***\n\n\n\n"
        }),
      });
      
      if (response.ok) {
        setPrinterTestStatus("success");
        toast({
          title: "Teste bem-sucedido",
          description: "A impressora está configurada corretamente",
        });
      } else {
        setPrinterTestStatus("error");
        toast({
          title: "Falha no teste",
          description: "Não foi possível conectar com a impressora",
          variant: "destructive",
        });
      }
    } catch (error) {
      setPrinterTestStatus("error");
      console.error("Printer test error", error);
      toast({
        title: "Falha no teste",
        description: "Não foi possível conectar com a impressora. Verifique o middleware de impressão.",
        variant: "destructive",
      });
    }
  };
  
  const generateBackup = async () => {
    setBackupStatus("processing");
    
    try {
      // Export all data from all tables
      const exportData = {
        users: await db.users.toArray(),
        products: await db.products.toArray(),
        categories: await db.categories.toArray(),
        addons: await db.addons.toArray(),
        sales: await db.sales.toArray(),
        config: await db.config.toArray()
      };
      
      // Convert to JSON
      const jsonData = JSON.stringify(exportData, null, 2);
      
      // Create download link
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `acaizen_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setBackupStatus("success");
      toast({
        title: "Backup gerado",
        description: "O backup foi gerado com sucesso",
      });
    } catch (error) {
      setBackupStatus("error");
      console.error("Failed to generate backup", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o backup",
        variant: "destructive",
      });
    }
  };
  
  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        
        if (!data.users || !data.products || !data.categories) {
          toast({
            title: "Arquivo inválido",
            description: "O arquivo não contém dados válidos de backup",
            variant: "destructive",
          });
          return;
        }
        
        // Confirm before overwriting data
        if (!window.confirm("Importar este backup irá substituir todos os dados atuais. Deseja continuar?")) {
          return;
        }
        
        // Clear existing data
        await db.users.clear();
        await db.products.clear();
        await db.categories.clear();
        await db.addons.clear();
        await db.sales.clear();
        await db.config.clear();
        
        // Import data
        if (data.users) await db.users.bulkAdd(data.users);
        if (data.products) await db.products.bulkAdd(data.products);
        if (data.categories) await db.categories.bulkAdd(data.categories);
        if (data.addons) await db.addons.bulkAdd(data.addons);
        if (data.sales) await db.sales.bulkAdd(data.sales);
        if (data.config) await db.config.bulkAdd(data.config);
        
        // Reload store config
        const newConfig = await db.config.get(1);
        if (newConfig) {
          setStoreConfig(newConfig);
        }
        
        toast({
          title: "Backup restaurado",
          description: "Os dados foram restaurados com sucesso",
        });
        
        // Reload page to reflect changes
        window.location.reload();
      } catch (error) {
        console.error("Failed to import backup", error);
        toast({
          title: "Erro",
          description: "Não foi possível importar o backup",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
    
    // Clear input value so the same file can be imported again
    e.target.value = "";
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
        
        <Tabs defaultValue="store">
          <TabsList>
            <TabsTrigger value="store">Dados da Loja</TabsTrigger>
            <TabsTrigger value="printer">Impressora</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
          </TabsList>
          
          {/* Store Info Tab */}
          <TabsContent value="store">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Loja</CardTitle>
                <CardDescription>
                  Configurações gerais da loja
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="storeName">Nome da Loja</Label>
                  <Input
                    id="storeName"
                    value={storeConfig.storeName}
                    onChange={(e) => handleConfigChange("storeName", e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={storeConfig.address}
                    onChange={(e) => handleConfigChange("address", e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={storeConfig.phone}
                    onChange={(e) => handleConfigChange("phone", e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={storeConfig.instagram}
                      onChange={(e) => handleConfigChange("instagram", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={storeConfig.facebook}
                      onChange={(e) => handleConfigChange("facebook", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button onClick={saveConfig}>
                  <Save className="h-4 w-4 mr-2" /> Salvar
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Printer Tab */}
          <TabsContent value="printer">
            <Card>
              <CardHeader>
                <CardTitle>Configuração de Impressora</CardTitle>
                <CardDescription>
                  Configurações para impressão de cupons
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="printerIpAddress">Endereço IP do Middleware de Impressão</Label>
                  <Input
                    id="printerIpAddress"
                    value={storeConfig.printerIpAddress || ""}
                    onChange={(e) => handleConfigChange("printerIpAddress", e.target.value)}
                    placeholder="localhost"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Endereço onde o middleware de impressão está rodando (padrão: localhost)
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="printerPort">Porta</Label>
                  <Input
                    id="printerPort"
                    type="number"
                    value={storeConfig.printerPort || 3333}
                    onChange={(e) => handleConfigChange("printerPort", parseInt(e.target.value))}
                    placeholder="3333"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Porta onde o middleware de impressão está rodando (padrão: 3333)
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                  <h3 className="font-medium mb-2">Informações sobre impressão</h3>
                  <p className="text-sm text-gray-600">
                    Este sistema utiliza um middleware de impressão ESC/POS que deve estar rodando
                    em <code>http://localhost:3333/print</code> para imprimir cupons reais.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Impressoras configuradas:
                  </p>
                  <ul className="text-sm text-gray-600 list-disc list-inside mt-1">
                    <li>Epson TM-T20: Cupom do cliente</li>
                    <li>POS-80: Comanda de produção</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={testPrinter}
                  disabled={printerTestStatus === "testing"}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {printerTestStatus === "testing" ? "Testando..." : "Testar Impressora"}
                </Button>
                <Button onClick={saveConfig}>
                  <Save className="h-4 w-4 mr-2" /> Salvar
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Backup Tab */}
          <TabsContent value="backup">
            <Card>
              <CardHeader>
                <CardTitle>Backup e Restauração</CardTitle>
                <CardDescription>
                  Gerenciamento de backups do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium mb-2">Backup</h3>
                  <p className="text-sm text-gray-600">
                    Crie um backup completo do sistema, incluindo todos os produtos, categorias, vendas e configurações.
                    O backup é salvo como um arquivo JSON que pode ser restaurado posteriormente.
                  </p>
                  <div className="mt-4">
                    <Button 
                      onClick={generateBackup} 
                      disabled={backupStatus === "processing"}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {backupStatus === "processing" ? "Gerando..." : "Gerar Backup"}
                    </Button>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium mb-2">Restauração</h3>
                  <p className="text-sm text-gray-600">
                    Restaure um backup previamente salvo. Atenção: todos os dados atuais serão substituídos pelos dados do backup!
                  </p>
                  <div className="mt-4">
                    <input
                      type="file"
                      id="importBackup"
                      className="hidden"
                      accept=".json"
                      onChange={importBackup}
                    />
                    <label htmlFor="importBackup">
                      <Button variant="outline" className="cursor-pointer w-full">
                        Importar Backup
                      </Button>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
