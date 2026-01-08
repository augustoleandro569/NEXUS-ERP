import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  getDoc,
  setDoc,
  Firestore
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  Auth
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

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  const apps = getApps();
  app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
  db = getFirestore(app);
  auth = getAuth(app);
  console.log("Nexus Cloud: Firebase Services inicializados com sucesso.");
} catch (error) {
  console.error("Erro crítico na inicialização do Firebase:", error);
}

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
    if (db && auth) {
      this.initListeners();
    } else {
      console.warn("Nexus Cloud: Store iniciada sem conexão ativa com banco de dados.");
    }
  }

  private initListeners() {
    if (!auth || !db) return;

    onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && db) {
        try {
          const userRef = doc(db, 'users', fbUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            this.data.currentUser = { id: fbUser.uid, ...userDoc.data() } as User;
          } else {
            const tempUser: User = {
              id: fbUser.uid,
              name: fbUser.email?.split('@')[0] || 'Usuário',
              email: fbUser.email || '',
              role: UserRole.ADMIN,
              units: []
            };
            this.data.currentUser = tempUser;
            try { 
              await setDoc(userRef, tempUser); 
            } catch(e) {
              console.warn("Nexus Cloud: Falha ao persistir perfil inicial.", e);
            }
          }
        } catch (e) {
          console.error("Nexus Cloud: Erro na sincronização do perfil:", e);
        }
      } else {
        this.data.currentUser = null;
      }
    });

    const setupListener = (col: string, callback: (docs: any[]) => void, q?: any) => {
      if (!db) return;
      return onSnapshot(q || collection(db, col), (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        if (err.code !== 'permission-denied') console.error(`Nexus Cloud: Erro no listener ${col}:`, err);
      });
    };

    setupListener('units', (docs) => this.data.units = docs as Unit[]);
    setupListener('products', (docs) => this.data.products = docs as Product[]);
    setupListener('users', (docs) => this.data.users = docs as User[]);
    setupListener('budgets', (docs) => this.data.budgets = docs as Budget[]);
    
    if (db) {
      onSnapshot(query(collection(db, 'transactions'), orderBy('date', 'desc')), (s) => {
        this.data.transactions = s.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      });

      onSnapshot(query(collection(db, 'logs'), orderBy('timestamp', 'desc')), (s) => {
        this.data.logs = s.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog)).slice(0, 50);
      });
    }
  }

  async login(email: string, password?: string) {
    if (!auth || !db) {
      console.error("Nexus Cloud: Serviços Firebase indisponíveis.");
      return false;
    }
    try {
      const res = await signInWithEmailAndPassword(auth, email, password || 'admin123');
      const userRef = doc(db, 'users', res.user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        const newUser: User = {
          id: res.user.uid,
          name: email.split('@')[0],
          email: email,
          role: UserRole.ADMIN,
          units: []
        };
        await setDoc(userRef, newUser);
        this.data.currentUser = newUser;
      } else {
        this.data.currentUser = { id: res.user.uid, ...userDoc.data() } as User;
      }
      
      await this.log(res.user.uid, 'LOGIN', 'Sessão Cloud Nexus iniciada.');
      return true;
    } catch (e) {
      console.error("Nexus Cloud: Erro no login:", e);
      return false;
    }
  }

  async logout() {
    if (!auth) return;
    if (this.data.currentUser) {
      await this.log(this.data.currentUser.id, 'LOGOUT', 'Sessão encerrada.');
    }
    await signOut(auth);
    this.data.currentUser = null;
  }

  async log(userId: string, action: string, details: string) {
    if (!db) return;
    try {
      await addDoc(collection(db, 'logs'), {
        userId, action, details, timestamp: new Date().toISOString()
      });
    } catch(e) {}
  }

  async addUnit(name: string, cnpj: string = '') {
    if (!db) return;
    await addDoc(collection(db, 'units'), { name, active: true, cnpj });
  }

  async updateUnit(unit: Unit) {
    if (!db) return;
    const { id, ...rest } = unit;
    await updateDoc(doc(db, 'units', id), rest);
  }

  async deleteUnit(id: string) {
    if (!db) return;
    await deleteDoc(doc(db, 'units', id));
  }

  async toggleUnit(id: string) {
    if (!db) return;
    const unit = this.data.units.find(u => u.id === id);
    if (unit) await updateDoc(doc(db, 'units', id), { active: !unit.active });
  }

  async addTransaction(t: Omit<Transaction, 'id' | 'status'>) {
    if (!db) return;
    await addDoc(collection(db, 'transactions'), { ...t, status: TransactionStatus.PENDING });
  }

  async approveTransaction(id: string, comment: string) {
    if (!db) return;
    await updateDoc(doc(db, 'transactions', id), { status: TransactionStatus.APPROVED, approvalComment: comment });
  }

  async rejectTransaction(id: string, comment: string) {
    if (!db) return;
    await updateDoc(doc(db, 'transactions', id), { status: TransactionStatus.REJECTED, approvalComment: comment });
  }

  async addUser(user: Omit<User, 'id'>) {
    if (!db) return;
    await addDoc(collection(db, 'users'), user);
  }

  async updateUser(user: User) {
    if (!db) return;
    const { id, ...rest } = user;
    await updateDoc(doc(db, 'users', id), rest);
  }

  async deleteUser(id: string) {
    if (!db) return;
    await deleteDoc(doc(db, 'users', id));
  }

  async addProduct(p: Omit<Product, 'id'>) {
    if (!db) return;
    await addDoc(collection(db, 'products'), p);
  }

  async addMovement(m: Omit<InventoryMovement, 'id' | 'status'>, linkToFinance: boolean = false) {
    if (!db) return;
    const product = this.data.products.find(p => p.id === m.productId);
    if (!product) return;

    const newStock = m.type === MovementType.IN 
      ? product.currentStock + m.quantity 
      : product.currentStock - m.quantity;

    if (newStock < 0) throw new Error("Saldo de estoque insuficiente.");

    await updateDoc(doc(db, 'products', m.productId), { currentStock: newStock });
    const moveRes = await addDoc(collection(db, 'movements'), { ...m, status: TransactionStatus.APPROVED });

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

  async setBudget(b: Omit<Budget, 'id' | 'revisions'>) {
    if (!db) return;
    const existing = this.data.budgets.find(x => x.unitId === b.unitId && x.category === b.category && x.month === b.month);
    if (existing) {
      const revisions = [...(existing.revisions || []), { 
        date: new Date().toISOString(), 
        amount: existing.amount, 
        reason: 'Revisão orçamentária automática' 
      }];
      await updateDoc(doc(db, 'budgets', existing.id), { amount: b.amount, revisions });
    } else {
      await addDoc(collection(db, 'budgets'), { ...b, revisions: [] });
    }
  }
}

export const store = new FirebaseStore();