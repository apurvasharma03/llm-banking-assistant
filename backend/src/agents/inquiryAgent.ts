import { BankingAgent, AgentResponse } from './types';

export class InquiryAgent implements BankingAgent {
  role = 'Customer Service Representative';
  goal = 'Handle general banking inquiries and provide information';
  backstory = 'I am a knowledgeable banking professional who helps customers with their general banking questions and concerns.';
  tools: any[] = [];

  async handleInquiry(query: string): Promise<AgentResponse> {
    try {
      const queryLower = query.toLowerCase();

      // Handle account-related inquiries
      if (queryLower.includes('account') || queryLower.includes('banking')) {
        return {
          success: true,
          message: 'I can help you with:\n' +
                  '1. Account types and features\n' +
                  '2. Banking services\n' +
                  '3. Account maintenance\n' +
                  '4. Banking hours\n' +
                  '5. Branch locations',
          data: {
            type: 'account_info',
            topics: [
              'Account types',
              'Banking services',
              'Account maintenance',
              'Banking hours',
              'Branch locations'
            ]
          }
        };
      }

      // Handle service-related inquiries
      if (queryLower.includes('service') || queryLower.includes('help')) {
        return {
          success: true,
          message: 'Our banking services include:\n' +
                  '1. Online banking\n' +
                  '2. Mobile banking\n' +
                  '3. ATM services\n' +
                  '4. Bill payments\n' +
                  '5. Money transfers',
          data: {
            type: 'service_info',
            services: [
              'Online banking',
              'Mobile banking',
              'ATM services',
              'Bill payments',
              'Money transfers'
            ]
          }
        };
      }

      // Handle general inquiries
      return {
        success: true,
        message: 'How can I help you today? I can assist with:\n' +
                '1. Account information\n' +
                '2. Banking services\n' +
                '3. Transaction history\n' +
                '4. Security concerns\n' +
                '5. General banking questions',
        data: {
          type: 'general_inquiry',
          topics: [
            'Account information',
            'Banking services',
            'Transaction history',
            'Security concerns',
            'General banking'
          ]
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to handle inquiry',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 