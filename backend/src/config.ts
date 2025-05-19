import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
const result = dotenv.config({ path: path.join(__dirname, '../.env') });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

// Verify required environment variables
const requiredEnvVars = ['PORT', 'FRONTEND_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

export const config = {
  port: process.env.PORT || '3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  ollama: {
    apiUrl: process.env.OLLAMA_API_URL || 'http://127.0.0.1:11434',
    model: process.env.OLLAMA_MODEL || 'mistral'
  }
}; 