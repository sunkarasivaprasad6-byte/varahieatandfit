export interface OrderItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export type OrderStatus = "NEW" | "PAYMENT_PENDING" | "PAYMENT_VERIFIED" | "CONFIRMED" | "PREPARING" | "READY" | "OUT_FOR_DELIVERY" | "OTP_PENDING" | "DELIVERED" | "CANCELLED";

export interface Order {
  id?: string;
  orderId: string;
  name: string;
  phone: string;
  address: string;
  location: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  paymentDone: boolean;
  paymentVerified: boolean;
  upiTransactionId?: string;
  status: OrderStatus;
  deliveryOtp?: string;
  otpVerified?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}
