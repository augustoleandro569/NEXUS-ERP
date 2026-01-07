
import React, { useState } from 'react';
import { Plus, Power, Shield, Activity, Users, Building, Mail, UserCheck, X, Pencil, Trash2, CheckCircle, Lock, Eye, EyeOff, FileText } from 'lucide-react';
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
    // Fix: Replaced UserRole.USER with UserRole.EMPLOYEE
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
      store.updateUnit({
        id: editingUnitId,
        ...unitForm
      });
    } else {
      // Fix: updated addUnit call to include cnpj and removed invalid store.save() logic
      store.addUnit(unitForm.name, unitForm.cnpj);
    }

    setIsUnitModalOpen(false);
    refresh();
  };

  const handleDeleteUnit = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir a unidade "${name}"? Esta ação removerá a unidade do sistema e de todos os usuários vinculados. Se houver transações vinculadas, a exclusão será bloqueada.`)) {
      try {
        // Fix: calling missing deleteUnit method
        store.deleteUnit(id);
        refresh();
      } catch (err: any) {
        alert(err.message);
      }
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
      // Fix: Replaced UserRole.USER with UserRole.EMPLOYEE
      setUserForm({ name: '', email: '', password: '', role: UserRole.EMPLOYEE, units: [] });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (userForm.units.length === 0) {
      alert("Selecione ao menos uma unidade para o usuário.");
      return;
    }

    if (editingUserId) {
      // Fix: calling missing updateUser method
      store.updateUser({
        id: editingUserId,
        ...userForm
      });
    } else {
      // Fix: calling missing addUser method
      store.addUser(userForm);
    }

    setIsUserModalOpen(false);
    refresh();
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (!isAdmin) return;
    if (confirm(`Tem certeza que deseja excluir o usuário "${name}"? Esta ação é irreversível.`)) {
      try {
        // Fix: calling missing deleteUser method
        store.deleteUser(id);
        refresh();
      } catch (err: any) {
        alert(err.message);
      }
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
              <Activity size={18} /> Logs de Auditoria
            </button>
          </>
        )}
      </div>

      {activeSubTab === 'general' && (
        <div className="animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Unidades de Negócio</h3>
              <p className="text-sm text-slate-500">Cadastre e gerencie as unidades da sua empresa.</p>
            </div>
            <button 
              onClick={() => openUnitModal()}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-blue-700 transition-all shadow-lg"
            >
              <Plus size={20} /> Nova Unidade
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.units.map((u: Unit) => (
              <div key={u.id} className={`bg-white p-6 rounded-2xl border shadow-sm transition-all flex flex-col justify-between ${u.active ? 'border-slate-100' : 'border-slate-200 bg-slate-50/50 grayscale'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${u.active ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                      <Building size={20} />
                    </div>
                    <div>
                      <h4 className={`font-bold ${u.active ? 'text-slate-900' : 'text-slate-500 line-through'}`}>{u.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{u.cnpj || 'Sem CNPJ'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => openUnitModal(u)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteUnit(u.id, u.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${u.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                    {u.active ? 'Ativa' : 'Inativa'}
                  </span>
                  <button 
                    onClick={() => { store.toggleUnit(u.id); refresh(); }}
                    className={`flex items-center gap-1.5 text-xs font-bold transition-all ${u.active ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'}`}
                  >
                    <Power size={14} />
                    {u.active ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {isUnitModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <div className="bg-white rounded-3xl w-full max-md shadow-2xl p-8 animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-800">{editingUnitId ? 'Editar Unidade' : 'Nova Unidade'}</h3>
                  <button onClick={() => setIsUnitModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                <form onSubmit={handleSaveUnit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome da Unidade</label>
                    <input 
                      type="text" required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                      value={unitForm.name}
                      onChange={e => setUnitForm({...unitForm, name: e.target.value})}
                      placeholder="Ex: Matriz São Paulo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">CNPJ (Opcional)</label>
                    <div className="relative">
                       <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input 
                        type="text"
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                        value={unitForm.cnpj}
                        onChange={e => setUnitForm({...unitForm, cnpj: e.target.value})}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                    <CheckCircle size={20} /> {editingUnitId ? 'Salvar Alterações' : 'Criar Unidade'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'users' && isAdmin && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Usuários Cadastrados</h3>
              <p className="text-sm text-slate-500">Gerencie perfis e permissões de acesso por unidade.</p>
            </div>
            <button 
              onClick={() => openUserModal()}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-blue-700 transition-all shadow-lg"
            >
              <Plus size={20} /> Novo Usuário
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.users.map((user: User) => (
              <div key={user.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative group hover:border-blue-200 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg uppercase">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 truncate"><Mail size={12} /> {user.email}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => openUserModal(user)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Unidades Acessíveis</p>
                  <div className="flex flex-wrap gap-1">
                    {user.units.map((unitId: string) => (
                      <span key={unitId} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                        {data.units.find((u: any) => u.id === unitId)?.name || 'Unidade'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isUserModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-800">{editingUserId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                  <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                <form onSubmit={handleSaveUser} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome Completo</label>
                      <input 
                        type="text" required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                        value={userForm.name}
                        onChange={e => setUserForm({...userForm, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">E-mail</label>
                      <input 
                        type="email" required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                        value={userForm.email}
                        onChange={e => setUserForm({...userForm, email: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Senha</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type={showPassword ? "text" : "password"}
                          required={!editingUserId}
                          placeholder={editingUserId ? "Deixe em branco para manter" : "Senha de acesso"}
                          className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                          value={userForm.password}
                          onChange={e => setUserForm({...userForm, password: e.target.value})}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Perfil</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                        value={userForm.role}
                        onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}
                      >
                        <option value={UserRole.EMPLOYEE}>Funcionário</option>
                        <option value={UserRole.MANAGER}>Gerente</option>
                        <option value={UserRole.ADMIN}>Administrador</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Unidades Autorizadas</label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-2">
                      {data.units.map((unit: any) => (
                        <button
                          key={unit.id}
                          type="button"
                          onClick={() => toggleUnitInForm(unit.id)}
                          className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${userForm.units.includes(unit.id) ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center ${userForm.units.includes(unit.id) ? 'bg-blue-600 text-white' : 'bg-white border-slate-300'}`}>
                            {userForm.units.includes(unit.id) && <CheckCircle size={12} />}
                          </div>
                          <span className="text-xs font-bold truncate">{unit.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                    <UserCheck size={20} /> {editingUserId ? 'Salvar Alterações' : 'Criar Usuário'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'logs' && isAdmin && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-slate-400" size={20} />
            <h3 className="text-lg font-bold">Logs de Auditoria</h3>
          </div>
          <div className="overflow-y-auto max-h-[600px] pr-2 space-y-4">
            {data.logs.map((log: any) => (
              <div key={log.id} className="p-4 border-l-4 border-blue-500 bg-slate-50/50 rounded-r-xl transition-all hover:bg-slate-100">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{log.action}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-700 font-bold">{log.details}</p>
                <p className="text-xs text-slate-500 mt-1">Operador: <b>{data.users.find((u:any)=>u.id===log.userId)?.name || 'Sistema'}</b></p>
              </div>
            ))}
            {data.logs.length === 0 && (
              <div className="text-center py-24 text-slate-300 italic">Nenhum log registrado.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
