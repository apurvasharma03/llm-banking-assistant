import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat';
import { config } from './config';
import fs from 'fs';
import path from 'path';
import customersRouter from './routes/customers';

const app = express();

// Middleware - Simplified CORS for development
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Load synthetic data
const customers = JSON.parse(fs.readFileSync(path.join(__dirname, '../customers.json'), 'utf-8'));
const accounts = JSON.parse(fs.readFileSync(path.join(__dirname, '../accounts.json'), 'utf-8'));
const transactions = JSON.parse(fs.readFileSync(path.join(__dirname, '../transactions.json'), 'utf-8'));

app.locals.customers = customers;
app.locals.accounts = accounts;
app.locals.transactions = transactions;

// Routes
app.use('/api/chat', chatRouter);
app.use('/api/customers', customersRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'ok',
    config: {
      port: config.port,
      frontendUrl: config.frontendUrl
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

app.listen(config.port, () => {
  console.log('=================================');
  console.log(`Server is running on port ${config.port}`);
  console.log(`Frontend URL: ${config.frontendUrl}`);
  console.log('=================================');
  
  // Add a small delay to ensure all middleware and routes are properly initialized
  setTimeout(() => {
    console.log('✅ Backend is fully initialized and ready to accept requests');
  }, 1000);
}); 