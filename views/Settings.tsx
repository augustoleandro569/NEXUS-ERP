import React, { useState } from 'react';
import { Plus, Power, Shield, Activity, Users, Building, Mail, UserCheck, X, Pencil, Trash2, CheckCircle, Lock, Eye, EyeOff, FileText, UserMinus } from 'lucide-react';
import { store } from '../store';
import { UserRole, User, Unit } from '../types';

const Settings: React.FC<{ data: any; refresh: () => void }> = ({ data, refresh }) => {
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'users' | 'logs'>('general');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const isAdmin = data.currentUser.role === UserRole.ADMIN;

  const [unitForm, setUnitForm] = useState({
    name: '',
    cnpj: '',
    active: true
  });

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.EMPLOYEE,
    units: [] as string[]
  });

  // Unit Management
  const openUnitModal = (unit?: Unit) => {
    if (unit) {
      setEditingUnitId(unit.id);
      setUnitForm({
        name: unit.name,
        cnpj: unit.cnpj || '',
        active: unit.active
      });
    } else {
      setEditingUnitId(null);
      setUnitForm({ name: '', cnpj: '', active: true });
    }
    setIsUnitModalOpen(true);
  };

  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitForm.name.trim()) return;
    if (editingUnitId) {
      store.updateUnit({ id: editingUnitId, ...unitForm });
    } else {
      store.addUnit(unitForm.name, unitForm.cnpj);
    }
    setIsUnitModalOpen(false);
    refresh();
  };

  const handleDeleteUnit = (id: string, name: string) => {
    if (confirm(`Excluir unidade "${name}"?`)) {
      try {
        store.deleteUnit(id);
        refresh();
      } catch (err: any) { alert(err.message); }
    }
  };

  // User Management
  const openUserModal = (user?: User) => {
    if (!isAdmin) return;
    setShowPassword(false);
    if (user) {
      setEditingUserId(user.id);
      setUserForm({
        name: user.name,
        email: user.email,
        password: user.password || '',
        role: user.role,
        units: user.units
      });
    } else {
      setEditingUserId(null);
      setUserForm({ name: '', email: '', password: '', role: UserRole.EMPLOYEE, units: [] });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (userForm.role !== UserRole.GUEST && userForm.units.length === 0) {
      alert("Atribua ao menos uma unidade para este nível de acesso.");
      return;
    }
    if (editingUserId) {
      store.updateUser({ id: editingUserId, ...userForm });
    } else {
      store.addUser(userForm);
    }
    setIsUserModalOpen(false);
    refresh();
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (!isAdmin) return;
    if (confirm(`Excluir usuário "${name}"?`)) {
      try {
        store.deleteUser(id);
        refresh();
      } catch (err: any) { alert(err.message); }
    }
  };

  const toggleUnitInForm = (unitId: string) => {
    setUserForm(prev => ({
      ...prev,
      units: prev.units.includes(unitId) 
        ? prev.units.filter(id => id !== unitId)
        : [...prev.units, unitId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
        <button 
          onClick={() => setActiveSubTab('general')}
          className={`px-6 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeSubTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Building size={18} /> Geral & Unidades
        </button>
        {isAdmin && (
          <>
            <button 
              onClick={() => setActiveSubTab('users')}
              className={`px-6 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeSubTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Users size={18} /> Gestão de Usuários
            </button>
            <button 
              onClick={() => setActiveSubTab('logs')}
              className={`px-6 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeSubTab === 'logs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Activity size={18} /> Auditoria
            </button>
          </>
        )}
      </div>

      {activeSubTab === 'general' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Unidades de Negócio</h3>
            <button onClick={() => openUnitModal()} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg">
              <Plus size={20} /> Nova Unidade
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.units.map((u: Unit) => (
              <div key={u.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Building size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{u.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{u.cnpj || 'Sem CNPJ'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openUnitModal(u)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDeleteUnit(u.id, u.name)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'users' && isAdmin && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800">Usuários & Visitantes</h3>
            <button onClick={() => openUserModal()} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg">
              <Plus size={20} /> Novo Usuário
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.users.map((user: User) => (
              <div key={user.id} className={`bg-white p-6 rounded-2xl border shadow-sm relative group transition-all ${user.role === UserRole.GUEST ? 'border-orange-100 bg-orange-50/20' : 'border-slate-100'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg uppercase ${user.role === UserRole.GUEST ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 
                          user.role === UserRole.GUEST ? 'bg-orange-100 text-orange-700 animate-pulse' : 
                          'bg-blue-100 text-blue-700'}`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openUserModal(user)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDeleteUser(user.id, user.name)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {user.role === UserRole.GUEST && (
                   <div className="mt-4 p-2 bg-orange-100/50 border border-orange-200 rounded-lg text-[10px] font-bold text-orange-700 uppercase tracking-widest text-center">
                     Visitante: Promova para liberar acesso
                   </div>
                )}
                {user.units.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-50">
                    <div className="flex flex-wrap gap-1">
                      {user.units.map((unitId: string) => (
                        <span key={unitId} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                          {data.units.find((u: any) => u.id === unitId)?.name || 'Unidade'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {isUserModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-800">Gerenciar Usuário</h3>
                  <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                <form onSubmit={handleSaveUser} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome</label>
                      <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">E-mail</label>
                      <input type="email" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Senha</label>
                      <input type="password" placeholder="Mudar senha..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nível de Acesso</label>
                      <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}>
                        <option value={UserRole.GUEST}>Visitante (Somente Boas-vindas)</option>
                        <option value={UserRole.EMPLOYEE}>Funcionário</option>
                        <option value={UserRole.MANAGER}>Gerente</option>
                        <option value={UserRole.ADMIN}>Administrador</option>
                      </select>
                    </div>
                  </div>

                  {userForm.role !== UserRole.GUEST && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Vincular Unidades</label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {data.units.map((unit: any) => (
                          <button key={unit.id} type="button" onClick={() => toggleUnitInForm(unit.id)} className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${userForm.units.includes(unit.id) ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                            <div className={`w-4 h-4 rounded border ${userForm.units.includes(unit.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`} />
                            <span className="text-xs font-bold truncate">{unit.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2">
                    <UserCheck size={20} /> Salvar Configurações
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'logs' && isAdmin && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Logs de Auditoria</h3>
          <div className="space-y-4">
            {data.logs.map((log: any) => (
              <div key={log.id} className="p-4 border-l-4 border-blue-500 bg-slate-50/50 rounded-r-xl">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{log.action}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-700 font-bold">{log.details}</p>
                <p className="text-xs text-slate-500 mt-1">Operador: <b>{data.users.find((u:any)=>u.id===log.userId)?.name || 'Sistema'}</b></p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isUnitModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-in zoom-in duration-200">
            <h3 className="text-2xl font-bold mb-6">{editingUnitId ? 'Editar Unidade' : 'Nova Unidade'}</h3>
            <form onSubmit={handleSaveUnit} className="space-y-5">
              <input type="text" placeholder="Nome da Unidade" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={unitForm.name} onChange={e => setUnitForm({...unitForm, name: e.target.value})} />
              <input type="text" placeholder="CNPJ" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={unitForm.cnpj} onChange={e => setUnitForm({...unitForm, cnpj: e.target.value})} />
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl">Salvar Unidade</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;