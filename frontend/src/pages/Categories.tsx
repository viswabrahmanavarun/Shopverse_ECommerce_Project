import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Smartphone, Shirt, Zap, Watch, 
  ChevronRight, LayoutGrid, ShoppingBag 
} from 'lucide-react';

const CATEGORY_META: Record<string, { icon: any, color: string, image: string }> = {
  'Electronics': { 
    icon: Smartphone, 
    color: 'bg-blue-500', 
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=800' 
  },
  'Footwear': { 
    icon: Zap, 
    color: 'bg-orange-500', 
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800' 
  },
  'Men\'s Fashion': { 
    icon: Shirt, 
    color: 'bg-indigo-600', 
    image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&q=80&w=800' 
  },
  'Women\'s Fashion': { 
    icon: Shirt, 
    color: 'bg-pink-500', 
    image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&q=80&w=800' 
  },
  'Accessories': { 
    icon: Watch, 
    color: 'bg-yellow-500', 
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800' 
  },
  'Smart Watches': { 
    icon: Watch, 
    color: 'bg-cyan-500', 
    image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=800' 
  }
};

export default function Categories() {
  const navigate = useNavigate();
  
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/products/categories');
      return response.data;
    }
  });

  const handleCategoryClick = (category: string) => {
    navigate(`/?categories=${encodeURIComponent(category)}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Exploring Categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <LayoutGrid className="text-brand" size={24} />
          <span className="text-brand font-black uppercase tracking-[0.3em] text-xs">Discovery</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-4 tracking-tighter">
          Browse by <span className="text-brand">Category</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl font-medium">
          Explore our wide range of premium collections curated just for your lifestyle.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((category: string) => {
          // Case-insensitive lookup
          const metaKey = Object.keys(CATEGORY_META).find(
            key => key.toLowerCase() === category.toLowerCase()
          ) || '';
          
          const meta = CATEGORY_META[metaKey] || { 
            icon: ShoppingBag, 
            color: 'bg-brand', 
            image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800' 
          };
          const Icon = meta.icon;

          return (
            <motion.button
              key={category}
              whileHover={{ y: -10 }}
              onClick={() => handleCategoryClick(category)}
              className="group relative h-[400px] rounded-[40px] overflow-hidden bg-white shadow-2xl shadow-gray-200/50 border border-gray-100 text-left"
            >
              {/* Background Image with Overlay */}
              <img 
                src={meta.image} 
                alt={category} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity group-hover:opacity-80" />

              {/* Content */}
              <div className="absolute inset-0 p-10 flex flex-col justify-end">
                <div className={`${meta.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl`}>
                  <Icon className="text-white" size={32} />
                </div>
                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">
                  {category}
                </h3>
                <p className="text-white/60 font-medium mb-6">
                  Experience the best in {category.toLowerCase()} with our latest collection.
                </p>
                <div className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest bg-white/20 backdrop-blur-md w-fit px-6 py-3 rounded-full border border-white/10 group-hover:bg-brand group-hover:border-brand transition-all">
                  Browse Collection <ChevronRight size={16} />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Featured Banner */}
      <div className="mt-20 bg-gray-900 rounded-[50px] p-8 sm:p-16 flex flex-col lg:flex-row items-center gap-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand/10 blur-[120px] rounded-full -translate-y-1/2" />
        <div className="relative z-10 flex-1">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight">
            Can't find what <br />you're looking for?
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-md">
            Our personal shoppers are available 24/7 to help you find the perfect match.
          </p>
          <button className="bg-brand text-white px-10 py-5 rounded-[24px] font-black hover:scale-105 transition-transform shadow-xl shadow-brand/20">
            TALK TO AN EXPERT
          </button>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-4">
           {[
             'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&q=80&w=400',
             'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400'
           ].map((img, i) => (
             <div key={i} className={`w-32 h-32 sm:w-48 sm:h-48 rounded-[32px] overflow-hidden border-4 border-white/10 ${i % 2 === 1 ? 'translate-y-8' : ''}`}>
               <img src={img} className="w-full h-full object-cover" />
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
