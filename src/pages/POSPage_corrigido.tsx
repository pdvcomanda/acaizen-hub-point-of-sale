
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
import { Printer } from "lucide-react";
import { printReceiptFromBrowser } from "@/utils/printUtils";

// Resto do seu código permanece igual

// No DialogFooter do Receipt Dialog use:
{/* ... dentro do DialogContent do Receipt Dialog ... */}
<DialogFooter className="flex flex-col sm:flex-row gap-2">
  <Button 
    onClick={handlePrintInBrowser} 
    className="w-full sm:w-auto flex items-center justify-center gap-2"
    variant="secondary"
  >
    <Printer className="h-4 w-4" />
    Imprimir Cupom
  </Button>
  <Button onClick={handleDownloadPdf} className="w-full sm:w-auto">
    Baixar Cupom
  </Button>
</DialogFooter>
