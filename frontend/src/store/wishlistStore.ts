import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  userId: string; // Isolate by user
}

interface WishlistState {
  items: WishlistItem[];
  toggle: (item: Omit<WishlistItem, 'userId'>, userId: string) => void;
  isWishlisted: (id: string, userId: string) => boolean;
  remove: (id: string, userId: string) => void;
  getUserItems: (userId: string) => WishlistItem[];
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item, userId) => {
        const exists = get().items.find(i => i.id === item.id && i.userId === userId);
        if (exists) {
          set({ items: get().items.filter(i => !(i.id === item.id && i.userId === userId)) });
        } else {
          set({ items: [...get().items, { ...item, userId }] });
        }
      },
      isWishlisted: (id, userId) => !!get().items.find(i => i.id === id && i.userId === userId),
      remove: (id, userId) => set({ items: get().items.filter(i => !(i.id === id && i.userId === userId)) }),
      getUserItems: (userId) => get().items.filter(i => i.userId === userId),
    }),
    { name: 'shopifyx-wishlist' }
  )
);
