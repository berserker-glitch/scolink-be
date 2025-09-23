-- Migration to add plan fields to centers table

-- Add the plan enum type
ALTER TABLE centers 
ADD COLUMN plan ENUM('basic', 'pro', 'premium', 'lifetime') NOT NULL DEFAULT 'basic';

-- Add plan expiry and upgrade tracking fields
ALTER TABLE centers 
ADD COLUMN plan_expires_at TIMESTAMP NULL,
ADD COLUMN plan_upgraded_at TIMESTAMP NULL;

-- Update existing centers to have lifetime plan (since they were created by super admin)
UPDATE centers 
SET plan = 'lifetime', 
    plan_upgraded_at = NOW() 
WHERE plan = 'basic';

-- Create index for efficient plan expiry queries
CREATE INDEX idx_centers_plan_expiry ON centers (plan, plan_expires_at);
