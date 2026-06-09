import { Request, Response } from 'express';
import { PaddleService } from '@/services/paddleService';
import { logger } from '@/utils/logger';
import env from '@/config/env';
import crypto from 'crypto';

const WEBHOOK_TOLERANCE_SECONDS = 5;

export class WebhookController {
  static handlePaddleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers['paddle-signature'];

      if (!env.PADDLE_WEBHOOK_SECRET) {
        logger.error('Paddle webhook secret is not configured');
        res.status(500).json({
          success: false,
          message: 'Webhook configuration error',
          errors: ['Webhook secret is not configured'],
        });
        return;
      }

      if (!signature || Array.isArray(signature)) {
        logger.warn('Webhook received without a valid signature header');
        res.status(400).json({
          success: false,
          message: 'Missing webhook signature',
          errors: ['Paddle-Signature header is required'],
        });
        return;
      }

      const rawBody = Buffer.isBuffer(req.body)
        ? req.body.toString('utf8')
        : typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body);

      if (!this.verifyWebhookSignature(rawBody, signature, env.PADDLE_WEBHOOK_SECRET)) {
        logger.warn('Invalid Paddle webhook signature');
        res.status(401).json({
          success: false,
          message: 'Invalid webhook signature',
          errors: ['Webhook signature verification failed'],
        });
        return;
      }

      const eventData = JSON.parse(rawBody);
      const eventType = eventData.event_type;

      logger.info('Received verified Paddle webhook', {
        eventType,
        eventId: eventData.event_id,
      });

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
      });

      res.status(500).json({
        success: false,
        message: 'Webhook processing failed',
        errors: ['Internal server error'],
      });
    }
  };

  static verifyWebhookSignature(
    rawBody: string,
    signatureHeader: string,
    secret: string,
    toleranceSeconds = WEBHOOK_TOLERANCE_SECONDS
  ): boolean {
    try {
      const parts = signatureHeader.split(';').reduce<Record<string, string[]>>((acc, part) => {
        const separatorIndex = part.indexOf('=');
        if (separatorIndex === -1) {
          return acc;
        }

        const key = part.slice(0, separatorIndex).trim();
        const value = part.slice(separatorIndex + 1).trim();
        acc[key] = [...(acc[key] || []), value];
        return acc;
      }, {});

      const timestamp = parts.ts?.[0];
      const signatures = parts.h1 || [];

      if (!timestamp || signatures.length === 0) {
        return false;
      }

      const timestampNumber = Number(timestamp);
      if (!Number.isFinite(timestampNumber)) {
        return false;
      }

      const nowSeconds = Math.floor(Date.now() / 1000);
      if (Math.abs(nowSeconds - timestampNumber) > toleranceSeconds) {
        return false;
      }

      const expected = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}:${rawBody}`)
        .digest('hex');

      const expectedBuffer = Buffer.from(expected, 'hex');

      return signatures.some((receivedSignature) => {
        const receivedBuffer = Buffer.from(receivedSignature, 'hex');
        return receivedBuffer.length === expectedBuffer.length
          && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
      });
    } catch (error) {
      logger.error('Webhook signature verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}
