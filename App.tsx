
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  Package, 
  BarChart3, 
  Settings, 
  LogOut, 
  X, 
  Target,
  CheckCircle2,
  Menu,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { store } from './store';
import { User, TransactionStatus, UserRole } from './types';
import Dashboard from './views/Dashboard';
import Finance from './views/Finance';
import Inventory from './views/Inventory';
import Reports from './views/Reports';
import Budgeting from './views/Budgeting';
import Approvals from './views/Approvals';
import SettingsView from './views/Settings';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(store.data.currentUser);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [globalData, setGlobalData] = useState(store.data);
  const [loginEmail, setLoginEmail] = useState('admin@nexus.com');
  const [loginPassword, setLoginPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);

  const refreshData = () => {
    setGlobalData({ ...store.data });
  };

  useEffect(() => {
    if (currentUser) {
      // Se o usuário for funcionário, redireciona para estoque se estiver em aba proibida
      if (currentUser.role === UserRole.EMPLOYEE && activeTab !== 'inventory') {
        setActiveTab('inventory');
      }
    }
  }, [currentUser]);

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = store.login(loginEmail, loginPassword);
    if (user) {
      setCurrentUser(user);
      refreshData();
    } else {
      alert('E-mail ou senha incorretos!');
    }
  };

  const handleLogout = () => {
    store.logout();
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg font-bold text-2xl">
              N
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Nexus ERP</h1>
            <p className="text-slate-500 mt-2">Gestão Corporativa Inteligente</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <input 
                type="email" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Sua senha"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md transition-colors"
            >
              Entrar no Sistema
            </button>
          </form>
          <p className="text-center text-xs text-slate-400 mt-6">
            Nexus v1.0 • Google AI Studio Powered
          </p>
        </div>
      </div>
    );
  }

  // Definição de itens de menu baseada em permissão
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'finance', label: 'Financeiro', icon: Wallet, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'inventory', label: 'Estoque', icon: Package, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
    { id: 'reports', label: 'Relatórios & DRE', icon: BarChart3, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'budgeting', label: 'Orçamentos', icon: Target, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'approvals', label: 'Aprovações', icon: CheckCircle2, roles: [UserRole.ADMIN, UserRole.MANAGER], badge: globalData.transactions.filter(t => t.status === TransactionStatus.PENDING).length },
    { id: 'settings', label: 'Configurações', icon: Settings, roles: [UserRole.ADMIN, UserRole.MANAGER] },
  ].filter(item => item.roles.includes(currentUser.role));

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard data={globalData} refresh={refreshData} />;
      case 'finance': return <Finance data={globalData} refresh={refreshData} />;
      case 'inventory': return <Inventory data={globalData} refresh={refreshData} />;
      case 'reports': return <Reports data={globalData} refresh={refreshData} />;
      case 'budgeting': return <Budgeting data={globalData} refresh={refreshData} />;
      case 'approvals': return <Approvals data={globalData} refresh={refreshData} />;
      case 'settings': return <SettingsView data={globalData} refresh={refreshData} />;
      default: return <Inventory data={globalData} refresh={refreshData} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Wallet size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">Nexus ERP</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400">
            <X size={20} />
          </button>
        </div>

        <nav className="px-4 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(window.innerWidth > 1024); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              {'badge' in item && item.badge && item.badge > 0 ? (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold uppercase">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-400 truncate">{currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all text-sm font-medium"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-600">
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-bold text-slate-800 capitalize">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-4 text-slate-500 text-sm font-medium">
            <span className="hidden sm:inline">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
