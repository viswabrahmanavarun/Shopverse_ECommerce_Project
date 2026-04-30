import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { ShoppingCart, Heart, ShieldCheck, Truck, RotateCcw, Loader2, Star, CheckCircle2, Edit, Trash2, X, Scale } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useState } from 'react';
import ReviewSection from '../components/product/ReviewSection';
import { useCompareStore } from '../store/compareStore';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const { user } = useAuthStore();
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}`);
      return response.data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds for "Live Count"
  });

  if (isLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-brand mx-auto mb-4" size={48} />
          <p className="text-gray-500 font-medium">Fetching product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="bg-red-50 p-8 rounded-3xl border border-red-100 text-center max-w-md">
          <CheckCircle2 className="mx-auto mb-4 text-red-400 rotate-180" size={48} />
          <h2 className="text-2xl font-black text-gray-900 mb-2">Connection Failed</h2>
          <p className="text-gray-600 mb-6">
            We couldn't reach the server. Please ensure your <strong>backend is running</strong> and your <strong>database is connected</strong>.
          </p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Retry Connection
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')} className="w-full mt-2 text-gray-500">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem({
      id: product.id || product._id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: 1,
      size: selectedSize,
      variant_sku: selectedVariant || undefined
    });
    toast.success('Successfully added to your cart!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Image Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center p-6">
            <img 
              src={product.images[activeImageIndex] || product.images[0]} 
              alt={product.name} 
              className="w-full h-full object-contain transition-all duration-300"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((img: string, idx: number) => (
              <div 
                key={idx} 
                onClick={() => setActiveImageIndex(idx)}
                className={`aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 cursor-pointer transition-all ${
                  activeImageIndex === idx ? 'border-brand' : 'border-transparent'
                }`}
              >
                <img src={img} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Info Section */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 text-brand font-bold uppercase tracking-widest text-sm mb-2">
              <Star size={16} className="fill-brand" />
              <span>Premium Choice</span>
              <span className="text-gray-300 mx-2">|</span>
              <span className="text-gray-500 lowercase font-medium">{product.category}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 mt-6">
              <span className="text-4xl font-black text-brand">₹{product.price.toLocaleString()}</span>
              <span className="text-xl text-gray-400 line-through">₹{(product.price * 1.5).toLocaleString()}</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">33% OFF</span>
            </div>
          </div>

          <p className="text-gray-600 text-lg leading-relaxed">
            {product.description}
          </p>

          {/* Dynamic Selectors based on Category */}
          <div className="space-y-6 pt-4">
            {product.category.toLowerCase() === 'electronics' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.variants?.[0]?.processor && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Processor</p>
                    <p className="font-bold text-gray-900">{product.variants[0].processor}</p>
                  </div>
                )}
                {product.variants?.[0]?.ram && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">RAM</p>
                    <p className="font-bold text-gray-900">{product.variants[0].ram}</p>
                  </div>
                )}
                {product.variants?.[0]?.rom && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Storage</p>
                    <p className="font-bold text-gray-900">{product.variants[0].rom}</p>
                  </div>
                )}
                {product.variants?.[0]?.color && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Color</p>
                    <p className="font-bold text-gray-900">{product.variants[0].color}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">Select Size</h3>
                  <button className="text-brand text-sm font-bold hover:underline">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {(product.category.toLowerCase() === 'footwear' 
                    ? ['7', '8', '9', '10', '11'] 
                    : ['S', 'M', 'L', 'XL', 'XXL']
                  ).map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-14 h-14 rounded-xl border-2 transition-all font-bold flex items-center justify-center ${
                        selectedSize === size 
                          ? 'border-brand bg-brand text-white shadow-lg shadow-brand/20' 
                          : 'border-gray-100 hover:border-gray-200 text-gray-600'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4 pt-4">
              <h3 className="font-bold text-gray-900">Select Style / Option</h3>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((v: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariant(v.sku)}
                    className={`px-6 py-3 rounded-xl border-2 transition-all font-medium ${
                      selectedVariant === v.sku 
                        ? 'border-brand bg-brand/5 text-brand shadow-sm' 
                        : 'border-gray-100 hover:border-gray-200 text-gray-600'
                    }`}
                  >
                    {v.color || v.size || v.ram || 'Option'} - ₹{v.price.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Status */}
          <div className="flex items-center gap-2 pt-2">
            {product.stock > 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-100">
                <CheckCircle2 size={14} /> In Stock ({product.stock} units)
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100">
                <X size={14} /> Out of Stock
              </div>
            )}
            {product.stock > 0 && product.stock < 5 && (
              <span className="text-xs font-bold text-orange-500 animate-pulse">Only {product.stock} left!</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button 
              size="lg" 
              className="flex-1 h-16 rounded-2xl text-lg font-black" 
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
            >
              {product.stock > 0 ? (
                <><ShoppingCart className="mr-2" /> Add to Cart</>
              ) : (
                'Out of Stock'
              )}
            </Button>

            
            {user?.role === 'admin' && (
              <>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-16 flex-1 rounded-2xl border-blue-200 text-blue-600 hover:bg-blue-50 font-bold"
                  onClick={() => navigate('/admin', { state: { editProductId: product.id || product._id, activeTab: 'products' } })}
                >
                  <Edit className="mr-2" /> Edit Product
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-16 w-16 p-0 rounded-2xl border-red-200 text-red-500 hover:bg-red-50"
                  onClick={async () => {
                    const productId = product.id || product._id;
                    if (window.confirm('Delete this product?')) {
                      await api.delete(`/products/${productId}`);
                      toast.success('Deleted');
                      navigate('/');
                    }
                  }}
                >
                  <Trash2 />
                </Button>
              </>
            )}

            <Button 
              variant="outline" 
              size="lg" 
              className="h-16 w-16 p-0 rounded-2xl border-gray-200"
              onClick={() => {
                const { add } = useCompareStore.getState();
                add({
                  id: product.id || product._id,
                  name: product.name,
                  price: product.price,
                  image: product.images[0],
                  category: product.category,
                  description: product.description,
                  variants: product.variants
                });
                toast.success('Added to comparison');
              }}
            >
              <Scale className="text-gray-400" />
            </Button>

            <Button variant="outline" size="lg" className="h-16 w-16 p-0 rounded-2xl border-gray-200">
              <Heart className="text-gray-400" />
            </Button>
          </div>

          {/* Perks */}
          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
              <Truck className="text-brand" />
              <div>
                <p className="text-sm font-bold text-gray-900">Free Delivery</p>
                <p className="text-xs text-gray-500">Orders over ₹5,000</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
              <RotateCcw className="text-brand" />
              <div>
                <p className="text-sm font-bold text-gray-900">30 Day Returns</p>
                <p className="text-xs text-gray-500">Easy exchange policy</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 p-4 rounded-2xl">
            <CheckCircle2 size={20} />
            <span>Secure Transaction & Quality Guaranteed</span>
          </div>
        </div>
      </div>

      {/* Specifications / Features */}
      <div className="mt-20 border-t border-gray-100 pt-16">
        <h2 className="text-3xl font-black text-gray-900 mb-10">Technical Specifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="text-brand" /> Performance & Durability
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-50">
                <span className="text-gray-500">Materials</span>
                <span className="font-medium text-gray-900">Eco-conscious Composite</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-50">
                <span className="text-gray-500">Warranty</span>
                <span className="font-medium text-gray-900">2 Year Global Limited</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-50">
                <span className="text-gray-500">Origin</span>
                <span className="font-medium text-gray-900">Handcrafted in Milan</span>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Star className="text-brand" /> Features
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Water Resistant', 'Shock Absorption', 'Lightweight Design', 'UV Protection', 'Ergonomic Grip', 'Sustainably Sourced'].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-600">
                  <div className="w-2 h-2 bg-brand rounded-full" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Reviews Section */}
        <ReviewSection productId={product.id || product._id} />
      </div>
    </div>
  );
};

export default ProductDetail;
