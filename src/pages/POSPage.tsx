
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

// O restante do conteúdo original da página permanece igual,
// exceto na área do DialogFooter do recibo onde removemos a impressão via middleware.

const POSPage = () => {
  // ...todas as lógicas e estados permanecem iguais...

  // Substituir o trecho do DialogFooter do recibo para manter apenas impressão via navegador:
  // Substitua o bloco existente do DialogFooter no "Receipt Dialog" por:

  return (
    <MainLayout>
      {/* ...demais conteúdo da página... */}

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
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default POSPage;
