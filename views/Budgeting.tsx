
import React, { useState } from 'react';
import { Target, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';
import { store } from '../store';
import { TransactionType, TransactionStatus } from '../types';

const Budgeting: React.FC<{ data: any; refresh: () => void }> = ({ data, refresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    unitId: data.units[0]?.id || '',
    category: '',
    month: new Date().toISOString().slice(0, 7),
    amount: ''
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    store.setBudget({
      ...formData,
      amount: parseFloat(formData.amount)
    });
    setIsModalOpen(false);
    refresh();
  };

  const budgets = data.budgets.map((b: any) => {
    const realized = data.transactions
      .filter((t: any) => 
        t.status === TransactionStatus.APPROVED &&
        t.type === TransactionType.EXPENSE &&
        t.unitId === b.unitId &&
        t.category === b.category &&
        t.date.startsWith(b.month)
      )
      .reduce((acc: number, t: any) => acc + t.amount, 0);
    
    return { ...b, realized };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Orçamentos</h2>
        <button onClick={()=>setIsModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold">
          <Target size={18} /> Definir Meta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((b: any) => {
          const percent = (b.realized / b.amount) * 100;
          const isOver = b.realized > b.amount;

          return (
            <div key={b.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-slate-800">{b.category}</h4>
                  <p className="text-xs text-slate-500">{data.units.find((u:any)=>u.id===b.unitId)?.name} • {b.month}</p>
                </div>
                {isOver ? <AlertCircle className="text-red-500" /> : <CheckCircle className="text-green-500" />}
              </div>
              
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-xs font-bold uppercase text-slate-400">
                  <span>Realizado</span>
                  <span>Orçamento</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className={isOver ? 'text-red-600' : 'text-slate-900'}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(b.realized)}
                  </span>
                  <span className="text-slate-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(b.amount)}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${isOver ? 'bg-red-500' : percent > 80 ? 'bg-orange-400' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
                <p className={`text-[10px] font-bold text-right uppercase ${isOver ? 'text-red-500' : 'text-slate-400'}`}>
                  {percent.toFixed(1)}% do orçamento
                </p>
              </div>
            </div>
          );
        })}
        {budgets.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            Nenhum orçamento definido. Comece criando uma meta.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Configurar Orçamento</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unidade</label>
                <select value={formData.unitId} onChange={e=>setFormData({...formData, unitId: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {data.units.map((u:any)=><option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria de Despesa</label>
                <input type="text" required placeholder="Ex: Marketing, Aluguel..." value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mês/Ano</label>
                  <input type="month" required value={formData.month} onChange={e=>setFormData({...formData, month: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Limite (R$)</label>
                  <input type="number" required step="0.01" value={formData.amount} onChange={e=>setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={()=>setIsModalOpen(false)} className="px-4 py-2 text-slate-500 font-medium">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-md">Definir</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgeting;
