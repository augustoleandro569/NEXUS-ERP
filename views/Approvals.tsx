
import React, { useState } from 'react';
import { Check, X, ShieldAlert, MessageSquare } from 'lucide-react';
import { store } from '../store';
import { TransactionStatus } from '../types';

const Approvals: React.FC<{ data: any; refresh: () => void }> = ({ data, refresh }) => {
  const pending = data.transactions.filter((t: any) => t.status === TransactionStatus.PENDING);
  const [comment, setComment] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    store.approveTransaction(id, comment || 'Aprovado pelo gestor');
    setSelectedId(null);
    setComment('');
    refresh();
  };

  const handleReject = (id: string) => {
    store.rejectTransaction(id, comment || 'Reprovado pelo gestor');
    setSelectedId(null);
    setComment('');
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800">
        <ShieldAlert size={20} className="shrink-0" />
        <div>
          <p className="text-sm font-bold">Centro de Governança</p>
          <p className="text-xs">Existem {pending.length} itens aguardando sua revisão estratégica.</p>
        </div>
      </div>

      <div className="space-y-4">
        {pending.map((item: any) => (
          <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {item.type}
                  </span>
                  <span className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString()}</span>
                </div>
                <h4 className="text-lg font-bold text-slate-800">{item.description}</h4>
                <div className="flex gap-4 mt-2 text-sm text-slate-500">
                  <span>Categoria: <b>{item.category}</b></span>
                  <span>Unidade: <b>{data.units.find((u:any)=>u.id===item.unitId)?.name}</b></span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900 mb-4">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                </p>
                
                {selectedId === item.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                      <MessageSquare size={16} className="text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Motivo (opcional)..." 
                        className="bg-transparent text-sm outline-none w-full"
                        value={comment}
                        onChange={e=>setComment(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={()=>setSelectedId(null)} className="px-4 py-2 text-sm text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Cancelar</button>
                      <button onClick={()=>handleReject(item.id)} className="px-4 py-2 text-sm bg-red-50 text-red-600 font-bold hover:bg-red-100 rounded-lg flex items-center gap-2 border border-red-200"><X size={16} /> Reprovar</button>
                      <button onClick={()=>handleApprove(item.id)} className="px-4 py-2 text-sm bg-green-600 text-white font-bold hover:bg-green-700 rounded-lg flex items-center gap-2 shadow-md"><Check size={16} /> Aprovar</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={()=>setSelectedId(item.id)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md"
                  >
                    Revisar Item
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {pending.length === 0 && (
          <div className="text-center py-24 text-slate-400 italic bg-white rounded-2xl border border-slate-100">
            Tudo em ordem! Nenhuma pendência encontrada.
          </div>
        )}
      </div>
    </div>
  );
};

export default Approvals;
