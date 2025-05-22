
import { createContext, useContext, useState, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { Product, Addon } from "@/lib/db";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedAddons: Addon[];
  totalPrice: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number, selectedAddons: Addon[]) => void;
  updateItemQuantity: (index: number, quantity: number) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const calculateItemPrice = (product: Product, quantity: number, selectedAddons: Addon[]) => {
    const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    return (product.price + addonsTotal) * quantity;
  };

  const addToCart = (product: Product, quantity: number, selectedAddons: Addon[]) => {
    const totalPrice = calculateItemPrice(product, quantity, selectedAddons);
    
    setItems((prevItems) => [
      ...prevItems,
      { product, quantity, selectedAddons, totalPrice }
    ]);
    
    toast({
      title: "Item adicionado",
      description: `${product.name} foi adicionado ao carrinho`,
    });
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    setItems((prevItems) => {
      const updatedItems = [...prevItems];
      if (updatedItems[index]) {
        updatedItems[index].quantity = quantity;
        updatedItems[index].totalPrice = calculateItemPrice(
          updatedItems[index].product,
          quantity,
          updatedItems[index].selectedAddons
        );
      }
      return updatedItems;
    });
  };

  const removeItem = (index: number) => {
    setItems((prevItems) => {
      const updatedItems = [...prevItems];
      const removedItem = updatedItems.splice(index, 1)[0];
      
      toast({
        title: "Item removido",
        description: `${removedItem.product.name} foi removido do carrinho`,
      });
      
      return updatedItems;
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      updateItemQuantity,
      removeItem,
      clearCart,
      totalItems,
      totalAmount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
