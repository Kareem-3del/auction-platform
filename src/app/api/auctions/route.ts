import type { NextRequest } from 'next/server';

import { handleAPIError } from '@/lib/api-response';

// Deprecated: Auction functionality has been unified into Products
export async function GET(request: NextRequest) {
  return handleAPIError({
    name: 'DeprecatedEndpointError',
    message: 'Auction endpoints have been deprecated. Use /api/products instead.',
  });
}

export async function POST(request: NextRequest) {
  return handleAPIError({
    name: 'DeprecatedEndpointError',
    message: 'Auction endpoints have been deprecated. Use /api/products instead.',
  });
}