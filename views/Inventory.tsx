
import React, { useState } from 'react';
import { Package, Plus, ArrowUpDown, History, MinusCircle, PlusCircle, X, Image as ImageIcon, Upload } from 'lucide-react';
import { store } from '../store';
import { MovementType } from '../types';

const Inventory: React.FC<{ data: any; refresh: () => void }> = ({ data, refresh }) => {
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');

  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    minStock: 0,
    currentStock: 0,
    costPrice: 0,
    unitId: data.units[0]?.id || '',
    imageUrl: ''
  });

  const [movementForm, setMovementForm] = useState({
    type: MovementType.IN,
    quantity: 1,
    reason: '',
    linkToFinance: true
  });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    store.addProduct({ ...productForm });
    setProductForm({
      name: '',
      sku: '',
      minStock: 0,
      currentStock: 0,
      costPrice: 0,
      unitId: data.units[0]?.id || '',
      imageUrl: ''
    });
    setIsProductModalOpen(false);
    refresh();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMovement = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      store.addMovement({
        productId: selectedProduct,
        type: movementForm.type,
        quantity: movementForm.quantity,
        reason: movementForm.reason,
        date: new Date().toISOString().split('T')[0],
        unitId: data.products.find((p: any) => p.id === selectedProduct)?.unitId || ''
      }, movementForm.linkToFinance);
      setIsMovementModalOpen(false);
      refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Gestão de Estoque</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsProductModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-md"
          >
            <Plus size={18} /> Novo Produto
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase">
              <tr>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Unidade</th>
                <th className="px-6 py-4 text-center">Saldo</th>
                <th className="px-6 py-4 text-center">Mínimo</th>
                <th className="px-6 py-4 text-right">Custo Médio</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {data.products.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={20} />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{p.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{p.sku}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{p.sku}</td>
                  <td className="px-6 py-4 text-slate-500">{data.units.find((u: any) => u.id === p.unitId)?.name}</td>
                  <td className={`px-6 py-4 text-center font-bold ${p.currentStock <= p.minStock ? 'text-red-600' : 'text-slate-900'}`}>{p.currentStock}</td>
                  <td className="px-6 py-4 text-center text-slate-500">{p.minStock}</td>
                  <td className="px-6 py-4 text-right font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.costPrice)}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => { setSelectedProduct(p.id); setIsMovementModalOpen(true); }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Movimentar"
                    >
                      <ArrowUpDown size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {data.products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">Nenhum produto cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Cadastrar Produto</h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="space-y-5">
              <div className="flex flex-col items-center justify-center mb-4">
                <div className="relative w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group">
                  {productForm.imageUrl ? (
                    <>
                      <img src={productForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <button type="button" onClick={() => setProductForm(p => ({ ...p, imageUrl: '' }))} className="text-white p-1 bg-red-500 rounded-full">
                          <X size={14} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center">
                      <Upload size={20} className="text-slate-400 mb-1" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Foto</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Produto</label>
                  <input type="text" required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SKU / Código</label>
                  <input type="text" required value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Custo Médio (R$)</label>
                  <input type="number" step="0.01" required value={productForm.costPrice} onChange={e => setProductForm({ ...productForm, costPrice: parseFloat(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estoque Mínimo</label>
                  <input type="number" required value={productForm.minStock} onChange={e => setProductForm({ ...productForm, minStock: parseInt(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Saldo Inicial</label>
                  <input type="number" required value={productForm.currentStock} onChange={e => setProductForm({ ...productForm, currentStock: parseInt(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unidade Vinculada</label>
                  <select value={productForm.unitId} onChange={e => setProductForm({ ...productForm, unitId: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                    {data.units.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-all">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">Salvar Produto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Movimentar</h3>
              <button onClick={() => setIsMovementModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-6">
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center">
                {data.products.find((p: any) => p.id === selectedProduct)?.imageUrl ? (
                  <img src={data.products.find((p: any) => p.id === selectedProduct)?.imageUrl} className="w-full h-full object-cover" />
                ) : (
                  <Package size={20} className="text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{data.products.find((p: any) => p.id === selectedProduct)?.name}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Saldo Atual: {data.products.find((p: any) => p.id === selectedProduct)?.currentStock}</p>
              </div>
            </div>
            <form onSubmit={handleAddMovement} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                  <select value={movementForm.type} onChange={e => setMovementForm({ ...movementForm, type: e.target.value as MovementType })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                    <option value={MovementType.IN}>Entrada</option>
                    <option value={MovementType.OUT}>Saída</option>
                    <option value={MovementType.ADJUSTMENT}>Ajuste</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantidade</label>
                  <input type="number" min="1" required value={movementForm.quantity} onChange={e => setMovementForm({ ...movementForm, quantity: parseInt(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motivo / Observação</label>
                <input type="text" required placeholder="Ex: Compra de mercadoria..." value={movementForm.reason} onChange={e => setMovementForm({ ...movementForm, reason: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <input type="checkbox" id="linkFinance" checked={movementForm.linkToFinance} onChange={e => setMovementForm({ ...movementForm, linkToFinance: e.target.checked })} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                <label htmlFor="linkFinance" className="text-xs font-bold text-blue-800 cursor-pointer">Gerar lançamento financeiro automático</label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsMovementModalOpen(false)} className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-all">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
