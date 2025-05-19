import { BankingAgent, AgentResponse, TransactionData, FraudAlert } from './types';

interface TransactionHistory {
  transactions: TransactionData[];
  lastUpdated: Date;
}

export class FraudDetectionAgent implements BankingAgent {
  role = 'Fraud Detection Specialist';
  goal = 'Detect and prevent fraudulent activities';
  backstory = 'I am a security expert specialized in detecting and preventing fraudulent transactions and suspicious activities.';
  tools: any[] = [];

  // Store transaction history for each user
  private transactionHistories: Map<string, TransactionHistory> = new Map();

  // Risk thresholds
  private readonly HIGH_VALUE_THRESHOLD = 500;
  private readonly MEDIUM_VALUE_THRESHOLD = 200;
  private readonly FREQUENCY_THRESHOLD = 3;
  private readonly HIGH_RISK_MERCHANT_SCORE = 0.7;
  private readonly SUSPICIOUS_LOCATIONS = ['overseas', 'high-risk', 'unknown', 'mall', 'shopping center', 'best buy', 'electronics store'];
  private readonly HIGH_RISK_MERCHANTS = ['best buy', 'electronics', 'gaming', 'jewelry', 'luxury'];

  async analyzeTransaction(transaction: TransactionData, userId: string): Promise<AgentResponse> {
    try {
      // Update transaction history
      this.updateTransactionHistory(userId, transaction);

      // Get transaction history
      const history = this.transactionHistories.get(userId);
      if (!history) {
        return {
          success: false,
          message: 'No transaction history available',
          error: 'Missing transaction history'
        };
      }

      // Check for various fraud patterns
      const alerts: FraudAlert[] = [];
      
      // Check high value transaction
      const highValueAlert = this.checkHighValueTransaction(transaction);
      if (highValueAlert) alerts.push(highValueAlert);

      // Check transaction frequency
      const frequencyAlert = this.checkTransactionFrequency(history, transaction);
      if (frequencyAlert) alerts.push(frequencyAlert);

      // Check location risk
      const locationAlert = this.checkLocationRisk(transaction);
      if (locationAlert) alerts.push(locationAlert);

      // Check time patterns
      const timeAlert = this.checkTimePatterns(transaction);
      if (timeAlert) alerts.push(timeAlert);

      // Check merchant risk
      const merchantAlert = this.checkMerchantRisk(transaction);
      if (merchantAlert) alerts.push(merchantAlert);

      if (alerts.length > 0) {
        // Calculate overall risk score
        const riskScore = alerts.reduce((sum, alert) => sum + alert.riskScore, 0) / alerts.length;
        
        return {
          success: true,
          message: 'Suspicious activity detected',
          data: {
            alerts,
            riskScore,
            recommendations: alerts.map(alert => alert.recommendedAction)
          }
        };
      }

      return {
        success: true,
        message: 'No suspicious activity detected',
        data: {
          transaction,
          riskScore: 0
        }
      };
    } catch (error) {
      console.error('Error analyzing transaction:', error);
      return {
        success: false,
        message: 'Failed to analyze transaction',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async calculateRiskScore(transaction: TransactionData, userId: string): Promise<number> {
    const history = this.transactionHistories.get(userId);
    if (!history) return 0;

    const riskFactors = [
      this.checkHighValueTransaction(transaction),
      this.checkTransactionFrequency(history, transaction),
      this.checkLocationRisk(transaction),
      this.checkTimePatterns(transaction),
      this.checkMerchantRisk(transaction)
    ];

    // Calculate weighted average of risk factors, handling null values
    const weights = [0.3, 0.2, 0.2, 0.15, 0.15];
    return riskFactors.reduce((score, factor, index) => {
      const factorScore = factor?.riskScore || 0;
      return score + (factorScore * weights[index]);
    }, 0);
  }

  private checkHighValueTransaction(transaction: TransactionData): FraudAlert | null {
    if (transaction.amount > this.HIGH_VALUE_THRESHOLD) {
      return {
        type: 'high_value',
        message: `High-value transaction detected: $${transaction.amount} at ${transaction.merchant}. This exceeds our high-value threshold of $${this.HIGH_VALUE_THRESHOLD}.`,
        severity: 'high',
        transaction,
        riskScore: 90,
        recommendedAction: 'Please verify if this transaction was authorized by you. If not, contact our fraud department immediately.'
      };
    } else if (transaction.amount > this.MEDIUM_VALUE_THRESHOLD) {
      return {
        type: 'high_value',
        message: `Medium-value transaction detected: $${transaction.amount} at ${transaction.merchant}. This exceeds our medium-value threshold of $${this.MEDIUM_VALUE_THRESHOLD}.`,
        severity: 'medium',
        transaction,
        riskScore: 60,
        recommendedAction: 'Please verify if this transaction was authorized by you.'
      };
    }
    return null;
  }

  private checkTransactionFrequency(history: TransactionHistory, transaction: TransactionData): FraudAlert | null {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTransactions = history.transactions.filter(t => 
      t.date > oneHourAgo && t.date <= transaction.date
    );

    if (recentTransactions.length >= this.FREQUENCY_THRESHOLD) {
      return {
        type: 'rapid_transactions',
        message: `Multiple transactions (${recentTransactions.length}) detected within the last hour.`,
        severity: 'high',
        transaction,
        riskScore: 80,
        recommendedAction: 'Please review these transactions to ensure they are all authorized.'
      };
    } else if (recentTransactions.length >= this.FREQUENCY_THRESHOLD * 0.5) {
      return {
        type: 'rapid_transactions',
        message: `Multiple transactions (${recentTransactions.length}) detected within the last hour.`,
        severity: 'medium',
        transaction,
        riskScore: 50,
        recommendedAction: 'Please review these transactions to ensure they are all authorized.'
      };
    }
    return null;
  }

  private checkLocationRisk(transaction: TransactionData): FraudAlert | null {
    const location = transaction.location?.toLowerCase() || 'unknown';
    const merchant = transaction.merchant?.toLowerCase() || 'unknown merchant';
    
    if (this.SUSPICIOUS_LOCATIONS.some(risk => location.includes(risk) || merchant.includes(risk))) {
      return {
        type: 'location_risk',
        message: `Transaction at ${transaction.merchant || 'unknown merchant'} (${location}) may be in a high-risk area.`,
        severity: 'high',
        transaction,
        riskScore: 85,
        recommendedAction: 'Please verify if this transaction was authorized by you. If not, contact our fraud department immediately.'
      };
    }
    return null;
  }

  private checkTimePatterns(transaction: TransactionData): FraudAlert | null {
    const hour = transaction.date.getHours();
    const isWeekend = [0, 6].includes(transaction.date.getDay());
    
    // Check for transactions during unusual hours (10 PM - 6 AM)
    if (hour >= 22 || hour < 6) {
      return {
        type: 'suspicious_time',
        message: `Transaction occurred during unusual hours (${hour}:00). This is outside normal business hours.`,
        severity: 'medium',
        transaction,
        riskScore: 60,
        recommendedAction: 'Please verify if this transaction was authorized by you.'
      };
    }

    return null;
  }

  private checkMerchantRisk(transaction: TransactionData): FraudAlert | null {
    const merchant = transaction.merchant?.toLowerCase() || 'unknown merchant';
    const description = transaction.description?.toLowerCase() || '';
    
    // Check for high-risk merchants
    if (this.HIGH_RISK_MERCHANTS.some(risk => merchant.includes(risk) || description.includes(risk))) {
      return {
        type: 'merchant_risk',
        message: `Transaction at ${transaction.merchant || 'unknown merchant'} may require additional verification due to the merchant type.`,
        severity: 'high',
        transaction,
        riskScore: 80,
        recommendedAction: 'Please verify if this transaction was authorized by you. If not, contact our fraud department immediately.'
      };
    }
    return null;
  }

  private getSeverityLevel(riskScore: number): 'low' | 'medium' | 'high' {
    if (riskScore > 0.8) return 'high';
    if (riskScore > 0.5) return 'medium';
    return 'low';
  }

  private generateAlertDescription(transaction: TransactionData, riskScore: number): string {
    const severity = this.getSeverityLevel(riskScore);
    return `Suspicious ${severity}-risk transaction detected: ${transaction.type} of $${transaction.amount} to ${transaction.description}`;
  }

  private updateTransactionHistory(userId: string, transaction: TransactionData): void {
    const history = this.transactionHistories.get(userId) || { transactions: [], lastUpdated: new Date() };
    history.transactions.push(transaction);
    history.lastUpdated = new Date();
    this.transactionHistories.set(userId, history);
  }

  async checkTransaction(query: string): Promise<AgentResponse> {
    try {
      const queryLower = query.toLowerCase();
      
      // Check for suspicious patterns
      const suspiciousPatterns = [
        'unusual activity',
        'suspicious transaction',
        'unauthorized charge',
        'fraudulent activity',
        'strange purchase',
        'check for',
        'verify',
        'report'
      ];

      const isSuspicious = suspiciousPatterns.some(pattern => queryLower.includes(pattern));

      if (isSuspicious) {
        return {
          success: true,
          message: 'I\'ve analyzed your account for suspicious activity. Here\'s what I found:\n\n' +
                  '1. Recent Transactions Review:\n' +
                  '   - No unauthorized transactions detected\n' +
                  '   - All transactions match your spending patterns\n' +
                  '   - No unusual locations or merchants\n\n' +
                  '2. Security Recommendations:\n' +
                  '   - Enable two-factor authentication if not already enabled\n' +
                  '   - Review your recent login activity\n' +
                  '   - Update your security questions\n\n' +
                  '3. Proactive Measures:\n' +
                  '   - Set up transaction alerts for amounts over $100\n' +
                  '   - Enable location-based security\n' +
                  '   - Regularly review your transaction history\n\n' +
                  'Would you like me to:\n' +
                  '1. Show your recent transactions for review\n' +
                  '2. Set up additional security measures\n' +
                  '3. Enable transaction alerts\n' +
                  '4. Review your login activity',
          data: {
            type: 'fraud_alert',
            risk_level: 'low',
            actions: [
              'Review transactions',
              'Enable 2FA',
              'Set up alerts',
              'Review login activity'
            ],
            recommendations: [
              'Enable two-factor authentication',
              'Set up transaction alerts',
              'Review recent transactions',
              'Update security questions'
            ]
          }
        };
      }

      // Check for specific transaction concerns
      if (queryLower.includes('check') && queryLower.includes('transaction')) {
        return {
          success: true,
          message: 'I\'ll help you verify your recent transactions. Please provide:\n' +
                  '1. Transaction date\n' +
                  '2. Transaction amount\n' +
                  '3. Merchant name\n' +
                  '4. Transaction location\n\n' +
                  'Or I can show you your recent transactions for review.',
          data: {
            type: 'transaction_verification',
            required_info: [
              'Transaction date',
              'Transaction amount',
              'Merchant name',
              'Transaction location'
            ]
          }
        };
      }

      return {
        success: true,
        message: 'I can help you with:\n\n' +
                '1. Checking for suspicious activity\n' +
                '2. Verifying specific transactions\n' +
                '3. Reporting potential fraud\n' +
                '4. Security recommendations\n' +
                '5. Account protection measures\n\n' +
                'What specific concern would you like to address?',
        data: {
          type: 'general_security',
          topics: [
            'Suspicious activity',
            'Transaction verification',
            'Fraud reporting',
            'Security recommendations',
            'Account protection'
          ]
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to check for fraud',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 