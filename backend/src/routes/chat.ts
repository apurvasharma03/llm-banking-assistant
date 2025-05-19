import { Router } from 'express';
import { AgentCoordinator } from '../agents/coordinator';

const router = Router();
const agentCoordinator = new AgentCoordinator();

// Store verification state
const verificationState = new Map<string, {
  isVerifying: boolean;
  sessionId: string;
  currentStep: 'security_question' | 'otp';
}>();

router.post('/message', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    if (!message || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Message and userId are required'
      });
    }

    const response = await agentCoordinator.processUserQuery(userId, message);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    if (!message || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Message and userId are required'
      });
    }

    const response = await agentCoordinator.processUserQuery(userId, message);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 