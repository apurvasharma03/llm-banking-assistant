export interface BankingAgent {
  role: string;
  goal: string;
  backstory: string;
  tools: any[];
}

export interface AgentResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface TransactionData {
  id: string;
  userId: string;
  amount: number;
  type: 'debit' | 'credit';
  description: string;
  date: Date;
  merchant?: string;
  location?: string;
  category?: string;
}

export interface AccountData {
  balance: number;
  accountNumber: string;
  type: string;
  transactions: TransactionData[];
}

export interface FraudAlert {
  type: 'suspicious_time' | 'rapid_transactions' | 'high_value' | 'location_risk' | 'merchant_risk';
  message: string;
  severity: 'low' | 'medium' | 'high';
  transaction: TransactionData;
  riskScore: number;
  recommendedAction: string;
} 