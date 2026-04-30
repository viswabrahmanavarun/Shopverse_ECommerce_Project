import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  cartId: string; // Unique ID for variant combination
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant_sku?: string;
  size?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'cartId'>) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        const items = get().items;
        const cartId = `${newItem.id}-${newItem.size || ''}-${newItem.variant_sku || ''}`;
        
        const existingItem = items.find((i) => i.cartId === cartId);
        if (existingItem) {
          set({
            items: items.map((i) =>
              i.cartId === cartId ? { ...i, quantity: i.quantity + newItem.quantity } : i
            ),
          });
        } else {
          set({ items: [...items, { ...newItem, cartId }] });
        }
      },
      removeItem: (cartId) => set({ items: get().items.filter((i) => i.cartId !== cartId) }),
      updateQuantity: (cartId, quantity) =>
        set({
          items: get().items.map((i) =>
            i.cartId === cartId ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        }),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'shopifyx-cart',
    }
  )
);
