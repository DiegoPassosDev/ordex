export type OrderStatus =
  | "WAITING"
  | "PREPARING"
  | "READY"
  | "ON_THE_WAY"
  | "DELIVERED"
  | "CANCELLED";

export type TableSessionStatus = "OPEN" | "REQUESTING_BILL" | "CLOSED";

export type EmployeeRole = "MANAGER" | "WAITER" | "KITCHEN" | "BAR" | "CASHIER";

export type CategoryType = "FOOD" | "DRINK" | "DESSERT";

export type PaymentMethod = "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "PIX";

export interface Restaurant {
  id: string;
  name: string;
  logoUrl?: string;
  serviceCharge: number;
  cancelWindowMin: number;
  acceptWindowMin: number;
}

export interface Table {
  id: string;
  number: number;
  qrCode: string;
  restaurantId: string;
}

export interface TableSession {
  id: string;
  tableId: string;
  restaurantId: string;
  waiterId?: string;
  guestLabel?: string;
  status: TableSessionStatus;
  openedAt: string;
  closedAt?: string;
  table: Table;
  waiter?: Employee;
  orders: Order[];
  guests: Guest[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  prepTimeMin: number;
  available: boolean;
  categoryId: string;
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  sortOrder: number;
  items: MenuItem[];
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  notes?: string;
  price: number;
  status: OrderStatus;
  menuItem: MenuItem;
}

export interface Order {
  id: string;
  sessionId: string;
  guestId: string;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
  session?: TableSession;
  guest?: Guest;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  active: boolean;
  restaurantId: string;
}

export interface Guest {
  id: string;
  name?: string;
  email: string;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  WAITING: "Aguardando",
  PREPARING: "Em Preparo",
  READY: "Pronto",
  ON_THE_WAY: "A Caminho",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  WAITING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  PREPARING: "bg-blue-100 text-blue-700 border-blue-200",
  READY: "bg-green-100 text-green-700 border-green-200",
  ON_THE_WAY: "bg-purple-100 text-purple-700 border-purple-200",
  DELIVERED: "bg-gray-100 text-gray-600 border-gray-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

export const ORDER_STATUS_DOT: Record<OrderStatus, string> = {
  WAITING: "bg-yellow-400",
  PREPARING: "bg-blue-500",
  READY: "bg-green-500",
  ON_THE_WAY: "bg-purple-500",
  DELIVERED: "bg-gray-400",
  CANCELLED: "bg-red-500",
};
