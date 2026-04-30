import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight, Home } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

const OrderSuccess = () => {
  const { id } = useParams();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-12 rounded-3xl shadow-xl text-center border border-gray-100"
      >
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle className="text-green-600" size={48} />
        </div>
        
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Order Placed!</h1>
        <p className="text-gray-600 mb-8">
          Thank you for your purchase. We've received your order and are processing it.
        </p>

        <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Order ID</p>
          <p className="text-sm font-mono text-gray-700 font-bold">#{id}</p>
        </div>

        <div className="space-y-4">
          <Link 
            to="/" 
            className="w-full py-4 bg-brand text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-dark transition-all"
          >
            <Home size={20} /> Back to Home
          </Link>
          <Link
            to="/account"
            className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all text-sm"
          >
            <Package size={20} /> Track My Order <ArrowRight size={16} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderSuccess;
