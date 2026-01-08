import React from 'react';
import { Coffee, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { User } from '../types';

const Welcome: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-blue-50">
        <Coffee size={48} />
      </div>
      
      <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
        Olá, {user.name}! 👋
      </h1>
      
      <p className="text-slate-500 max-w-md text-lg font-medium leading-relaxed mb-12">
        Seja muito bem-vindo ao <span className="text-blue-600 font-bold">Nexus ERP</span>. 
        Sua conta foi criada com sucesso, mas você ainda não possui permissões para visualizar os dados financeiros.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="bg-orange-50 text-orange-600 w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Clock size={20} />
          </div>
          <h3 className="font-bold text-slate-800 mb-2">Aguardando</h3>
          <p className="text-xs text-slate-400">Um administrador está revisando sua solicitação de acesso.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={20} />
          </div>
          <h3 className="font-bold text-slate-800 mb-2">Segurança</h3>
          <p className="text-xs text-slate-400">Seus dados estão protegidos seguindo protocolos corporativos.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="bg-green-50 text-green-600 w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={20} />
          </div>
          <h3 className="font-bold text-slate-800 mb-2">Próximos Passos</h3>
          <p className="text-xs text-slate-400">Assim que aprovado, suas unidades de negócio aparecerão aqui.</p>
        </div>
      </div>

      <div className="mt-12 p-4 bg-blue-600 text-white rounded-2xl font-bold text-sm flex items-center gap-3 shadow-lg">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        Status: Cadastro Pendente de Configuração
      </div>
    </div>
  );
};

export default Welcome;