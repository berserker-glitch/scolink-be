import { PaddleSubscriptionStatus, PaddleTransactionStatus } from '@prisma/client';
import prisma from '@/config/database';
import { logger } from '@/utils/logger';
import { createError } from '@/middleware/errorHandler';

// Paddle configuration (hardcoded as requested)
export const PADDLE_CONFIG = {
  clientToken: 'test_002efe842e029f562973d724169',//'live_87ce83307a34173fb013fc11b31',
  productId: 'pro_01k63sra91ttt22p29xwxa7k6t',    //pro_01k6512x55qw0ksvfnbspqvrdh
  prices: {
    professional: 'pri_01k63sshnpmsh731qfefga6kt0', //'pri_01k6513x6vgad5x9yf01qkavgw', // $25/month
    premium: 'pri_01k641bc2ka8crnx09fw50bg5e', //'pri_01k6514j2vsd672528qrkj5tvj',     // $50/month
    lifetime: 'pri_01k641cyt65tvp34y12c44wv4e'//'pri_01k651560kcvm5xsa8s361p8ee'     // $500 one-time
  }
};

export class PaddleService {
  /**
   * Handle successful transaction from webhook
   */
  static async handleTransactionCompleted(webhookData: any): Promise<void> {
    // Debug log the webhook data structure
    logger.info('Raw webhook data structure:', {
      keys: Object.keys(webhookData),
      dataKeys: Object.keys(webhookData.data || {}),
      dataPreview: JSON.stringify(webhookData.data).substring(0, 200)
    });

    const transactionData = webhookData.data;
    const {
      subscription_id,
      customer_id,
      custom_data,
      items
    } = transactionData;

    // Try multiple possible locations for transaction ID
    const transaction_id = transactionData.id || transactionData.transaction_id || transactionData.txn_id;

    logger.info('Processing completed transaction', {
      transactionId: transaction_id,
      subscriptionId: subscription_id,
      customerId: customer_id,
      foundTransactionId: !!transaction_id
    });

    try {
      const centerId = custom_data?.centerId;
      const userId = custom_data?.userId;
      const planId = custom_data?.planId;

      if (!centerId) {
        throw new Error('Center ID not found in webhook custom data');
      }

      // Get the price ID from the first item
      const priceId = items[0]?.price?.id;
      if (!priceId) {
        throw new Error('Price ID not found in transaction items');
      }

      // Determine plan type from price ID
      const planType = this.getPlanTypeFromPriceId(priceId);
      
      // Find or create center
      const center = await prisma.center.findUnique({
        where: { id: centerId }
      });

      if (!center) {
        throw new Error(`Center not found: ${centerId}`);
      }

      // Update center plan
      const updatedCenter = await prisma.center.update({
        where: { id: centerId },
        data: {
          plan: planType,
          paddleSubscriptionId: subscription_id,
          paddleCustomerId: customer_id,
          paddlePriceId: priceId,
          subscriptionStatus: 'active',
          planUpgradedAt: new Date(), // Mark that user has completed plan selection
          planExpiresAt: planType === 'lifetime' ? null : this.calculateExpiryDate(planType)
        }
      });

      // Create or update subscription record
      if (subscription_id) {
        await this.createOrUpdateSubscription({
          centerId,
          paddleSubscriptionId: subscription_id,
          paddleCustomerId: customer_id,
          paddlePriceId: priceId,
          status: PaddleSubscriptionStatus.active,
          webhookData
        });
      }

      // Create transaction record (only if we have a transaction ID)
      if (transaction_id) {
        await this.createTransactionRecord({
          centerId,
          subscriptionId: subscription_id,
          transactionId: transaction_id,
          customerId: customer_id,
          status: PaddleTransactionStatus.completed,
          webhookData
        });
        logger.info('Transaction record created successfully');
      } else {
        logger.warn('No transaction ID found - skipping transaction record creation');
      }

      logger.info('🎉 PAYMENT SUCCESS - User plan activated!', {
        centerId,
        userId,
        planType,
        transactionId: transaction_id,
        message: 'User will be redirected to dashboard with success message'
      });

    } catch (error) {
      logger.error('Failed to process completed transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId: transaction_id
      });
      throw error;
    }
  }

  /**
   * Handle failed transaction from webhook
   */
  static async handleTransactionFailed(webhookData: any): Promise<void> {
    const {
      transaction_id,
      custom_data,
      failure_reason
    } = webhookData.data;

    logger.warn('🚫 PAYMENT FAILED - User stays on plan selection', {
      transactionId: transaction_id,
      centerId: custom_data?.centerId,
      userId: custom_data?.userId,
      planId: custom_data?.planId,
      failureReason: failure_reason,
      message: 'User will remain on plan selection page'
    });

    try {
      const centerId = custom_data?.centerId;

      if (centerId) {
        // Create transaction record for failed payment
        await this.createTransactionRecord({
          centerId,
          subscriptionId: undefined,
          transactionId: transaction_id,
          customerId: custom_data?.customerId,
          status: PaddleTransactionStatus.canceled,
          webhookData
        });

        logger.info('Failed transaction recorded', {
          transactionId: transaction_id,
          centerId
        });
      }
    } catch (error) {
      logger.error('Failed to process failed transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId: transaction_id
      });
    }
  }

  /**
   * Handle subscription updates from webhook
   */
  static async handleSubscriptionUpdated(webhookData: any): Promise<void> {
    const {
      id: subscriptionId,
      customer_id,
      status,
      current_billing_period
    } = webhookData.data;

    logger.info('Processing subscription update', {
      subscriptionId,
      customerId: customer_id,
      status
    });

    try {
      // Find subscription
      const subscription = await prisma.paddleSubscription.findUnique({
        where: { paddleSubscriptionId: subscriptionId },
        include: { center: true }
      });

      if (!subscription) {
        logger.warn('Subscription not found for update', { subscriptionId });
        return;
      }

      // Update subscription
      await prisma.paddleSubscription.update({
        where: { id: subscription.id },
        data: {
          status: this.mapPaddleSubscriptionStatus(status),
          currentPeriodStart: new Date(current_billing_period.starts_at),
          currentPeriodEnd: new Date(current_billing_period.ends_at),
          updatedAt: new Date()
        }
      });

      // Update center status
      await prisma.center.update({
        where: { id: subscription.centerId },
        data: {
          subscriptionStatus: status,
          planExpiresAt: new Date(current_billing_period.ends_at),
          nextBillingDate: new Date(current_billing_period.ends_at)
        }
      });

      logger.info('Subscription updated successfully', {
        subscriptionId,
        centerId: subscription.centerId,
        status
      });

    } catch (error) {
      logger.error('Failed to process subscription update', {
        error: error instanceof Error ? error.message : 'Unknown error',
        subscriptionId
      });
      throw error;
    }
  }

  /**
   * Handle subscription cancellation from webhook
   */
  static async handleSubscriptionCanceled(webhookData: any): Promise<void> {
    const {
      id: subscriptionId,
      status,
      canceled_at
    } = webhookData.data;

    logger.info('Processing subscription cancellation', {
      subscriptionId,
      status
    });

    try {
      // Find subscription
      const subscription = await prisma.paddleSubscription.findUnique({
        where: { paddleSubscriptionId: subscriptionId },
        include: { center: true }
      });

      if (!subscription) {
        logger.warn('Subscription not found for cancellation', { subscriptionId });
        return;
      }

      // Update subscription
      await prisma.paddleSubscription.update({
        where: { id: subscription.id },
        data: {
          status: PaddleSubscriptionStatus.canceled,
          canceledAt: new Date(canceled_at),
          updatedAt: new Date()
        }
      });

      // Update center to basic plan
      await prisma.center.update({
        where: { id: subscription.centerId },
        data: {
          plan: 'basic',
          subscriptionStatus: 'canceled',
          planExpiresAt: null,
          nextBillingDate: null
        }
      });

      logger.info('Subscription canceled successfully', {
        subscriptionId,
        centerId: subscription.centerId
      });

    } catch (error) {
      logger.error('Failed to process subscription cancellation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        subscriptionId
      });
      throw error;
    }
  }

  /**
   * Create or update subscription record
   */
  private static async createOrUpdateSubscription(params: {
    centerId: string;
    paddleSubscriptionId: string;
    paddleCustomerId: string;
    paddlePriceId: string;
    status: PaddleSubscriptionStatus;
    webhookData: any;
  }) {
    const { webhookData } = params;
    const subscriptionData = webhookData.data;

    const subscription = await prisma.paddleSubscription.upsert({
      where: { paddleSubscriptionId: params.paddleSubscriptionId },
      create: {
        centerId: params.centerId,
        paddleSubscriptionId: params.paddleSubscriptionId,
        paddleCustomerId: params.paddleCustomerId,
        paddlePriceId: params.paddlePriceId,
        status: params.status,
        currentPeriodStart: new Date(subscriptionData.current_billing_period?.starts_at || Date.now()),
        currentPeriodEnd: new Date(subscriptionData.current_billing_period?.ends_at || Date.now() + 30 * 24 * 60 * 60 * 1000),
        trialStart: subscriptionData.trial_dates?.starts_at ? new Date(subscriptionData.trial_dates.starts_at) : null,
        trialEnd: subscriptionData.trial_dates?.ends_at ? new Date(subscriptionData.trial_dates.ends_at) : null
      },
      update: {
        status: params.status,
        paddlePriceId: params.paddlePriceId,
        currentPeriodStart: new Date(subscriptionData.current_billing_period?.starts_at || Date.now()),
        currentPeriodEnd: new Date(subscriptionData.current_billing_period?.ends_at || Date.now() + 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    });

    return subscription;
  }

  /**
   * Create transaction record
   */
  private static async createTransactionRecord(params: {
    centerId: string;
    subscriptionId?: string;
    transactionId: string;
    customerId: string;
    status: PaddleTransactionStatus;
    webhookData: any;
  }) {
    const { webhookData } = params;
    const transactionData = webhookData.data;

    // Find subscription if exists
    let subscription = null;
    if (params.subscriptionId) {
      subscription = await prisma.paddleSubscription.findUnique({
        where: { paddleSubscriptionId: params.subscriptionId }
      });
    }

    const transaction = await prisma.paddleTransaction.create({
      data: {
        subscriptionId: subscription?.id || null,
        paddleTransactionId: params.transactionId,
        paddleSubscriptionId: params.subscriptionId || null,
        paddleCustomerId: params.customerId,
        status: params.status,
        amount: parseFloat(transactionData.details?.totals?.grand_total || '0'),
        currency: transactionData.currency_code || 'USD',
        billedAt: transactionData.billed_at ? new Date(transactionData.billed_at) : null,
        paidAt: transactionData.paid_at ? new Date(transactionData.paid_at) : null,
        receiptUrl: transactionData.receipt_url || null,
        invoiceNumber: transactionData.invoice_number || null
      }
    });

    return transaction;
  }

  /**
   * Get plan type from Paddle price ID
   */
  private static getPlanTypeFromPriceId(priceId: string): 'basic' | 'pro' | 'premium' | 'lifetime' {
    switch (priceId) {
      case PADDLE_CONFIG.prices.professional:
        return 'pro';
      case PADDLE_CONFIG.prices.premium:
        return 'premium';
      case PADDLE_CONFIG.prices.lifetime:
        return 'lifetime';
      default:
        return 'basic';
    }
  }

  /**
   * Calculate expiry date based on plan type
   */
  private static calculateExpiryDate(planType: string): Date {
    const now = new Date();
    switch (planType) {
      case 'pro':
      case 'premium':
        // Monthly plans expire in 30 days
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      case 'lifetime':
        // Lifetime plans don't expire
        return new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Map Paddle subscription status to our enum
   */
  private static mapPaddleSubscriptionStatus(paddleStatus: string): PaddleSubscriptionStatus {
    switch (paddleStatus.toLowerCase()) {
      case 'active':
        return PaddleSubscriptionStatus.active;
      case 'canceled':
      case 'cancelled':
        return PaddleSubscriptionStatus.canceled;
      case 'paused':
        return PaddleSubscriptionStatus.paused;
      case 'past_due':
        return PaddleSubscriptionStatus.past_due;
      case 'trialing':
        return PaddleSubscriptionStatus.trialing;
      default:
        return PaddleSubscriptionStatus.active;
    }
  }

  /**
   * Check if a center needs plan selection
   */
  static async centerNeedsPlanSelection(centerId: string): Promise<boolean> {
    const center = await prisma.center.findUnique({
      where: { id: centerId }
    });

    if (!center) {
      return true;
    }

    // If no plan is assigned yet, needs plan selection
    if (!center.plan) {
      return true;
    }

    // Once a plan is selected (basic, pro, premium, lifetime), no need for selection
    // unless it's a paid plan that has expired
    if (center.plan === 'basic' || center.plan === 'lifetime') {
      return false;
    }

    // For pro/premium plans, check if subscription is active and not expired
    if ((center.plan === 'pro' || center.plan === 'premium')) {
      if (center.subscriptionStatus === 'active' && center.planExpiresAt) {
        return new Date() > center.planExpiresAt;
      }
      // If no active subscription for paid plans, needs plan selection
      return !center.subscriptionStatus || center.subscriptionStatus !== 'active';
    }

    return false;
  }
}
