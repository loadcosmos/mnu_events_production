export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  redirectUrl?: string;
  message?: string;
}

export interface TicketResponse {
  id: string;
  eventId: string;
  userId: string;
  price: number;
  platformFee: number;
  status: string;
  paymentMethod: string;
  transactionId: string;
  qrCode: string;
  createdAt: Date;
  updatedAt: Date;
  event?: {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    location: string;
  };
}

export interface TransactionStatus {
  transactionId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}
