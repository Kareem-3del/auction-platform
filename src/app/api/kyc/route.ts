
import { withAuth } from '@/lib/middleware/auth';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse 
} from '@/lib/api-response';

// GET /api/kyc - Get KYC submissions (Admin only)
export const GET = withAuth(async (request) => {
  try {
    validateMethod(request, ['GET']);

    // Check user permissions
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
      return handleAPIError({
        name: 'UnauthorizedError',
        message: 'Insufficient permissions to view KYC submissions',
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const riskLevel = searchParams.get('riskLevel');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    const whereClause: any = {};
    
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    if (riskLevel && riskLevel !== 'all') {
      whereClause.riskLevel = riskLevel;
    }

    // Mock KYC submissions - in production this would come from KYC table
    const kycSubmissions = [
      {
        id: 'kyc-001',
        userId: 'user-001',
        userEmail: 'john.doe@example.com',
        userName: 'John Doe',
        status: 'pending',
        documentType: 'Passport',
        documentNumber: 'P123456789',
        submittedAt: '2024-01-15T10:30:00Z',
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null,
        riskLevel: 'low'
      },
      {
        id: 'kyc-002',
        userId: 'user-002',
        userEmail: 'jane.smith@example.com',
        userName: 'Jane Smith',
        status: 'approved',
        documentType: 'Driver License',
        documentNumber: 'DL987654321',
        submittedAt: '2024-01-14T15:45:00Z',
        reviewedAt: '2024-01-15T09:20:00Z',
        reviewedBy: 'admin-001',
        rejectionReason: null,
        riskLevel: 'low'
      },
      {
        id: 'kyc-003',
        userId: 'user-003',
        userEmail: 'bob.wilson@example.com',
        userName: 'Bob Wilson',
        status: 'rejected',
        documentType: 'National ID',
        documentNumber: 'ID456789123',
        submittedAt: '2024-01-13T11:20:00Z',
        reviewedAt: '2024-01-14T16:30:00Z',
        reviewedBy: 'admin-002',
        rejectionReason: 'Document image quality too low',
        riskLevel: 'high'
      },
      {
        id: 'kyc-004',
        userId: 'user-004',
        userEmail: 'alice.brown@example.com',
        userName: 'Alice Brown',
        status: 'pending',
        documentType: 'Passport',
        documentNumber: 'P987654321',
        submittedAt: '2024-01-16T08:15:00Z',
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null,
        riskLevel: 'medium'
      },
      {
        id: 'kyc-005',
        userId: 'user-005',
        userEmail: 'charlie.davis@example.com',
        userName: 'Charlie Davis',
        status: 'approved',
        documentType: 'Driver License',
        documentNumber: 'DL123789456',
        submittedAt: '2024-01-12T14:45:00Z',
        reviewedAt: '2024-01-13T10:15:00Z',
        reviewedBy: 'admin-001',
        rejectionReason: null,
        riskLevel: 'low'
      }
    ];

    // Apply filters
    let filteredSubmissions = kycSubmissions;
    
    if (status && status !== 'all') {
      filteredSubmissions = filteredSubmissions.filter(sub => sub.status === status);
    }
    
    if (riskLevel && riskLevel !== 'all') {
      filteredSubmissions = filteredSubmissions.filter(sub => sub.riskLevel === riskLevel);
    }

    // Apply pagination
    const paginatedSubmissions = filteredSubmissions.slice(offset, offset + limit);

    return successResponse({
      data: paginatedSubmissions,
      pagination: {
        page,
        limit,
        total: filteredSubmissions.length,
        pages: Math.ceil(filteredSubmissions.length / limit),
      },
      message: 'KYC submissions retrieved successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });