
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
  Lock,
  User as UserIcon,
  Loader2,
  Cloud,
  CloudOff,
  RefreshCw
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
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [syncState, setSyncState] = useState(store.syncStatus);

  const refreshData = () => {
    setGlobalData({ ...store.data });
    setSyncState(store.syncStatus);
  };

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === UserRole.EMPLOYEE && activeTab !== 'inventory') {
        setActiveTab('inventory');
      }
    }
  }, [currentUser]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(() => setSyncState(store.syncStatus), 1000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    setTimeout(() => {
      const user = store.login(loginEmail, loginPassword);
      if (user) {
        setCurrentUser(user);
        refreshData();
      } else {
        alert('E-mail ou senha incorretos!');
      }
      setIsLoggingIn(false);
    }, 800);
  };

  const quickLogin = (role: UserRole) => {
    setLoginPassword('admin');
    if (role === UserRole.ADMIN) setLoginEmail('admin@nexus.com');
    if (role === UserRole.MANAGER) setLoginEmail('gerente@nexus.com');
    if (role === UserRole.EMPLOYEE) setLoginEmail('funcionario@nexus.com');
    
    setTimeout(() => {
       const btn = document.getElementById('login-submit-btn');
       btn?.click();
    }, 100);
  };

  const handleLogout = () => {
    store.logout();
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-10">
            <div className="bg-blue-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-blue-200 font-black text-3xl transform -rotate-6">
              N
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Nexus ERP</h1>
            <p className="text-slate-400 font-medium mt-2">Gestão Corporativa Inteligente</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail de Acesso</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="email" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                  placeholder="admin@nexus.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              id="login-submit-btn"
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar no Nexus'
              )}
            </button>
          </form>

          <div className="mt-10">
            <div className="relative flex items-center mb-6">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Acesso Rápido</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => quickLogin(UserRole.ADMIN)}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">A</div>
                  <span className="text-sm font-bold text-slate-700">Acessar como Administrador</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full shadow-2xl'}`}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/20 transform -rotate-6">
              <Wallet size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">Nexus ERP</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="px-6 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-hide">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); if(window.innerWidth < 1024) setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
            >
              <div className="flex items-center gap-4">
                <item.icon size={20} className={activeTab === item.id ? 'opacity-100' : 'opacity-60'} />
                <span className="font-bold text-sm tracking-wide">{item.label}</span>
              </div>
              {'badge' in item && item.badge && item.badge > 0 ? (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-800/50 mb-4 group cursor-default">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-lg border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate text-slate-100">{currentUser.name}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all text-xs font-bold uppercase tracking-widest border border-transparent hover:border-red-500/20"
          >
            <LogOut size={16} />
            Encerrar Sessão
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-all">
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900 capitalize tracking-tight">{activeTab}</h2>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{currentUser.units.length} Unidade(s) sob gestão</p>
                <span className="text-slate-200">|</span>
                <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${syncState === 'cloud' ? 'text-green-500' : syncState === 'syncing' ? 'text-blue-500' : 'text-slate-400'}`}>
                  {syncState === 'cloud' ? <Cloud size={12} /> : syncState === 'syncing' ? <RefreshCw size={12} className="animate-spin" /> : <CloudOff size={12} />}
                  {syncState === 'cloud' ? 'Nuvem' : syncState === 'syncing' ? 'Sincronizando' : 'Local'}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <span className="hidden sm:inline bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 scroll-smooth">
          <div className="max-w-[1600px] mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
