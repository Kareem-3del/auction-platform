#!/usr/bin/env node

/**
 * Cron job to automatically update auction statuses
 * Runs every minute to check for status transitions
 */

const https = require('https');

const API_URL = process.env.API_URL || 'https://auction.lebanon-auction.bdaya.tech';
const ENDPOINT = '/api/cron/update-auction-status/';

const options = {
  method: 'GET',
  timeout: 10000,
};

console.log(`[${new Date().toISOString()}] Running auction status update cron...`);

const req = https.get(`${API_URL}${ENDPOINT}`, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log(`[${new Date().toISOString()}] Status update result:`, result);

      if (result.success) {
        console.log(`✓ Updated: ${result.data.scheduledToLive} SCHEDULED→LIVE, ${result.data.liveToEnded} LIVE→ENDED`);
        if (result.data.paymentsProcessed > 0 || result.data.paymentsFailed > 0) {
          console.log(`  💰 Payments: ${result.data.paymentsProcessed} processed, ${result.data.paymentsFailed} failed`);
        }
      } else {
        console.error('✗ Error:', result.error?.message);
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to parse response:`, error.message);
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error(`[${new Date().toISOString()}] Request failed:`, error.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error(`[${new Date().toISOString()}] Request timeout`);
  req.destroy();
  process.exit(1);
});

req.end();
