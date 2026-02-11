import { createHash } from 'crypto';

/**
 * Checksum Calculator
 * Usage: npx ts-node calculate-checksum.ts
 *
 * The checksum is calculated as:
 *   SHA256(JSON.stringify(body) + organizationId)
 *
 * Update the `body` object below to match your request payload.
 */

const body = {
  organizationId: '0fb06630-ec01-4257-ba71-0663271b1a0d',
  cardId: 'f9155395-fcd4-4921-97a5-47661974af2d',
  amount: 200.5,
  transactionKey: 'transaction-key-789',
};

const secret = '0fb06630-ec01-4257-ba71-0663271b1a0d'; // x-organization-id header value

function computeChecksum(body: object, secret: string): string {
  const payload = JSON.stringify(body).trim();
  const normalized = payload.replace(/\s+/g, '');
  return createHash('sha256')
    .update(normalized + secret)
    .digest('hex');
}

const checksum = computeChecksum(body, secret);
console.log('='.repeat(60));
console.log('Body:', JSON.stringify(body));
console.log('Secret (x-organization-id):', secret);
console.log('='.repeat(60));
console.log('Checksum:', checksum);
console.log('='.repeat(60));
console.log('\\nUse this in your x-checksum header.');
