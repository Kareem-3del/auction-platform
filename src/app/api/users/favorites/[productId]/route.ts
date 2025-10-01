import { prisma } from 'src/lib/prisma';
import { withAuth } from 'src/lib/middleware/auth';
import {
  handleAPIError,
  validateMethod,
  successResponse,
} from 'src/lib/api-response';

// DELETE /api/users/favorites/[productId] - Remove from favorites
export const DELETE = withAuth(async (request, { params }) => {
  try {
    validateMethod(request, ['DELETE']);

    const userId = request.user.id;
    const productId = params.productId;

    if (!productId) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Product ID is required',
      });
    }

    // Check if favorited
    const favorite = await prisma.userFavorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!favorite) {
      return handleAPIError({
        name: 'NotFoundError',
        message: 'Product not in favorites',
      });
    }

    // Remove from favorites
    await prisma.$transaction(async (tx) => {
      await tx.userFavorite.delete({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });

      // Decrement favorite count
      await tx.product.update({
        where: { id: productId },
        data: {
          favoriteCount: {
            decrement: 1,
          },
        },
      });
    });

    return successResponse({
      data: null,
      message: 'Removed from favorites',
    });
  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });
