
import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  ArrowUpDown, 
  X, 
  Upload, 
  Search, 
  Building2, 
  List, 
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { store } from '../store';
import { MovementType, Product, UserRole } from '../types';

const Inventory: React.FC<{ data: any; refresh: () => void }> = ({ data, refresh }) => {
  const [activeSubTab, setActiveSubTab] = useState<'stock' | 'catalog'>('stock');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>(data.currentUser?.units[0] || data.units[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');

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

  const isAdminOrManager = data.currentUser.role === UserRole.ADMIN || data.currentUser.role === UserRole.MANAGER;
  const isEmployee = data.currentUser.role === UserRole.EMPLOYEE;
  const userUnits = data.units.filter((u: any) => data.currentUser.units.includes(u.id));

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
      const product = data.products.find((p: any) => p.id === selectedProductId);
      store.addMovement({
        productId: selectedProductId,
        type: movementForm.type,
        quantity: movementForm.quantity,
        reason: movementForm.reason,
        date: new Date().toISOString().split('T')[0],
        unitId: product?.unitId || ''
      }, movementForm.linkToFinance);
      setIsMovementModalOpen(false);
      setMovementForm({ type: MovementType.IN, quantity: 1, reason: '', linkToFinance: true });
      refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredProducts = data.products.filter((p: Product) => {
    const matchesUnit = activeSubTab === 'stock' ? p.unitId === selectedUnitFilter : true;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesUnit && matchesSearch;
  });

  const selectedProduct = data.products.find((p: any) => p.id === selectedProductId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
          <button 
            onClick={() => { setActiveSubTab('stock'); setSearchTerm(''); }}
            className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeSubTab === 'stock' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Building2 size={18} /> Estoque por Unidade
          </button>
          {!isEmployee && (
            <button 
              onClick={() => { setActiveSubTab('catalog'); setSearchTerm(''); }}
              className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeSubTab === 'catalog' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List size={18} /> Catálogo de Produtos
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm w-full focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          {activeSubTab === 'catalog' && isAdminOrManager && (
            <button 
              onClick={() => setIsProductModalOpen(true)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-md"
            >
              <Plus size={18} /> Novo Produto
            </button>
          )}
        </div>
      </div>

      {activeSubTab === 'stock' ? (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {userUnits.map((u: any) => (
              <button
                key={u.id}
                onClick={() => setSelectedUnitFilter(u.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedUnitFilter === u.id ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                {u.name}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Produto</th>
                    <th className="px-6 py-4 text-center">Saldo Atual</th>
                    <th className="px-6 py-4 text-center">Mínimo</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {filteredProducts.map((p: Product) => (
                    <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200 shrink-0 shadow-sm">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={24} strokeWidth={1.5} />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 leading-tight">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{p.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xl font-bold ${p.currentStock <= p.minStock ? 'text-red-500' : 'text-slate-900'}`}>
                          {p.currentStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-400 font-bold">{p.minStock}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          {p.currentStock <= p.minStock ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-600 border border-red-100">
                              <AlertTriangle size={12} /> Estoque Baixo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-green-50 text-green-600 border border-green-100">
                              <CheckCircle2 size={12} /> Disponível
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => { setSelectedProductId(p.id); setIsMovementModalOpen(true); }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-2 ml-auto shadow-sm"
                        >
                          <ArrowUpDown size={14} /> Movimentar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4 text-center">SKU</th>
                  <th className="px-6 py-4 text-center">Unidade Padrão</th>
                  <th className="px-6 py-4 text-right">Custo de Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filteredProducts.map((p: Product) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                          {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Package size={20} className="text-slate-400" />}
                        </div>
                        <span className="font-bold text-slate-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-xs font-bold text-slate-500">{p.sku}</td>
                    <td className="px-6 py-4 text-center text-slate-600 font-medium">
                      {data.units.find((u: any) => u.id === p.unitId)?.name}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-700">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.costPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isMovementModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                  <ArrowUpDown size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Movimentar Estoque</h3>
              </div>
              <button onClick={() => setIsMovementModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
            </div>
            
            <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Produto Selecionado</p>
              <h4 className="font-bold text-slate-800">{selectedProduct?.name}</h4>
              <p className="text-xs text-slate-500">Saldo Atual: <span className="font-bold">{selectedProduct?.currentStock}</span> unidades</p>
            </div>

            <form onSubmit={handleAddMovement} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setMovementForm({...movementForm, type: MovementType.IN})}
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${movementForm.type === MovementType.IN ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' : 'bg-white border-slate-100 text-slate-400'}`}
                >
                  <ArrowUpCircle size={18} /> <span className="font-bold text-sm">Entrada</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMovementForm({...movementForm, type: MovementType.OUT})}
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${movementForm.type === MovementType.OUT ? 'bg-red-50 border-red-500 text-red-700 shadow-sm' : 'bg-white border-slate-100 text-slate-400'}`}
                >
                  <ArrowDownCircle size={18} /> <span className="font-bold text-sm">Saída</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Quantidade</label>
                <input 
                  type="number" min="1" required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  value={movementForm.quantity}
                  onChange={e => setMovementForm({...movementForm, quantity: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Motivo / Descrição</label>
                <textarea 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm h-24 resize-none"
                  placeholder="Ex: Compra de mercadoria, venda para cliente..."
                  value={movementForm.reason}
                  onChange={e => setMovementForm({...movementForm, reason: e.target.value})}
                />
              </div>

              <div className="flex items-center gap-2 px-1">
                <input 
                  type="checkbox" 
                  id="linkFinance"
                  checked={movementForm.linkToFinance}
                  onChange={e => setMovementForm({...movementForm, linkToFinance: e.target.checked})}
                  className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="linkFinance" className="text-sm font-bold text-slate-600 cursor-pointer select-none">Vincular ao Financeiro</label>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                Confirmar Movimentação
              </button>
            </form>
          </div>
        </div>
      )}

      {isProductModalOpen && isAdminOrManager && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl text-white">
                  <Package size={20} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Cadastrar Novo Produto</h3>
              </div>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={28} /></button>
            </div>
            
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome do Produto</label>
                  <input 
                    type="text" required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Teclado Mecânico RGB"
                    value={productForm.name}
                    onChange={e => setProductForm({...productForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">SKU / Código</label>
                  <input 
                    type="text" required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="TEC-RGB-001"
                    value={productForm.sku}
                    onChange={e => setProductForm({...productForm, sku: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Estoque Mínimo</label>
                    <input 
                      type="number" required min="0"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                      value={productForm.minStock}
                      onChange={e => setProductForm({...productForm, minStock: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Estoque Inicial</label>
                    <input 
                      type="number" required min="0"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                      value={productForm.currentStock}
                      onChange={e => setProductForm({...productForm, currentStock: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Preço de Custo (Médio)</label>
                  <input 
                    type="number" required step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="R$ 0,00"
                    value={productForm.costPrice}
                    onChange={e => setProductForm({...productForm, costPrice: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Unidade Destino</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                    value={productForm.unitId}
                    onChange={e => setProductForm({...productForm, unitId: e.target.value})}
                  >
                    {data.units.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Imagem do Produto</label>
                  <label className="flex items-center justify-center gap-3 w-full px-4 py-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all group">
                    {productForm.imageUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={productForm.imageUrl} className="h-16 w-16 object-cover rounded-lg" />
                        <span className="text-[10px] font-bold text-blue-600">Trocar Imagem</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="text-slate-400 group-hover:text-blue-500" />
                        <span className="text-sm font-medium text-slate-500">Clique para enviar</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              <button type="submit" className="md:col-span-2 w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mt-4">
                Salvar Produto no Catálogo
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
