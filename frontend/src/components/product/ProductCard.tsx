import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Edit, Trash2, Heart } from 'lucide-react';
import { Button } from '../ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useWishlistStore } from '../../store/wishlistStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
}

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const { user } = useAuthStore();
  const { toggle, isWishlisted } = useWishlistStore();
  const navigate = useNavigate();

  const productId = product.id || (product as any)._id;
  const wishlisted = user ? isWishlisted(productId, user.id) : false;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: productId,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: 1
    });
    toast.success('Added to cart!');
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please login to use wishlist');
      navigate('/login');
      return;
    }

    toggle({
      id: productId,
      name: product.name,
      price: product.price,
      image: product.images[0],
      category: product.category,
    }, user.id);
    toast(wishlisted ? 'Removed from wishlist' : '❤️ Added to wishlist');
  };


  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${productId}`);
      toast.success('Product deleted');
      window.location.reload();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/admin', { state: { editProductId: productId, activeTab: 'products' } });
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
        <img
          src={product.images[0] || 'https://via.placeholder.com/400'}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 p-2"
        />

        {/* Wishlist heart — always visible top-right */}
        <button
          onClick={handleWishlist}
          className={`absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md z-10 ${
            wishlisted
              ? 'bg-red-500 text-white scale-110'
              : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white'
          }`}
        >
          <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>

        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Link to={`/product/${productId}`}>
            <Button variant="secondary" size="sm" className="rounded-full w-10 h-10 p-0">
              <Eye size={18} />
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            className="rounded-full w-10 h-10 p-0"
            onClick={handleAddToCart}
          >
            <ShoppingCart size={18} />
          </Button>

          {user?.role === 'admin' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full w-10 h-10 p-0 bg-blue-500 text-white hover:bg-blue-600"
                onClick={handleEdit}
              >
                <Edit size={18} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full w-10 h-10 p-0 bg-red-500 text-white hover:bg-red-600"
                onClick={handleDelete}
              >
                <Trash2 size={18} />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="text-xs font-medium text-brand mb-1 uppercase tracking-wider">
          {product.category}
        </div>
        <h3 className="font-semibold text-gray-900 group-hover:text-brand transition-colors truncate">
          {product.name}
        </h3>
        <p className="mt-1 text-lg font-bold text-gray-900">
          ₹{product.price.toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
}
