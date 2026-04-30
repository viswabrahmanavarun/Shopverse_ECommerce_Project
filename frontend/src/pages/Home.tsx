import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import ProductGrid from '../components/product/ProductGrid';
import { X, SlidersHorizontal, Smartphone, Laptop, Shirt, Home as HomeIcon, Zap, Watch, Book, LayoutGrid, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';


const SORT_OPTIONS = [
  { label: 'Newest Arrivals', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

const CATEGORY_ICONS: Record<string, any> = {
  'Electronics': Smartphone,
  'Mobiles': Smartphone,
  'Laptops': Laptop,
  'Fashion': Shirt,
  'Home': HomeIcon,
  'Appliances': Zap,
  'Smart Watches': Watch,
  'Books': Book,
  'Beauty': LayoutGrid,
};

const BANNERS = [
  {
    id: 1,
    title: "HRX Performance",
    subtitle: "Inspired by Hrithik Roshan",
    offer: "Min. 70% Off",
    color: "bg-[#eef2ff]",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1200",
    textColor: "text-blue-900",
    searchTerm: "HRX"
  },
  {
    id: 2,
    title: "Summer Collection",
    subtitle: "New Arrivals in Men's Fashion",
    offer: "Flat 50% Off",
    color: "bg-[#fffbeb]",
    image: "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&q=80&w=1200",
    textColor: "text-amber-900",
    searchTerm: "Fashion"
  },
  {
    id: 3,
    title: "Elite Gadgets",
    subtitle: "Smartwatches & Accessories",
    offer: "Up to 40% Off",
    color: "bg-[#fdf2f8]",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200",
    textColor: "text-pink-900",
    searchTerm: "Watch"
  }
];

export default function Home() {
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);
  const navigate = useNavigate();

  // Auto-slide Banners
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/products/categories');
      return response.data;
    }
  });


  const { data: products, isLoading } = useQuery({
    queryKey: ['products', searchTerm, selectedCategories, priceRange, sortBy],
    queryFn: async () => {
      const response = await api.get('/products', {
        params: { 
          search: searchTerm, 
          categories: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
          min_price: priceRange[0],
          max_price: priceRange[1],
          sort_by: sortBy
        }
      });
      return response.data;
    }
  });

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 200000]);
    setSortBy('newest');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Category Bar (Flipkart Style) */}
      <div className="bg-white border-b shadow-sm overflow-x-auto no-scrollbar scroll-smooth">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between min-w-max lg:min-w-0">
          {categories.map((cat: string) => {
            const Icon = CATEGORY_ICONS[cat] || LayoutGrid;
            const isSelected = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`flex flex-col items-center gap-2 py-4 px-6 min-w-[100px] group transition-all relative ${
                  isSelected ? 'text-brand' : 'text-gray-600 hover:text-brand'
                }`}
              >
                <div className={`p-2 rounded-xl transition-all ${
                  isSelected ? 'bg-brand/10' : 'group-hover:bg-gray-50'
                }`}>
                  <Icon size={24} strokeWidth={isSelected ? 2.5 : 2} />
                </div>
                <span className={`text-[11px] font-black uppercase tracking-wider ${isSelected ? 'opacity-100' : 'opacity-80'}`}>
                  {cat}
                </span>
                {isSelected && (
                  <motion.div layoutId="cat-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-brand rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search & Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
          {/* Hero Banners */}
          <div className="lg:col-span-12 relative h-[300px] sm:h-[500px] rounded-[40px] overflow-hidden shadow-2xl shadow-gray-200/50 group">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBanner}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0"
              >
                {/* Background Image with Parallax effect */}
                <motion.img 
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 10, ease: "linear" }}
                  src={BANNERS[currentBanner].image} 
                  className="absolute inset-0 w-full h-full object-cover"
                  alt="Banner"
                />
                
                {/* Cinematic Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                <div className="relative h-full max-w-7xl mx-auto px-8 md:px-16 flex flex-col justify-center items-start text-left">
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="backdrop-blur-md bg-white/10 border border-white/20 p-8 rounded-[32px] max-w-xl"
                  >
                    <span className="text-xs font-black uppercase tracking-[0.4em] mb-4 text-white/70 block">
                      {BANNERS[currentBanner].subtitle}
                    </span>
                    <h2 className="text-4xl md:text-7xl font-black mb-6 leading-tight text-white drop-shadow-2xl">
                      {BANNERS[currentBanner].title}
                    </h2>
                    <div className="flex items-center gap-6">
                      <div className="bg-brand text-white px-8 py-4 rounded-2xl font-black text-xl shadow-xl shadow-brand/40">
                        {BANNERS[currentBanner].offer}
                      </div>
                      <button 
                        onClick={() => {
                          const term = (BANNERS[currentBanner] as any).searchTerm;
                          if (term) {
                            navigate(`/?search=${term}`);
                            setTimeout(() => {
                              document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }
                        }}
                        className="text-white font-bold flex items-center gap-2 hover:gap-4 transition-all group/btn"
                      >
                        Shop Now <ChevronRight className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Navigation Arrows */}
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-6 pointer-events-none">
              <button 
                onClick={() => setCurrentBanner(prev => (prev - 1 + BANNERS.length) % BANNERS.length)}
                className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white shadow-2xl pointer-events-auto opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-black"
              >
                <ChevronLeft size={28} />
              </button>
              <button 
                onClick={() => setCurrentBanner(prev => (prev + 1) % BANNERS.length)}
                className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white shadow-2xl pointer-events-auto opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-black"
              >
                <ChevronRight size={28} />
              </button>
            </div>

            {/* Pagination Dots */}
            <div className="absolute bottom-10 left-16 flex gap-3 z-20">
              {BANNERS.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentBanner(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${currentBanner === i ? 'w-12 bg-brand' : 'w-3 bg-white/30 hover:bg-white/50'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Filters & Sorting Controls (Flipkart Style) */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all border-2 ${
              showFilters || selectedCategories.length > 0
                ? 'bg-brand text-white border-brand' 
                : 'bg-white text-gray-700 border-gray-100 hover:border-gray-200'
            }`}
          >
            <SlidersHorizontal size={18} />
            <span>Filters</span>
          </button>

          <div className="flex items-center bg-white border-2 border-gray-100 rounded-xl px-4 py-1">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest mr-4">Sort By</span>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`px-4 py-2 text-sm font-bold transition-all border-b-2 ${
                  sortBy === opt.value ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <AnimatePresence>
          {(showFilters) && (
            <motion.aside 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full lg:w-64 space-y-8 flex-shrink-0"
            >
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-gray-900 uppercase tracking-wider text-xs">Categories</h3>
                  <button onClick={clearFilters} className="text-brand text-[10px] font-bold hover:underline">RESET ALL</button>
                </div>
                
                <div className="space-y-2">
                  {categories.map((cat: string) => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        selectedCategories.includes(cat)
                          ? 'bg-brand/10 text-brand'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {cat}
                      {selectedCategories.includes(cat) && <X size={14} />}
                    </button>
                  ))}
                </div>

                <div className="mt-8">
                  <h3 className="font-black text-gray-900 uppercase tracking-wider text-xs mb-6">Price Range</h3>
                  <div className="space-y-4">
                    <input 
                      type="range" 
                      min="0" 
                      max="200000" 
                      step="1000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full accent-brand cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-sm font-black text-gray-900">
                      <span className="bg-gray-100 px-3 py-1 rounded-lg">₹{priceRange[0]}</span>
                      <span className="text-gray-300">→</span>
                      <span className="bg-brand/10 text-brand px-3 py-1 rounded-lg">₹{priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowFilters(false)}
                  className="w-full mt-8 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors lg:hidden"
                >
                  Apply Filters
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

          {/* Product Listing */}
          <div id="product-grid" className="flex-1 scroll-mt-24">
            {(selectedCategories.length > 0 || searchTerm) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {searchTerm && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white rounded-full text-xs font-bold shadow-sm">
                    Search: "{searchTerm}"
                    <button onClick={() => navigate('/')} className="hover:bg-white/20 rounded-full p-0.5"><X size={12} /></button>
                  </span>
                )}
                {selectedCategories.map(cat => (
                  <span key={cat} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-full text-xs font-bold shadow-sm">
                    {cat}
                    <button onClick={() => toggleCategory(cat)} className="hover:bg-gray-300 rounded-full p-0.5"><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
            
            <ProductGrid products={products || []} isLoading={isLoading} />
          </div>
      </div>
    </div>
  );
}
