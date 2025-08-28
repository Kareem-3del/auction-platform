
import { withAuth } from '@/lib/middleware/auth';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse 
} from '@/lib/api-response';

// GET /api/transactions - Get all transactions (Admin only)
export const GET = withAuth(async (request) => {
  try {
    validateMethod(request, ['GET']);

    // Check user permissions
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to view transactions',
      });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    // Mock transaction data - in production this would come from transactions table
    const allTransactions = [
      {
        id: 'txn-001',
        type: 'bid',
        amount: 150.00,
        status: 'completed',
        description: 'Bid placed on auction',
        userId: 'user-001',
        userEmail: 'john.doe@example.com',
        auctionId: 'auction-001',
        auctionTitle: 'Vintage Watch Collection',
        paymentMethod: 'Credit Card',
        createdAt: '2024-01-15T10:30:00Z',
      },
      {
        id: 'txn-002',
        type: 'payment',
        amount: 250.00,
        status: 'completed',
        description: 'Payment for won auction',
        userId: 'user-002',
        userEmail: 'jane.smith@example.com',
        auctionId: 'auction-002',
        auctionTitle: 'Antique Jewelry Set',
        paymentMethod: 'PayPal',
        createdAt: '2024-01-14T15:45:00Z',
      },
      {
        id: 'txn-003',
        type: 'refund',
        amount: 75.00,
        status: 'pending',
        description: 'Refund for cancelled auction',
        userId: 'user-003',
        userEmail: 'bob.wilson@example.com',
        auctionId: 'auction-003',
        auctionTitle: 'Classic Car Model',
        paymentMethod: 'Credit Card',
        createdAt: '2024-01-13T11:20:00Z',
      },
      {
        id: 'txn-004',
        type: 'payout',
        amount: 450.00,
        status: 'completed',
        description: 'Seller payout for completed auction',
        userId: 'user-004',
        userEmail: 'alice.brown@example.com',
        auctionId: 'auction-004',
        auctionTitle: 'Art Collection',
        paymentMethod: 'Bank Transfer',
        createdAt: '2024-01-16T08:15:00Z',
      },
      {
        id: 'txn-005',
        type: 'bid',
        amount: 120.00,
        status: 'completed',
        description: 'Bid placed on auction',
        userId: 'user-005',
        userEmail: 'charlie.davis@example.com',
        auctionId: 'auction-005',
        auctionTitle: 'Sports Equipment',
        paymentMethod: 'Credit Card',
        createdAt: '2024-01-12T14:45:00Z',
      },
      {
        id: 'txn-006',
        type: 'transfer',
        amount: 300.00,
        status: 'completed',
        description: 'Balance transfer between accounts',
        userId: 'user-006',
        userEmail: 'diana.white@example.com',
        auctionId: null,
        auctionTitle: null,
        paymentMethod: 'Internal Transfer',
        createdAt: '2024-01-11T16:30:00Z',
      },
      {
        id: 'txn-007',
        type: 'payment',
        amount: 180.00,
        status: 'failed',
        description: 'Failed payment attempt',
        userId: 'user-007',
        userEmail: 'evan.green@example.com',
        auctionId: 'auction-006',
        auctionTitle: 'Electronics Bundle',
        paymentMethod: 'Credit Card',
        createdAt: '2024-01-10T12:00:00Z',
      },
      {
        id: 'txn-008',
        type: 'bid',
        amount: 95.00,
        status: 'completed',
        description: 'Auto-bid placed',
        userId: 'user-008',
        userEmail: 'fiona.black@example.com',
        auctionId: 'auction-007',
        auctionTitle: 'Book Collection',
        paymentMethod: 'Credit Card',
        createdAt: '2024-01-09T09:15:00Z',
      },
      {
        id: 'txn-009',
        type: 'refund',
        amount: 200.00,
        status: 'completed',
        description: 'Refund processed successfully',
        userId: 'user-009',
        userEmail: 'george.blue@example.com',
        auctionId: 'auction-008',
        auctionTitle: 'Home Decor Items',
        paymentMethod: 'PayPal',
        createdAt: '2024-01-08T17:45:00Z',
      },
      {
        id: 'txn-010',
        type: 'payout',
        amount: 375.00,
        status: 'pending',
        description: 'Seller payout pending verification',
        userId: 'user-010',
        userEmail: 'helen.red@example.com',
        auctionId: 'auction-009',
        auctionTitle: 'Musical Instruments',
        paymentMethod: 'Bank Transfer',
        createdAt: '2024-01-07T13:20:00Z',
      }
    ];

    // Apply filters
    let filteredTransactions = allTransactions;
    
    if (type && type !== 'all') {
      filteredTransactions = filteredTransactions.filter(txn => txn.type === type);
    }
    
    if (status && status !== 'all') {
      filteredTransactions = filteredTransactions.filter(txn => txn.status === status);
    }

    // Apply pagination
    const totalCount = filteredTransactions.length;
    const paginatedTransactions = filteredTransactions.slice(offset, offset + limit);

    return successResponse({
      data: paginatedTransactions,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      message: 'Transactions retrieved successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });