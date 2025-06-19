import { config } from '../config';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export class CrewAIService {
  private static instance: CrewAIService;
  private readonly scriptPath: string;

  private constructor() {
    // Path to the Python script
    this.scriptPath = path.resolve(__dirname, '../../crew_agent.py');
  }

  public static getInstance(): CrewAIService {
    if (!CrewAIService.instance) {
      CrewAIService.instance = new CrewAIService();
    }
    return CrewAIService.instance;
  }

  async runAgent(input: any): Promise<any> {
    // Enhanced input data for the multi-agent CrewAI system
    const enhancedInput = {
      query: input.query || '',
      userId: input.userId || 'user123',
      mockBalance: input.mockBalance || 5000.0,
      transactionHistory: input.transactionHistory || [],
      amount: input.amount || 0,
      type: input.type || '',
      description: input.description || '',
      category: input.category || '',
      merchant: input.merchant || '',
      location: input.location || '',
      // Add any additional context that might be useful for the agents
      timestamp: new Date().toISOString(),
      sessionId: input.sessionId || null
    };

    // Write enhanced input to a temporary JSON file
    const inputFile = path.resolve(__dirname, '../../crew_input.json');
    fs.writeFileSync(inputFile, JSON.stringify(enhancedInput, null, 2));

    return new Promise((resolve, reject) => {
      const python = spawn('python', [this.scriptPath, inputFile]);
      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      python.stderr.on('data', (data) => {
        error += data.toString();
      });
      python.on('close', (code) => {
        fs.unlinkSync(inputFile); // Clean up temp file
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (e) {
            reject({ 
              success: false, 
              error: 'Failed to parse Python output', 
              details: output,
              fallback: 'Using fallback response due to parsing error'
            });
          }
        } else {
          reject({ 
            success: false, 
            error: error || 'Python script failed', 
            details: output,
            fallback: 'Using fallback response due to CrewAI error'
          });
        }
      });
    });
  }
} 