
import React from 'react';
import { FileText, Download, TrendingUp, DollarSign, Activity, Percent } from 'lucide-react';
import { TransactionType, TransactionStatus } from '../types';

const Reports: React.FC<{ data: any; refresh: () => void }> = ({ data }) => {
  const approved = data.transactions.filter((t: any) => t.status === TransactionStatus.APPROVED);

  // DRE Logic
  const totalRevenue = approved.filter((t: any) => t.type === TransactionType.INCOME).reduce((a: number, b: any) => a + b.amount, 0);
  const cogs = approved.filter((t: any) => t.category.toLowerCase().includes('estoque') && t.type === TransactionType.EXPENSE).reduce((a: number, b: any) => a + b.amount, 0);
  const grossProfit = totalRevenue - cogs;
  
  const operatingExpenses = approved.filter((t: any) => !t.category.toLowerCase().includes('estoque') && t.type === TransactionType.EXPENSE).reduce((a: number, b: any) => a + b.amount, 0);
  const ebitda = grossProfit - operatingExpenses;
  const netIncome = ebitda; // Simplified for now

  // KPI Calculations
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
  const avgTicket = approved.filter((t:any)=>t.type === TransactionType.INCOME).length > 0 ? totalRevenue / approved.filter((t:any)=>t.type === TransactionType.INCOME).length : 0;

  const dreRows = [
    { label: 'RECEITA BRUTA', value: totalRevenue, primary: true },
    { label: '(-) CMV (Custo Mercadoria)', value: -cogs },
    { label: 'LUCRO BRUTO', value: grossProfit, primary: true, sub: true },
    { label: '(-) DESPESAS OPERACIONAIS', value: -operatingExpenses },
    { label: 'EBITDA', value: ebitda, primary: true, sub: true },
    { label: 'LUCRO LÍQUIDO', value: netIncome, primary: true, highlight: true },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIBox label="Margem Bruta" value={`${grossMargin.toFixed(1)}%`} icon={Percent} color="text-blue-600" />
        <KPIBox label="Margem Líquida" value={`${netMargin.toFixed(1)}%`} icon={TrendingUp} color="text-green-600" />
        <KPIBox label="Ticket Médio" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(avgTicket)} icon={DollarSign} color="text-purple-600" />
        <KPIBox label="EBITDA" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ebitda)} icon={Activity} color="text-orange-600" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="text-slate-400" size={20} />
            <h3 className="text-lg font-bold">DRE - Demonstrativo de Resultado</h3>
          </div>
          <button className="text-sm font-semibold text-blue-600 flex items-center gap-1 hover:underline">
            <Download size={14} /> Exportar PDF
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {dreRows.map((row, i) => (
              <div 
                key={i} 
                className={`flex items-center justify-between py-3 px-4 rounded-xl ${
                  row.highlight ? 'bg-blue-600 text-white' : 
                  row.primary ? 'bg-slate-50 font-bold' : 
                  'text-slate-600'
                } ${row.sub ? 'pl-8' : ''}`}
              >
                <span className="text-sm">{row.label}</span>
                <span className="font-mono">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const KPIBox = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
    <div className={`${color} mb-2`}><Icon size={20} /></div>
    <p className="text-slate-500 text-xs font-bold uppercase">{label}</p>
    <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
  </div>
);

export default Reports;
