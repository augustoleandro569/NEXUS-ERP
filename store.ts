
import { createClient } from '@supabase/supabase-js';
import { User, Unit, Transaction, Product, InventoryMovement, Budget, AuditLog, UserRole, TransactionStatus, TransactionType, MovementType } from './types';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || '';

const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const INITIAL_UNITS: Unit[] = [
  { id: 'u1', name: 'Matriz São Paulo', active: true },
  { id: 'u2', name: 'Filial Curitiba', active: true }
];

const INITIAL_USER: User = {
  id: 'admin-1',
  name: 'Administrador Nexus',
  email: 'admin@nexus.com',
  password: 'admin',
  role: UserRole.ADMIN,
  units: ['u1', 'u2']
};

class ERPStore {
  private static STORAGE_KEY = 'nexus_erp_data_v1';
  public syncStatus: 'local' | 'cloud' | 'syncing' = 'local';

  data: {
    users: User[];
    units: Unit[];
    transactions: Transaction[];
    products: Product[];
    movements: InventoryMovement[];
    budgets: Budget[];
    logs: AuditLog[];
    currentUser: User | null;
  };

  constructor() {
    const stored = localStorage.getItem(ERPStore.STORAGE_KEY);
    if (stored) {
      this.data = JSON.parse(stored);
    } else {
      this.data = {
        users: [INITIAL_USER],
        units: INITIAL_UNITS,
        transactions: [],
        products: [],
        movements: [],
        budgets: [],
        logs: [],
        currentUser: null
      };
      this.save();
    }
    this.initialSync();
  }

  private async initialSync() {
    if (!supabase || !this.data.currentUser) return;
    
    this.syncStatus = 'syncing';
    try {
      // Exemplo de pull: Busca o estado mais recente da nuvem para o usuário
      const { data: cloudData, error } = await supabase
        .from('nexus_states')
        .select('payload')
        .eq('user_id', this.data.currentUser.id)
        .single();

      if (cloudData && !error) {
        this.data = { ...this.data, ...cloudData.payload };
        this.syncStatus = 'cloud';
        this.save(false); // Salva localmente mas não dispara novo sync
      }
    } catch (e) {
      this.syncStatus = 'local';
    }
  }

  async save(shouldSync: boolean = true) {
    localStorage.setItem(ERPStore.STORAGE_KEY, JSON.stringify(this.data));
    
    if (shouldSync && supabase && this.data.currentUser) {
      this.syncStatus = 'syncing';
      try {
        await supabase
          .from('nexus_states')
          .upsert({ 
            user_id: this.data.currentUser.id, 
            payload: this.data,
            updated_at: new Date().toISOString()
          });
        this.syncStatus = 'cloud';
      } catch (e) {
        this.syncStatus = 'local';
      }
    }
  }

  log(userId: string, action: string, details: string) {
    this.data.logs.unshift({
      id: crypto.randomUUID(),
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
    this.save();
  }

  login(email: string, password?: string): User | null {
    const user = this.data.users.find(u => u.email === email);
    if (user && (user.password === password || !user.password)) {
      this.data.currentUser = user;
      this.log(user.id, 'LOGIN', 'Usuário realizou login.');
      this.save();
      this.initialSync();
      return user;
    }
    return null;
  }

  logout() {
    this.data.currentUser = null;
    this.save();
  }

  // Métodos de Negócio simplificados para o exemplo de sincronização
  addUser(u: Omit<User, 'id'>) {
    const newUser: User = { ...u, id: crypto.randomUUID() };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUser(u: User) {
    const index = this.data.users.findIndex(user => user.id === u.id);
    if (index !== -1) {
      this.data.users[index] = { ...u, password: u.password || this.data.users[index].password };
      this.save();
    }
  }

  deleteUser(id: string) {
    if (this.data.currentUser?.id === id) throw new Error("Não pode excluir o usuário atual.");
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.save();
  }

  addUnit(name: string) {
    const newUnit: Unit = { id: crypto.randomUUID(), name, active: true };
    this.data.units.push(newUnit);
    this.save();
    return newUnit;
  }

  updateUnit(unit: Unit) {
    const index = this.data.units.findIndex(u => u.id === unit.id);
    if (index !== -1) {
      this.data.units[index] = unit;
      this.save();
    }
  }

  deleteUnit(id: string) {
    const hasTransactions = this.data.transactions.some(t => t.unitId === id);
    if (hasTransactions) throw new Error("Não pode excluir unidade com transações.");
    this.data.units = this.data.units.filter(u => u.id !== id);
    this.save();
  }

  toggleUnit(id: string) {
    const unit = this.data.units.find(u => u.id === id);
    if (unit) {
      unit.active = !unit.active;
      this.save();
    }
  }

  addTransaction(t: Omit<Transaction, 'id' | 'status'>) {
    const newTransaction: Transaction = {
      ...t,
      id: crypto.randomUUID(),
      status: TransactionStatus.PENDING
    };
    this.data.transactions.unshift(newTransaction);
    this.save();
    return newTransaction;
  }

  approveTransaction(id: string, comment: string) {
    const t = this.data.transactions.find(x => x.id === id);
    if (t) {
      t.status = TransactionStatus.APPROVED;
      t.approvalComment = comment;
      this.save();
    }
  }

  rejectTransaction(id: string, comment: string) {
    const t = this.data.transactions.find(x => x.id === id);
    if (t) {
      t.status = TransactionStatus.REJECTED;
      t.approvalComment = comment;
      this.save();
    }
  }

  addProduct(p: Omit<Product, 'id'>) {
    const newProduct: Product = { ...p, id: crypto.randomUUID() };
    this.data.products.push(newProduct);
    this.save();
  }

  addMovement(m: Omit<InventoryMovement, 'id' | 'status'>, linkToFinance: boolean = false) {
    const product = this.data.products.find(p => p.id === m.productId);
    if (!product) return;
    if (m.type === MovementType.OUT && product.currentStock < m.quantity) {
      throw new Error("Saldo insuficiente em estoque.");
    }
    const movement: InventoryMovement = { ...m, id: crypto.randomUUID(), status: TransactionStatus.APPROVED };
    if (m.type === MovementType.IN) product.currentStock += m.quantity;
    if (m.type === MovementType.OUT) product.currentStock -= m.quantity;
    this.data.movements.unshift(movement);
    if (linkToFinance) {
      this.addTransaction({
        type: m.type === MovementType.IN ? TransactionType.EXPENSE : TransactionType.INCOME,
        date: m.date,
        amount: m.quantity * product.costPrice,
        category: 'Estoque',
        description: `Movimentação de ${product.name}`,
        paymentMethod: 'Ajuste de Estoque',
        unitId: m.unitId,
        createdBy: this.data.currentUser?.id || 'sys',
        inventoryMovementId: movement.id
      });
    }
    this.save();
  }

  setBudget(b: Omit<Budget, 'id' | 'revisions'>) {
    const existing = this.data.budgets.find(x => x.unitId === b.unitId && x.category === b.category && x.month === b.month);
    if (existing) {
      existing.revisions.push({ date: new Date().toISOString(), amount: existing.amount, reason: 'Revisão orçamentária' });
      existing.amount = b.amount;
    } else {
      this.data.budgets.push({ ...b, id: crypto.randomUUID(), revisions: [] });
    }
    this.save();
  }
}

export const store = new ERPStore();
