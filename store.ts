import { 
  User, Unit, Transaction, Product, InventoryMovement, 
  Budget, AuditLog, UserRole, TransactionStatus, 
  TransactionType, MovementType 
} from './types';

const STORAGE_KEY = 'nexus_erp_v1_data';

class LocalStore {
  public data: {
    users: User[];
    units: Unit[];
    transactions: Transaction[];
    products: Product[];
    movements: InventoryMovement[];
    budgets: Budget[];
    logs: AuditLog[];
    currentUser: User | null;
  } = {
    users: [],
    units: [],
    transactions: [],
    products: [],
    movements: [],
    budgets: [],
    logs: [],
    currentUser: null
  };

  constructor() {
    this.load();
    if (this.data.units.length === 0) {
      this.seed();
    }
  }

  private seed() {
    const initialUnits: Unit[] = [
      { id: '1', name: 'Matriz Nexus', active: true, cnpj: '00.123.456/0001-00' },
      { id: '2', name: 'Filial Sul', active: true, cnpj: '00.123.456/0002-00' }
    ];

    const admin: User = {
      id: 'admin-1',
      name: 'Administrador Nexus',
      email: 'admin@nexus.com',
      password: 'admin123',
      role: UserRole.ADMIN,
      units: ['1', '2']
    };

    const initialProducts: Product[] = [
      { id: 'p1', name: 'MacBook Pro M3', sku: 'APPLE-MBP-001', minStock: 5, currentStock: 12, unitId: '1', costPrice: 12000 },
      { id: 'p2', name: 'iPhone 15 Pro', sku: 'APPLE-IPH-002', minStock: 10, currentStock: 8, unitId: '1', costPrice: 6500 }
    ];

    this.data.units = initialUnits;
    this.data.users = [admin];
    this.data.products = initialProducts;
    this.save();
  }

  private load() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.data = JSON.parse(saved);
        // Garante que o usuário atual seja limpo no reload para forçar login
        this.data.currentUser = null;
      } catch (e) {
        console.error("Erro ao carregar dados locais", e);
      }
    }
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  async login(email: string, password?: string) {
    const user = this.data.users.find(u => u.email === email && u.password === (password || 'admin123'));
    if (user) {
      this.data.currentUser = user;
      this.log(user.id, 'LOGIN', 'Acesso ao sistema Nexus Local.');
      this.save();
      return true;
    }
    return false;
  }

  async logout() {
    if (this.data.currentUser) {
      this.log(this.data.currentUser.id, 'LOGOUT', 'Sessão encerrada.');
    }
    this.data.currentUser = null;
    this.save();
  }

  log(userId: string, action: string, details: string) {
    const log: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.data.logs.unshift(log);
    if (this.data.logs.length > 100) this.data.logs.pop();
    this.save();
  }

  // Unidades
  addUnit(name: string, cnpj: string = '') {
    const newUnit: Unit = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      active: true,
      cnpj
    };
    this.data.units.push(newUnit);
    this.save();
  }

  updateUnit(unit: Unit) {
    const idx = this.data.units.findIndex(u => u.id === unit.id);
    if (idx !== -1) {
      this.data.units[idx] = unit;
      this.save();
    }
  }

  deleteUnit(id: string) {
    // Bloqueia se houver transações
    const hasTransactions = this.data.transactions.some(t => t.unitId === id);
    if (hasTransactions) throw new Error("Não é possível excluir unidade com movimentações financeiras.");
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

  // Financeiro
  addTransaction(t: Omit<Transaction, 'id' | 'status'>) {
    const newTransaction: Transaction = {
      ...t,
      id: Math.random().toString(36).substr(2, 9),
      status: TransactionStatus.PENDING
    };
    this.data.transactions.unshift(newTransaction);
    this.save();
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

  // Usuários
  addUser(user: Omit<User, 'id'>) {
    const newUser: User = {
      ...user,
      id: Math.random().toString(36).substr(2, 9)
    };
    this.data.users.push(newUser);
    this.save();
  }

  updateUser(user: User) {
    const idx = this.data.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      this.data.users[idx] = user;
      this.save();
    }
  }

  deleteUser(id: string) {
    if (id === this.data.currentUser?.id) throw new Error("Não é possível excluir o próprio usuário.");
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.save();
  }

  // Estoque
  addProduct(p: Omit<Product, 'id'>) {
    const newProduct: Product = {
      ...p,
      id: Math.random().toString(36).substr(2, 9)
    };
    this.data.products.push(newProduct);
    this.save();
  }

  addMovement(m: Omit<InventoryMovement, 'id' | 'status'>, linkToFinance: boolean = false) {
    const product = this.data.products.find(p => p.id === m.productId);
    if (!product) return;

    const qty = Number(m.quantity);
    const newStock = m.type === MovementType.IN ? product.currentStock + qty : product.currentStock - qty;
    
    if (newStock < 0) throw new Error("Estoque insuficiente para esta operação.");

    product.currentStock = newStock;

    const movement: InventoryMovement = {
      ...m,
      id: Math.random().toString(36).substr(2, 9),
      status: TransactionStatus.APPROVED
    };

    this.data.movements.unshift(movement);

    if (linkToFinance) {
      this.addTransaction({
        type: m.type === MovementType.IN ? TransactionType.EXPENSE : TransactionType.INCOME,
        date: m.date,
        amount: qty * (product.costPrice || 0),
        category: 'Estoque',
        description: `${m.type === MovementType.IN ? 'Compra' : 'Venda'} de ${product.name}`,
        paymentMethod: 'Ajuste de Estoque',
        unitId: m.unitId,
        createdBy: this.data.currentUser?.id || 'sys'
      });
    }
    this.save();
  }

  // Orçamento
  setBudget(b: Omit<Budget, 'id' | 'revisions'>) {
    const existing = this.data.budgets.find(x => x.unitId === b.unitId && x.category === b.category && x.month === b.month);
    if (existing) {
      existing.amount = b.amount;
    } else {
      this.data.budgets.push({
        ...b,
        id: Math.random().toString(36).substr(2, 9),
        revisions: []
      });
    }
    this.save();
  }
}

export const store = new LocalStore();