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
    // Write input to a temporary JSON file
    const inputFile = path.resolve(__dirname, '../../crew_input.json');
    fs.writeFileSync(inputFile, JSON.stringify(input));

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
            resolve(JSON.parse(output));
          } catch (e) {
            reject({ success: false, error: 'Failed to parse Python output', details: output });
          }
        } else {
          reject({ success: false, error: error || 'Python script failed', details: output });
        }
      });
    });
  }
} 