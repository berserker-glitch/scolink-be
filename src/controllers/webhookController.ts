import { Request, Response } from 'express';
import { PaddleService } from '@/services/paddleService';
import { logger } from '@/utils/logger';
import crypto from 'crypto';

export class WebhookController {
  // Hardcoded Paddle webhook secret key
  private static readonly PADDLE_WEBHOOK_SECRET = 'pdl_ntfset_01k6mkydhrk41a836pakt7m6gq_d98MwN+bD7RxEcC2vvq7tM/5vFSXL2hP';

  /**
   * Handle Paddle webhook events
   */
  static handlePaddleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers['paddle-signature'] as string;
      
      // Verify webhook signature for security
      if (!signature) {
        logger.warn('Webhook received without signature');
        res.status(400).json({
          success: false,
          message: 'Missing webhook signature',
          errors: ['Paddle-Signature header is required'],
        });
        return;
      }

      // Get raw body string for signature verification
      let rawBodyString: string;
      let eventData: any;

      if (Buffer.isBuffer(req.body)) {
        // Body is raw buffer (expected from express.raw middleware)
        rawBodyString = req.body.toString('utf8');
        eventData = JSON.parse(rawBodyString);
      } else if (typeof req.body === 'object') {
        // Body was already parsed as JSON (fallback)
        eventData = req.body;
        rawBodyString = JSON.stringify(req.body);
      } else {
        // Body is string
        rawBodyString = req.body;
        eventData = JSON.parse(rawBodyString);
      }

      // Debug logging for signature verification
      logger.info('Webhook signature verification debug', {
        bodyType: Buffer.isBuffer(req.body) ? 'Buffer' : typeof req.body,
        bodyLength: rawBodyString.length,
        signature,
        bodyPreview: rawBodyString.substring(0, 100) + '...'
      });

      // Verify the signature using the raw string
      const isValidSignature = this.verifyWebhookSignature(
        rawBodyString, 
        signature, 
        this.PADDLE_WEBHOOK_SECRET
      );

      if (!isValidSignature) {
        logger.warn('Invalid webhook signature', { signature });
        res.status(401).json({
          success: false,
          message: 'Invalid webhook signature',
          errors: ['Webhook signature verification failed'],
        });
        return;
      }
      
      logger.info('Received verified Paddle webhook', {
        eventType: eventData.event_type,
        eventId: eventData.event_id
      });

      const eventType = eventData.event_type;
      
      switch (eventType) {
        case 'transaction.completed':
        case 'transaction.paid':
          await PaddleService.handleTransactionCompleted(eventData);
          break;
          
        case 'transaction.canceled':
        case 'transaction.failed':
          await PaddleService.handleTransactionFailed(eventData);
          break;
          
        case 'subscription.activated':
        case 'subscription.updated':
          await PaddleService.handleSubscriptionUpdated(eventData);
          break;
          
        case 'subscription.canceled':
        case 'subscription.cancelled':
          await PaddleService.handleSubscriptionCanceled(eventData);
          break;
          
        default:
          logger.info('Unhandled webhook event type', { eventType });
      }
      
      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
      });

    } catch (error) {
      logger.error('Webhook processing failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        bodySize: req.body ? req.body.length : 0
      });
      
      res.status(500).json({
        success: false,
        message: 'Webhook processing failed',
        errors: ['Internal server error'],
      });
    }
  };

  /**
   * Verify Paddle webhook signature
   * Paddle uses HMAC-SHA256 with a specific format
   */
  private static verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
    try {
      logger.info('=== SIGNATURE VERIFICATION DEBUG ===');
      
      // Parse Paddle signature header (format: "ts=timestamp;h1=signature")
      const parts = signature.split(';');
      logger.info('Signature parts:', { parts });
      
      const timestamp = parts.find(part => part.startsWith('ts='))?.substring(3);
      const signatureHash = parts.find(part => part.startsWith('h1='))?.substring(3);
      
      logger.info('Parsed signature components:', {
        timestamp,
        signatureHash,
        secretPreview: secret.substring(0, 20) + '...'
      });
      
      if (!signatureHash) {
        logger.error('Invalid signature format - missing h1 parameter');
        return false;
      }

      // Try different signature methods that Paddle might use
      const methods = [
        {
          name: 'Body only',
          data: body
        },
        {
          name: 'Timestamp + body', 
          data: timestamp + body
        },
        {
          name: 'Timestamp:body format',
          data: `${timestamp}:${body}`
        },
        {
          name: 'ts + body (no separator)',
          data: timestamp + body
        }
      ];

      for (const method of methods) {
        const expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(method.data)
          .digest('hex');
          
        logger.info(`Testing ${method.name}:`, {
          dataLength: method.data.length,
          dataPreview: method.data.substring(0, 50) + '...',
          expectedSignature,
          receivedSignature: signatureHash,
          match: expectedSignature === signatureHash
        });
        
        if (expectedSignature === signatureHash) {
          logger.info(`✅ Signature verification SUCCESS using: ${method.name}`);
          return true;
        }
      }

      logger.warn('❌ All signature verification methods failed');
      return false;
      
    } catch (error) {
      logger.error('Webhook signature verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        signature
      });
      return false;
    }
  }
}
