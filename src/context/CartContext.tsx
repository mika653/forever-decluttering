import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Item, Store } from '../types';

export interface CartItem {
  item: Item;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  store: Store | null;
  setStore: (store: Store) => void;
  addItem: (item: Item) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalPrice: number;
  totalItems: number;
  isInCart: (itemId: string) => boolean;
  showCart: boolean;
  setShowCart: (show: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [showCart, setShowCart] = useState(false);

  const addItem = useCallback((item: Item) => {
    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id);
      if (existing) return prev; // already in cart
      return [...prev, { item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((ci) => ci.item.id !== itemId));
      return;
    }
    setCartItems((prev) =>
      prev.map((ci) => (ci.item.id === itemId ? { ...ci, quantity } : ci))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const totalPrice = cartItems.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
  const totalItems = cartItems.reduce((sum, ci) => sum + ci.quantity, 0);

  const isInCart = useCallback(
    (itemId: string) => cartItems.some((ci) => ci.item.id === itemId),
    [cartItems]
  );

  return (
    <CartContext.Provider
      value={{
        items: cartItems,
        store,
        setStore,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalPrice,
        totalItems,
        isInCart,
        showCart,
        setShowCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
