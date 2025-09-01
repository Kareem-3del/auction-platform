import type { NextRequest } from 'next/server';

import { handleAPIError } from 'src/lib/api-response';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Deprecated: Auction functionality has been unified into Products
export async function GET(request: NextRequest, { params }: RouteParams) {
  return handleAPIError({
    name: 'DeprecatedEndpointError',
    message: 'Auction endpoints have been deprecated. Use /api/products/[id]/bids instead.',
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return handleAPIError({
    name: 'DeprecatedEndpointError', 
    message: 'Auction endpoints have been deprecated. Use /api/products/[id]/bids instead.',
  });
}