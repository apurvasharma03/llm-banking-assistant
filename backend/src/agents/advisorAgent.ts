import { BankingAgent, AgentResponse, TransactionData } from './types';
import { CrewAIService } from '../services/crewAIService';

interface SpendingInsight {
  category: string;
  amount: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendation: string;
}

interface InvestmentRecommendation {
  type: string;
  risk: 'low' | 'medium' | 'high';
  description: string;
  expectedReturn: string;
  minimumAmount: number;
}

export class AdvisorAgent implements BankingAgent {
  role = 'Financial Advisor';
  goal = 'Provide personalized financial advice and recommendations';
  backstory = 'I am a certified financial advisor with expertise in personal finance, investment strategies, and financial planning. I help customers make informed financial decisions.';
  tools: any[] = [];

  constructor() {
  }

  async analyzeSpending(transactions: TransactionData[]): Promise<AgentResponse> {
    try {
      const crewAIService = CrewAIService.getInstance();
      const result = await crewAIService.runAgent({
        query: 'Analyze my spending',
        transactions
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
        const spendingByCategory = this.categorizeSpending(transactions);
        const insights = this.generateSpendingInsights(transactions, spendingByCategory);
        const recommendations = this.generateRecommendations(spendingByCategory, insights);
        const totalSpending = Object.values(spendingByCategory).reduce((sum, amount) => sum + amount, 0);
        const topCategories = Object.entries(spendingByCategory)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3);
        let message = 'Spending Analysis:\n\n';
        message += `Total Spending: $${totalSpending.toFixed(2)}\n\n`;
        message += 'Top Spending Categories:\n';
        topCategories.forEach(([category, amount]) => {
          const percentage = (amount / totalSpending) * 100;
          message += `- ${category}: $${amount.toFixed(2)} (${percentage.toFixed(1)}%)\n`;
        });
        message += '\nKey Insights:\n';
        insights.forEach(insight => {
          if (insight.trend !== 'stable' || insight.amount > 500) {
            message += `- ${insight.category}: ${insight.trend} trend, ${insight.recommendation}\n`;
          }
        });
        message += '\nRecommendations:\n';
        recommendations.forEach((rec, index) => {
          message += `${index + 1}. ${rec}\n`;
        });
        return {
          success: true,
          message: message,
          data: {
            spendingByCategory,
            insights,
            recommendations,
            totalSpending
          }
        };
      } catch (legacyError) {
        return {
          success: false,
          message: 'Failed to analyze spending',
          error: legacyError instanceof Error ? legacyError.message : 'Unknown error'
        };
      }
    }
  }

  private categorizeSpending(transactions: TransactionData[]): Record<string, number> {
    const categories: Record<string, number> = {};
    
    transactions.forEach(transaction => {
      if (transaction.type === 'debit') {
        const category = transaction.category || 'Uncategorized';
        categories[category] = (categories[category] || 0) + transaction.amount;
      }
    });

    return categories;
  }

  private generateSpendingInsights(
    transactions: TransactionData[],
    spendingByCategory: Record<string, number>
  ): SpendingInsight[] {
    const insights: SpendingInsight[] = [];
    const totalSpending = Object.values(spendingByCategory).reduce((sum, amount) => sum + amount, 0);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    Object.entries(spendingByCategory).forEach(([category, amount]) => {
      const percentage = (amount / totalSpending) * 100;
      
      // Calculate trend
      const recentTransactions = transactions.filter(t => 
        t.category === category && t.date >= oneMonthAgo
      );
      const olderTransactions = transactions.filter(t => 
        t.category === category && t.date < oneMonthAgo
      );
      
      const recentTotal = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
      const olderTotal = olderTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (recentTotal > olderTotal * 1.1) trend = 'increasing';
      else if (recentTotal < olderTotal * 0.9) trend = 'decreasing';

      insights.push({
        category,
        amount,
        percentage,
        trend,
        recommendation: this.generateCategoryRecommendation(category, amount, trend)
      });
    });

    return insights;
  }

  private generateCategoryRecommendation(
    category: string,
    amount: number,
    trend: 'increasing' | 'decreasing' | 'stable'
  ): string {
    const thresholds: Record<string, number> = {
      'Shopping': 500,
      'Dining': 300,
      'Entertainment': 200,
      'Transportation': 400,
      'Utilities': 600
    };

    const threshold = thresholds[category] || 1000;
    
    if (amount > threshold) {
      return `Consider reducing your ${category} spending. Current spending is above recommended threshold.`;
    } else if (trend === 'increasing') {
      return `Your ${category} spending is increasing. Monitor this trend to stay within budget.`;
    } else if (trend === 'decreasing') {
      return `Good job reducing your ${category} spending! Keep up the good work.`;
    }
    
    return `Your ${category} spending is within normal range.`;
  }

  private generateRecommendations(
    spendingByCategory: Record<string, number>,
    insights: SpendingInsight[]
  ): string[] {
    const recommendations: string[] = [];
    const totalSpending = Object.values(spendingByCategory).reduce((sum, amount) => sum + amount, 0);

    // Analyze spending patterns
    const highSpendingCategories = insights.filter(insight => 
      insight.percentage > 30 || insight.trend === 'increasing'
    );

    highSpendingCategories.forEach(insight => {
      recommendations.push(insight.recommendation);
    });

    // Add investment recommendations if spending is under control
    if (highSpendingCategories.length === 0) {
      const investmentAdvice = this.getInvestmentRecommendations(totalSpending);
      recommendations.push(...investmentAdvice.map(rec => rec.description));
    }

    if (recommendations.length === 0) {
      recommendations.push('Your spending patterns look healthy. Keep up the good work!');
    }

    return recommendations;
  }

  private getInvestmentRecommendations(totalSpending: number): InvestmentRecommendation[] {
    const recommendations: InvestmentRecommendation[] = [];

    // Add recommendations based on spending patterns
    if (totalSpending < 2000) {
      recommendations.push({
        type: 'Emergency Fund',
        risk: 'low',
        description: 'Build an emergency fund with 3-6 months of expenses before investing.',
        expectedReturn: '2-3%',
        minimumAmount: 1000
      });
    } else {
      recommendations.push({
        type: 'Diversified Portfolio',
        risk: 'medium',
        description: 'Consider a balanced portfolio of stocks and bonds for long-term growth.',
        expectedReturn: '6-8%',
        minimumAmount: 5000
      });
    }

    return recommendations;
  }

  async provideAdvice(query: string): Promise<AgentResponse> {
    try {
      const crewAIService = CrewAIService.getInstance();
      const result = await crewAIService.runAgent({ query });
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
        const queryLower = query.toLowerCase();
        if (queryLower.includes('save') || queryLower.includes('saving')) {
          return {
            success: true,
            message: 'Here are some tips to save more money:\n' +
                    '1. Create a monthly budget and stick to it\n' +
                    '2. Set up automatic savings transfers\n' +
                    '3. Reduce unnecessary subscriptions\n' +
                    '4. Cook meals at home instead of eating out\n' +
                    '5. Use cashback and reward programs',
            data: {
              type: 'savings_advice',
              tips: [
                'Create a monthly budget',
                'Set up automatic savings',
                'Reduce subscriptions',
                'Cook at home',
                'Use reward programs'
              ]
            }
          };
        }
        if (queryLower.includes('invest') || queryLower.includes('investment')) {
          return {
            success: true,
            message: 'Here are some investment recommendations:\n' +
                    '1. Start with a diversified portfolio\n' +
                    '2. Consider index funds for long-term growth\n' +
                    '3. Don\'t put all your eggs in one basket\n' +
                    '4. Invest regularly through dollar-cost averaging\n' +
                    '5. Consider your risk tolerance',
            data: {
              type: 'investment_advice',
              recommendations: [
                'Diversified portfolio',
                'Index funds',
                'Risk management',
                'Regular investing',
                'Risk assessment'
              ]
            }
          };
        }
        return {
          success: true,
          message: 'I can help you with:\n' +
                  '1. Saving strategies\n' +
                  '2. Investment advice\n' +
                  '3. Budget planning\n' +
                  '4. Debt management\n' +
                  '5. Financial goal setting\n\n' +
                  'What specific area would you like to focus on?',
          data: {
            type: 'general_advice',
            topics: [
              'Saving strategies',
              'Investment advice',
              'Budget planning',
              'Debt management',
              'Financial goals'
            ]
          }
        };
      } catch (legacyError) {
        return {
          success: false,
          message: 'Failed to provide financial advice',
          error: legacyError instanceof Error ? legacyError.message : 'Unknown error'
        };
      }
    }
  }
} 