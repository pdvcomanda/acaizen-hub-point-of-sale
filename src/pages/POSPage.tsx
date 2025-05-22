import { useState, useEffect } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { db, Product, Category, Addon } from "@/lib/db";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Printer, PrinterText } from "lucide-react";
import { printReceiptFromBrowser } from "@/utils/printUtils";

const POSPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { items, addToCart, removeItem, clearCart, totalAmount } = useCart();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddonsOpen, setIsAddonsOpen] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [availableAddons, setAvailableAddons] = useState<Addon[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit" | "debit" | "pix">("cash");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  
  // Load categories and products
  useEffect(() => {
    const loadData = async () => {
      try {
        const allCategories = await db.categories.toArray();
        const allProducts = await db.products.toArray();
        
        setCategories(allCategories);
        setProducts(allProducts);
      } catch (error) {
        console.error("Failed to load POS data", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados",
          variant: "destructive",
        });
      }
    };
    
    loadData();
  }, [toast]);
  
  // Filter products based on category and search term
  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeCategory === 'all' || product.categoryId === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  // Handle product selection
  const handleProductClick = async (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    
    if (product.hasAddons) {
      try {
        const productAddons = await db.addons.where({ productId: product.id }).toArray();
        setAvailableAddons(productAddons);
        setSelectedAddons([]);
        setIsAddonsOpen(true);
      } catch (error) {
        console.error("Failed to load product addons", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os adicionais do produto",
          variant: "destructive",
        });
      }
    } else {
      addToCart(product, 1, []);
    }
  };
  
  // Handle addon selection
  const handleAddonToggle = (addon: Addon) => {
    setSelectedAddons((prevAddons) => {
      const isSelected = prevAddons.some(a => a.id === addon.id);
      return isSelected 
        ? prevAddons.filter(a => a.id !== addon.id)
        : [...prevAddons, addon];
    });
  };
  
  // Add product with addons to cart
  const handleAddWithAddons = () => {
    if (selectedProduct) {
      addToCart(selectedProduct, quantity, selectedAddons);
      setIsAddonsOpen(false);
    }
  };
  
  // Handle checkout
  const handleCheckout = () => {
    if (items.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao carrinho para finalizar a venda",
        variant: "destructive",
      });
      return;
    }
    
    setCustomerName("");
    setPaymentMethod("cash");
    setCashReceived("");
    setIsCheckoutOpen(true);
  };
  
  // Calculate change
  const calculateChange = () => {
    if (paymentMethod === "cash" && cashReceived) {
      const received = parseFloat(cashReceived);
      if (received >= totalAmount) {
        return received - totalAmount;
      }
      return 0;
    }
    return 0;
  };
  
  // Generate receipt text
  const generateReceiptText = (saleId: number) => {
    const storeInfo = "Açaízen SmartHUB\n" +
                      "Rua Arthur Oscar, 220 - Vila Nova\n" +
                      "Mansa - RJ\n" +
                      "Tel: (24) 9933-9007\n" +
                      "---------------------------------------\n";
    
    const headerInfo = `CUPOM NÃO FISCAL\n` +
                       `Data: ${new Date().toLocaleDateString()}\n` +
                       `Hora: ${new Date().toLocaleTimeString()}\n` +
                       `Cliente: ${customerName || "Não informado"}\n` +
                       `Atendente: ${user?.name || "Não informado"}\n` +
                       `---------------------------------------\n\n`;
    
    let itemsText = "ITENS\n";
    itemsText += "---------------------------------------\n";
    
    items.forEach((item, index) => {
      itemsText += `${item.quantity}x ${item.product.name}\n`;
      itemsText += `  R$ ${item.product.price.toFixed(2)} un    R$ ${(item.product.price * item.quantity).toFixed(2)}\n`;
      
      if (item.selectedAddons.length > 0) {
        itemsText += "  Adicionais:\n";
        item.selectedAddons.forEach(addon => {
          itemsText += `    + ${addon.name} - R$ ${addon.price.toFixed(2)}\n`;
        });
      }
      itemsText += "\n";
    });
    
    const paymentInfo = "---------------------------------------\n" +
                        `TOTAL: R$ ${totalAmount.toFixed(2)}\n\n` +
                        `Forma de pagamento: ${
                          paymentMethod === "cash" ? "Dinheiro" :
                          paymentMethod === "credit" ? "Cartão de Crédito" :
                          paymentMethod === "debit" ? "Cartão de Débito" : "PIX"
                        }\n\n`;
    
    let changeInfo = "";
    if (paymentMethod === "cash") {
      changeInfo = `Valor recebido: R$ ${parseFloat(cashReceived).toFixed(2)}\n` +
                   `Troco: R$ ${calculateChange().toFixed(2)}\n\n`;
    }
    
    const footer = "---------------------------------------\n" +
                   "Obrigado pela preferência!\n" +
                   "@acaizenn | @açaizen\n" +
                   `Pedido #${saleId}\n`;
    
    return storeInfo + headerInfo + itemsText + paymentInfo + changeInfo + footer;
  };
  
  // Generate receipt HTML for PDF
  const generateReceiptHTML = (saleId: number) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Cupom Açaízen #${saleId}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin: 0;
            padding: 20px;
            width: 300px;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
          }
          .store-name {
            font-size: 16px;
            font-weight: bold;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 10px 0;
          }
          .item {
            margin-bottom: 10px;
          }
          .addon {
            padding-left: 15px;
          }
          .total {
            font-weight: bold;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="store-name">Açaízen SmartHUB</div>
          <div>Rua Arthur Oscar, 220 - Vila Nova</div>
          <div>Mansa - RJ</div>
          <div>Tel: (24) 9933-9007</div>
        </div>
        <div class="divider"></div>
        <div>
          <div><strong>CUPOM NÃO FISCAL</strong></div>
          <div>Data: ${new Date().toLocaleDateString()}</div>
          <div>Hora: ${new Date().toLocaleTimeString()}</div>
          <div>Cliente: ${customerName || "Não informado"}</div>
          <div>Atendente: ${user?.name || "Não informado"}</div>
        </div>
        <div class="divider"></div>
        <div><strong>ITENS</strong></div>
        <div class="divider"></div>
        ${items.map(item => `
          <div class="item">
            <div>${item.quantity}x ${item.product.name}</div>
            <div>R$ ${item.product.price.toFixed(2)} un    R$ ${(item.product.price * item.quantity).toFixed(2)}</div>
            ${item.selectedAddons.length > 0 ? `
              <div>Adicionais:</div>
              ${item.selectedAddons.map(addon => `
                <div class="addon">+ ${addon.name} - R$ ${addon.price.toFixed(2)}</div>
              `).join('')}
            ` : ''}
          </div>
        `).join('')}
        <div class="divider"></div>
        <div class="total">TOTAL: R$ ${totalAmount.toFixed(2)}</div>
        <div>
          <div>Forma de pagamento: ${
            paymentMethod === "cash" ? "Dinheiro" :
            paymentMethod === "credit" ? "Cartão de Crédito" :
            paymentMethod === "debit" ? "Cartão de Débito" : "PIX"
          }</div>
          ${paymentMethod === "cash" ? `
            <div>Valor recebido: R$ ${parseFloat(cashReceived).toFixed(2)}</div>
            <div>Troco: R$ ${calculateChange().toFixed(2)}</div>
          ` : ''}
        </div>
        <div class="divider"></div>
        <div class="footer">
          <div>Obrigado pela preferência!</div>
          <div>@acaizenn | @açaizen</div>
          <div>Pedido #${saleId}</div>
        </div>
      </body>
      </html>
    `;
  };
  
  // Process sale
  const processSale = async () => {
    if (items.length === 0) {
      return;
    }
    
    if (paymentMethod === "cash" && (!cashReceived || parseFloat(cashReceived) < totalAmount)) {
      toast({
        title: "Valor insuficiente",
        description: "O valor recebido deve ser igual ou maior que o total",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create sale object
      const sale = {
        customerName: customerName || "Cliente",
        total: totalAmount,
        paymentMethod,
        cashReceived: paymentMethod === "cash" ? parseFloat(cashReceived) : undefined,
        change: paymentMethod === "cash" ? calculateChange() : undefined,
        items: [], // We'll populate this after getting the saleId
        createdAt: new Date().toISOString(),
        operatorId: user!.id,
        operatorName: user!.name
      };
      
      // Save sale to database to get the ID
      const saleId = await db.sales.add(sale);
      
      // Now create and save the sale items with the generated saleId
      const saleItems = items.map(item => ({
        saleId: saleId as number,
        productId: item.product.id!,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        addons: item.selectedAddons.map(addon => ({
          id: addon.id!,
          name: addon.name,
          price: addon.price
        })),
        totalPrice: item.totalPrice
      }));
      
      // Update the sale with items
      await db.sales.update(saleId, { items: saleItems });
      
      // Generate receipt
      const receiptText = generateReceiptText(saleId as number);
      const receiptHTML = generateReceiptHTML(saleId as number);
      
      // Try to print receipt
      try {
        const config = await db.config.get(1);
        
        if (config?.printerIpAddress) {
          // Print customer receipt
          fetch(`http://${config.printerIpAddress}:${config.printerPort || 3333}/print`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              receipt: receiptText
            }),
          }).catch(err => {
            console.error('Printer error:', err);
          });
          
          // Print kitchen order if there are any products that need to be prepared
          const kitchenItems = items.filter(item => item.product.categoryId === 1); // Assuming categoryId 1 is for food items
          
          if (kitchenItems.length > 0) {
            const kitchenText = "COMANDA DE PRODUÇÃO\n" +
                               `Pedido #${saleId}\n` +
                               `Data: ${new Date().toLocaleDateString()}\n` +
                               `Hora: ${new Date().toLocaleTimeString()}\n` +
                               `Cliente: ${customerName || "Não informado"}\n` +
                               "---------------------------------------\n\n";
                               
            let itemsText = "";
            kitchenItems.forEach((item) => {
              itemsText += `${item.quantity}x ${item.product.name}\n`;
              
              if (item.selectedAddons.length > 0) {
                itemsText += "  Adicionais:\n";
                item.selectedAddons.forEach(addon => {
                  itemsText += `    + ${addon.name}\n`;
                });
              }
              itemsText += "\n";
            });
            
            const fullKitchenText = kitchenText + itemsText;
            
            fetch(`http://${config.printerIpAddress}:${config.printerPort || 3333}/print-kitchen`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                receipt: fullKitchenText
              }),
            }).catch(err => {
              console.error('Kitchen printer error:', err);
            });
          }
        }
      } catch (printError) {
        console.error('Failed to print receipt:', printError);
      }
      
      // Generate PDF
      const blob = new Blob([receiptHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setReceiptUrl(url);
      
      toast({
        title: "Venda finalizada",
        description: `Pedido #${saleId} registrado com sucesso`,
      });
      
      // Clear cart
      clearCart();
      setIsCheckoutOpen(false);
      
      // Update product stock
      items.forEach(async (item) => {
        const product = await db.products.get(item.product.id!);
        if (product) {
          await db.products.update(product.id!, {
            stock: product.stock - item.quantity
          });
        }
      });
      
    } catch (error) {
      console.error("Failed to process sale", error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a venda",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle download PDF
  const handleDownloadPdf = () => {
    if (receiptUrl) {
      const link = document.createElement('a');
      link.href = receiptUrl;
      link.setAttribute('download', `cupom-acaizen-${Date.now()}.html`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  // Handle direct printing via middleware
  const handlePrintDirectly = async () => {
    try {
      const config = await db.config.get(1);
      
      if (!config?.printerIpAddress) {
        toast({
          title: "Erro de configuração",
          description: "Endereço IP da impressora não configurado",
          variant: "destructive",
        });
        return;
      }
      
      if (receiptUrl) {
        // Convert HTML receipt to plain text for the thermal printer
        const lastSales = await db.sales.orderBy("id").reverse().limit(1).toArray();
        if (lastSales && lastSales.length > 0) {
          const lastSaleId = lastSales[0].id;
          const receiptText = generateReceiptText(lastSaleId as number);
          
          // Send to printer via middleware
          fetch(`http://${config.printerIpAddress}:${config.printerPort || 3333}/print`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              receipt: receiptText
            }),
          })
          .then(() => {
            toast({
              title: "Cupom enviado",
              description: "O cupom foi enviado para impressão",
            });
          })
          .catch(err => {
            console.error('Printer error:', err);
            toast({
              title: "Erro de impressão",
              description: "Não foi possível enviar para a impressora",
              variant: "destructive",
            });
          });
        }
      }
    } catch (error) {
      console.error("Error printing receipt:", error);
      toast({
        title: "Erro",
        description: "Não foi possível imprimir o cupom",
        variant: "destructive",
      });
    }
  };
  
  // Handle browser-based direct printing
  const handlePrintInBrowser = async () => {
    try {
      const lastSales = await db.sales.orderBy("id").reverse().limit(1).toArray();
      if (lastSales && lastSales.length > 0) {
        const lastSaleId = lastSales[0].id as number;
        
        // Use the utility function to print receipt
        printReceiptFromBrowser(
          items,
          totalAmount,
          {
            method: paymentMethod,
            cashReceived: paymentMethod === "cash" ? parseFloat(cashReceived) : undefined,
            change: paymentMethod === "cash" ? calculateChange() : undefined,
          },
          {
            name: "AÇAÍ ZEN",
            customerName: customerName || undefined,
            orderNumber: lastSaleId,
          }
        );
        
        toast({
          title: "Imprimindo cupom",
          description: "Uma nova janela foi aberta para impressão",
        });
      }
    } catch (error) {
      console.error("Error printing receipt:", error);
      toast({
        title: "Erro",
        description: "Não foi possível imprimir o cupom",
        variant: "destructive",
      });
    }
  };
  
  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Frente de Caixa</h1>
            <div className="w-full md:w-auto">
              <Input
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          
          <Tabs defaultValue="all" onValueChange={(value) => setActiveCategory(value === 'all' ? 'all' : parseInt(value))}>
            <TabsList className="mb-4 flex flex-wrap">
              <TabsTrigger value="all">Todos</TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={`${category.id}`}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleProductClick(product)}
                  >
                    <CardContent className="p-0">
                      <div className="bg-gray-100 aspect-square flex items-center justify-center">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-4xl text-gray-400">
                            {product.name.substring(0, 1)}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-800">{product.name}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-primary font-semibold">
                            R$ {product.price.toFixed(2)}
                          </span>
                          {product.hasAddons && (
                            <span className="text-xs px-2 py-1 bg-accent text-primary-dark rounded-full">
                              + Adicionais
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            {categories.map((category) => (
              <TabsContent key={category.id} value={`${category.id}`} className="mt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts
                    .filter((product) => product.categoryId === category.id)
                    .map((product) => (
                      <Card 
                        key={product.id} 
                        className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleProductClick(product)}
                      >
                        <CardContent className="p-0">
                          <div className="bg-gray-100 aspect-square flex items-center justify-center">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-4xl text-gray-400">
                                {product.name.substring(0, 1)}
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-medium text-gray-800">{product.name}</h3>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-primary font-semibold">
                                R$ {product.price.toFixed(2)}
                              </span>
                              {product.hasAddons && (
                                <span className="text-xs px-2 py-1 bg-accent text-primary-dark rounded-full">
                                  + Adicionais
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
        
        {/* Cart Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">Carrinho de Compras</h2>
          </div>
          
          <ScrollArea className="h-[calc(100vh-320px)] p-4">
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Carrinho vazio
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="border-b pb-4">
                    <div className="flex justify-between">
                      <div>
                        <span className="font-medium">{item.quantity}x </span>
                        <span>{item.product.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">
                          R$ {item.totalPrice.toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          &times;
                        </Button>
                      </div>
                    </div>
                    
                    {item.selectedAddons.length > 0 && (
                      <div className="mt-1 text-sm text-gray-600 pl-4">
                        {item.selectedAddons.map((addon) => (
                          <div key={addon.id} className="flex justify-between">
                            <span>+ {addon.name}</span>
                            <span>R$ {addon.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <div className="border-t p-4">
            <div className="flex justify-between text-lg font-semibold mb-4">
              <span>Total:</span>
              <span>R$ {totalAmount.toFixed(2)}</span>
            </div>
            
            <Button 
              className="w-full bg-primary hover:bg-primary-dark"
              disabled={items.length === 0}
              onClick={handleCheckout}
            >
              Finalizar Venda
            </Button>
          </div>
        </div>
      </div>
      
      {/* Addons Dialog */}
      <Dialog open={isAddonsOpen} onOpenChange={setIsAddonsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              Selecione os adicionais para este produto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="quantity">Quantidade</Label>
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <span className="w-10 text-center">{quantity}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>
            
            <div>
              <Label>Adicionais</Label>
              <div className="mt-2 space-y-2">
                {availableAddons.map((addon) => (
                  <div key={addon.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`addon-${addon.id}`}
                        checked={selectedAddons.some(a => a.id === addon.id)}
                        onCheckedChange={() => handleAddonToggle(addon)}
                      />
                      <Label htmlFor={`addon-${addon.id}`}>{addon.name}</Label>
                    </div>
                    <span>+ R$ {addon.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddonsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddWithAddons}>
              Adicionar ao Carrinho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={(open) => {
        if (!isProcessing) setIsCheckoutOpen(open);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
            <DialogDescription>
              Complete as informações para finalizar a venda
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div>
              <Label htmlFor="customerName">Nome do Cliente (opcional)</Label>
              <Input
                id="customerName"
                placeholder="Nome do cliente"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as "cash" | "credit" | "debit" | "pix")}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash">Dinheiro</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="credit" id="credit" />
                  <Label htmlFor="credit">Cartão de Crédito</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="debit" id="debit" />
                  <Label htmlFor="debit">Cartão de Débito</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pix" id="pix" />
                  <Label htmlFor="pix">PIX</Label>
                </div>
              </RadioGroup>
            </div>
            
            {paymentMethod === "cash" && (
              <div className="space-y-2">
                <Label htmlFor="cashReceived">Valor Recebido</Label>
                <Input
                  id="cashReceived"
                  placeholder="0.00"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                />
                <div className="flex justify-between pt-2">
                  <span>Troco:</span>
                  <span className="font-medium">
                    R$ {calculateChange().toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>R$ {totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button onClick={processSale} disabled={isProcessing}>
              {isProcessing ? "Processando..." : "Finalizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Receipt Dialog */}
      <Dialog open={!!receiptUrl} onOpenChange={() => setReceiptUrl(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cupom Gerado</DialogTitle>
            <DialogDescription>
              O cupom foi gerado com sucesso!
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center py-4">
            <p>Seu cupom não fiscal está pronto.</p>
            <p className="text-sm text-gray-500 mt-1">
              Você pode baixar uma cópia ou imprimir agora.
            </p>
            <p className="text-xs text-amber-600 mt-3 p-2 bg-amber-50 rounded-md">
              Para impressão automática, configure sua impressora POS-80 como <strong>Genérica / Somente Texto</strong> e defina como <strong>impressora padrão</strong> no Windows.
            </p>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handlePrintDirectly} 
              className="w-full sm:w-auto flex items-center justify-center gap-2"
              variant="outline"
            >
              <Printer className="h-4 w-4" />
              Imprimir via Middleware
            </Button>
            <Button 
              onClick={handlePrintInBrowser}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
              variant="secondary"
            >
              <PrinterText className="h-4 w-4" />
              Impressão Direta
            </Button>
            <Button onClick={handleDownloadPdf} className="w-full sm:w-auto">
              Baixar Cupom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default POSPage;
