CREATE TABLE IF NOT EXISTS card (
  card_id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  card_number VARCHAR(100) UNIQUE NOT NULL,
  daily_limit BIGINT NOT NULL,
  monthly_limit BIGINT NOT NULL,
  status BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_card_organization_id ON card(organization_id);
