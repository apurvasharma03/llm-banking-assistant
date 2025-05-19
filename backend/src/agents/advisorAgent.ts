import { BankingAgent, AgentResponse, TransactionData } from './types';

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

  async analyzeSpending(transactions: TransactionData[]): Promise<AgentResponse> {
    try {
      const spendingByCategory = this.categorizeSpending(transactions);
      const insights = this.generateSpendingInsights(transactions, spendingByCategory);
      const recommendations = this.generateRecommendations(spendingByCategory, insights);

      // Format the response message with key insights
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
    } catch (error) {
      return {
        success: false,
        message: 'Failed to analyze spending',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
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
      const queryLower = query.toLowerCase();
      let advice = '';

      // Investment advice
      if (queryLower.includes('invest') || queryLower.includes('investment')) {
        advice = 'Here are some investment recommendations:\n' +
                '1. Diversify your portfolio across different asset classes\n' +
                '2. Consider index funds for long-term growth\n' +
                '3. Start with a retirement account (IRA/401k)\n' +
                '4. Research before investing in individual stocks\n' +
                '5. Consider your risk tolerance and time horizon';
      }
      // Saving advice
      else if (queryLower.includes('save') || queryLower.includes('saving')) {
        advice = 'Here are some saving strategies:\n' +
                '1. Follow the 50/30/20 rule (50% needs, 30% wants, 20% savings)\n' +
                '2. Set up automatic transfers to savings\n' +
                '3. Create an emergency fund (3-6 months of expenses)\n' +
                '4. Look for high-yield savings accounts\n' +
                '5. Track your spending to identify saving opportunities';
      }
      // Budget advice
      else if (queryLower.includes('budget') || queryLower.includes('spending')) {
        advice = 'Here are some budgeting tips:\n' +
                '1. Track all your expenses for a month\n' +
                '2. Categorize your spending\n' +
                '3. Set realistic spending limits\n' +
                '4. Use budgeting apps to stay on track\n' +
                '5. Review and adjust your budget regularly';
      }
      // General financial advice
      else {
        advice = 'Here are some general financial tips:\n' +
                '1. Build an emergency fund\n' +
                '2. Pay off high-interest debt first\n' +
                '3. Start saving for retirement early\n' +
                '4. Review your insurance coverage\n' +
                '5. Create a financial plan\n\n' +
                'Would you like specific advice about:\n' +
                '- Investing\n' +
                '- Saving\n' +
                '- Budgeting\n' +
                '- Debt management\n' +
                '- Retirement planning';
      }

      return {
        success: true,
        message: advice,
        data: {
          type: 'advice',
          query: query,
          suggestions: [
            'Would you like to know more about investing?',
            'Would you like to learn about saving strategies?',
            'Would you like help with budgeting?'
          ]
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to provide financial advice',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 