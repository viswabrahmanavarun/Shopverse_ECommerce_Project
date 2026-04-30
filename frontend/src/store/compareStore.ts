import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CompareProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  variants?: any[];
}

interface CompareState {
  items: CompareProduct[];
  add: (product: CompareProduct) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set) => ({
      items: [],
      add: (product) => set((state) => {
        if (state.items.find((i) => i.id === product.id)) return state;
        if (state.items.length >= 4) {
          // Limit to 4 items
          return { items: [...state.items.slice(1), product] };
        }
        return { items: [...state.items, product] };
      }),
      remove: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id),
      })),
      clear: () => set({ items: [] }),
    }),
    { name: 'compare-storage' }
  )
);
