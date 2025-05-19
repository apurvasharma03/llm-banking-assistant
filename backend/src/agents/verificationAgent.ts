import { BankingAgent, AgentResponse } from './types';
import { Config } from '../config/config';

interface VerificationSession {
  id: string;
  type: 'security_question' | 'otp';
  question?: string;
  answer?: string;
  otp?: string;
  attempts: number;
  expiresAt: Date;
}

export class VerificationAgent implements BankingAgent {
  role = 'Security Verification Specialist';
  goal = 'Verify user identity securely';
  backstory = 'I am a security expert responsible for verifying user identity through security questions and OTPs.';
  tools: any[] = [];

  private verificationSessions: Map<string, VerificationSession> = new Map();
  private securityQuestions: Record<string, string> = {
    'In which city were you born?': 'New York'
  };

  async initiateVerification(): Promise<AgentResponse> {
    const question = Object.keys(this.securityQuestions)[0];
    return {
      success: true,
      message: `Please answer the following security question: ${question}`,
      data: {
        sessionId: 'mock-session-id',
        verificationStep: 'security_question'
      }
    };
  }

  async verifyAnswer(sessionId: string, answer: string): Promise<AgentResponse> {
    const question = Object.keys(this.securityQuestions)[0];
    const correctAnswer = this.securityQuestions[question];

    if (answer.toLowerCase() === correctAnswer.toLowerCase()) {
      return {
        success: true,
        message: 'Verification successful.',
        data: {
          isVerified: true
        }
      };
    } else {
      return {
        success: false,
        message: 'Incorrect answer. Please try again.',
        error: 'INCORRECT_ANSWER'
      };
    }
  }

  async generateOTP(): Promise<AgentResponse> {
    try {
      const sessionId = Math.random().toString(36).substring(7);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      const session: VerificationSession = {
        id: sessionId,
        type: 'otp',
        otp: otp,
        attempts: 0,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry
      };

      this.verificationSessions.set(sessionId, session);

      return {
        success: true,
        message: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
        data: {
          sessionId: sessionId,
          type: 'otp'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate OTP',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async verifyOTP(sessionId: string, otp: string): Promise<AgentResponse> {
    try {
      const session = this.verificationSessions.get(sessionId);
      if (!session) {
        return {
          success: false,
          message: 'Invalid or expired OTP session'
        };
      }

      if (session.expiresAt < new Date()) {
        this.verificationSessions.delete(sessionId);
        return {
          success: false,
          message: 'OTP has expired. Please request a new one.'
        };
      }

      session.attempts++;
      if (session.attempts > Config.getMaxVerificationAttempts()) {
        this.verificationSessions.delete(sessionId);
        return {
          success: false,
          message: 'Too many failed attempts. Please request a new OTP.'
        };
      }

      if (session.type === 'otp' && session.otp === otp) {
        this.verificationSessions.delete(sessionId);
        return {
          success: true,
          message: 'OTP verification successful'
        };
      }

      return {
        success: false,
        message: 'Invalid OTP. Please try again.'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to verify OTP',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 