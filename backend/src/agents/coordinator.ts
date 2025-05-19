import { InquiryAgent } from './inquiryAgent';
import { TransactionAgent } from './transactionAgent';
import { FraudDetectionAgent } from './fraudDetectionAgent';
import { AdvisorAgent } from './advisorAgent';
import { VerificationAgent } from './verificationAgent';
import { AgentResponse, TransactionData, FraudAlert } from './types';
import { MemoryManager } from '../memory/memoryManager';
import { AuditLogger } from '../services/auditLogger';
import { Config } from '../config/config';

interface Intent {
  type: 'inquiry' | 'transaction' | 'fraud' | 'advice' | 'verification';
  confidence: number;
  keywords: string[];
}

export class AgentCoordinator {
  private inquiryAgent: InquiryAgent;
  private transactionAgent: TransactionAgent;
  private fraudDetectionAgent: FraudDetectionAgent;
  private advisorAgent: AdvisorAgent;
  private verificationAgent: VerificationAgent;
  private memoryManager: MemoryManager;
  private auditLogger: AuditLogger;
  private currentVerificationSessions: Map<string, string> = new Map();
  private verifiedUsers: Set<string> = new Set();

  private intentPatterns: Record<string, Intent> = {
    balance: {
      type: 'inquiry',
      confidence: 0.9,
      keywords: ['balance', 'account', 'check', 'show', 'how much']
    },
    fraud: {
      type: 'fraud',
      confidence: 0.95,
      keywords: [
        'suspicious', 'fraud', 'unauthorized', 'strange', 'unusual', 
        'activity', 'suspicious activity', 'unusual activity', 'purchase',
        'transaction', 'made a purchase', 'bought', 'at', 'am', 'pm',
        'check for', 'verify', 'confirm', 'validate'
      ]
    },
    transaction: {
      type: 'transaction',
      confidence: 0.9,
      keywords: [
        'transaction', 'history', 'recent', 'spending', 'transfer',
        'send money', 'pay bill', 'payment', 'transfer money', 'send',
        'pay', 'bill', 'confirm', 'cancel', 'show me', 'list', 'view',
        'transactions', 'recent transactions', 'latest transactions'
      ]
    },
    advice: {
      type: 'advice',
      confidence: 0.8,
      keywords: [
        'how to', 'help', 'advice', 'recommend', 'suggest', 'set up', 'setup', 
        'save', 'saving', 'invest', 'budget', 'financial', 'how can i', 'how do i',
        'spending', 'trends', 'analysis', 'analyze', 'patterns', 'spend'
      ]
    },
    verification: {
      type: 'verification',
      confidence: 0.9,
      keywords: ['verify', 'verification', 'identity', 'security', 'authenticate', 'login', 'sign in', 'signin']
    }
  };

  constructor() {
    this.inquiryAgent = new InquiryAgent();
    this.transactionAgent = new TransactionAgent();
    this.fraudDetectionAgent = new FraudDetectionAgent();
    this.advisorAgent = new AdvisorAgent();
    this.verificationAgent = new VerificationAgent();
    this.memoryManager = new MemoryManager();
    this.auditLogger = new AuditLogger();
  }

  async processUserQuery(userId: string, query: string): Promise<AgentResponse> {
    try {
      // Check if user is already verified
      if (this.verifiedUsers.has(userId)) {
        // User is verified, process query normally
        const intent = this.classifyIntent(query);
        console.log('Detected intent:', intent);
        
        // Route to appropriate agent based on intent
        switch (intent.type) {
          case 'transaction':
            return this.handleTransactionQuery(userId, query);
          case 'advice':
            return this.advisorAgent.provideAdvice(query);
          case 'fraud':
            return this.fraudDetectionAgent.checkTransaction(query);
          case 'inquiry':
            if (query.toLowerCase().includes('balance')) {
              return this.transactionAgent.checkBalance();
            }
            return this.inquiryAgent.handleInquiry(query);
          case 'verification':
            return {
              success: true,
              message: 'You are already verified. How can I help you?',
              data: { isVerified: true }
            };
          default:
            return {
              success: false,
              message: 'I am not sure how to help with that. Could you please rephrase your request?'
            };
        }
      }

      // User is not verified, check if they're in the verification process
      const currentSession = this.currentVerificationSessions.get(userId);
      if (currentSession) {
        const verificationResponse = await this.verificationAgent.verifyAnswer(currentSession, query);
        if (verificationResponse.success) {
          this.currentVerificationSessions.delete(userId);
          this.verifiedUsers.add(userId);
          return {
            success: true,
            message: 'Verification successful. How can I help you?',
            data: {
              isVerified: true
            }
          };
        } else {
          return verificationResponse;
        }
      }

      // Start verification process
      const verificationResponse = await this.verificationAgent.initiateVerification();
      if (verificationResponse.success && verificationResponse.data?.sessionId) {
        this.currentVerificationSessions.set(userId, verificationResponse.data.sessionId);
      }
      return verificationResponse;

    } catch (error) {
      return {
        success: false,
        message: 'An error occurred while processing your request',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private classifyIntent(query: string): Intent {
    const queryLower = query.toLowerCase();
    
    // First check for fraud-related queries with expanded patterns
    if (queryLower.includes('suspicious') || 
        queryLower.includes('unusual') || 
        queryLower.includes('fraud') ||
        queryLower.includes('unauthorized') ||
        queryLower.includes('check for') ||
        queryLower.includes('verify') ||
        queryLower.includes('report') ||
        queryLower.includes('security') ||
        queryLower.includes('protection') ||
        (queryLower.includes('check') && queryLower.includes('activity')) ||
        (queryLower.includes('verify') && queryLower.includes('transaction'))) {
      return {
        type: 'fraud',
        confidence: 0.95,
        keywords: ['suspicious', 'unusual', 'activity', 'fraud', 'security', 'protection']
      };
    }

    // Then check for financial advice queries
    if (queryLower.includes('how to') || 
        queryLower.includes('help') || 
        queryLower.includes('advice') || 
        queryLower.includes('recommend') || 
        queryLower.includes('suggest') || 
        queryLower.includes('save') || 
        queryLower.includes('saving') || 
        queryLower.includes('invest') || 
        queryLower.includes('budget') || 
        queryLower.includes('financial')) {
      return {
        type: 'advice',
        confidence: 0.9,
        keywords: ['help', 'advice', 'recommend', 'suggest', 'save', 'invest', 'budget']
      };
    }

    // First check for transaction history requests
    if (queryLower.includes('show') && 
        (queryLower.includes('recent') || 
         queryLower.includes('latest') || 
         queryLower.includes('transactions')) ||
        queryLower.includes('transaction history') ||
        queryLower.includes('my transactions')) {
      return {
        type: 'transaction',
        confidence: 0.95,
        keywords: ['show', 'recent', 'latest', 'transactions', 'history']
      };
    }

    // Then check for bill payment requests
    if (queryLower.includes('pay') || queryLower.includes('payment') || queryLower.includes('bill')) {
      const amountMatch = query.match(/\$?(\d+(?:\.\d{2})?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

      // Extract biller name - look for various patterns
      let biller = '';
      const patterns = [
        /(?:to|for)\s+([A-Za-z\s]+)/i,  // "to Internet Provider" or "for Internet Provider"
        /my\s+([A-Za-z\s]+)\s+bill/i,   // "my electricity bill"
        /([A-Za-z\s]+)\s+bill/i,        // "electricity bill"
        /bill\s+to\s+([A-Za-z\s]+)/i    // "bill to Internet Provider"
      ];

      for (const pattern of patterns) {
        const match = query.match(pattern);
        if (match) {
          biller = match[1].trim();
          break;
        }
      }

      if (amount && biller) {
        return {
          type: 'transaction',
          confidence: 0.95,
          keywords: ['pay', 'bill', 'payment', amount.toString(), biller]
        };
      }
    }

    // Then check for high-value transfers
    if ((queryLower.includes('transfer') || 
         queryLower.includes('send')) && 
        queryLower.includes('$') && 
        parseFloat(queryLower.match(/\$?(\d+(?:\.\d{2})?)/)?.[1] || '0') >= 1000) {
      return {
        type: 'transaction',
        confidence: 0.95,
        keywords: ['transfer', 'send', 'high-value']
      };
    }

    // Then check for regular transfers
    if (queryLower.includes('transfer') || 
        queryLower.includes('send money') || 
        queryLower.includes('move') ||
        (queryLower.includes('to') && queryLower.includes('account'))) {
      return {
        type: 'transaction',
        confidence: 0.95,
        keywords: ['transfer', 'send', 'move', 'account']
      };
    }

    let bestMatch: Intent | null = null;
    let highestConfidence = 0;

    // Check each intent pattern
    for (const [key, intent] of Object.entries(this.intentPatterns)) {
      const matches = intent.keywords.filter(keyword => 
        queryLower.includes(keyword)
      ).length;

      if (matches > 0) {
        // Calculate base confidence
        let confidence = (matches / intent.keywords.length) * intent.confidence;
        
        // Boost confidence for exact matches
        if (intent.keywords.some(keyword => queryLower === keyword)) {
          confidence = confidence * 1.2;
        }

        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestMatch = intent;
        }
      }
    }

    return bestMatch || {
      type: 'inquiry',
      confidence: 0.5,
      keywords: []
    };
  }

  private async handleTransactionQuery(userId: string, query: string): Promise<AgentResponse> {
    const queryLower = query.toLowerCase();

    // Check for transfer confirmation
    const confirmMatch = queryLower.match(/confirm transfer (\w+)/);
    if (confirmMatch) {
      const transactionId = confirmMatch[1];
      return this.transactionAgent.confirmTransfer(transactionId);
    }

    // Check for bill payment confirmation
    const confirmPaymentMatch = queryLower.match(/confirm payment (\w+)/);
    if (confirmPaymentMatch) {
      const transactionId = confirmPaymentMatch[1];
      return this.transactionAgent.confirmBillPayment(transactionId);
    }

    // Check for transaction history
    if (queryLower.includes('show') && 
        (queryLower.includes('recent') || 
         queryLower.includes('latest') || 
         queryLower.includes('transactions')) ||
        queryLower.includes('transaction history') ||
        queryLower.includes('my transactions')) {
      return this.transactionAgent.getTransactionHistory();
    }

    // Check for transfer intent
    if (queryLower.includes('transfer') || queryLower.includes('send money')) {
      const amountMatch = query.match(/\$?(\d+(?:\.\d{2})?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

      const toAccountMatch = query.match(/to\s+(\w+)/i);
      const toAccount = toAccountMatch ? toAccountMatch[1] : '';

      if (amount && toAccount) {
        return this.transactionAgent.initiateTransfer({
          fromAccount: 'checking',
          toAccount: toAccount,
          amount: amount,
          description: `Transfer to ${toAccount}`
        });
      }
    }

    // Check for bill payment intent
    if (queryLower.includes('pay') || queryLower.includes('payment') || queryLower.includes('bill')) {
      const amountMatch = query.match(/\$?(\d+(?:\.\d{2})?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

      // Extract biller name - look for various patterns
      let biller = '';
      const patterns = [
        /(?:to|for)\s+([A-Za-z\s]+)/i,  // "to Internet Provider" or "for Internet Provider"
        /my\s+([A-Za-z\s]+)\s+bill/i,   // "my electricity bill"
        /([A-Za-z\s]+)\s+bill/i,        // "electricity bill"
        /bill\s+to\s+([A-Za-z\s]+)/i    // "bill to Internet Provider"
      ];

      for (const pattern of patterns) {
        const match = query.match(pattern);
        if (match) {
          biller = match[1].trim();
          break;
        }
      }

      if (amount && biller) {
        return this.transactionAgent.initiateBillPayment({
          accountNumber: '123456789',
          billerName: biller,
          amount: amount,
          description: `Payment to ${biller}`
        });
      }
    }

    // Default response for unrecognized transaction queries
    return {
      success: false,
      message: 'I couldn\'t understand the transaction details. Please provide:\n' +
              '1. The type of transaction (transfer, bill payment, etc.)\n' +
              '2. The amount\n' +
              '3. The recipient or biller name\n\n' +
              'For example: "Transfer $100 to John" or "Pay $75 to Electricity Bill"',
      data: {
        type: 'transaction_error',
        required_info: [
          'Transaction type',
          'Amount',
          'Recipient/Biller'
        ]
      }
    };
  }
}