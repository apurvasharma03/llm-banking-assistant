import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat';
import { config } from './config';
import fs from 'fs';
import path from 'path';
import customersRouter from './routes/customers';
import { Server } from 'http';

const app = express();

// Middleware - Simplified CORS for development
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase JSON payload limit and timeout
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Set timeout for all requests
app.use((req, res, next) => {
  // Set timeout to 60 seconds for all requests
  req.setTimeout(60000);
  res.setTimeout(60000);
  next();
});

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

let server: Server;

// Function to start the server
export function startServer(port?: string): Promise<Server> {
  return new Promise((resolve) => {
    const serverPort = port || config.port;
    
    // Add memory cleanup
    const cleanup = () => {
      if (global.gc) {
        global.gc();
      }
    };
    
    // Clean up memory every 30 seconds
    const memoryCleanupInterval = setInterval(cleanup, 30000);
    
    server = app.listen(serverPort, () => {
      console.log('=================================');
      console.log(`Server is running on port ${serverPort}`);
      console.log(`Frontend URL: ${config.frontendUrl}`);
      console.log('=================================');
      
      // Add a small delay to ensure all middleware and routes are properly initialized
      setTimeout(() => {
        console.log('✅ Backend is fully initialized and ready to accept requests');
        resolve(server);
      }, 1000);
    });

    // Set server timeout to 60 seconds
    server.timeout = 60000;
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
      clearInterval(memoryCleanupInterval);
    });
    
    // Handle server close
    server.on('close', () => {
      console.log('Server closing, cleaning up...');
      clearInterval(memoryCleanupInterval);
      cleanup();
    });
  });
}

// Function to stop the server
export function stopServer(): Promise<void> {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('Server stopped');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// Export the app for testing
export { app };

// Start server if this file is run directly
if (require.main === module) {
  startServer();
} 