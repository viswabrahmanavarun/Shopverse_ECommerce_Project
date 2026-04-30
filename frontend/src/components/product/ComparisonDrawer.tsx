import { motion, AnimatePresence } from 'framer-motion';
import { X, Scale, ArrowRight, ArrowLeftRight, Plus } from 'lucide-react';
import { useCompareStore } from '../../store/compareStore';
import { useState } from 'react';

export default function ComparisonDrawer({ setIsOpen }: { setIsOpen: (open: boolean) => void }) {
  const { items, remove, clear } = useCompareStore();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[95%] max-w-4xl">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden shadow-brand/20"
      >
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center text-brand">
              <Scale size={18} />
            </div>
            <span className="font-bold text-gray-900">Compare Products ({items.length}/4)</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={clear}
              className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear All
            </button>
            <button 
              onClick={() => setIsOpen(true)}
              className="bg-brand text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-dark transition-all flex items-center gap-2"
            >
              Compare Now <ArrowRight size={14} />
            </button>
          </div>
        </div>
        
        <div className="p-4 flex gap-4 overflow-x-auto no-scrollbar">
          {items.map((product) => (
            <motion.div 
              key={product.id}
              layout
              className="w-32 flex-shrink-0 relative group"
            >
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 group-hover:border-brand/50 transition-all">
                <img src={product.image} className="w-full h-full object-cover" />
              </div>
              <button 
                onClick={() => remove(product.id)}
                className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:scale-110 transition-all"
              >
                <X size={12} />
              </button>
              <p className="text-[10px] font-bold text-gray-900 mt-2 truncate px-1">{product.name}</p>
            </motion.div>
          ))}
          {[...Array(4 - items.length)].map((_, i) => (
            <div key={i} className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-200">
              <Plus size={24} />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export function ComparisonModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { items, remove } = useCompareStore();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white w-full max-w-6xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <ArrowLeftRight className="text-brand" size={32} /> Compare Products
            </h2>
            <p className="text-gray-500 font-medium mt-1">Detailed side-by-side analysis</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-200 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <div className="grid grid-cols-[150px_repeat(4,1fr)] gap-4 min-w-[800px]">
            {/* Rows */}
            <div className="contents">
              <div className="py-4 font-bold text-gray-400 uppercase text-xs tracking-widest self-center">Product</div>
              {items.map(p => (
                <div key={p.id} className="text-center p-4">
                  <div className="relative group mx-auto mb-4">
                    <img src={p.image} className="w-32 h-32 object-cover rounded-3xl mx-auto shadow-lg group-hover:scale-105 transition-all" />
                    <button onClick={() => remove(p.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={14} />
                    </button>
                  </div>
                  <h3 className="font-black text-gray-900 text-sm leading-tight">{p.name}</h3>
                </div>
              ))}
              {[...Array(4 - items.length)].map((_, i) => <div key={i} />)}
            </div>

            <div className="contents border-t">
              <div className="py-6 font-bold text-gray-400 uppercase text-xs tracking-widest self-center">Price</div>
              {items.map(p => (
                <div key={p.id} className="py-6 px-4 text-center font-black text-brand text-xl">₹{p.price.toLocaleString()}</div>
              ))}
              {[...Array(4 - items.length)].map((_, i) => <div key={i} className="py-6" />)}
            </div>

            <div className="contents border-t bg-gray-50/50">
              <div className="py-6 font-bold text-gray-400 uppercase text-xs tracking-widest self-center">Category</div>
              {items.map(p => (
                <div key={p.id} className="py-6 px-4 text-center text-sm font-bold text-gray-600 capitalize">{p.category}</div>
              ))}
              {[...Array(4 - items.length)].map((_, i) => <div key={i} className="py-6" />)}
            </div>

            <div className="contents border-t">
              <div className="py-6 font-bold text-gray-400 uppercase text-xs tracking-widest self-center">Description</div>
              {items.map(p => (
                <div key={p.id} className="py-6 px-4 text-center text-xs text-gray-500 leading-relaxed italic line-clamp-4 overflow-hidden">{p.description}</div>
              ))}
              {[...Array(4 - items.length)].map((_, i) => <div key={i} className="py-6" />)}
            </div>

            <div className="contents border-t bg-gray-50/50">
              <div className="py-6 font-bold text-gray-400 uppercase text-xs tracking-widest self-center">Specs</div>
              {items.map(p => (
                <div key={p.id} className="py-6 px-4 text-center space-y-2">
                   {p.variants?.[0]?.ram && <div className="text-[10px] bg-white border border-gray-100 p-2 rounded-lg"><span className="text-gray-400 block mb-0.5">RAM</span><span className="font-bold text-gray-900">{p.variants[0].ram}</span></div>}
                   {p.variants?.[0]?.rom && <div className="text-[10px] bg-white border border-gray-100 p-2 rounded-lg"><span className="text-gray-400 block mb-0.5">ROM</span><span className="font-bold text-gray-900">{p.variants[0].rom}</span></div>}
                   {p.variants?.[0]?.processor && <div className="text-[10px] bg-white border border-gray-100 p-2 rounded-lg"><span className="text-gray-400 block mb-0.5">Processor</span><span className="font-bold text-gray-900">{p.variants[0].processor}</span></div>}
                   {p.variants?.[0]?.size && <div className="text-[10px] bg-white border border-gray-100 p-2 rounded-lg"><span className="text-gray-400 block mb-0.5">Size</span><span className="font-bold text-gray-900">{p.variants[0].size}</span></div>}
                   {p.variants?.[0]?.color && <div className="text-[10px] bg-white border border-gray-100 p-2 rounded-lg"><span className="text-gray-400 block mb-0.5">Color</span><span className="font-bold text-gray-900">{p.variants[0].color}</span></div>}
                </div>
              ))}
              {[...Array(4 - items.length)].map((_, i) => <div key={i} className="py-6" />)}
            </div>

          </div>
        </div>
        
        <div className="p-8 bg-gray-50 border-t flex justify-center">
             <button onClick={onClose} className="px-12 py-4 bg-brand text-white rounded-2xl font-black shadow-lg shadow-brand/30 hover:scale-105 transition-all">Close Comparison</button>
        </div>
      </motion.div>
    </div>
  );
}

export function ComparisonWrapper() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <ComparisonDrawer setIsOpen={setIsModalOpen} />
      <AnimatePresence>
        {isModalOpen && <ComparisonModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
