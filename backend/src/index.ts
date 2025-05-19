import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat';
import { config } from './config';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/chat', chatRouter);

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
}); 