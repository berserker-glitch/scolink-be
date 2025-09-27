-- Migration to add Paddle payment integration fields

-- Add Paddle subscription fields to centers table
ALTER TABLE centers 
ADD COLUMN paddle_subscription_id VARCHAR(255) NULL,
ADD COLUMN paddle_customer_id VARCHAR(255) NULL,
ADD COLUMN paddle_price_id VARCHAR(255) NULL,
ADD COLUMN subscription_status VARCHAR(50) NULL COMMENT 'active, canceled, paused, past_due, trialing',
ADD COLUMN next_billing_date TIMESTAMP NULL;

-- Create paddle_subscriptions table
CREATE TABLE paddle_subscriptions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    center_id CHAR(36) NOT NULL,
    paddle_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    paddle_customer_id VARCHAR(255) NOT NULL,
    paddle_price_id VARCHAR(255) NOT NULL,
    status ENUM('active', 'canceled', 'paused', 'past_due', 'trialing') NOT NULL,
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP NULL,
    trial_start TIMESTAMP NULL,
    trial_end TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
    INDEX idx_paddle_subscription (paddle_subscription_id),
    INDEX idx_center (center_id),
    INDEX idx_status (status)
);

-- Create paddle_transactions table
CREATE TABLE paddle_transactions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    subscription_id CHAR(36) NULL,
    paddle_transaction_id VARCHAR(255) UNIQUE NOT NULL,
    paddle_subscription_id VARCHAR(255) NULL,
    paddle_customer_id VARCHAR(255) NOT NULL,
    status ENUM('billed', 'paid', 'completed', 'canceled', 'past_due') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    billed_at TIMESTAMP NULL,
    paid_at TIMESTAMP NULL,
    receipt_url TEXT NULL,
    invoice_number VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (subscription_id) REFERENCES paddle_subscriptions(id) ON DELETE SET NULL,
    INDEX idx_paddle_transaction (paddle_transaction_id),
    INDEX idx_subscription (subscription_id),
    INDEX idx_status (status)
);
