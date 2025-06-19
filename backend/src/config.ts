import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
const result = dotenv.config({ path: path.join(__dirname, '../.env') });

if (result.error) {
  console.warn('Warning: .env file not found, using default values');
}

// Use default values if environment variables are not set
export const config = {
  port: process.env.PORT || '3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  ollama: {
    apiUrl: process.env.OLLAMA_API_URL || 'http://127.0.0.1:11434',
    model: process.env.OLLAMA_MODEL || 'mistral'
  },
  crewai: {
    apiKey: process.env.CREWAI_API_KEY || '',
    apiUrl: process.env.CREWAI_API_URL || ''
  }
}; 