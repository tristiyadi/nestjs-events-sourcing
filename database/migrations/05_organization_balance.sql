CREATE TABLE IF NOT EXISTS organization_balance (
  organization_id VARCHAR(100) PRIMARY KEY,
  organization_name VARCHAR(200),
  balance decimal(15,4) NOT NULL,
  status BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
