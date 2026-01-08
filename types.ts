
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  GUEST = 'GUEST'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  units: string[];
}

export interface Unit {
  id: string;
  name: string;
  active: boolean;
  cnpj?: string;
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string;
  amount: number;
  category: string;
  description: string;
  paymentMethod: string;
  unitId: string;
  createdBy: string;
  status: TransactionStatus;
  attachmentUrl?: string;
  inventoryMovementId?: string;
  approvalComment?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  minStock: number;
  currentStock: number;
  unitId: string;
  imageUrl?: string;
  costPrice: number;
}

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT'
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  date: string;
  unitId: string;
  reason: string;
  transactionId?: string;
  status: TransactionStatus;
}

export interface Budget {
  id: string;
  unitId: string;
  category: string;
  month: string;
  amount: number;
  revisions: { date: string; amount: number; reason: string }[];
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface KPIStats {
  ebitda: number;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  stockTurnover: number;
  averageTicket: number;
  breakEvenPoint: number;
}