import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  Sparkles,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { TransactionType } from '../types';
import { getFinancialForecast } from '../geminiService';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard: React.FC<{ data: any; refresh: () => void }> = ({ data, refresh }) => {
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const approved = useMemo(() => data.transactions.filter((t: any) => t.status === 'APPROVED'), [data.transactions]);
  
  // KPI Totals
  const totalIncome = approved.filter((t: any) => t.type === TransactionType.INCOME).reduce((acc: number, t: any) => acc + t.amount, 0);
  const totalExpense = approved.filter((t: any) => t.type === TransactionType.EXPENSE).reduce((acc: number, t: any) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const lowStockItems = data.products.filter((p: any) => p.currentStock <= p.minStock);

  // Chart Data: Monthly Cash Flow
  const monthlyFlowData = useMemo(() => {
    const months: Record<string, { name: string, income: number, expense: number }> = {};
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return d.toISOString().slice(0, 7);
    }).reverse();

    last6Months.forEach(m => {
      const [year, month] = m.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('pt-BR', { month: 'short' });
      months[m] = { name: monthName.toUpperCase(), income: 0, expense: 0 };
    });

    approved.forEach((t: any) => {
      const monthKey = t.date.slice(0, 7);
      if (months[monthKey]) {
        if (t.type === TransactionType.INCOME) months[monthKey].income += t.amount;
        else months[monthKey].expense += t.amount;
      }
    });

    return Object.values(months);
  }, [approved]);

  // Chart Data: Expenses by Category
  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    approved.filter((t: any) => t.type === TransactionType.EXPENSE).forEach((t: any) => {
      cats[t.category] = (cats[t.category] || 0) + t.amount;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [approved]);

  // Chart Data: Stock Criticality
  const stockChartData = useMemo(() => {
    return data.products
      .map((p: any) => ({
        name: p.name.length > 15 ? p.name.slice(0, 12) + '...' : p.name,
        atual: p.currentStock,
        minimo: p.minStock
      }))
      .sort((a: any, b: any) => (a.atual / a.minimo) - (b.atual / b.minimo))
      .slice(0, 5);
  }, [data.products]);

  useEffect(() => {
    const fetchForecast = async () => {
      if (approved.length >= 5) {
        setLoading(true);
        try {
          const result = await getFinancialForecast(approved);
          setForecast(result);
        } catch (e) { console.error(e); }
        setLoading(false);
      }
    };
    fetchForecast();
  }, [approved]);

  const cards = [
    { label: 'Capital em Caixa', value: balance, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Receitas', value: totalIncome, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Total Despesas', value: totalExpense, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Alertas de Estoque', value: lowStockItems.length, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100', isCurrency: false },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.bg} p-3 rounded-2xl ${card.color}`}>
                <card.icon size={24} />
              </div>
              {card.isCurrency !== false && (
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${balance >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {balance >= 0 ? '+ Saudável' : '- Atenção'}
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{card.label}</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {card.isCurrency === false ? card.value : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.value)}
            </h3>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                <BarChartIcon size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Fluxo de Caixa (6 Meses)</h3>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 600 }} />
                <Bar name="Receitas" dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar name="Despesas" dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Distribution */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-orange-50 p-2 rounded-xl text-orange-600">
              <PieChartIcon size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Mix de Despesas</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 600 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Status Bar Chart */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
              <Activity size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Monitor de Estoque Crítico</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={stockChartData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} width={80} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar name="Saldo Atual" dataKey="atual" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar name="Mínimo Requerido" dataKey="minimo" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Forecast Section */}
        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles size={120} className="text-blue-400" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400">
                <Sparkles size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Projeção Inteligente (IA)</h3>
            </div>

            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                <div className="h-24 bg-slate-800/50 rounded-2xl"></div>
              </div>
            ) : forecast ? (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4 border-b border-white/5 pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <span>Mês</span>
                  <span>Receita</span>
                  <span>Despesa</span>
                </div>
                <div className="space-y-4">
                  {forecast.forecast.map((f: any, i: number) => (
                    <div key={i} className="grid grid-cols-3 gap-4 text-sm items-center">
                      <span className="font-bold text-slate-300">{f.month}</span>
                      <span className="text-emerald-400 font-black">
                        +{new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(f.revenue)}
                      </span>
                      <span className="text-rose-400 font-black">
                        -{new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(f.expense)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-5 bg-blue-500/10 rounded-2xl border border-blue-500/20 backdrop-blur-md">
                  <p className="text-xs text-blue-200 font-medium leading-relaxed italic">
                    "{forecast.forecast[0]?.insight}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                  <Activity size={32} />
                </div>
                <p className="text-slate-400 text-sm font-medium">Histórico insuficiente para previsões.</p>
                <p className="text-[10px] text-slate-600 mt-2 font-bold uppercase tracking-tighter">Mínimo de 5 transações aprovadas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;