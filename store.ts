import { 
  User, Unit, Transaction, Product, InventoryMovement, 
  Budget, AuditLog, UserRole, TransactionStatus, 
  TransactionType, MovementType 
} from './types';

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
    users: [
      { id: '1', name: 'Administrador Nexus', email: 'admin@nexus.com', role: UserRole.ADMIN, units: ['1'] }
    ],
    units: [
      { id: '1', name: 'Matriz Principal', active: true, cnpj: '00.000.000/0001-00' }
    ],
    transactions: [],
    products: [],
    movements: [],
    budgets: [],
    logs: [],
    currentUser: null
  };

  constructor() {
    this.load();
  }

  private load() {
    const saved = localStorage.getItem('nexus_erp_local_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.data = { ...this.data, ...parsed, currentUser: null };
      } catch (e) {
        console.error("Erro ao carregar dados locais", e);
      }
    }
  }

  private persist() {
    localStorage.setItem('nexus_erp_local_v1', JSON.stringify({
      users: this.data.users,
      units: this.data.units,
      transactions: this.data.transactions,
      products: this.data.products,
      movements: this.data.movements,
      budgets: this.data.budgets,
      logs: this.data.logs
    }));
  }

  async login(email: string, password?: string) {
    const user = this.data.users.find(u => u.email === email);
    // Senha padrão admin123 para simplificação local
    if (user && (password === 'admin123' || !password)) {
      this.data.currentUser = user;
      this.log(user.id, 'LOGIN', 'Acesso ao sistema realizado.');
      return true;
    }
    return false;
  }

  async logout() {
    if (this.data.currentUser) {
      this.log(this.data.currentUser.id, 'LOGOUT', 'Sessão encerrada.');
    }
    this.data.currentUser = null;
  }

  log(userId: string, action: string, details: string) {
    const log: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.data.logs = [log, ...this.data.logs].slice(0, 100);
    this.persist();
  }

  // Unidades
  addUnit(name: string, cnpj: string = '') {
    const unit: Unit = { id: Math.random().toString(36).substr(2, 9), name, active: true, cnpj };
    this.data.units.push(unit);
    this.persist();
  }

  updateUnit(unit: Unit) {
    const idx = this.data.units.findIndex(u => u.id === unit.id);
    if (idx !== -1) {
      this.data.units[idx] = unit;
      this.persist();
    }
  }

  deleteUnit(id: string) {
    this.data.units = this.data.units.filter(u => u.id !== id);
    this.persist();
  }

  toggleUnit(id: string) {
    const unit = this.data.units.find(u => u.id === id);
    if (unit) {
      unit.active = !unit.active;
      this.persist();
    }
  }

  // Transações
  addTransaction(t: Omit<Transaction, 'id' | 'status'>) {
    const transaction: Transaction = {
      ...t,
      id: Math.random().toString(36).substr(2, 9),
      status: TransactionStatus.PENDING
    };
    this.data.transactions = [transaction, ...this.data.transactions];
    this.persist();
    this.log(t.createdBy, 'FINANCE', `Novo lançamento: ${t.description}`);
  }

  approveTransaction(id: string, comment: string) {
    const t = this.data.transactions.find(x => x.id === id);
    if (t) {
      t.status = TransactionStatus.APPROVED;
      t.approvalComment = comment;
      this.persist();
    }
  }

  rejectTransaction(id: string, comment: string) {
    const t = this.data.transactions.find(x => x.id === id);
    if (t) {
      t.status = TransactionStatus.REJECTED;
      t.approvalComment = comment;
      this.persist();
    }
  }

  // Usuários
  addUser(user: Omit<User, 'id'>) {
    const newUser: User = { ...user, id: Math.random().toString(36).substr(2, 9) };
    this.data.users.push(newUser);
    this.persist();
  }

  updateUser(user: User) {
    const idx = this.data.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      this.data.users[idx] = user;
      this.persist();
    }
  }

  deleteUser(id: string) {
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.persist();
  }

  // Produtos e Estoque
  addProduct(p: Omit<Product, 'id'>) {
    const product: Product = { ...p, id: Math.random().toString(36).substr(2, 9) };
    this.data.products.push(product);
    this.persist();
  }

  addMovement(m: Omit<InventoryMovement, 'id' | 'status'>, linkToFinance: boolean = false) {
    const product = this.data.products.find(p => p.id === m.productId);
    if (!product) return;

    const newStock = m.type === MovementType.IN 
      ? product.currentStock + m.quantity 
      : product.currentStock - m.quantity;

    if (newStock < 0) throw new Error("Saldo de estoque insuficiente.");

    product.currentStock = newStock;
    const moveId = Math.random().toString(36).substr(2, 9);
    
    this.data.movements.push({ ...m, id: moveId, status: TransactionStatus.APPROVED });

    if (linkToFinance) {
      this.addTransaction({
        type: m.type === MovementType.IN ? TransactionType.EXPENSE : TransactionType.INCOME,
        date: m.date,
        amount: m.quantity * product.costPrice,
        category: 'Estoque',
        description: `${m.type === MovementType.IN ? 'Compra' : 'Venda'} de ${product.name}`,
        paymentMethod: 'Ajuste de Estoque',
        unitId: m.unitId,
        createdBy: this.data.currentUser?.id || 'sys',
        inventoryMovementId: moveId
      });
    }
    this.persist();
  }

  setBudget(b: Omit<Budget, 'id' | 'revisions'>) {
    const existingIdx = this.data.budgets.findIndex(x => x.unitId === b.unitId && x.category === b.category && x.month === b.month);
    if (existingIdx !== -1) {
      const existing = this.data.budgets[existingIdx];
      existing.revisions = [...(existing.revisions || []), { 
        date: new Date().toISOString(), 
        amount: existing.amount, 
        reason: 'Revisão orçamentária' 
      }];
      existing.amount = b.amount;
    } else {
      this.data.budgets.push({ ...b, id: Math.random().toString(36).substr(2, 9), revisions: [] });
    }
    this.persist();
  }
}

export const store = new LocalStore();