import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  ListOrdered, 
  Plus, 
  DollarSign, 
  ShoppingBag,
  Loader2,
  Trash2,
  Edit,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  TrendingUp,
  RefreshCw,
  Ticket,
  Calendar
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

const AdminDashboard = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'stats' | 'products' | 'orders' | 'coupons'>(
    location.state?.activeTab || 'stats'
  );
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalSales: 0, totalOrders: 0, totalProducts: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [formCategory, setFormCategory] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [showExpiryCalendar, setShowExpiryCalendar] = useState(false);

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // 'YYYY-MM-DD'

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchData();
    }
  }, []);

  useEffect(() => {
    if (location.state?.editProductId && products.length > 0) {
      const productToEdit = products.find(p => (p.id || p._id) === location.state.editProductId);
      if (productToEdit) {
        setEditingProduct(productToEdit);
        setImageUrls(productToEdit.images || ['']);
        setIsModalOpen(true);
      }
    }
  }, [location.state, products]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, orderRes, statsRes, couponRes] = await Promise.all([
        api.get('/products/'),
        api.get('/orders/'),
        api.get('/orders/stats'),
        api.get('/coupons/')
      ]);
      setProducts(prodRes.data);
      setOrders(orderRes.data);
      setChartData(statsRes.data);
      setCoupons(couponRes.data);
      
      const totalSales = orderRes.data
        .filter((o: any) => o.payment_status === 'paid')
        .reduce((acc: number, o: any) => acc + o.total_amount, 0);
      
      setStats({
        totalSales,
        totalOrders: orderRes.data.length,
        totalProducts: prodRes.data.length,
        categoryStats: prodRes.data.reduce((acc: any, p: any) => {
          const cat = p.category || 'Other';
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {})
      });
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    const couponData = {
      code: formData.get('code'),
      discount_type: formData.get('discount_type'),
      discount_value: Number(formData.get('discount_value')),
      min_purchase_amount: Number(formData.get('min_purchase_amount')),
      expiry_date: new Date(formData.get('expiry_date') as string).toISOString(),
      usage_limit: formData.get('usage_limit') ? Number(formData.get('usage_limit')) : null,
      product_id: formData.get('product_id') || null,
    };

    try {
      await api.post('/coupons/', couponData);
      toast.success('Coupon created');
      setIsCouponModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create coupon');
    } finally {
      setFormLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => (p.id || p._id) !== id));
      toast.success('Product deleted');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    const category = formData.get('category') as string;
    
    const productData = {
      name: formData.get('name'),
      brand: formData.get('brand') || 'Generic',
      description: formData.get('description'),
      price: parseFloat(formData.get('price') as string),
      category: category,
      images: imageUrls.filter(url => url.trim() !== ''),
      stock: parseInt(formData.get('stock') as string),
      variants: [{
        size: formData.get('size') || undefined,
        color: formData.get('color') || 'Neutral',
        ram: formData.get('ram') || undefined,
        rom: formData.get('rom') || undefined,
        processor: formData.get('processor') || undefined,
        price: parseFloat(formData.get('price') as string),
        stock: parseInt(formData.get('stock') as string),
        sku: `SKU-${Date.now()}`
      }]
    };

    try {
      if (editingProduct) {
        const productId = editingProduct.id || editingProduct._id;
        await api.put(`/products/${productId}`, productData);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products/', productData);
        toast.success('Product added successfully');
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setImageUrls(['']); // Reset images
      fetchData();
    } catch (error) {
      toast.error('Failed to save product');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 space-y-2">
          <button
            onClick={() => setActiveTab('stats')}
            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${activeTab === 'stats' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <LayoutDashboard size={20} /> <span className="font-bold">Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${activeTab === 'products' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <Package size={20} /> <span className="font-bold">Products</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${activeTab === 'orders' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <ListOrdered size={20} /> <span className="font-bold">Orders</span>
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${activeTab === 'coupons' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <Ticket size={20} /> <span className="font-bold">Coupons</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'stats' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-extrabold text-gray-900">Dashboard Overview</h1>
                <button onClick={fetchData} className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand transition-colors">
                  <RefreshCw size={16} /> Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm group hover:border-brand transition-all">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-4 group-hover:bg-brand group-hover:text-white transition-all">
                    <DollarSign size={24} />
                  </div>
                  <p className="text-gray-500 font-medium">Total Sales</p>
                  <h3 className="text-3xl font-black text-gray-900">₹{stats.totalSales.toLocaleString()}</h3>
                  <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                    <TrendingUp size={14} /> +12% from last week
                  </p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm group hover:border-blue-500 transition-all">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all">
                    <ShoppingBag size={24} />
                  </div>
                  <p className="text-gray-500 font-medium">Total Orders</p>
                  <h3 className="text-3xl font-black text-gray-900">{stats.totalOrders}</h3>
                  <p className="text-xs text-blue-600 font-bold mt-2">Active orders this month</p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm group hover:border-purple-500 transition-all">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-4 group-hover:bg-purple-500 group-hover:text-white transition-all">
                    <Package size={24} />
                  </div>
                  <p className="text-gray-500 font-medium">Products</p>
                  <h3 className="text-3xl font-black text-gray-900">{stats.totalProducts}</h3>
                  <p className="text-xs text-purple-600 font-bold mt-2">In stock catalog</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-[400px]">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Growth (Last 7 Days)</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 12}}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 12}}
                        tickFormatter={(v) => `₹${v/1000}k`}
                      />
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#16a34a" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorRev)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Orders Bar Chart */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-[400px]">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Order Volume</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 12}}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 12}}
                      />
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        cursor={{fill: '#f8fafc'}}
                      />
                      <Bar 
                        dataKey="orders" 
                        fill="#3b82f6" 
                        radius={[6, 6, 0, 0]}
                        animationDuration={1500}
                      >
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#3b82f6' : '#93c5fd'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-[400px]">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Inventory by Category</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(stats.categoryStats || {}).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      animationDuration={1500}
                    >
                      {Object.entries(stats.categoryStats || {}).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#16a34a', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-gray-900">Products</h1>
                <button 
                  onClick={() => { 
                    setEditingProduct(null); 
                    setImageUrls(['']); 
                    setFormCategory('');
                    setIsModalOpen(true); 
                  }}
                  className="bg-brand text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-dark transition-all"
                >
                  <Plus size={20} /> Add Product
                </button>
              </div>
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 font-bold text-gray-700">Product</th>
                      <th className="px-6 py-4 font-bold text-gray-700">Brand</th>
                      <th className="px-6 py-4 font-bold text-gray-700">Category</th>
                      <th className="px-6 py-4 font-bold text-gray-700">Price</th>
                      <th className="px-6 py-4 font-bold text-gray-700">Stock</th>
                      <th className="px-6 py-4 font-bold text-gray-700 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => {
                      const productId = p.id || p._id;
                      return (
                        <tr key={productId} className="border-b hover:bg-gray-50 transition-all">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <img src={p.images?.[0] || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-lg object-cover" />
                            <span className="font-bold text-gray-900">{p.name}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{p.brand || 'Generic'}</td>
                          <td className="px-6 py-4 text-gray-600 capitalize">{p.category}</td>
                          <td className="px-6 py-4 font-bold text-brand">₹{p.price.toLocaleString()}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {p.variants?.[0]?.stock || 0}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button 
                              onClick={() => { 
                                setEditingProduct(p); 
                                setImageUrls(p.images || ['']);
                                setFormCategory(p.category || '');
                                setIsModalOpen(true); 
                              }}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit size={18} />
                            </button>
                            <button onClick={() => deleteProduct(productId)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'coupons' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-gray-900">Coupons</h1>
                <button 
                  onClick={() => {
                    setExpiryDate('');
                    setShowExpiryCalendar(false);
                    setIsCouponModalOpen(true);
                  }}
                  className="bg-brand text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-dark transition-all"
                >
                  <Plus size={20} /> Create Coupon
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-brand transition-all">
                    <div className="absolute top-0 right-0 p-3">
                      <button 
                        onClick={async () => {
                           if(window.confirm('Delete this coupon?')) {
                             await api.delete(`/coupons/${coupon.id}`);
                             toast.success('Deleted');
                             fetchData();
                           }
                        }}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                       <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand">
                          <Ticket size={20} />
                       </div>
                       <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">{coupon.code}</h3>
                    </div>
                    <div className="space-y-3">
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium">Discount</span>
                          <span className="font-bold text-brand">{coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium">Used</span>
                          <span className="font-bold text-gray-900">{coupon.used_count} / {coupon.usage_limit || '∞'}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium">Min Order</span>
                          <span className="font-bold text-gray-900">₹{coupon.min_purchase_amount}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-50">
                          <span className="text-gray-500 font-medium">Expires</span>
                          <span className="text-xs font-bold text-gray-400">{new Date(coupon.expiry_date).toLocaleDateString()}</span>
                       </div>
                    </div>
                    <div className={`mt-4 py-2 text-center rounded-xl text-[10px] font-black uppercase tracking-widest ${coupon.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                       {coupon.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                ))}
                {coupons.length === 0 && (
                  <div className="md:col-span-2 lg:col-span-3 py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                     <Ticket size={48} className="mx-auto text-gray-200 mb-3" />
                     <p className="text-gray-400 font-medium">No coupons found. Create one to start promotions!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {activeTab === 'orders' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-extrabold text-gray-900">Manage Orders</h1>
                <button onClick={fetchData} className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand transition-colors">
                  <RefreshCw size={16} /> Refresh
                </button>
              </div>

              <div className="flex gap-6 items-start">
                {/* LEFT: Orders List */}
                <div className="flex-1 space-y-4 min-w-0">
                  {/* Status Filter Tabs */}
                  <div className="flex gap-2 flex-wrap">
                    {['all', 'pending', 'processing', 'shipped', 'delivered'].map(status => {
                      const count = status === 'all' ? orders.length : orders.filter((o: any) => o.order_status === status).length;
                      return (
                        <button
                          key={status}
                          onClick={() => setOrderFilter(status)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                            orderFilter === status
                              ? 'bg-brand text-white shadow-md'
                              : 'bg-white border border-gray-200 text-gray-600 hover:border-brand hover:text-brand'
                          }`}
                        >
                          {status === 'all' ? 'All' : status} <span className="ml-1 opacity-70">({count})</span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedDate && (
                    <div className="flex items-center gap-2 text-sm text-brand font-medium bg-brand/5 px-4 py-2 rounded-xl">
                      <span>📅 Showing orders for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      <button onClick={() => setSelectedDate(null)} className="ml-auto text-gray-400 hover:text-gray-700"><X size={14} /></button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {(() => {
                      let filtered = orderFilter === 'all' ? orders : orders.filter((o: any) => o.order_status === orderFilter);
                      if (selectedDate) {
                        filtered = filtered.filter((o: any) => {
                          const d = new Date(o.created_at);
                          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                          return key === selectedDate;
                        });
                      }
                      if (filtered.length === 0) return (
                        <p className="text-center py-16 text-gray-500 bg-gray-50 rounded-3xl border border-dashed">No orders found.</p>
                      );
                      return filtered.map((order: any) => (
                        <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                          <div
                            className="p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand font-black text-xs">
                                #{order.id.slice(-4).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">₹{order.total_amount.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">{order.items?.length || 0} items · {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                order.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                                order.payment_status === 'failed' ? 'bg-red-100 text-red-600' :
                                order.payment_status === 'cod' ? 'bg-purple-100 text-purple-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {order.payment_status === 'cod' ? 'COD' : order.payment_status}
                              </span>

                              <select
                                value={order.order_status}
                                onClick={(e) => e.stopPropagation()}
                                onChange={async (e) => {
                                  e.stopPropagation();
                                  setUpdatingOrder(order.id);
                                  try {
                                    await api.put(`/orders/${order.id}`, { order_status: e.target.value });
                                    setOrders(orders.map((o: any) =>
                                      o.id === order.id ? { ...o, order_status: e.target.value } : o
                                    ));
                                    toast.success('Order status updated');
                                  } catch {
                                    toast.error('Failed to update status');
                                  } finally {
                                    setUpdatingOrder(null);
                                  }
                                }}
                                className={`text-xs font-bold px-3 py-2 rounded-xl border-2 cursor-pointer outline-none transition-all ${
                                  order.order_status === 'delivered' ? 'border-brand text-brand bg-brand/5' :
                                  order.order_status === 'shipped' ? 'border-blue-400 text-blue-600 bg-blue-50' :
                                  order.order_status === 'processing' ? 'border-orange-400 text-orange-600 bg-orange-50' :
                                  'border-gray-300 text-gray-600 bg-gray-50'
                                }`}
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>

                              {updatingOrder === order.id ? (
                                <Loader2 size={16} className="animate-spin text-brand" />
                              ) : (
                                expandedOrder === order.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />
                              )}
                            </div>
                          </div>

                          <AnimatePresence>
                            {expandedOrder === order.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden border-t border-gray-100"
                              >
                                <div className="p-5 grid md:grid-cols-2 gap-6 bg-gray-50/60">
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1"><Package size={12}/> Items Ordered</h4>
                                    <div className="space-y-2">
                                      {order.items?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
                                          {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                                          <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                                            <p className="text-xs text-gray-500">Qty: {item.quantity} · ₹{item.price?.toLocaleString()}</p>
                                          </div>
                                          <p className="font-bold text-brand text-sm flex-shrink-0">₹{(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1"><MapPin size={12}/> Shipping Address</h4>
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-1 text-sm">
                                      {order.shipping_address?.name && (
                                        <p className="font-bold text-gray-900 text-base">{order.shipping_address.name}</p>
                                      )}
                                      <p className="font-medium text-gray-900">{order.shipping_address?.street}</p>
                                      <p className="text-gray-600">{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                                      <p className="text-gray-600">{order.shipping_address?.country} - {order.shipping_address?.pincode}</p>
                                      <p className="text-gray-500 flex items-center gap-1 pt-1"><Phone size={12}/> {order.shipping_address?.phone}</p>
                                    </div>
                                    <div className="mt-3 bg-white p-4 rounded-xl border border-gray-100 space-y-2 text-sm">
                                      <div className="flex justify-between text-gray-600">
                                        <span>Payment ID</span>
                                        <span className="font-mono text-xs text-gray-500 truncate max-w-[150px]">{order.payment_id || '—'}</span>
                                      </div>
                                      <div className="flex justify-between text-gray-600">
                                        <span>Order ID</span>
                                        <span className="font-mono text-xs text-gray-500">{order.id.slice(-12)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* RIGHT: Mini Calendar */}
                <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-4">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => {
                        if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                        else setCalMonth(m => m - 1);
                      }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                    >
                      ‹
                    </button>
                    <span className="font-bold text-gray-900 text-sm">
                      {new Date(calYear, calMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => {
                        if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                        else setCalMonth(m => m + 1);
                      }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                    >
                      ›
                    </button>
                  </div>

                  {/* Day Labels */}
                  <div className="grid grid-cols-7 mb-1">
                    {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                      <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  {(() => {
                    const firstDay = new Date(calYear, calMonth, 1).getDay();
                    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                    const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

                    // Build set of dates that have orders
                    const orderDates = new Set(orders.map((o: any) => {
                      const d = new Date(o.created_at);
                      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                    }));

                    const cells = [];
                    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);
                    for (let day = 1; day <= daysInMonth; day++) {
                      const key = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                      const isToday = key === todayKey;
                      const isSelected = key === selectedDate;
                      const hasOrders = orderDates.has(key);
                      cells.push(
                        <button
                          key={key}
                          onClick={() => setSelectedDate(selectedDate === key ? null : key)}
                          className={`relative w-full aspect-square rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                            isSelected ? 'bg-brand text-white shadow-md' :
                            isToday ? 'bg-brand/10 text-brand font-bold' :
                            'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          {day}
                          {hasOrders && !isSelected && (
                            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand" />
                          )}
                          {hasOrders && isSelected && (
                            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white" />
                          )}
                        </button>
                      );
                    }
                    return <div className="grid grid-cols-7 gap-0.5">{cells}</div>;
                  })()}

                  {/* Legend */}
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Legend</p>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-2 h-2 rounded-full bg-brand inline-block" /> Has orders
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-5 h-5 rounded-xl bg-brand/10 inline-block" /> Today
                    </div>
                    {selectedDate && (
                      <button
                        onClick={() => setSelectedDate(null)}
                        className="w-full mt-2 text-xs text-red-500 hover:text-red-700 font-medium py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        ✕ Clear date filter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                <h2 className="text-2xl font-black text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSaveProduct} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Product Name</label>
                    <input 
                      name="name" 
                      defaultValue={editingProduct?.name} 
                      required 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Brand Name</label>
                    <input 
                      name="brand" 
                      defaultValue={editingProduct?.brand || 'Generic'} 
                      required 
                      placeholder="e.g. Nike, Apple, HRX"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Category</label>
                    <input 
                      name="category" 
                      list="category-options"
                      defaultValue={editingProduct?.category} 
                      onChange={(e) => setFormCategory(e.target.value)}
                      required 
                      placeholder="Select or type new category..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand outline-none bg-white"
                    />
                    <datalist id="category-options">
                      {['Electronics', 'Mobiles', 'Footwear', 'Men\'s Fashion', 'Women\'s Fashion', 'Smart Watches', 'Televisions', 'Accessories'].map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Price (₹)</label>
                    <input 
                      name="price" 
                      type="number" 
                      defaultValue={editingProduct?.price} 
                      required 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Stock Quantity</label>
                    <input 
                      name="stock" 
                      type="number" 
                      defaultValue={editingProduct?.stock || 0} 
                      required 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand outline-none"
                    />
                  </div>
                </div>

                {/* Conditional Fields based on Category */}
                {formCategory && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="p-6 bg-brand/5 rounded-2xl border border-brand/10 space-y-4 overflow-hidden"
                  >
                    <h3 className="font-bold text-brand text-sm flex items-center gap-2 uppercase tracking-wider">
                      <Package size={16} /> {formCategory} Specific Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Color is applicable to almost everything */}
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Color</label>
                        <input 
                          name="color" 
                          placeholder="e.g. Black, Silver, Blue"
                          defaultValue={editingProduct?.variants?.[0]?.color} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand outline-none bg-white"
                        />
                      </div>

                      {/* Size for Fashion/Footwear */}
                      {['footwear', 'men\'s fashion', 'women\'s fashion', 'fashion', 'clothing'].includes(formCategory.toLowerCase()) && (
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">
                            {formCategory.toLowerCase() === 'footwear' ? 'Footwear Size (UK/India)' : 'Size (S, M, L...)'}
                          </label>
                          <input 
                            name="size" 
                            placeholder={formCategory.toLowerCase() === 'footwear' ? "e.g. 7, 8, 9, 10" : "e.g. S, M, L, XL"}
                            defaultValue={editingProduct?.variants?.[0]?.size} 
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand outline-none bg-white"
                          />
                        </div>
                      )}

                      {/* Electronics Specifics */}
                      {['electronics', 'mobiles', 'televisions', 'smart watches', 'laptop'].includes(formCategory.toLowerCase()) && (
                        <>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">RAM</label>
                            <input 
                              name="ram" 
                              placeholder="e.g. 8GB, 16GB"
                              defaultValue={editingProduct?.variants?.[0]?.ram} 
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand outline-none bg-white"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">ROM / Storage</label>
                            <input 
                              name="rom" 
                              placeholder="e.g. 512GB SSD, 128GB"
                              defaultValue={editingProduct?.variants?.[0]?.rom} 
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand outline-none bg-white"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold text-gray-700">Processor</label>
                            <input 
                              name="processor" 
                              placeholder="e.g. Intel Core i5, Apple M2"
                              defaultValue={editingProduct?.variants?.[0]?.processor} 
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand outline-none bg-white"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-700">Image URLs</label>
                    <button 
                      type="button" 
                      onClick={() => setImageUrls([...imageUrls, ''])}
                      className="text-brand text-xs font-bold flex items-center gap-1 hover:underline"
                    >
                      <Plus size={14} /> Add Another
                    </button>
                  </div>
                  <div className="space-y-3">
                    {imageUrls.map((url, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          value={url} 
                          onChange={(e) => {
                            const newUrls = [...imageUrls];
                            newUrls[idx] = e.target.value;
                            setImageUrls(newUrls);
                          }}
                          required 
                          placeholder="https://..."
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand outline-none"
                        />
                        {imageUrls.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-xl"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Description</label>
                  <textarea 
                    name="description" 
                    defaultValue={editingProduct?.description} 
                    required 
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand outline-none resize-none"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 px-6 py-4 rounded-xl font-bold bg-brand text-white hover:bg-brand-dark transition-all flex items-center justify-center gap-2"
                  >
                    {formLoading ? <Loader2 className="animate-spin" size={20} /> : (editingProduct ? 'Update Product' : 'Add Product')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {isCouponModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCouponModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden" >
              <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                <h2 className="text-2xl font-black text-gray-900">Create Coupon</h2>
                <button onClick={() => setIsCouponModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveCoupon} className="p-8 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Coupon Code</label>
                  <input name="code" required placeholder="SAVE20" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand font-black uppercase" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                    <select name="discount_type" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand font-bold text-sm">
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Value</label>
                    <input name="discount_value" type="number" required placeholder="10" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Min Purchase</label>
                    <input name="min_purchase_amount" type="number" defaultValue="0" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Usage Limit</label>
                    <input name="usage_limit" type="number" placeholder="Optional" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Apply to Product (Optional)</label>
                  <select name="product_id" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand text-sm">
                    <option value="">All Products (Cart Wide)</option>
                    {products.map(p => (
                      <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 relative">
                  <label className="text-xs font-bold text-gray-500 uppercase">Expiry Date</label>
                  <div 
                    onClick={() => setShowExpiryCalendar(!showExpiryCalendar)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 cursor-pointer flex items-center justify-between hover:border-brand transition-all"
                  >
                    <span className={expiryDate ? 'text-gray-900 font-bold' : 'text-gray-400'}>
                      {expiryDate ? new Date(expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Select Expiry Date'}
                    </span>
                    <Calendar size={18} className="text-gray-400" />
                  </div>
                  <input type="hidden" name="expiry_date" value={expiryDate} required />
                  
                  <AnimatePresence>
                    {showExpiryCalendar && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <button type="button" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); } else setCalMonth(m => m-1); }} className="p-1 hover:bg-gray-100 rounded-lg">‹</button>
                          <span className="font-bold text-sm text-gray-900">{new Date(calYear, calMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                          <button type="button" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); } else setCalMonth(m => m+1); }} className="p-1 hover:bg-gray-100 rounded-lg">›</button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center mb-1">
                          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="text-[10px] font-black text-gray-400 uppercase">{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {(() => {
                            const first = new Date(calYear, calMonth, 1).getDay();
                            const total = new Date(calYear, calMonth + 1, 0).getDate();
                            const cells = [];
                            for (let i = 0; i < first; i++) cells.push(<div key={`e${i}`} />);
                            for (let d = 1; d <= total; d++) {
                              const key = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                              const isToday = key === today.toISOString().split('T')[0];
                              const isSelected = key === expiryDate;
                              cells.push(
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => { setExpiryDate(key); setShowExpiryCalendar(false); }}
                                  className={`aspect-square rounded-lg text-xs font-bold transition-all ${
                                    isSelected ? 'bg-brand text-white' :
                                    isToday ? 'bg-brand/10 text-brand' : 'hover:bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {d}
                                </button>
                              );
                            }
                            return cells;
                          })()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button type="submit" disabled={formLoading} className="w-full bg-brand text-white py-4 rounded-xl font-bold hover:bg-brand-dark transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2">
                  {formLoading ? <Loader2 className="animate-spin" /> : 'Create Coupon'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
