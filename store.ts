
import { 
  User, Unit, Transaction, Product, InventoryMovement, 
  Budget, AuditLog, UserRole, TransactionStatus, 
  TransactionType, MovementType 
} from './types';

class LocalStore {
  private STORAGE_KEY = 'NEXUS_ERP_DATA_V1';

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
    if (this.data.users.length === 0) {
      this.seedInitialData();
    }
  }

  private seedInitialData() {
    const defaultUnitId = 'unit-1';
    this.data.units = [{ id: defaultUnitId, name: 'Matriz São Paulo', active: true, cnpj: '12.345.678/0001-90' }];
    this.data.users = [{
      id: 'admin-1',
      name: 'Administrador Nexus',
      email: 'admin@nexus.com',
      password: 'admin123',
      role: UserRole.ADMIN,
      units: [defaultUnitId]
    }];
    this.save();
  }

  private load() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.data = { ...this.data, ...parsed, currentUser: null }; // Reset auth on reload
      } catch (e) {
        console.error("Erro ao carregar dados locais", e);
      }
    }
  }

  private save() {
    const { currentUser, ...toSave } = this.data;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toSave));
  }

  // AUTH
  async login(email: string, password?: string) {
    const user = this.data.users.find(u => u.email === email && u.password === (password || 'admin123'));
    if (user) {
      this.data.currentUser = user;
      this.log(user.id, 'LOGIN', 'Usuário autenticado no sistema.');
      return true;
    }
    return false;
  }

  async logout() {
    if (this.data.currentUser) {
      this.log(this.data.currentUser.id, 'LOGOUT', 'Usuário encerrou a sessão.');
    }
    this.data.currentUser = null;
  }

  // LOGS
  log(userId: string, action: string, details: string) {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.data.logs = [newLog, ...this.data.logs].slice(0, 100);
    this.save();
  }

  // UNITS
  async addUnit(name: string, cnpj: string = '') {
    const newUnit: Unit = {
      id: 'unit-' + Date.now(),
      name,
      active: true,
      cnpj
    };
    this.data.units.push(newUnit);
    this.save();
  }

  async updateUnit(unit: Unit) {
    const idx = this.data.units.findIndex(u => u.id === unit.id);
    if (idx !== -1) {
      this.data.units[idx] = unit;
      this.save();
    }
  }

  async deleteUnit(id: string) {
    this.data.units = this.data.units.filter(u => u.id !== id);
    this.save();
  }

  async toggleUnit(id: string) {
    const unit = this.data.units.find(u => u.id === id);
    if (unit) {
      unit.active = !unit.active;
      this.save();
    }
  }

  // TRANSACTIONS
  async addTransaction(t: Omit<Transaction, 'id' | 'status'>) {
    const newTransaction: Transaction = {
      ...t,
      id: 'tx-' + Date.now(),
      status: TransactionStatus.PENDING,
    };
    this.data.transactions = [newTransaction, ...this.data.transactions];
    this.save();
  }

  async approveTransaction(id: string, comment: string) {
    const tx = this.data.transactions.find(t => t.id === id);
    if (tx) {
      tx.status = TransactionStatus.APPROVED;
      tx.approvalComment = comment;
      this.save();
    }
  }

  async rejectTransaction(id: string, comment: string) {
    const tx = this.data.transactions.find(t => t.id === id);
    if (tx) {
      tx.status = TransactionStatus.REJECTED;
      tx.approvalComment = comment;
      this.save();
    }
  }

  // USERS
  async addUser(user: Omit<User, 'id'>) {
    const newUser: User = { ...user, id: 'user-' + Date.now() };
    this.data.users.push(newUser);
    this.save();
  }

  async updateUser(user: User) {
    const idx = this.data.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      this.data.users[idx] = user;
      this.save();
    }
  }

  async deleteUser(id: string) {
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.save();
  }

  // PRODUCTS
  async addProduct(p: Omit<Product, 'id'>) {
    const newProduct: Product = { ...p, id: 'prod-' + Date.now() };
    this.data.products.push(newProduct);
    this.save();
  }

  async addMovement(m: Omit<InventoryMovement, 'id' | 'status'>, linkToFinance: boolean = false) {
    const productIdx = this.data.products.findIndex(p => p.id === m.productId);
    if (productIdx === -1) return;
    
    const product = this.data.products[productIdx];
    const newStock = m.type === MovementType.IN 
      ? product.currentStock + m.quantity 
      : product.currentStock - m.quantity;

    if (newStock < 0) throw new Error("Saldo insuficiente em estoque.");

    // Update stock
    this.data.products[productIdx].currentStock = newStock;

    // Record movement
    const movement: InventoryMovement = {
      ...m,
      id: 'mv-' + Date.now(),
      status: TransactionStatus.APPROVED,
    };
    this.data.movements.push(movement);

    if (linkToFinance) {
      await this.addTransaction({
        type: m.type === MovementType.IN ? TransactionType.EXPENSE : TransactionType.INCOME,
        date: m.date,
        amount: m.quantity * product.costPrice,
        category: 'Estoque',
        description: `${m.type === MovementType.IN ? 'Compra' : 'Venda'} de ${product.name}`,
        paymentMethod: 'Ajuste de Estoque',
        unitId: m.unitId,
        createdBy: this.data.currentUser?.id || 'sys',
        inventoryMovementId: movement.id
      });
    }
    this.save();
  }

  // BUDGETS
  async setBudget(b: Omit<Budget, 'id' | 'revisions'>) {
    const existingIdx = this.data.budgets.findIndex(x => x.unitId === b.unitId && x.category === b.category && x.month === b.month);
    
    if (existingIdx !== -1) {
      const existing = this.data.budgets[existingIdx];
      const revisions = [...(existing.revisions || []), { 
        date: new Date().toISOString(), 
        amount: existing.amount, 
        reason: 'Revisão orçamentária' 
      }];
      this.data.budgets[existingIdx] = { ...existing, amount: b.amount, revisions };
    } else {
      this.data.budgets.push({ ...b, id: 'bg-' + Date.now(), revisions: [] });
    }
    this.save();
  }
}

export const store = new LocalStore();
