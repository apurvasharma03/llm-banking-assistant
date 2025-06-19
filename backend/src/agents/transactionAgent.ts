import { BankingAgent, AgentResponse, TransactionData } from './types';
import { Config } from '../config/config';
import { CrewAIService } from '../services/crewAIService';

interface TransferDetails {
  fromAccount: string;
  toAccount: string;
  amount: number;
  description?: string;
}

interface BillPaymentDetails {
  accountNumber: string;
  billerName: string;
  amount: number;
  dueDate?: Date;
  description?: string;
}

export class TransactionAgent implements BankingAgent {
  role = 'Transaction Specialist';
  goal = 'Process and provide information about banking transactions';
  backstory = 'I am a banking professional with expertise in transaction processing and history analysis. I ensure accurate and secure handling of all financial transactions.';
  tools: any[] = [];

  private mockBalance: number;
  private pendingTransactions: Map<string, TransactionData> = new Map();
  private transactionHistory: TransactionData[] = [];
  private agentId: string | null = null;

  constructor() {
    this.mockBalance = Config.getInitialBalance();
  }

  async getTransactionHistory(): Promise<AgentResponse> {
    try {
      const crewAIService = CrewAIService.getInstance();
      const result = await crewAIService.runAgent({
        query: 'Get transaction history',
        userId: 'user123',
        mockBalance: this.mockBalance,
        transactionHistory: this.transactionHistory,
        amount: 0,
        type: 'inquiry',
        description: 'Transaction history request'
      });
      if (result.success) {
        return {
          success: true,
          message: result.message,
          data: result.data
        };
      } else {
        throw new Error(result.error || 'CrewAI failed');
      }
    } catch (error) {
      // Fallback to legacy logic
      try {
        if (this.transactionHistory.length === 0) {
          this.transactionHistory = [
            {
              id: '1',
              userId: 'user123',
              amount: 100.00,
              type: 'debit',
              description: 'Grocery Store',
              date: new Date(Date.now() - 24 * 60 * 60 * 1000),
              merchant: 'Grocery Store',
              location: 'Local Store',
              category: 'Shopping'
            },
            {
              id: '2',
              userId: 'user123',
              amount: 500.00,
              type: 'credit',
              description: 'Salary Deposit',
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              merchant: 'Employer',
              location: 'Direct Deposit',
              category: 'Income'
            },
            {
              id: '3',
              userId: 'user123',
              amount: 50.00,
              type: 'debit',
              description: 'Restaurant',
              date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
              merchant: 'Local Restaurant',
              location: 'Downtown',
              category: 'Dining'
            }
          ];
        }
        const formattedTransactions = this.transactionHistory
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .map(t => `${t.date.toLocaleDateString()} - ${t.description} - $${t.amount.toFixed(2)} (${t.type})`)
          .join('\n');
        return {
          success: true,
          message: `Here are your recent transactions:\n${formattedTransactions}`,
          data: {
            transactions: this.transactionHistory,
            suggestions: [
              'Would you like to analyze your spending patterns?',
              'Would you like to check your account balance?'
            ]
          }
        };
      } catch (legacyError) {
        return {
          success: false,
          message: 'Failed to retrieve transaction history',
          error: legacyError instanceof Error ? legacyError.message : 'Unknown error'
        };
      }
    }
  }

  async processTransaction(
    amount: number, 
    type: 'credit' | 'debit', 
    description: string, 
    category?: string,
    merchant?: string,
    location?: string
  ): Promise<AgentResponse> {
    try {
      const crewAIService = CrewAIService.getInstance();
      const result = await crewAIService.runAgent({
        query: 'Process transaction',
        amount, type, description, category, merchant, location
      });
      if (result.success) {
        return {
          success: true,
          message: result.message,
          data: result.data
        };
      } else {
        throw new Error(result.error || 'CrewAI failed');
      }
    } catch (error) {
      // Fallback to legacy logic
      try {
        if (amount <= 0) {
          return {
            success: false,
            message: 'Transaction amount must be greater than 0'
          };
        }
        if (type === 'debit' && amount > this.mockBalance) {
          return {
            success: false,
            message: 'Insufficient funds for transaction'
          };
        }
        const transaction: TransactionData = {
          id: Math.random().toString(36).substring(7),
          userId: 'user123',
          amount: amount,
          type: type,
          description: description,
          date: new Date(),
          merchant: merchant || description,
          location: location || 'Unknown',
          category: category || 'Uncategorized'
        };
        this.mockBalance += type === 'credit' ? amount : -amount;
        this.transactionHistory.push(transaction);
        return {
          success: true,
          message: `Transaction processed successfully: ${type} of $${amount.toFixed(2)}`,
          data: transaction
        };
      } catch (legacyError) {
        return {
          success: false,
          message: 'Failed to process transaction',
          error: legacyError instanceof Error ? legacyError.message : 'Unknown error'
        };
      }
    }
  }

  async checkBalance(): Promise<AgentResponse> {
    try {
      const crewAIService = CrewAIService.getInstance();
      const result = await crewAIService.runAgent({
        query: 'Check balance',
        userId: 'user123',
        mockBalance: this.mockBalance,
        transactionHistory: this.transactionHistory,
        amount: 0,
        type: 'inquiry',
        description: 'Balance check request'
      });
      if (result.success) {
        return {
          success: true,
          message: result.message,
          data: result.data
        };
      } else {
        throw new Error(result.error || 'CrewAI failed');
      }
    } catch (error) {
      // Fallback to legacy logic
      try {
        return {
          success: true,
          message: `Your current balance is $${this.mockBalance.toFixed(2)}`,
          data: {
            balance: this.mockBalance,
            lastUpdated: new Date()
          }
        };
      } catch (legacyError) {
        return {
          success: false,
          message: 'Failed to check balance',
          error: legacyError instanceof Error ? legacyError.message : 'Unknown error'
        };
      }
    }
  }

  async initiateTransfer(details: TransferDetails): Promise<AgentResponse> {
    try {
      if (details.amount <= 0) {
        return {
          success: false,
          message: 'Transfer amount must be greater than 0'
        };
      }

      if (details.amount > this.mockBalance) {
        return {
          success: false,
          message: 'Insufficient funds for transfer'
        };
      }

      const transaction: TransactionData = {
        id: Math.random().toString(36).substring(7),
        userId: 'user123',
        amount: details.amount,
        type: 'debit',
        description: `Transfer to ${details.toAccount}${details.description ? ` - ${details.description}` : ''}`,
        date: new Date(),
        merchant: details.toAccount,
        location: 'Online Transfer',
        category: 'Transfer'
      };

      this.pendingTransactions.set(transaction.id, transaction);

      return {
        success: true,
        message: `Transfer initiated. Please review the following details:\n\n` +
                `From: ${details.fromAccount}\n` +
                `To: ${details.toAccount}\n` +
                `Amount: $${details.amount.toFixed(2)}\n` +
                `Description: ${details.description || 'N/A'}\n\n` +
                `To confirm this transfer, please reply with:\n` +
                `"confirm transfer ${transaction.id}"\n\n` +
                `To cancel, please reply with:\n` +
                `"cancel transfer ${transaction.id}"`,
        data: {
          transactionId: transaction.id,
          details: details
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to initiate transfer',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async confirmTransfer(transactionId: string): Promise<AgentResponse> {
    try {
      const transaction = this.pendingTransactions.get(transactionId);
      if (!transaction) {
        return {
          success: false,
          message: 'Invalid or expired transaction ID. Please initiate a new transfer.'
        };
      }

      // Process the transfer
      this.mockBalance -= transaction.amount;
      this.pendingTransactions.delete(transactionId);
      this.transactionHistory.push(transaction);

      return {
        success: true,
        message: `Transfer completed successfully!\n\n` +
                `Amount: $${transaction.amount.toFixed(2)}\n` +
                `To: ${transaction.merchant}\n` +
                `New balance: $${this.mockBalance.toFixed(2)}\n\n` +
                `Transaction ID: ${transaction.id}\n` +
                `Date: ${transaction.date.toLocaleString()}`,
        data: transaction
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to confirm transfer',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async initiateBillPayment(details: BillPaymentDetails): Promise<AgentResponse> {
    try {
      if (details.amount <= 0) {
        return {
          success: false,
          message: 'Payment amount must be greater than 0'
        };
      }

      if (details.amount > this.mockBalance) {
        return {
          success: false,
          message: 'Insufficient funds for payment'
        };
      }

      const transaction: TransactionData = {
        id: Math.random().toString(36).substring(7),
        userId: 'user123',
        amount: details.amount,
        type: 'debit',
        description: `Bill Payment to ${details.billerName}${details.description ? ` - ${details.description}` : ''}`,
        date: new Date(),
        merchant: details.billerName,
        location: 'Online Payment',
        category: 'Bills'
      };

      this.pendingTransactions.set(transaction.id, transaction);

      return {
        success: true,
        message: `Bill payment initiated. Please confirm the following details:\n` +
                `Biller: ${details.billerName}\n` +
                `Account: ${details.accountNumber}\n` +
                `Amount: $${details.amount.toFixed(2)}\n` +
                `Due Date: ${details.dueDate?.toLocaleDateString() || 'N/A'}\n` +
                `Description: ${details.description || 'N/A'}\n\n` +
                `To confirm, please reply with "confirm payment ${transaction.id}"`,
        data: {
          transactionId: transaction.id,
          details: details
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to initiate bill payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async confirmBillPayment(transactionId: string): Promise<AgentResponse> {
    try {
      const transaction = this.pendingTransactions.get(transactionId);
      if (!transaction) {
        return {
          success: false,
          message: 'Invalid or expired transaction ID'
        };
      }

      // Process the payment
      this.mockBalance -= transaction.amount;
      this.pendingTransactions.delete(transactionId);
      this.transactionHistory.push(transaction);

      return {
        success: true,
        message: `Bill payment completed successfully. New balance: $${this.mockBalance.toFixed(2)}`,
        data: transaction
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to confirm bill payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async cancelPendingTransaction(transactionId: string): Promise<AgentResponse> {
    try {
      if (!this.pendingTransactions.has(transactionId)) {
        return {
          success: false,
          message: 'Invalid or expired transaction ID'
        };
      }

      this.pendingTransactions.delete(transactionId);

      return {
        success: true,
        message: 'Transaction cancelled successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to cancel transaction',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 