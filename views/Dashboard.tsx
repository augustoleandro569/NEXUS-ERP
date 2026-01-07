
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, Sparkles } from 'lucide-react';
import { TransactionType } from '../types';
import { getFinancialForecast } from '../geminiService';

const Dashboard: React.FC<{ data: any; refresh: () => void }> = ({ data, refresh }) => {
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const approved = data.transactions.filter((t: any) => t.status === 'APPROVED');
  const totalIncome = approved.filter((t: any) => t.type === TransactionType.INCOME).reduce((acc: number, t: any) => acc + t.amount, 0);
  const totalExpense = approved.filter((t: any) => t.type === TransactionType.EXPENSE).reduce((acc: number, t: any) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const lowStockItems = data.products.filter((p: any) => p.currentStock <= p.minStock);

  useEffect(() => {
    const fetchForecast = async () => {
      if (approved.length > 5) {
        setLoading(true);
        try {
          const result = await getFinancialForecast(approved);
          setForecast(result);
        } catch (e) { console.error(e); }
        setLoading(false);
      }
    };
    fetchForecast();
  }, [data.transactions]);

  const cards = [
    { label: 'Saldo Atual', value: balance, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Receitas', value: totalIncome, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Despesas', value: totalExpense, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Alertas de Estoque', value: lowStockItems.length, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100', isCurrency: false },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.bg} p-3 rounded-xl ${card.color}`}>
                <card.icon size={24} />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">{card.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {card.isCurrency === false ? card.value : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.value)}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-purple-500" size={20} />
            <h3 className="text-lg font-bold">Projeção Financeira (IA)</h3>
          </div>
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-10 bg-slate-100 rounded"></div>
              <div className="h-10 bg-slate-100 rounded"></div>
            </div>
          ) : forecast ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-2 text-xs font-bold text-slate-400 uppercase">
                <span>Mês</span>
                <span>Receita Prev.</span>
                <span>Despesa Prev.</span>
              </div>
              {forecast.forecast.map((f: any, i: number) => (
                <div key={i} className="grid grid-cols-3 gap-4 text-sm py-2 items-center">
                  <span className="font-semibold text-slate-700">{f.month}</span>
                  <span className="text-green-600 font-medium">+{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.revenue)}</span>
                  <span className="text-red-600 font-medium">-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.expense)}</span>
                </div>
              ))}
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-800 font-medium italic">"{forecast.forecast[0]?.insight}"</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <p>Histórico insuficiente para previsões por IA.</p>
              <p className="text-xs mt-1">Mínimo de 5 transações aprovadas.</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <h3 className="text-lg font-bold mb-4">Críticos de Estoque</h3>
          <div className="space-y-3">
            {lowStockItems.length > 0 ? lowStockItems.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
                <div>
                  <p className="text-sm font-bold text-slate-800">{p.name}</p>
                  <p className="text-xs text-red-600">Saldo: {p.currentStock} / Mín: {p.minStock}</p>
                </div>
                <Package size={18} className="text-red-400" />
              </div>
            )) : (
              <div className="text-center py-12 text-slate-400 text-sm">
                Estoque saudável.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
