
import { useState, useEffect } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { db, Sale } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const ReportsPage = () => {
  const { toast } = useToast();
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [dateRange, setDateRange] = useState<"today" | "yesterday" | "week" | "month">("today");
  const [paymentMethod, setPaymentMethod] = useState<"all" | "cash" | "credit" | "debit" | "pix">("all");
  
  const [salesData, setSalesData] = useState<{
    totalSales: number;
    totalAmount: number;
    averageTicket: number;
    paymentBreakdown: { method: string, count: number, amount: number }[];
  }>({
    totalSales: 0,
    totalAmount: 0,
    averageTicket: 0,
    paymentBreakdown: [],
  });
  
  const [topProducts, setTopProducts] = useState<{ name: string, quantity: number, revenue: number }[]>([]);
  
  // Load sales data
  useEffect(() => {
    const loadSales = async () => {
      try {
        const allSales = await db.sales.toArray();
        setSales(allSales);
      } catch (error) {
        console.error("Failed to load sales", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados de vendas",
          variant: "destructive",
        });
      }
    };
    
    loadSales();
  }, [toast]);
  
  // Filter and analyze sales data
  useEffect(() => {
    if (!sales.length) return;
    
    // Create date range
    const now = new Date();
    let startDate: Date, endDate: Date;
    
    switch (dateRange) {
      case "today":
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case "yesterday":
        startDate = startOfDay(subDays(now, 1));
        endDate = endOfDay(subDays(now, 1));
        break;
      case "week":
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Week starts on Monday
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case "month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      default:
        startDate = startOfDay(now);
        endDate = endOfDay(now);
    }
    
    // Filter sales by date and payment method
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      const withinDateRange = isWithinInterval(saleDate, { start: startDate, end: endDate });
      const matchesPayment = paymentMethod === "all" || sale.paymentMethod === paymentMethod;
      return withinDateRange && matchesPayment;
    });
    
    // Calculate total sales, amount, and average ticket
    const totalAmount = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalSales = filteredSales.length;
    const averageTicket = totalSales ? totalAmount / totalSales : 0;
    
    // Calculate payment method breakdown
    const paymentCounts: Record<string, { count: number, amount: number }> = {
      cash: { count: 0, amount: 0 },
      credit: { count: 0, amount: 0 },
      debit: { count: 0, amount: 0 },
      pix: { count: 0, amount: 0 },
    };
    
    filteredSales.forEach(sale => {
      paymentCounts[sale.paymentMethod].count += 1;
      paymentCounts[sale.paymentMethod].amount += sale.total;
    });
    
    const paymentBreakdown = Object.entries(paymentCounts).map(([method, data]) => ({
      method: method === "cash" ? "Dinheiro" :
             method === "credit" ? "Crédito" :
             method === "debit" ? "Débito" : "PIX",
      count: data.count,
      amount: data.amount
    }));
    
    setSalesData({
      totalSales,
      totalAmount,
      averageTicket,
      paymentBreakdown,
    });
    
    // Calculate top products
    const productSales: Record<string, { quantity: number, revenue: number }> = {};
    
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.productName]) {
          productSales[item.productName] = { quantity: 0, revenue: 0 };
        }
        productSales[item.productName].quantity += item.quantity;
        productSales[item.productName].revenue += item.totalPrice;
      });
    });
    
    const topProductsArray = Object.entries(productSales)
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    setTopProducts(topProductsArray);
    
  }, [sales, dateRange, paymentMethod]);
  
  // Export functions
  const exportToPDF = () => {
    // In a real implementation, this would generate a PDF
    // For now, we'll just alert
    alert("Exportação para PDF não implementada nesta versão do sistema");
  };
  
  const exportToExcel = () => {
    // Create a simple CSV file
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add title
    const title = `Relatório de Vendas - ${
      dateRange === "today" ? "Hoje" :
      dateRange === "yesterday" ? "Ontem" :
      dateRange === "week" ? "Última Semana" : "Último Mês"
    }`;
    csvContent += `${title}\n\n`;
    
    // Add summary
    csvContent += "Resumo\n";
    csvContent += `Total de Vendas,${salesData.totalSales}\n`;
    csvContent += `Valor Total,R$ ${salesData.totalAmount.toFixed(2)}\n`;
    csvContent += `Ticket Médio,R$ ${salesData.averageTicket.toFixed(2)}\n\n`;
    
    // Add payment methods
    csvContent += "Formas de Pagamento\n";
    csvContent += "Método,Quantidade,Valor\n";
    salesData.paymentBreakdown.forEach(payment => {
      csvContent += `${payment.method},${payment.count},R$ ${payment.amount.toFixed(2)}\n`;
    });
    csvContent += "\n";
    
    // Add top products
    csvContent += "Produtos Mais Vendidos\n";
    csvContent += "Produto,Quantidade,Faturamento\n";
    topProducts.forEach(product => {
      csvContent += `${product.name},${product.quantity},R$ ${product.revenue.toFixed(2)}\n`;
    });
    
    // Download file
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_vendas_acaizen_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Format functions for charts
  const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
          
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={(value) => setDateRange(value as any)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="yesterday">Ontem</SelectItem>
                <SelectItem value="week">Última Semana</SelectItem>
                <SelectItem value="month">Último Mês</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="credit">Crédito</SelectItem>
                <SelectItem value="debit">Débito</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={exportToExcel}>
              <Download className="h-4 w-4 mr-2" /> Excel
            </Button>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Vendas</CardTitle>
              <CardDescription>Total de pedidos no período</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{salesData.totalSales}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Faturamento</CardTitle>
              <CardDescription>Valor total das vendas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">R$ {salesData.totalAmount.toFixed(2)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Ticket Médio</CardTitle>
              <CardDescription>Valor médio por pedido</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">R$ {salesData.averageTicket.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="payment">Formas de Pagamento</TabsTrigger>
          </TabsList>
          
          {/* Top Products */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Produtos Mais Vendidos</CardTitle>
                <CardDescription>
                  Top produtos por faturamento no período selecionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topProducts.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    Sem dados para o período selecionado
                  </div>
                ) : (
                  <>
                    <div className="h-72 mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={topProducts.slice(0, 5)}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={formatCurrency} />
                          <Tooltip formatter={(value) => [`R$ ${parseFloat(value as string).toFixed(2)}`, 'Faturamento']} />
                          <Bar dataKey="revenue" name="Faturamento" fill="#9b87f5">
                            {topProducts.slice(0, 5).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#9b87f5' : '#d6bcfa'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead className="text-right">Faturamento</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topProducts.map((product) => (
                          <TableRow key={product.name}>
                            <TableCell>{product.name}</TableCell>
                            <TableCell>{product.quantity}</TableCell>
                            <TableCell className="text-right">R$ {product.revenue.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Payment Methods */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Formas de Pagamento</CardTitle>
                <CardDescription>
                  Distribuição das vendas por forma de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {salesData.paymentBreakdown.every(p => p.count === 0) ? (
                  <div className="text-center py-10 text-gray-500">
                    Sem dados para o período selecionado
                  </div>
                ) : (
                  <>
                    <div className="h-72 mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={salesData.paymentBreakdown.filter(p => p.count > 0)}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="method" />
                          <YAxis yAxisId="left" tickFormatter={formatCurrency} />
                          <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}`} />
                          <Tooltip formatter={(value, name) => {
                            return name === "Valor" 
                              ? [`R$ ${parseFloat(value as string).toFixed(2)}`, name]
                              : [value, name];
                          }} />
                          <Legend />
                          <Bar yAxisId="left" dataKey="amount" name="Valor" fill="#9b87f5" />
                          <Bar yAxisId="right" dataKey="count" name="Quantidade" fill="#7E69AB" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Forma de Pagamento</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead className="text-right">Valor Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesData.paymentBreakdown.map((payment) => (
                          <TableRow key={payment.method}>
                            <TableCell>{payment.method}</TableCell>
                            <TableCell>{payment.count}</TableCell>
                            <TableCell className="text-right">R$ {payment.amount.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ReportsPage;
