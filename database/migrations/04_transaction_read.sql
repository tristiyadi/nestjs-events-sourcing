CREATE TABLE IF NOT EXISTS transaction_read (
  transaction_id UUID PRIMARY KEY,
  card_id VARCHAR(100),
  amount decimal(15,4),
  status VARCHAR(30) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaction_read_id ON transaction_read(transaction_id);
