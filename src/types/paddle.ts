// Paddle-related types

export interface PaddleWebhookEvent {
  event_id: string;
  event_type: string;
  occurred_at: string;
  notification_id: string;
  data: any;
}

export interface PaddleTransactionCompleted {
  id: string;
  status: string;
  customer_id: string;
  currency_code: string;
  origin: string;
  subscription_id?: string;
  invoice_id?: string;
  invoice_number?: string;
  collection_mode: string;
  discount_id?: string;
  billing_details: {
    enable_checkout: boolean;
    purchase_order_number?: string;
    additional_information?: string;
    payment_terms: {
      interval: string;
      frequency: number;
    };
  };
  billing_period?: {
    ends_at: string;
    starts_at: string;
  };
  details: {
    tax_rates_used: any[];
    totals: {
      subtotal: string;
      discount: string;
      tax: string;
      total: string;
      grand_total: string;
      fee?: string;
      earnings?: string;
      currency_code: string;
    };
  };
  items: Array<{
    price_id: string;
    quantity: number;
    proration?: {
      rate: string;
      billing_period: {
        starts_at: string;
        ends_at: string;
      };
    };
  }>;
  payments: Array<{
    amount: string;
    status: string;
    created_at: string;
    captured_at?: string;
    method_details: {
      card?: {
        type: string;
        last4: string;
        expiry_month: number;
        expiry_year: number;
      };
      type: string;
    };
  }>;
  checkout?: {
    url?: string;
  };
  receipt_url?: string;
  created_at: string;
  updated_at: string;
  billed_at?: string;
  paid_at?: string;
  custom_data?: {
    [key: string]: any;
  };
}

export interface PaddleSubscriptionUpdated {
  id: string;
  status: string;
  customer_id: string;
  address_id?: string;
  business_id?: string;
  currency_code: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  first_billed_at?: string;
  next_billed_at?: string;
  paused_at?: string;
  canceled_at?: string;
  discount_id?: string;
  collection_mode: string;
  billing_details: {
    enable_checkout: boolean;
    purchase_order_number?: string;
    additional_information?: string;
    payment_terms: {
      interval: string;
      frequency: number;
    };
  };
  current_billing_period?: {
    starts_at: string;
    ends_at: string;
  };
  billing_cycle: {
    interval: string;
    frequency: number;
  };
  recurring_transaction_details?: {
    tax_rates_used: any[];
    totals: {
      subtotal: string;
      discount: string;
      tax: string;
      total: string;
      grand_total: string;
      currency_code: string;
    };
  };
  scheduled_change?: {
    action: string;
    effective_at: string;
    resume_at?: string;
  };
  items: Array<{
    status: string;
    quantity: number;
    recurring: boolean;
    created_at: string;
    updated_at: string;
    previously_billed_at?: string;
    next_billed_at?: string;
    trial_dates?: {
      starts_at: string;
      ends_at: string;
    };
    price: {
      id: string;
      name?: string;
      description?: string;
      product_id: string;
      billing_cycle: {
        interval: string;
        frequency: number;
      };
      trial_period?: {
        interval: string;
        frequency: number;
      };
      tax_mode: string;
      unit_price: {
        amount: string;
        currency_code: string;
      };
      custom_data?: {
        [key: string]: any;
      };
    };
  }>;
  custom_data?: {
    [key: string]: any;
  };
}

export interface PaddleSubscriptionCanceled {
  id: string;
  status: string;
  customer_id: string;
  currency_code: string;
  created_at: string;
  updated_at: string;
  canceled_at: string;
  discount_id?: string;
  collection_mode: string;
  custom_data?: {
    [key: string]: any;
  };
}
