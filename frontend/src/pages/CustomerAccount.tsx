import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, User, Heart, ChevronDown, ChevronUp,
  MapPin, Phone, RefreshCw, Truck, CheckCircle,
  Clock, ShoppingBag, Trash2, Edit2, Save, X, Plus, Home, Briefcase
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

// ─── Order Tracking Stepper ───────────────────────────────────────────────────
const ORDER_STEPS = ['processing', 'shipped', 'delivered'];
const STEP_LABELS: Record<string, string> = {
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  pending: 'Pending',
};
const STEP_ICONS: Record<string, any> = {
  processing: Clock,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: X,
  pending: Clock
};

function OrderTracker({ status }: { status: string }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 mt-3 px-4 py-3 bg-red-50 rounded-xl text-red-600 text-sm font-medium">
        <X size={16} /> Order Cancelled
      </div>
    );
  }
  const currentIdx = ORDER_STEPS.indexOf(status);
  return (
    <div className="mt-4 px-2">
      <div className="flex items-center">
        {ORDER_STEPS.map((step, idx) => {
          const Icon = STEP_ICONS[step];
          const done = idx <= currentIdx;
          const active = idx === currentIdx;
          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  done ? 'bg-brand text-white shadow-md shadow-brand/30' : 'bg-gray-100 text-gray-400'
                } ${active ? 'ring-4 ring-brand/20' : ''}`}>
                  <Icon size={16} />
                </div>
                <span className={`text-[10px] font-bold mt-1.5 ${done ? 'text-brand' : 'text-gray-400'}`}>
                  {STEP_LABELS[step]}
                </span>
              </div>
              {idx < ORDER_STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-1 mb-4 rounded-full transition-all ${
                  idx < currentIdx ? 'bg-brand' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order }: { order: any }) {
  const [expanded, setExpanded] = useState(false);

  const paymentBadge = (status: string) => {
    const map: Record<string, string> = {
      paid: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-600',
      cod: 'bg-purple-100 text-purple-700',
      pending: 'bg-yellow-100 text-yellow-700',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  return (
    <motion.div
      layout
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div
        className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center">
            <Package size={20} className="text-brand" />
          </div>
          <div>
            <p className="font-bold text-gray-900">₹{order.total_amount.toLocaleString()}</p>
            <p className="text-xs text-gray-500">
              {order.items?.length || 0} item{(order.items?.length || 0) > 1 ? 's' : ''} ·{' '}
              {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${paymentBadge(order.payment_status)}`}>
            {order.payment_status === 'cod' ? 'COD' : order.payment_status}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
            order.order_status === 'delivered' ? 'bg-brand/10 text-brand' :
            order.order_status === 'shipped' ? 'bg-blue-100 text-blue-600' :
            order.order_status === 'cancelled' ? 'bg-red-100 text-red-500' :
            'bg-orange-100 text-orange-600'
          }`}>
            {STEP_LABELS[order.order_status] || order.order_status}
          </span>
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="p-5 space-y-5">
              {/* Tracking History */}
              <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock size={12} /> Status Timeline
                </p>
                <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                  {(!order.status_history || order.status_history.length === 0) ? (
                    <div className="relative flex gap-4 items-start pl-8">
                      <div className="absolute left-0 w-6 h-6 rounded-full flex items-center justify-center z-10 bg-brand text-white shadow-lg shadow-brand/20">
                        <Clock size={12} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-brand">Order Placed</p>
                          <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">
                            {new Date(order.created_at).toLocaleString('en-IN', { 
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Your order has been received and is being processed.</p>
                      </div>
                    </div>
                  ) : (
                    order.status_history.map((update: any, idx: number) => {
                      const Icon = STEP_ICONS[update.status] || Clock;
                      const isLast = idx === (order.status_history.length - 1);
                      return (
                        <div key={idx} className="relative flex gap-4 items-start pl-8">
                          <div className={`absolute left-0 w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                            isLast ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-gray-200 text-gray-500'
                          }`}>
                            <Icon size={12} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm font-bold capitalize ${isLast ? 'text-brand' : 'text-gray-900'}`}>
                                {STEP_LABELS[update.status] || update.status}
                              </p>
                              <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">
                                {new Date(update.timestamp).toLocaleString('en-IN', { 
                                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{update.message}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Items Ordered</p>
                <div className="space-y-2">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} · ₹{item.price?.toLocaleString()} each</p>
                      </div>
                      <p className="font-bold text-brand">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <MapPin size={11} /> Delivery Address
                  </p>
                  {order.shipping_address?.name && (
                    <p className="font-bold text-gray-900">{order.shipping_address.name}</p>
                  )}
                  <p className="text-sm text-gray-700">{order.shipping_address?.street}</p>
                  <p className="text-sm text-gray-600">{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                  <p className="text-sm text-gray-600">{order.shipping_address?.country} - {order.shipping_address?.pincode}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Phone size={11} /> {order.shipping_address?.phone}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Order Summary</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span><span>₹{order.total_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span><span className="text-brand font-medium">FREE</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
                      <span>Total</span><span>₹{order.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                  {order.payment_id && (
                    <p className="text-xs text-gray-400 mt-2 font-mono truncate">ID: {order.payment_id}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CustomerAccount() {
  const { user } = useAuthStore();
  const location = useLocation();
  const { items: allItems, remove: removeFromWishlist } = useWishlistStore();
  const wishlist = user ? allItems.filter(i => i.userId === user.id) : [];
  
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'wishlist' | 'addresses'>(
    location.state?.activeTab || 'orders'
  );
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.full_name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');

  // Address State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Reset tab if location state changes
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const { data } = await api.get('/orders/me');
      setOrders(data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const fetchAddresses = useCallback(async () => {
    try {
      const { data } = await api.get('/users/addresses');
      setAddresses(data);
    } catch {
      console.error('Failed to load addresses');
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchAddresses();
  }, [fetchOrders, fetchAddresses]);

  const tabs = [
    { key: 'orders', label: 'My Orders', icon: Package, count: orders.length },
    { key: 'wishlist', label: 'Wishlist', icon: Heart, count: wishlist.length },
    { key: 'addresses', label: 'Addresses', icon: MapPin, count: addresses.length },
    { key: 'profile', label: 'Profile', icon: User, count: undefined },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-brand to-green-400 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-brand/30">
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">{user?.full_name}</h1>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-fit">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === key
                  ? 'bg-brand text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={16} />
              {label}
              {count !== undefined && count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                }`}>{count}</span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── MY ORDERS TAB ── */}
          {activeTab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">My Orders</h2>
                <button onClick={fetchOrders} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand transition-colors">
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>

              {loadingOrders ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                  <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No orders yet</p>
                  <p className="text-gray-400 text-sm mt-1">Start shopping to see your orders here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...orders].reverse().map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Profile Details</h2>
                  {!editingProfile ? (
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="flex items-center gap-2 text-sm text-brand hover:bg-brand/5 px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingProfile(false)}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <X size={14} /> Cancel
                      </button>
                      <button
                        onClick={() => { toast.success('Profile updated!'); setEditingProfile(false); }}
                        className="flex items-center gap-1.5 text-sm text-white bg-brand hover:bg-brand/90 px-3 py-1.5 rounded-lg transition-colors font-medium"
                      >
                        <Save size={14} /> Save
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                    {editingProfile ? (
                      <input
                        value={profileName}
                        onChange={e => setProfileName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-brand outline-none text-gray-900 font-medium"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">{user?.full_name}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                    {editingProfile ? (
                      <input
                        value={profileEmail}
                        onChange={e => setProfileEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-brand outline-none text-gray-900 font-medium"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">{user?.email}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account Role</label>
                    <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-700 capitalize">{user?.role}</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Orders</label>
                    <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-bold">{orders.length}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-2">
                  {[
                    { label: 'Total Spent', value: `₹${orders.reduce((a: number, o: any) => a + (o.payment_status === 'paid' ? o.total_amount : 0), 0).toLocaleString()}` },
                    { label: 'Delivered', value: orders.filter((o: any) => o.order_status === 'delivered').length },
                    { label: 'Wishlisted', value: wishlist.length },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center p-4 bg-brand/5 rounded-2xl">
                      <p className="text-2xl font-black text-brand">{value}</p>
                      <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── ADDRESSES TAB ── */}
          {activeTab === 'addresses' && (
            <motion.div key="addresses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Saved Addresses</h2>
                <button 
                  onClick={() => setShowAddressForm(true)}
                  className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-dark transition-all"
                >
                  <Plus size={16} /> Add New Address
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className={`p-5 rounded-2xl border-2 transition-all bg-white ${addr.is_default ? 'border-brand shadow-md shadow-brand/10' : 'border-gray-100'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        {addr.label?.toLowerCase() === 'home' ? <Home size={16} className="text-brand" /> : <Briefcase size={16} className="text-brand" />}
                        <span className="font-black text-gray-900 text-sm uppercase tracking-wider">{addr.label}</span>
                        {addr.is_default && <span className="bg-brand text-white text-[10px] px-2 py-0.5 rounded-full font-bold">DEFAULT</span>}
                      </div>
                      <button 
                        onClick={async () => {
                          if (window.confirm('Delete this address?')) {
                            await api.delete(`/users/addresses/${addr.id}`);
                            toast.success('Deleted');
                            fetchAddresses();
                          }
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="font-bold text-gray-900">{addr.name}</p>
                    <p className="text-sm text-gray-600 mt-1">{addr.street}</p>
                    <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5 font-medium">
                      <Phone size={12} /> {addr.phone}
                    </p>
                    {!addr.is_default && (
                      <button 
                        onClick={async () => {
                          await api.put(`/users/addresses/${addr.id}/default`);
                          toast.success('Default updated');
                          fetchAddresses();
                        }}
                        className="mt-4 text-xs font-bold text-brand hover:underline"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {addresses.length === 0 && !showAddressForm && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                  <MapPin size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No addresses saved</p>
                  <p className="text-gray-400 text-sm mt-1">Save your addresses for faster checkout</p>
                </div>
              )}

              {/* Add Address Modal */}
              <AnimatePresence>
                {showAddressForm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-black text-gray-900">Add Address</h3>
                        <button onClick={() => setShowAddressForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                          <X size={20} />
                        </button>
                      </div>

                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        setIsAddingAddress(true);
                        const fd = new FormData(e.currentTarget);
                        const data = {
                          label: fd.get('label'),
                          name: fd.get('name'),
                          street: fd.get('street'),
                          city: fd.get('city'),
                          state: fd.get('state'),
                          country: 'India',
                          pincode: fd.get('pincode'),
                          phone: fd.get('phone'),
                          is_default: addresses.length === 0
                        };
                        try {
                          await api.post('/users/addresses', data);
                          toast.success('Address added!');
                          setShowAddressForm(false);
                          fetchAddresses();
                        } catch {
                          toast.error('Failed to add address');
                        } finally {
                          setIsAddingAddress(false);
                        }
                      }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Label</label>
                            <select name="label" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand font-bold text-sm">
                              <option value="Home">Home</option>
                              <option value="Office">Office</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                            <input name="name" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand text-sm" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Street Address</label>
                          <input name="street" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">City</label>
                            <input name="city" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">State</label>
                            <input name="state" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand text-sm" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Pincode</label>
                            <input name="pincode" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                            <input name="phone" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand text-sm" />
                          </div>
                        </div>
                        <button 
                          type="submit" 
                          disabled={isAddingAddress}
                          className="w-full bg-brand text-white py-4 rounded-xl font-bold hover:bg-brand-dark transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                        >
                          {isAddingAddress ? <RefreshCw className="animate-spin" size={20} /> : 'Save Address'}
                        </button>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── WISHLIST TAB ── */}
          {activeTab === 'wishlist' && (
            <motion.div key="wishlist" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 className="text-xl font-bold text-gray-900 mb-4">My Wishlist</h2>
              {wishlist.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                  <Heart size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">Your wishlist is empty</p>
                  <p className="text-gray-400 text-sm mt-1">Tap the ♡ on any product to save it here</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {wishlist.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group"
                    >
                      <div className="relative">
                        <img src={item.image} alt={item.name} className="w-full h-40 object-cover" />
                        <button
                          onClick={() => { 
                            if (user) removeFromWishlist(item.id, user.id); 
                            toast.success('Removed from wishlist'); 
                          }}
                          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{item.category}</p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{item.name}</p>
                        <p className="text-brand font-black mt-1">₹{item.price.toLocaleString()}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
