#!/usr/bin/env node
/**
 * Debug script to test the products API directly
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugAPI() {
  console.log('🔍 Debugging Products API...\n');

  // Test 1: Check what's in the database
  console.log('1. Database Products (ending soon):');
  const dbProducts = await prisma.product.findMany({
    where: {
      status: 'APPROVED',
      auctionStatus: 'LIVE',
      endTime: { gte: new Date() }
    },
    include: {
      category: true,
      agent: true
    },
    orderBy: [
      { endTime: 'asc' },
      { createdAt: 'desc' }
    ],
    take: 3
  });

  dbProducts.forEach((p, i) => {
    const timeLeft = Math.round((new Date(p.endTime) - new Date()) / 1000 / 60);
    console.log(`${i+1}. ${p.title}`);
    console.log(`   Category: ${p.category.name}`);
    console.log(`   Current Bid: $${p.currentBid?.toString() || '0'}`);
    console.log(`   Ends in: ${timeLeft}m`);
    console.log(`   ID: ${p.id}`);
    console.log('');
  });

  // Test 2: Simulate the API call
  console.log('2. Simulating API call with filters:');
  const apiParams = {
    limit: 6,
    status: 'APPROVED',
    auctionStatus: 'LIVE',
    sortBy: 'ending_soon'
  };

  console.log('API Parameters:', apiParams);

  // Build where clause like the API does
  const whereClause = {
    status: 'APPROVED',
    NOT: [
      { status: 'SOLD' },
      { auctionStatus: 'ENDED' },
      { auctionStatus: 'CANCELLED' }
    ],
    auctionStatus: { in: ['LIVE'] }
  };

  const apiProducts = await prisma.product.findMany({
    where: whereClause,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      agent: {
        select: {
          id: true,
          displayName: true,
          businessName: true,
          logoUrl: true,
          rating: true,
          reviewCount: true,
        },
      }
    },
    orderBy: [
      { endTime: 'asc' },
      { createdAt: 'desc' }
    ],
    skip: 0,
    take: 6,
  });

  console.log(`Found ${apiProducts.length} products from API simulation:`);
  apiProducts.forEach((p, i) => {
    const timeLeft = Math.round((new Date(p.endTime) - new Date()) / 1000 / 60);
    console.log(`${i+1}. ${p.title}`);
    console.log(`   Category: ${p.category.name}`);
    console.log(`   Current Bid: $${Number(p.currentBid)}`);
    console.log(`   Agent: ${p.agent.displayName}`);
    console.log(`   Ends in: ${timeLeft}m`);
    console.log('');
  });

  // Test 3: Check what the actual API would return
  console.log('3. Testing actual HTTP API call...');
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://auction.lebanon-auction.bdaya.tech/api/products?limit=1&status=APPROVED&auctionStatus=LIVE&sortBy=ending_soon');
    const responseText = await response.text();
    
    console.log('API Response Status:', response.status);
    console.log('API Response (first 500 chars):', responseText.substring(0, 500));
    
    try {
      const data = JSON.parse(responseText);
      console.log('Parsed JSON success:', data.success);
      if (data.data) {
        console.log('First product:', data.data[0]?.title);
      }
    } catch (e) {
      console.log('JSON Parse Error:', e.message);
    }
  } catch (e) {
    console.log('HTTP Request Error:', e.message);
  }

  await prisma.$disconnect();
}

debugAPI().catch(console.error);