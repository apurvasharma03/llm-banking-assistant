import { AgentResponse } from '../agents/types';

interface MemoryEntry {
  timestamp: number;
  query: string;
  response: AgentResponse;
  intent: string;
}

interface UserPreferences {
  preferredLanguage: string;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
  };
  lastLogin: number;
  frequentlyAccessedFeatures: string[];
}

export class MemoryManager {
  private shortTermMemory: Map<string, MemoryEntry[]>;
  private longTermMemory: Map<string, UserPreferences>;
  private readonly MAX_SHORT_TERM_ENTRIES = 10;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.shortTermMemory = new Map();
    this.longTermMemory = new Map();
  }

  // Short-term memory methods
  addToShortTermMemory(userId: string, query: string, response: AgentResponse, intent: string): void {
    if (!this.shortTermMemory.has(userId)) {
      this.shortTermMemory.set(userId, []);
    }

    const userMemory = this.shortTermMemory.get(userId)!;
    userMemory.push({
      timestamp: Date.now(),
      query,
      response,
      intent
    });

    // Keep only the most recent entries
    if (userMemory.length > this.MAX_SHORT_TERM_ENTRIES) {
      userMemory.shift();
    }
  }

  getShortTermMemory(userId: string): MemoryEntry[] {
    const userMemory = this.shortTermMemory.get(userId) || [];
    return userMemory.filter(entry => 
      Date.now() - entry.timestamp < this.SESSION_TIMEOUT
    );
  }

  clearShortTermMemory(userId: string): void {
    this.shortTermMemory.delete(userId);
  }

  // Long-term memory methods
  updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): void {
    const currentPreferences = this.longTermMemory.get(userId) || this.getDefaultPreferences();
    this.longTermMemory.set(userId, {
      ...currentPreferences,
      ...preferences,
      lastLogin: Date.now()
    });
  }

  getUserPreferences(userId: string): UserPreferences {
    return this.longTermMemory.get(userId) || this.getDefaultPreferences();
  }

  updateFrequentlyAccessedFeatures(userId: string, feature: string): void {
    const preferences = this.getUserPreferences(userId);
    const features = preferences.frequentlyAccessedFeatures;
    
    // Remove if exists and add to end
    const index = features.indexOf(feature);
    if (index > -1) {
      features.splice(index, 1);
    }
    features.push(feature);
    
    // Keep only the 5 most recent features
    if (features.length > 5) {
      features.shift();
    }
    
    this.updateUserPreferences(userId, { frequentlyAccessedFeatures: features });
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      preferredLanguage: 'en',
      notificationPreferences: {
        email: true,
        sms: false
      },
      lastLogin: Date.now(),
      frequentlyAccessedFeatures: []
    };
  }

  // Context analysis methods
  getContextualSuggestions(userId: string): string[] {
    const shortTerm = this.getShortTermMemory(userId);
    const preferences = this.getUserPreferences(userId);
    
    const suggestions: string[] = [];
    
    // Add suggestions based on recent queries
    if (shortTerm.length > 0) {
      const lastQuery = shortTerm[shortTerm.length - 1];
      if (lastQuery.intent === 'inquiry') {
        suggestions.push('Would you like to see your transaction history?');
      } else if (lastQuery.intent === 'transaction') {
        suggestions.push('Would you like to analyze your spending patterns?');
      }
    }
    
    // Add suggestions based on frequently accessed features
    if (preferences.frequentlyAccessedFeatures.length > 0) {
      const mostRecent = preferences.frequentlyAccessedFeatures[preferences.frequentlyAccessedFeatures.length - 1];
      suggestions.push(`Would you like to access ${mostRecent} again?`);
    }
    
    return suggestions;
  }
} 