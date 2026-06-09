import crypto from 'crypto';
import { WebhookController } from '@/controllers/webhookController';

jest.mock('@/services/paddleService', () => ({
  PaddleService: {
    processWebhook: jest.fn(),
  },
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const sign = (timestamp: number, rawBody: string, secret = process.env.PADDLE_WEBHOOK_SECRET!) => {
  return crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}:${rawBody}`)
    .digest('hex');
};

describe('WebhookController signature verification', () => {
  it('accepts a valid Paddle ts:rawBody HMAC signature', () => {
    const rawBody = '{"event_type":"transaction.completed"}';
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = `ts=${timestamp};h1=${sign(timestamp, rawBody)}`;

    expect(WebhookController.verifyWebhookSignature(rawBody, signature, process.env.PADDLE_WEBHOOK_SECRET!)).toBe(true);
  });

  it('rejects invalid signatures', () => {
    const rawBody = '{"event_type":"transaction.completed"}';
    const timestamp = Math.floor(Date.now() / 1000);

    expect(WebhookController.verifyWebhookSignature(rawBody, `ts=${timestamp};h1=bad`, process.env.PADDLE_WEBHOOK_SECRET!)).toBe(false);
  });

  it('rejects replayed signatures outside the timestamp tolerance', () => {
    const rawBody = '{"event_type":"transaction.completed"}';
    const timestamp = Math.floor(Date.now() / 1000) - 60;
    const signature = `ts=${timestamp};h1=${sign(timestamp, rawBody)}`;

    expect(WebhookController.verifyWebhookSignature(rawBody, signature, process.env.PADDLE_WEBHOOK_SECRET!)).toBe(false);
  });
});
