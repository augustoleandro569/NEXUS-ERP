
import { User, Unit, Transaction, Product, InventoryMovement, Budget, AuditLog, UserRole, TransactionStatus, TransactionType, MovementType } from './types';

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
  }

  save() {
    localStorage.setItem(ERPStore.STORAGE_KEY, JSON.stringify(this.data));
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
      return user;
    }
    return null;
  }

  logout() {
    this.data.currentUser = null;
    this.save();
  }

  // User Management
  addUser(u: Omit<User, 'id'>) {
    const newUser: User = { ...u, id: crypto.randomUUID() };
    this.data.users.push(newUser);
    this.log(this.data.currentUser?.id || 'sys', 'USER_ADD', `Novo usuário criado: ${u.name} (${u.email})`);
    this.save();
    return newUser;
  }

  updateUser(u: User) {
    const index = this.data.users.findIndex(user => user.id === u.id);
    if (index !== -1) {
      const oldUser = this.data.users[index];
      const updatedUser = {
        ...u,
        password: u.password || oldUser.password
      };
      this.data.users[index] = updatedUser;
      this.log(this.data.currentUser?.id || 'sys', 'USER_UPDATE', `Usuário atualizado: ${u.name}`);
      this.save();
    }
  }

  deleteUser(id: string) {
    const userToDelete = this.data.users.find(u => u.id === id);
    if (!userToDelete) return;
    
    if (this.data.currentUser?.id === id) {
      throw new Error("Você não pode excluir seu próprio usuário logado.");
    }

    this.data.users = this.data.users.filter(u => u.id !== id);
    this.log(this.data.currentUser?.id || 'sys', 'USER_DELETE', `Usuário removido: ${userToDelete.name}`);
    this.save();
  }

  // Unit Management
  addUnit(name: string) {
    const newUnit: Unit = { id: crypto.randomUUID(), name, active: true };
    this.data.units.push(newUnit);
    this.log(this.data.currentUser?.id || 'sys', 'UNIT_ADD', `Unidade criada: ${name}`);
    this.save();
    return newUnit;
  }

  updateUnit(unit: Unit) {
    const index = this.data.units.findIndex(u => u.id === unit.id);
    if (index !== -1) {
      const oldUnit = this.data.units[index];
      this.data.units[index] = unit;
      this.log(this.data.currentUser?.id || 'sys', 'UNIT_UPDATE', `Unidade atualizada: ${unit.name} (Anterior: ${oldUnit.name})`);
      this.save();
    }
  }

  deleteUnit(id: string) {
    // Check for associated data
    const hasTransactions = this.data.transactions.some(t => t.unitId === id);
    const hasProducts = this.data.products.some(p => p.unitId === id);
    const hasUsers = this.data.users.some(u => u.units.includes(id));

    if (hasTransactions || hasProducts) {
      throw new Error("Não é possível excluir uma unidade que possui transações ou produtos vinculados. Tente desativá-la.");
    }

    const unitToDelete = this.data.units.find(u => u.id === id);
    if (!unitToDelete) return;

    if (this.data.units.length <= 1) {
      throw new Error("O sistema deve possuir pelo menos uma unidade ativa.");
    }

    this.data.units = this.data.units.filter(u => u.id !== id);
    
    // Cleanup unit references in users
    this.data.users.forEach(u => {
      u.units = u.units.filter(uid => uid !== id);
    });

    this.log(this.data.currentUser?.id || 'sys', 'UNIT_DELETE', `Unidade removida: ${unitToDelete.name}`);
    this.save();
  }

  toggleUnit(id: string) {
    const unit = this.data.units.find(u => u.id === id);
    if (unit) {
      unit.active = !unit.active;
      this.log(this.data.currentUser?.id || 'sys', 'UNIT_TOGGLE', `Unidade ${unit.name} ${unit.active ? 'ativada' : 'desativada'}`);
    }
    this.save();
  }

  // Business Methods
  addTransaction(t: Omit<Transaction, 'id' | 'status'>) {
    const newTransaction: Transaction = {
      ...t,
      id: crypto.randomUUID(),
      status: TransactionStatus.PENDING
    };
    this.data.transactions.unshift(newTransaction);
    this.log(this.data.currentUser?.id || 'sys', 'TRANS_ADD', `Nova transação: ${t.description}`);
    this.save();
    return newTransaction;
  }

  approveTransaction(id: string, comment: string) {
    const t = this.data.transactions.find(x => x.id === id);
    if (t) {
      t.status = TransactionStatus.APPROVED;
      t.approvalComment = comment;
      this.log(this.data.currentUser?.id || 'sys', 'TRANS_APPROVE', `Aprovado: ${t.description}`);
      this.save();
    }
  }

  rejectTransaction(id: string, comment: string) {
    const t = this.data.transactions.find(x => x.id === id);
    if (t) {
      t.status = TransactionStatus.REJECTED;
      t.approvalComment = comment;
      this.log(this.data.currentUser?.id || 'sys', 'TRANS_REJECT', `Reprovado: ${t.description}`);
      this.save();
    }
  }

  addProduct(p: Omit<Product, 'id'>) {
    const newProduct: Product = { ...p, id: crypto.randomUUID() };
    this.data.products.push(newProduct);
    this.log(this.data.currentUser?.id || 'sys', 'PROD_ADD', `Produto cadastrado: ${p.name}`);
    this.save();
  }

  addMovement(m: Omit<InventoryMovement, 'id' | 'status'>, linkToFinance: boolean = false) {
    const product = this.data.products.find(p => p.id === m.productId);
    if (!product) return;

    if (m.type === MovementType.OUT && product.currentStock < m.quantity) {
      throw new Error("Saldo insuficiente em estoque.");
    }

    const movement: InventoryMovement = {
      ...m,
      id: crypto.randomUUID(),
      status: TransactionStatus.APPROVED
    };

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

    this.log(this.data.currentUser?.id || 'sys', 'INV_MOVE', `Movimentação: ${product.name} (${m.quantity})`);
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
    this.log(this.data.currentUser?.id || 'sys', 'BUDGET_SET', `Orçamento definido para ${b.category}`);
    this.save();
  }
}

export const store = new ERPStore();
