import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, ChevronRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number;
  image: string;
  category: string;
}

interface FlashSaleProps {
  products: Product[];
}

export default function FlashSale({ products }: FlashSaleProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 4,
    minutes: 59,
    seconds: 59
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!products || products.length === 0) return null;

  // For demo, let's take first 5 products and give them a "fake" discount if not already present
  const saleProducts = products.slice(0, 5).map(p => ({
    ...p,
    discount: Math.round(((p.original_price - p.price) / p.original_price) * 100) || 45
  }));

  return (
    <section className="mb-12">
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-orange-500 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <Zap className="text-white fill-white" size={32} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">Flash Sale</h2>
              <p className="text-white/80 font-bold text-sm">Grab them before they're gone!</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10">
              <Clock className="text-white/70" size={20} />
              <div className="flex items-center gap-1 font-black text-2xl text-white min-w-[140px] justify-center">
                <span>{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="animate-pulse opacity-50">:</span>
                <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="animate-pulse opacity-50">:</span>
                <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
              </div>
            </div>
            <Link to="/search" className="hidden sm:flex items-center gap-2 bg-white text-red-600 px-6 py-3 rounded-2xl font-black text-sm hover:bg-gray-50 transition-colors shadow-lg">
              VIEW ALL <ChevronRight size={18} />
            </Link>
          </div>
        </div>

        <div className="p-6 overflow-x-auto no-scrollbar">
          <div className="flex gap-6 min-w-max pb-4">
            {saleProducts.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -10 }}
                className="w-[200px] group cursor-pointer"
              >
                <Link to={`/product/${product.id}`}>
                  <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-100 mb-4 shadow-sm border border-gray-50">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">
                      {product.discount}% OFF
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm truncate mb-1">{product.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-gray-900">₹{product.price.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 line-through">₹{(product.price * 1.5).toLocaleString()}</span>
                  </div>
                  <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full w-[70%]" />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 mt-1.5 uppercase tracking-widest">70% Sold Out</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
