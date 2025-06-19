import { BankingAgent, AgentResponse } from './types';
import { CrewAIService } from '../services/crewAIService';

export class FinancialAdvisorAgent implements BankingAgent {
  role = 'Financial Advisor';
  goal = 'Provide financial advice and recommendations';
  backstory = 'I am a financial expert with years of experience in personal finance, investment strategies, and wealth management.';
  tools: any[] = [];
  private crewAIService: CrewAIService;

  constructor() {
    this.crewAIService = CrewAIService.getInstance();
  }

  async provideAdvice(query: string): Promise<AgentResponse> {
    try {
      const result = await this.crewAIService.runAgent({ query });
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