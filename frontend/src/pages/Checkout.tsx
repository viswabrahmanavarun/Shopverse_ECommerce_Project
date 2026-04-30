import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCartStore } from '../store/cartStore';
import { motion } from 'framer-motion';
import { CreditCard, Truck, ShieldCheck, ArrowRight, Loader2, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle2, PartyPopper, Plus, Home, Briefcase } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const addressSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().min(2, 'Country is required'),
  pincode: z.string().min(6, 'Valid pincode is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
});

type AddressForm = z.infer<typeof addressSchema>;

const Checkout = () => {
  const { items, clearCart } = useCartStore();
  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'cod'>('card');
  const [upiId, setUpiId] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [selectedSavedAddress, setSelectedSavedAddress] = useState<any | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_amount: number } | null>(null);

  const { data: savedAddresses = [] } = useQuery({
    queryKey: ['saved-addresses'],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await api.get('/users/addresses');
      return data;
    },
    enabled: !!user,
  });

  const { data: activeCoupons = [] } = useQuery({
    queryKey: ['active-coupons'],
    queryFn: async () => {
      const { data } = await api.get('/coupons/active');
      return data;
    }
  });

  // Set default address if available
  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedSavedAddress && !useNewAddress) {
      const defaultAddr = savedAddresses.find((a: any) => a.is_default) || savedAddresses[0];
      setSelectedSavedAddress(defaultAddr);
    }
  }, [savedAddresses, selectedSavedAddress, useNewAddress]);

  const { register, handleSubmit, formState: { errors } } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  });

  if (items.length === 0) {
    navigate('/');
    return null;
  }

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const applyCoupon = async (codeOverride?: string) => {
    const codeToApply = codeOverride || couponCode;
    if (!codeToApply.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await api.post('/coupons/validate', {
        code: codeToApply,
        cart_total: total,
        items: items.map(i => ({ product_id: i.id, price: i.price, quantity: i.quantity }))
      });
      setAppliedCoupon(data);
      setCouponCode(codeToApply);
      toast.success('Coupon applied successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid coupon');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const finalTotal = total - (appliedCoupon?.discount_amount || 0);

  const onSubmit = async (data: AddressForm) => {
    if (paymentMethod === 'upi' && !upiId.trim()) {
      alert('Please enter your UPI ID');
      return;
    }

    setLoading(true);
    try {
      const validItems = items.filter(item => item.id);
      const shippingData = useNewAddress ? data : (selectedSavedAddress || data);
      
      const orderData = {
        items: validItems.map(item => ({
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        total_amount: finalTotal,
        discount_amount: appliedCoupon?.discount_amount || 0,
        coupon_code: appliedCoupon?.code || null,
        shipping_address: shippingData,
        payment_method: paymentMethod === 'cod' ? 'cod' : 'online'
      };

      // COD — no Razorpay, go straight to success
      if (paymentMethod === 'cod') {
        const { data: order } = await api.post('/orders/', orderData);
        setIsSuccess(true);
        setTimeout(() => {
          clearCart();
          navigate(`/order-success/${order.id}`);
        }, 3000);
        return;
      }

      // Online payment — load Razorpay
      const res = await loadRazorpay();
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        return;
      }

      const { data: order } = await api.post('/orders/', orderData);

      const prefill: any = {
        name: data.name || 'Customer',
        email: user?.email || 'customer@example.com',
        contact: data.phone,
      };

      if (paymentMethod === 'upi') {
        prefill.method = 'upi';
        prefill.vpa = upiId.trim();
      }

      const options: any = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: Math.round(order.total_amount * 100),
        currency: 'INR',
        name: 'Shopverse',
        description: 'Order Payment',
        order_id: order.payment_id,
        handler: async (response: any) => {
          try {
            await api.post(`/orders/${order.id}/verify-payment`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            setIsSuccess(true);
            setTimeout(() => {
              clearCart();
              navigate(`/order-success/${order.id}`);
            }, 3000);
          } catch (err) {
            alert('Payment verification failed');
          }
        },
        prefill,
        method: { upi: true, card: true, netbanking: true, wallet: true, paylater: true },
        theme: { color: '#16a34a' },
      };

      const paymentObject = new (window as any).Razorpay(options);

      // Mark order as failed if Razorpay payment fails mid-transaction
      paymentObject.on('payment.failed', async () => {
        try {
          await api.put(`/orders/${order.id}`, { payment_status: 'failed' });
        } catch {}
        alert('Payment failed. Please try again.');
      });

      paymentObject.open();
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative inline-block">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5, times: [0, 0.7, 1] }}
              className="w-32 h-32 bg-brand rounded-full flex items-center justify-center text-white mb-6 shadow-2xl shadow-brand/40"
            >
              <CheckCircle2 size={64} strokeWidth={3} />
            </motion.div>
            
            {/* Confetti-like bits */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 0, y: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  x: (i % 2 === 0 ? 1 : -1) * (Math.random() * 100 + 50),
                  y: (i < 3 ? 1 : -1) * (Math.random() * 100 + 50),
                  scale: [0, 1, 0]
                }}
                transition={{ duration: 1, delay: 0.2, repeat: Infinity, repeatDelay: 1 }}
                className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-brand/30"
              />
            ))}
          </div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-black text-gray-900 mb-2"
          >
            Order Placed!
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-gray-500 font-medium flex items-center justify-center gap-2"
          >
            <PartyPopper size={18} className="text-brand" />
            Celebration time! Redirecting you to details...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Shipping Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-brand/10 rounded-xl text-brand">
              <Truck size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Delivery Address</h2>
              <p className="text-gray-500">Choose where to receive your order</p>
            </div>
          </div>

          {/* Saved Addresses Selector */}
          {savedAddresses.length > 0 && !useNewAddress && (
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-1 gap-3">
                {savedAddresses.map((addr: any) => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedSavedAddress(addr)}
                    className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                      selectedSavedAddress?.id === addr.id 
                        ? 'border-brand bg-brand/5 shadow-md shadow-brand/10' 
                        : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'
                    }`}
                  >
                    <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedSavedAddress?.id === addr.id ? 'border-brand bg-brand' : 'border-gray-300 bg-white'
                    }`}>
                      {selectedSavedAddress?.id === addr.id && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {addr.label?.toLowerCase() === 'home' ? <Home size={14} className="text-brand" /> : <Briefcase size={14} className="text-brand" />}
                        <span className="font-black text-gray-900 text-xs uppercase tracking-widest">{addr.label}</span>
                      </div>
                      <p className="font-bold text-gray-900">{addr.name}</p>
                      <p className="text-sm text-gray-600 line-clamp-1">{addr.street}, {addr.city}</p>
                      <p className="text-xs text-gray-500 mt-1 font-medium">{addr.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => setUseNewAddress(true)}
                className="flex items-center gap-2 text-brand font-bold text-sm hover:underline mt-2"
              >
                <Plus size={16} /> Add a new address
              </button>
            </div>
          )}

          {/* New Address Form Toggle */}
          {useNewAddress && savedAddresses.length > 0 && (
            <button 
              onClick={() => { setUseNewAddress(false); }}
              className="flex items-center gap-2 text-brand font-bold text-sm hover:underline mb-6"
            >
              ← Back to saved addresses
            </button>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* New Address Form Fields (Only visible if using new address or no saved addresses) */}
            <div className={(!useNewAddress && savedAddresses.length > 0) ? 'hidden' : 'block space-y-6'}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input
                  {...register('name')}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all`}
                  placeholder="Your full name"
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Street Address</label>
                <input
                  {...register('street')}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.street ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all`}
                  placeholder="123 Shopping St, Area Name"
                />
                {errors.street && <p className="text-red-500 text-xs">{errors.street.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">City</label>
                  <input
                    {...register('city')}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.city ? 'border-red-500' : 'border-gray-200'} outline-none transition-all`}
                  />
                  {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">State</label>
                  <input
                    {...register('state')}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.state ? 'border-red-500' : 'border-gray-200'} outline-none transition-all`}
                  />
                  {errors.state && <p className="text-red-500 text-xs">{errors.state.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Pincode</label>
                  <input
                    {...register('pincode')}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.pincode ? 'border-red-500' : 'border-gray-200'} outline-none transition-all`}
                  />
                  {errors.pincode && <p className="text-red-500 text-xs">{errors.pincode.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Country</label>
                  <input
                    {...register('country')}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.country ? 'border-red-500' : 'border-gray-200'} outline-none transition-all`}
                  />
                  {errors.country && <p className="text-red-500 text-xs">{errors.country.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  {...register('phone')}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.phone ? 'border-red-500' : 'border-gray-200'} outline-none transition-all`}
                  placeholder="10-digit mobile number"
                />
                {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
              </div>
            </div>

            {/* Payment Method Selector (Always Visible) */}
            <div className="space-y-3 pt-4 border-t border-gray-100 mt-8">
              <label className="text-sm font-medium text-gray-700">Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    paymentMethod === 'card'
                      ? 'border-brand bg-brand/5 text-brand'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <CreditCard size={18} />
                  <div className="text-left">
                    <p className="font-bold text-[10px] leading-tight">Card / Net Banking</p>
                    <p className="text-[10px] opacity-60">All major cards</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-brand bg-brand/5 text-brand'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Smartphone size={18} />
                  <div className="text-left">
                    <p className="font-bold text-[10px] leading-tight">UPI</p>
                    <p className="text-[10px] opacity-60">GPay, PhonePe</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Truck size={18} />
                  <div className="text-left">
                    <p className="font-bold text-[10px] leading-tight">Cash on Delivery</p>
                    <p className="text-[10px] opacity-60">Pay at door</p>
                  </div>
                </button>
              </div>

              {paymentMethod === 'upi' && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-medium text-gray-700">UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                  />
                </motion.div>
              )}

              {paymentMethod === 'cod' && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3"
                >
                  <Truck size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">Cash on Delivery</p>
                    <p className="text-xs text-amber-700 mt-0.5">Pay ₹{total.toLocaleString()} in cash at delivery.</p>
                  </div>
                </motion.div>
              )}
            </div>

            <button
              type={(!useNewAddress && savedAddresses.length > 0) ? "button" : "submit"}
              onClick={(!useNewAddress && savedAddresses.length > 0) ? () => onSubmit({} as any) : undefined}
              disabled={loading}
              className="w-full bg-brand text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-dark transition-all disabled:opacity-50 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : <>
                {(!useNewAddress && savedAddresses.length > 0) ? 'Deliver to this Address' : 'Complete Purchase'} 
                <ArrowRight size={20} />
              </>}
            </button>
          </form>
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-50 p-8 rounded-2xl border border-gray-100 flex flex-col"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-brand/10 rounded-xl text-brand">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
              <p className="text-gray-500">{items.length} items to be delivered</p>
            </div>
          </div>

          <div className="flex-1 space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {items.map((item) => (
              <div key={item.cartId || item.id} className="flex gap-4 bg-white p-4 rounded-xl border border-gray-50">
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  <img src={item.image || 'https://via.placeholder.com/150'} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 line-clamp-1">{item.name}</h3>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  <p className="font-bold text-brand mt-1">₹{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Coupon Input */}
          <div className="mb-6 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <PartyPopper size={18} className="text-brand" />
              <p className="text-sm font-bold text-gray-900">Available Promotions</p>
            </div>
            
            {/* List of active coupons */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
               {activeCoupons.map((c: any) => {
                 const isApplicable = !c.product_id || items.some(i => i.id === c.product_id);
                 return (
                   <button
                     key={c.id}
                     onClick={() => applyCoupon(c.code)}
                     disabled={!isApplicable || couponLoading}
                     className={`flex-shrink-0 px-4 py-2 rounded-xl border-2 transition-all text-left ${
                       appliedCoupon?.code === c.code 
                         ? 'border-brand bg-brand/5' 
                         : isApplicable ? 'border-gray-100 hover:border-brand/30 bg-gray-50' : 'border-gray-50 opacity-40 grayscale cursor-not-allowed'
                     }`}
                   >
                     <p className="text-[10px] font-black uppercase text-brand tracking-widest">{c.code}</p>
                     <p className="text-xs font-bold text-gray-900 mt-0.5">{c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}</p>
                     {c.product_id && <p className="text-[9px] text-gray-400 mt-1">Specific Product Only</p>}
                   </button>
                 );
               })}
               {activeCoupons.length === 0 && <p className="text-xs text-gray-400 italic">No coupons available right now</p>}
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="OR ENTER CODE"
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-brand"
              />
              <button 
                onClick={() => applyCoupon()}
                disabled={couponLoading || !couponCode}
                className="px-6 py-2 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-dark transition-all disabled:opacity-50"
              >
                {couponLoading ? <Loader2 className="animate-spin" size={16} /> : 'Apply'}
              </button>
            </div>
            {appliedCoupon && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 flex items-center justify-between text-xs font-bold text-green-600 bg-green-50 p-3 rounded-xl border border-green-100"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  <span>Coupon "{appliedCoupon.code}" Applied!</span>
                </div>
                <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-red-500 hover:underline">Remove</button>
              </motion.div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Discount</span>
                <span>- ₹{appliedCoupon.discount_amount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className="text-green-600 font-medium">FREE</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-4 border-t border-dashed border-gray-300">
              <span>Total Price</span>
              <span>₹{finalTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-8 p-4 bg-brand/5 rounded-xl flex items-start gap-3">
            <CreditCard className="text-brand flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-gray-600 italic">
              "Your payment is completely secure with Razorpay encryption. No card details are stored on our servers."
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;
