import type { NextRequest } from 'next/server';

import { handleAPIError } from '@/lib/api-response';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Deprecated: Auction functionality has been unified into Products
export async function GET(request: NextRequest, { params }: RouteParams) {
  return handleAPIError({
    name: 'DeprecatedEndpointError',
    message: 'Auction endpoints have been deprecated. Use /api/products instead.',
  });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return handleAPIError({
    name: 'DeprecatedEndpointError',
    message: 'Auction endpoints have been deprecated. Use /api/products instead.',
  });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return handleAPIError({
    name: 'DeprecatedEndpointError',
    message: 'Auction endpoints have been deprecated. Use /api/products instead.',
  });
}