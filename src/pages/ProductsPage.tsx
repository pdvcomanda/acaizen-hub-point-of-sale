
import { useState, useEffect } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { db, Product, Category, Addon } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Trash, Download, Upload, Save } from "lucide-react";

const ProductsPage = () => {
  const { toast } = useToast();
  
  // Tab state
  const [activeTab, setActiveTab] = useState("products");
  
  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  
  // Product form
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: "",
    price: 0,
    description: "",
    categoryId: 0,
    stock: 0,
    hasAddons: false
  });
  
  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({
    name: "",
    description: ""
  });
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  
  // Addons state
  const [addons, setAddons] = useState<Addon[]>([]);
  const [productAddons, setProductAddons] = useState<Addon[]>([]);
  const [isAddonDialogOpen, setIsAddonDialogOpen] = useState(false);
  const [addonForm, setAddonForm] = useState<Partial<Addon>>({
    name: "",
    price: 0,
    productId: 0
  });
  const [editAddonId, setEditAddonId] = useState<number | null>(null);
  
  // Load data
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadAddons();
  }, []);
  
  const loadProducts = async () => {
    try {
      const allProducts = await db.products.toArray();
      setProducts(allProducts);
    } catch (error) {
      console.error("Failed to load products", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos",
        variant: "destructive",
      });
    }
  };
  
  const loadCategories = async () => {
    try {
      const allCategories = await db.categories.toArray();
      setCategories(allCategories);
    } catch (error) {
      console.error("Failed to load categories", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias",
        variant: "destructive",
      });
    }
  };
  
  const loadAddons = async () => {
    try {
      const allAddons = await db.addons.toArray();
      setAddons(allAddons);
    } catch (error) {
      console.error("Failed to load addons", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os adicionais",
        variant: "destructive",
      });
    }
  };
  
  // Product handlers
  const openAddProductDialog = () => {
    setEditProductId(null);
    setProductForm({
      name: "",
      price: 0,
      description: "",
      categoryId: categories.length > 0 ? categories[0].id! : 0,
      stock: 0,
      hasAddons: false
    });
    setIsProductDialogOpen(true);
  };
  
  const openEditProductDialog = async (product: Product) => {
    setEditProductId(product.id!);
    setProductForm({
      name: product.name,
      price: product.price,
      description: product.description,
      categoryId: product.categoryId,
      stock: product.stock,
      hasAddons: product.hasAddons,
      image: product.image
    });
    setIsProductDialogOpen(true);
  };
  
  const handleProductFormChange = (field: string, value: any) => {
    setProductForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const saveProduct = async () => {
    try {
      if (!productForm.name || !productForm.categoryId) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }
      
      const now = new Date().toISOString();
      
      if (editProductId) {
        // Update existing product
        await db.products.update(editProductId, {
          ...productForm,
          updatedAt: now
        } as Product);
        
        toast({
          title: "Produto atualizado",
          description: `${productForm.name} foi atualizado com sucesso`,
        });
      } else {
        // Add new product
        const productId = await db.products.add({
          ...productForm,
          createdAt: now,
          updatedAt: now
        } as Product);
        
        toast({
          title: "Produto adicionado",
          description: `${productForm.name} foi adicionado com sucesso`,
        });
      }
      
      loadProducts();
      setIsProductDialogOpen(false);
    } catch (error) {
      console.error("Failed to save product", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o produto",
        variant: "destructive",
      });
    }
  };
  
  const deleteProduct = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        // Delete product addons
        await db.addons.where({ productId: id }).delete();
        
        // Delete product
        await db.products.delete(id);
        
        toast({
          title: "Produto excluído",
          description: "O produto foi excluído com sucesso",
        });
        
        loadProducts();
        loadAddons();
      } catch (error) {
        console.error("Failed to delete product", error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o produto",
          variant: "destructive",
        });
      }
    }
  };
  
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
  );
  
  // Category handlers
  const openAddCategoryDialog = () => {
    setEditCategoryId(null);
    setCategoryForm({
      name: "",
      description: ""
    });
    setIsCategoryDialogOpen(true);
  };
  
  const openEditCategoryDialog = (category: Category) => {
    setEditCategoryId(category.id!);
    setCategoryForm({
      name: category.name,
      description: category.description
    });
    setIsCategoryDialogOpen(true);
  };
  
  const handleCategoryFormChange = (field: string, value: any) => {
    setCategoryForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const saveCategory = async () => {
    try {
      if (!categoryForm.name) {
        toast({
          title: "Campo obrigatório",
          description: "O nome da categoria é obrigatório",
          variant: "destructive",
        });
        return;
      }
      
      const now = new Date().toISOString();
      
      if (editCategoryId) {
        // Update existing category
        await db.categories.update(editCategoryId, {
          ...categoryForm,
          updatedAt: now
        } as Category);
        
        toast({
          title: "Categoria atualizada",
          description: `${categoryForm.name} foi atualizada com sucesso`,
        });
      } else {
        // Add new category
        await db.categories.add({
          ...categoryForm,
          createdAt: now,
          updatedAt: now
        } as Category);
        
        toast({
          title: "Categoria adicionada",
          description: `${categoryForm.name} foi adicionada com sucesso`,
        });
      }
      
      loadCategories();
      setIsCategoryDialogOpen(false);
    } catch (error) {
      console.error("Failed to save category", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a categoria",
        variant: "destructive",
      });
    }
  };
  
  const deleteCategory = async (id: number) => {
    // Check if there are products in this category
    const productsInCategory = await db.products.where({ categoryId: id }).count();
    
    if (productsInCategory > 0) {
      toast({
        title: "Não é possível excluir",
        description: "Existem produtos nesta categoria. Mova-os para outra categoria primeiro.",
        variant: "destructive",
      });
      return;
    }
    
    if (window.confirm("Tem certeza que deseja excluir esta categoria?")) {
      try {
        await db.categories.delete(id);
        
        toast({
          title: "Categoria excluída",
          description: "A categoria foi excluída com sucesso",
        });
        
        loadCategories();
      } catch (error) {
        console.error("Failed to delete category", error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir a categoria",
          variant: "destructive",
        });
      }
    }
  };
  
  // Addon handlers
  const openProductAddons = async (product: Product) => {
    setSelectedProduct(product);
    
    try {
      const productAddons = await db.addons.where({ productId: product.id }).toArray();
      setProductAddons(productAddons);
      
      setIsAddonDialogOpen(true);
      setEditAddonId(null);
      setAddonForm({
        name: "",
        price: 0,
        productId: product.id
      });
    } catch (error) {
      console.error("Failed to load product addons", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os adicionais do produto",
        variant: "destructive",
      });
    }
  };
  
  const handleAddonFormChange = (field: string, value: any) => {
    setAddonForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const saveAddon = async () => {
    try {
      if (!addonForm.name || addonForm.price === undefined) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }
      
      const now = new Date().toISOString();
      
      if (editAddonId) {
        // Update existing addon
        await db.addons.update(editAddonId, {
          ...addonForm,
          updatedAt: now
        } as Addon);
      } else {
        // Add new addon
        await db.addons.add({
          ...addonForm,
          createdAt: now,
          updatedAt: now
        } as Addon);
      }
      
      // Refresh product addons
      const updatedAddons = await db.addons.where({ productId: selectedProduct?.id }).toArray();
      setProductAddons(updatedAddons);
      
      // Update product hasAddons flag if needed
      if (updatedAddons.length > 0 && !selectedProduct?.hasAddons) {
        await db.products.update(selectedProduct!.id!, { 
          hasAddons: true,
          updatedAt: now
        });
        loadProducts();
      }
      
      setEditAddonId(null);
      setAddonForm({
        name: "",
        price: 0,
        productId: selectedProduct?.id
      });
      
      loadAddons();
      
      toast({
        title: "Adicional salvo",
        description: "O adicional foi salvo com sucesso",
      });
    } catch (error) {
      console.error("Failed to save addon", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o adicional",
        variant: "destructive",
      });
    }
  };
  
  const editAddon = (addon: Addon) => {
    setEditAddonId(addon.id!);
    setAddonForm({
      name: addon.name,
      price: addon.price,
      productId: addon.productId
    });
  };
  
  const deleteAddon = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este adicional?")) {
      try {
        await db.addons.delete(id);
        
        // Refresh product addons
        const updatedAddons = await db.addons.where({ productId: selectedProduct?.id }).toArray();
        setProductAddons(updatedAddons);
        
        // Update product hasAddons flag if needed
        if (updatedAddons.length === 0 && selectedProduct?.hasAddons) {
          await db.products.update(selectedProduct!.id!, { 
            hasAddons: false,
            updatedAt: new Date().toISOString()
          });
          loadProducts();
        }
        
        loadAddons();
        
        toast({
          title: "Adicional excluído",
          description: "O adicional foi excluído com sucesso",
        });
      } catch (error) {
        console.error("Failed to delete addon", error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o adicional",
          variant: "destructive",
        });
      }
    }
  };
  
  // Export/Import handlers
  const exportProducts = () => {
    const productsData = products.map(product => ({
      name: product.name,
      price: product.price,
      description: product.description,
      category: categories.find(c => c.id === product.categoryId)?.name || "",
      stock: product.stock,
      hasAddons: product.hasAddons ? "Sim" : "Não"
    }));
    
    const headers = ["Nome", "Preço", "Descrição", "Categoria", "Estoque", "Tem Adicionais"];
    
    let csvContent = headers.join(",") + "\n";
    
    productsData.forEach(product => {
      const row = [
        `"${product.name.replace(/"/g, '""')}"`,
        product.price,
        `"${product.description.replace(/"/g, '""')}"`,
        `"${product.category.replace(/"/g, '""')}"`,
        product.stock,
        product.hasAddons
      ];
      csvContent += row.join(",") + "\n";
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `produtos_acaizen_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const importProducts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n");
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        
        const nameIndex = headers.indexOf("nome");
        const priceIndex = headers.indexOf("preço");
        const descriptionIndex = headers.indexOf("descrição");
        const categoryIndex = headers.indexOf("categoria");
        const stockIndex = headers.indexOf("estoque");
        const hasAddonsIndex = headers.indexOf("tem adicionais");
        
        if (nameIndex === -1 || priceIndex === -1) {
          toast({
            title: "Formato inválido",
            description: "O arquivo CSV não contém as colunas necessárias",
            variant: "destructive",
          });
          return;
        }
        
        const now = new Date().toISOString();
        let imported = 0;
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(",");
          let name = values[nameIndex] || "";
          name = name.replace(/^"|"$/g, "").replace(/""/g, '"');
          
          if (!name) continue;
          
          let price = parseFloat(values[priceIndex] || "0");
          let description = values[descriptionIndex] || "";
          description = description.replace(/^"|"$/g, "").replace(/""/g, '"');
          
          let categoryName = values[categoryIndex] || "";
          categoryName = categoryName.replace(/^"|"$/g, "").replace(/""/g, '"');
          
          let categoryId: number;
          
          // Find or create category
          let category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
          if (category) {
            categoryId = category.id!;
          } else if (categoryName) {
            categoryId = await db.categories.add({
              name: categoryName,
              description: "",
              createdAt: now,
              updatedAt: now
            } as Category);
            
            // Update categories array
            loadCategories();
          } else {
            // Use first category as fallback
            categoryId = categories[0]?.id || 1;
          }
          
          let stock = parseInt(values[stockIndex] || "0", 10);
          let hasAddons = (values[hasAddonsIndex] || "").toLowerCase() === "sim";
          
          // Add product
          await db.products.add({
            name,
            price,
            description,
            categoryId,
            stock,
            hasAddons,
            createdAt: now,
            updatedAt: now
          } as Product);
          
          imported++;
        }
        
        loadProducts();
        
        toast({
          title: "Importação concluída",
          description: `${imported} produtos foram importados com sucesso`,
        });
      } catch (error) {
        console.error("Failed to import products", error);
        toast({
          title: "Erro",
          description: "Não foi possível importar os produtos",
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
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Produtos</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 w-1/3">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar produtos..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="importProducts"
                className="hidden"
                accept=".csv"
                onChange={importProducts}
              />
              <label htmlFor="importProducts">
                <Button variant="outline" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" /> Importar
                </Button>
              </label>
              <Button variant="outline" onClick={exportProducts}>
                <Download className="h-4 w-4 mr-2" /> Exportar
              </Button>
              <Button onClick={openAddProductDialog}>
                <Plus className="h-4 w-4 mr-2" /> Novo Produto
              </Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Adicionais</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        Nenhum produto encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map(product => (
                      <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>R$ {product.price.toFixed(2)}</TableCell>
                        <TableCell>
                          {categories.find(c => c.id === product.categoryId)?.name || ""}
                        </TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>
                          {product.hasAddons ? (
                            <Button variant="link" onClick={() => openProductAddons(product)}>
                              Ver adicionais
                            </Button>
                          ) : (
                            "Não"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditProductDialog(product)}>
                              Editar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteProduct(product.id!)}>
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
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Categorias</h2>
            <Button onClick={openAddCategoryDialog}>
              <Plus className="h-4 w-4 mr-2" /> Nova Categoria
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Produtos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        Nenhuma categoria encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map(category => (
                      <TableRow key={category.id}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>{category.description}</TableCell>
                        <TableCell>
                          {products.filter(p => p.categoryId === category.id).length}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditCategoryDialog(category)}>
                              Editar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteCategory(category.id!)}>
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
        </TabsContent>
      </Tabs>
      
      {/* Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editProductId ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
            <DialogDescription>
              Preencha os campos para {editProductId ? "editar o" : "adicionar um novo"} produto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={productForm.name || ""}
                onChange={(e) => handleProductFormChange("name", e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="price">Preço *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={productForm.price || 0}
                onChange={(e) => handleProductFormChange("price", parseFloat(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={productForm.categoryId?.toString() || ""}
                onValueChange={(value) => handleProductFormChange("categoryId", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id!.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="stock">Estoque *</Label>
              <Input
                id="stock"
                type="number"
                value={productForm.stock || 0}
                onChange={(e) => handleProductFormChange("stock", parseInt(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={productForm.description || ""}
                onChange={(e) => handleProductFormChange("description", e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="hasAddons"
                checked={productForm.hasAddons || false}
                onCheckedChange={(checked) => handleProductFormChange("hasAddons", checked)}
              />
              <Label htmlFor="hasAddons">Este produto pode ter adicionais</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveProduct}>
              <Save className="h-4 w-4 mr-2" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editCategoryId ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
            <DialogDescription>
              Preencha os campos para {editCategoryId ? "editar a" : "adicionar uma nova"} categoria
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="categoryName">Nome *</Label>
              <Input
                id="categoryName"
                value={categoryForm.name || ""}
                onChange={(e) => handleCategoryFormChange("name", e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="categoryDescription">Descrição</Label>
              <Textarea
                id="categoryDescription"
                value={categoryForm.description || ""}
                onChange={(e) => handleCategoryFormChange("description", e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveCategory}>
              <Save className="h-4 w-4 mr-2" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Addon Dialog */}
      <Dialog open={isAddonDialogOpen} onOpenChange={setIsAddonDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Adicionais para {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription>
              Gerencie os adicionais para este produto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
              <div>
                <Label htmlFor="addonName">Nome</Label>
                <Input
                  id="addonName"
                  value={addonForm.name || ""}
                  onChange={(e) => handleAddonFormChange("name", e.target.value)}
                  placeholder="Nome do adicional"
                />
              </div>
              <div>
                <Label htmlFor="addonPrice">Preço</Label>
                <Input
                  id="addonPrice"
                  type="number"
                  step="0.01"
                  value={addonForm.price || 0}
                  onChange={(e) => handleAddonFormChange("price", parseFloat(e.target.value))}
                  className="w-24"
                />
              </div>
              <Button className="mb-1" onClick={saveAddon}>
                {editAddonId ? "Atualizar" : "Adicionar"}
              </Button>
            </div>
            
            <ScrollArea className="h-60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productAddons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        Nenhum adicional cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    productAddons.map(addon => (
                      <TableRow key={addon.id}>
                        <TableCell>{addon.name}</TableCell>
                        <TableCell>R$ {addon.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => editAddon(addon)}>
                              Editar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteAddon(addon.id!)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ProductsPage;
