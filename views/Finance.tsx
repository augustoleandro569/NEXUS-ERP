
import React, { useState } from 'react';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownLeft, FileText, X, Paperclip, Upload, Eye, CheckCircle2 } from 'lucide-react';
import { store } from '../store';
import { TransactionType, TransactionStatus } from '../types';

const Finance: React.FC<{ data: any; refresh: () => void }> = ({ data, refresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [formData, setFormData] = useState({
    type: TransactionType.EXPENSE,
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    unitId: data.units[0]?.id || '',
    paymentMethod: 'Pix',
    attachmentUrl: ''
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, attachmentUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    store.addTransaction({
      ...formData,
      amount: parseFloat(formData.amount),
      createdBy: data.currentUser.id
    });
    setFormData({
      type: TransactionType.EXPENSE,
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      unitId: data.units[0]?.id || '',
      paymentMethod: 'Pix',
      attachmentUrl: ''
    });
    setIsModalOpen(false);
    refresh();
  };

  const transactions = data.transactions.filter((t: any) => 
    filterType === 'ALL' || t.type === filterType
  );

  const openAttachment = (url: string) => {
    const newWindow = window.open();
    if (newWindow) {
      if (url.startsWith('data:application/pdf')) {
        newWindow.document.write(`<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      } else {
        newWindow.document.write(`<img src="${url}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;"/>`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Financeiro</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg active:scale-95"
        >
          <Plus size={20} /> Novo Lançamento
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 overflow-x-auto bg-slate-50/30">
          {['ALL', TransactionType.INCOME, TransactionType.EXPENSE].map((type) => (
            <button 
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                filterType === type 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-white hover:shadow-sm'
              }`}
            >
              {type === 'ALL' ? 'Todos' : type === TransactionType.INCOME ? 'Entradas' : 'Saídas'}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Descrição / Categoria</th>
                <th className="px-6 py-4">Unidade</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-center">Doc</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {transactions.map((t: any) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-500">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{t.description}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500">
                      {data.units.find((u: any) => u.id === t.unitId)?.name}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {t.attachmentUrl ? (
                      <button 
                        onClick={() => openAttachment(t.attachmentUrl)}
                        className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg transition-all"
                        title="Ver Comprovante"
                      >
                        <Paperclip size={18} />
                      </button>
                    ) : (
                      <span className="text-slate-200">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                      t.status === TransactionStatus.APPROVED ? 'bg-green-50 text-green-700 border-green-100' : 
                      t.status === TransactionStatus.PENDING ? 'bg-orange-50 text-orange-700 border-orange-100' : 
                      'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center text-slate-400 italic">Nenhum lançamento encontrado para este filtro.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 overflow-y-auto max-h-[90vh] animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl text-white">
                  <FileText size={20} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Novo Lançamento</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fluxo</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    <option value={TransactionType.INCOME}>Receita (+)</option>
                    <option value={TransactionType.EXPENSE}>Despesa (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Valor Total</label>
                  <input 
                    type="number" step="0.01" required
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    placeholder="R$ 0,00"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descrição da Operação</label>
                <input 
                  type="text" required
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Ex: Pagamento Fornecedor XYZ"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Categoria</label>
                  <input 
                    type="text" required
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    placeholder="Ex: Aluguel"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data</label>
                  <input 
                    type="date" required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Unidade Responsável</label>
                <select 
                  value={formData.unitId}
                  onChange={e => setFormData({...formData, unitId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {data.units.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Comprovante (PDF ou Imagem)</label>
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${formData.attachmentUrl ? 'bg-blue-50 border-blue-400' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}`}>
                  {formData.attachmentUrl ? (
                    <div className="flex flex-col items-center gap-1">
                      <CheckCircle2 className="w-8 h-8 text-blue-500" />
                      <p className="text-xs text-blue-600 font-bold">Arquivo pronto!</p>
                      <button type="button" onClick={(e) => { e.preventDefault(); setFormData({...formData, attachmentUrl: ''}); }} className="text-[10px] text-red-500 hover:underline">Remover</button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Clique para anexar</p>
                      <p className="text-[10px] text-slate-400 mt-1">Sugerido: Comprovante de Transferência</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileUpload} />
                </label>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-95"
              >
                Efetivar Lançamento
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
