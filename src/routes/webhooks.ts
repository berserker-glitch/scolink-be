import { Router } from 'express';
import { WebhookController } from '@/controllers/webhookController';
import express from 'express';

const router = Router();

// Paddle webhook endpoint (no auth required, uses raw body)
router.post('/paddle', 
  express.raw({ type: 'application/json' }), // Get raw body for signature verification
  WebhookController.handlePaddleWebhook
);

export default router;
