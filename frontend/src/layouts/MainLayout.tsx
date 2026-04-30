import { useState, useEffect, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, LogOut, Menu, Heart, Search, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useDebounce } from '../hooks/useDebounce';
import api from '../services/api';
import CartSidebar from '../components/cart/CartSidebar';
import { Button } from '../components/ui/Button';
import { ComparisonWrapper } from '../components/product/ComparisonDrawer';
import SupportChat from '../components/common/SupportChat';

export default function MainLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const cartItems = useCartStore((state) => state.items);
  const wishlistCount = useWishlistStore(state => 
    user ? state.items.filter(i => i.userId === user.id).length : 0
  );
  const [isCartOpen, setIsCartOpen] = useState(false);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedSearch.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const { data } = await api.get(`/products/search/suggestions?q=${debouncedSearch}`);
        setSuggestions(data);
      } catch (error) {
        console.error('Suggestions error:', error);
      }
    };
    fetchSuggestions();
  }, [debouncedSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ search: searchTerm });
    navigate(`/?search=${searchTerm}`);
    setSuggestions([]);
  };

  const handleSuggestionClick = (productId: string) => {
    navigate(`/product/${productId}`);
    setSuggestions([]);
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex flex-col">
                <span className="text-2xl font-black text-brand tracking-tighter leading-none">
                  Shopverse
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                  Everything you need, in one place
                </span>
              </Link>
              <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
                <Link to="/" className="hover:text-brand transition-colors">Shop</Link>
                <Link to="/categories" className="hover:text-brand transition-colors">Categories</Link>
                {user?.role === 'seller' && (
                  <Link to="/seller" className="hover:text-brand transition-colors">Seller Panel</Link>
                )}
                {user?.role === 'admin' && (
                  <Link to="/admin" className="hover:text-brand transition-colors">Admin Panel</Link>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 flex-1 justify-end">
              {/* Navbar Search Bar */}
              <div className="hidden sm:block relative max-w-md w-full mr-2">
                <form onSubmit={handleSearchSubmit} className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Search for products..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full focus:ring-2 focus:ring-brand/20 transition-all outline-none text-sm font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  
                  {/* Navbar Autocomplete */}
                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl z-[60] overflow-hidden p-2"
                      >
                        {suggestions.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleSuggestionClick(item.id)}
                            className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-all text-left group/item"
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                              <p className="text-[10px] text-brand font-black uppercase tracking-widest">₹{item.price.toLocaleString()}</p>
                            </div>
                            <ChevronRight size={14} className="text-gray-300 group-hover/item:text-brand" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>

              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ShoppingBag size={22} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-brand text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </button>

              {user ? (
                <div className="flex items-center gap-2">
                  {/* Wishlist */}
                   <Link
                    to="/account"
                    state={{ activeTab: 'wishlist' }}
                    className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    title="Wishlist"
                  >
                    <Heart size={20} />
                    {wishlistCount > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>

                  {/* Profile */}
                  <Link
                    to="/account"
                    className="flex items-center gap-2 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors"
                    title="My Account"
                  >
                    <div className="w-7 h-7 bg-brand rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {user.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium text-gray-700">
                      {user.full_name.split(' ')[0]}
                    </span>
                  </Link>

                  <button
                    onClick={logout}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <Link to="/login">
                  <Button size="sm">Sign In</Button>
                </Link>
              )}
              
              <button className="md:hidden p-2 text-gray-600">
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-white border-t py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          © 2026 Shopverse. All rights reserved. Built for scale.
        </div>
      </footer>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <ComparisonWrapper />
      <SupportChat />
    </div>
  );
}
