
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  setDoc,
  getDoc
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  User, Unit, Transaction, Product, InventoryMovement, 
  Budget, AuditLog, UserRole, TransactionStatus, 
  TransactionType, MovementType 
} from './types';

const firebaseConfig = {
  apiKey: "AIzaSyDA-6MvzgCE9-iRSsmPe0uStN1CjghFnLs",
  authDomain: "nexus-erp-56e2f.firebaseapp.com",
  projectId: "nexus-erp-56e2f",
  storageBucket: "nexus-erp-56e2f.firebasestorage.app",
  messagingSenderId: "706383612948",
  appId: "1:706383612948:web:b1c6a196a2c1cf5acd2b01",
  measurementId: "G-RLG81K4M3P"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

class FirebaseStore {
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
    this.initListeners();
  }

  private initListeners() {
    // Escutar mudanças na autenticação
    onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        if (userDoc.exists()) {
          this.data.currentUser = { id: fbUser.uid, ...userDoc.data() } as User;
        }
      } else {
        this.data.currentUser = null;
      }
    });

    // Escutar coleções em tempo real
    onSnapshot(collection(db, 'units'), (s) => {
      this.data.units = s.docs.map(d => ({ id: d.id, ...d.data() } as Unit));
    });

    onSnapshot(query(collection(db, 'transactions'), orderBy('date', 'desc')), (s) => {
      this.data.transactions = s.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
    });

    onSnapshot(collection(db, 'products'), (s) => {
      this.data.products = s.docs.map(d => ({ id: d.id, ...d.data() } as Product));
    });

    onSnapshot(collection(db, 'users'), (s) => {
      this.data.users = s.docs.map(d => ({ id: d.id, ...d.data() } as User));
    });

    onSnapshot(collection(db, 'budgets'), (s) => {
      this.data.budgets = s.docs.map(d => ({ id: d.id, ...d.data() } as Budget));
    });

    onSnapshot(query(collection(db, 'logs'), orderBy('timestamp', 'desc')), (s) => {
      this.data.logs = s.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog)).slice(0, 50);
    });
  }

  // AUTH
  async login(email: string, password?: string) {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password || 'admin123');
      const userDoc = await getDoc(doc(db, 'users', res.user.uid));
      if (userDoc.exists()) {
        this.data.currentUser = { id: res.user.uid, ...userDoc.data() } as User;
        await this.log(res.user.uid, 'LOGIN', 'Acesso ao sistema via Firebase Auth');
        return true;
      }
      return false;
    } catch (e) {
      console.error("Erro no Login:", e);
      return false;
    }
  }

  async logout() {
    if (this.data.currentUser) {
      await this.log(this.data.currentUser.id, 'LOGOUT', 'Sessão encerrada');
    }
    await signOut(auth);
    this.data.currentUser = null;
  }

  // LOGS
  async log(userId: string, action: string, details: string) {
    await addDoc(collection(db, 'logs'), {
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // UNITS
  async addUnit(name: string, cnpj: string = '') {
    await addDoc(collection(db, 'units'), {
      name,
      active: true,
      cnpj
    });
  }

  async updateUnit(unit: Unit) {
    const { id, ...rest } = unit;
    await updateDoc(doc(db, 'units', id), rest);
  }

  async deleteUnit(id: string) {
    // Verificar se há dependências
    const hasTransactions = this.data.transactions.some(t => t.unitId === id);
    if (hasTransactions) throw new Error("Unidade possui movimentações financeiras vinculadas.");
    await deleteDoc(doc(db, 'units', id));
  }

  async toggleUnit(id: string) {
    const unit = this.data.units.find(u => u.id === id);
    if (unit) {
      await updateDoc(doc(db, 'units', id), { active: !unit.active });
    }
  }

  // TRANSACTIONS
  async addTransaction(t: Omit<Transaction, 'id' | 'status'>) {
    await addDoc(collection(db, 'transactions'), {
      ...t,
      status: TransactionStatus.PENDING
    });
  }

  async approveTransaction(id: string, comment: string) {
    await updateDoc(doc(db, 'transactions', id), {
      status: TransactionStatus.APPROVED,
      approvalComment: comment
    });
  }

  async rejectTransaction(id: string, comment: string) {
    await updateDoc(doc(db, 'transactions', id), {
      status: TransactionStatus.REJECTED,
      approvalComment: comment
    });
  }

  // USERS (Admin)
  async addUser(user: Omit<User, 'id'>) {
    // Nota: No Firebase real, você usaria Firebase Admin ou criaria o usuário via Auth primeiro.
    // Para simplificar o MVP, salvamos os dados do perfil na coleção.
    await addDoc(collection(db, 'users'), user);
  }

  async updateUser(user: User) {
    const { id, ...rest } = user;
    await updateDoc(doc(db, 'users', id), rest);
  }

  async deleteUser(id: string) {
    await deleteDoc(doc(db, 'users', id));
  }

  // PRODUCTS & INVENTORY
  async addProduct(p: Omit<Product, 'id'>) {
    await addDoc(collection(db, 'products'), p);
  }

  async addMovement(m: Omit<InventoryMovement, 'id' | 'status'>, linkToFinance: boolean = false) {
    const product = this.data.products.find(p => p.id === m.productId);
    if (!product) return;

    const newStock = m.type === MovementType.IN 
      ? product.currentStock + m.quantity 
      : product.currentStock - m.quantity;

    if (newStock < 0) throw new Error("Saldo insuficiente em estoque.");

    // Atualizar estoque do produto
    await updateDoc(doc(db, 'products', m.productId), { currentStock: newStock });

    // Registrar movimento
    const moveRes = await addDoc(collection(db, 'movements'), {
      ...m,
      status: TransactionStatus.APPROVED
    });

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
        inventoryMovementId: moveRes.id
      });
    }
  }

  // BUDGETS
  async setBudget(b: Omit<Budget, 'id' | 'revisions'>) {
    const existing = this.data.budgets.find(x => x.unitId === b.unitId && x.category === b.category && x.month === b.month);
    
    if (existing) {
      const revisions = [...(existing.revisions || []), { 
        date: new Date().toISOString(), 
        amount: existing.amount, 
        reason: 'Revisão orçamentária' 
      }];
      await updateDoc(doc(db, 'budgets', existing.id), { amount: b.amount, revisions });
    } else {
      await addDoc(collection(db, 'budgets'), { ...b, revisions: [] });
    }
  }
}

export const store = new FirebaseStore();
