# Console.log to Logger Migration Guide

This guide helps migrate all console.log statements to the new structured logger.

## Files That Need Updates (53 files)

### High Priority (API Routes & Critical Services):

1. `/src/lib/auth.ts` - Authentication logic
2. `/src/lib/prisma.ts` - Database connection
3. `/src/lib/redis.ts` - Redis connection
4. `/src/lib/notification-service.ts` - Notifications
5. `/src/lib/auction-scheduler.ts` - Auction timing
6. `/src/lib/auction-settlement.ts` - Auction completion
7. `/src/lib/websocket/bidding-server.ts` - WebSocket server
8. `/src/lib/websocket/init.ts` - WebSocket initialization
9. `/src/lib/websocket/production-client.ts` - WS client
10. `/src/app/api/auth/login/route.ts` - Login endpoint
11. `/src/app/api/auth/refresh/route.ts` - Token refresh
12. `/src/app/api/auth/me/route.ts` - User info
13. `/src/app/api/auth/logout/route.ts` - Logout
14. `/src/app/api/auth/forgot-password/route.ts` - Password reset
15. `/src/app/api/auth/verify-email/route.ts` - Email verification
16. `/src/app/api/auctions/route.ts` - Auction listing
17. `/src/app/api/auctions-noauth/route.ts` - Public auctions
18. `/src/app/api/admin/users/[id]/balance/route.ts` - Balance adjustment
19. `/src/app/api/account/charge/route.ts` - Account charging
20. `/src/app/api/notifications/stream/route.ts` - Notification stream

### Medium Priority (Components & Hooks):

21. `/src/contexts/LocaleContext.tsx`
22. `/src/contexts/NotificationContext.tsx`
23. `/src/hooks/useAuth.tsx`
24. `/src/hooks/useNotifications.tsx`
25. `/src/hooks/useRealtimeBidding.tsx`
26. `/src/components/auction/RealtimeBidding.tsx`
27. `/src/components/bidding/QuickBidDialog.tsx`
28. `/src/components/notifications/NotificationCenter.tsx`
29. `/src/components/search/SearchDialog.tsx`

### Low Priority (Pages & Sections):

30-53. Various page components and sections

## Migration Patterns

### Pattern 1: Info Messages
```typescript
// OLD:
console.log('User logged in:', userId);

// NEW:
import { logger } from '@/lib/logger';
logger.info('User logged in', { userId });
```

### Pattern 2: Error Messages
```typescript
// OLD:
console.error('Failed to save:', error);

// NEW:
import { logger } from '@/lib/logger';
logger.error('Failed to save', error, { context: 'additional-info' });
```

### Pattern 3: Debug Messages
```typescript
// OLD:
console.log('Debug data:', data);

// NEW:
import { logger } from '@/lib/logger';
logger.debug('Debug data', { data });
```

### Pattern 4: Warnings
```typescript
// OLD:
console.warn('Deprecated feature used');

// NEW:
import { logger } from '@/lib/logger';
logger.warn('Deprecated feature used', { feature: 'name' });
```

### Pattern 5: Specialized Loggers

#### Authentication Events:
```typescript
// OLD:
console.log('User authenticated:', userId);

// NEW:
logger.auth('User authenticated', userId, { method: 'email' });
```

#### Bidding Events:
```typescript
// OLD:
console.log('Bid placed:', bidId);

// NEW:
logger.bid('Bid placed', productId, { bidId, amount });
```

#### Email Events:
```typescript
// OLD:
console.log('Email sent to:', email);

// NEW:
logger.email('Email sent', email, { subject, success: true });
```

#### WebSocket Events:
```typescript
// OLD:
console.log('WS connection established');

// NEW:
logger.ws('Connection established', { userId, productId });
```

#### HTTP Requests:
```typescript
// OLD:
console.log(`${method} ${url} - ${status}`);

// NEW:
logger.http(method, url, status, duration);
```

## Quick Reference

```typescript
import { logger } from '@/lib/logger';

// Basic logging
logger.error(message, error, context);
logger.warn(message, context);
logger.info(message, context);
logger.debug(message, context);

// Specialized
logger.auth(action, userId, context);
logger.bid(action, productId, context);
logger.email(action, to, context);
logger.ws(action, context);
logger.http(method, url, status, duration, context);
logger.db(query, duration, context);
```

## Search & Replace Examples

### Find all console.log in a file:
```bash
grep -n "console\." src/path/to/file.ts
```

### Find all console.log in src directory:
```bash
grep -r "console\." src/ --include="*.ts" --include="*.tsx"
```

### Count console.log instances:
```bash
grep -r "console\." src/ --include="*.ts" --include="*.tsx" | wc -l
```

## Important Notes

1. **Production Safety**: Logger automatically hides stack traces in production
2. **Context is Key**: Always include relevant context (userId, productId, etc.)
3. **Log Levels**: Use appropriate levels:
   - ERROR: Errors that need attention
   - WARN: Potential issues
   - INFO: Important events
   - DEBUG: Detailed debugging (development only)
4. **Structured Data**: Use objects for context, not string concatenation
5. **No Secrets**: Never log sensitive data (passwords, tokens, etc.)

## Example Complete Migration

### Before:
```typescript
export async function createBid(data: BidData) {
  console.log('Creating bid:', data);

  try {
    const bid = await prisma.bid.create({ data });
    console.log('Bid created:', bid.id);
    return bid;
  } catch (error) {
    console.error('Failed to create bid:', error);
    throw error;
  }
}
```

### After:
```typescript
import { logger } from '@/lib/logger';

export async function createBid(data: BidData) {
  logger.debug('Creating bid', { amount: data.amount, productId: data.productId });

  try {
    const bid = await prisma.bid.create({ data });
    logger.bid('Bid created', data.productId, {
      bidId: bid.id,
      amount: data.amount,
      userId: data.userId
    });
    return bid;
  } catch (error) {
    logger.error('Failed to create bid', error, {
      productId: data.productId,
      userId: data.userId
    });
    throw error;
  }
}
```

## Testing After Migration

1. Check application starts without errors
2. Verify logs appear in proper format
3. Test error scenarios log correctly
4. Confirm production mode hides sensitive data
5. Check log levels work correctly

## Automation Helper (Optional)

Create a script to help with basic replacements:

```bash
#!/bin/bash
# Simple replacements for common patterns

# Replace console.log with logger.info
sed -i 's/console\.log(/logger.info(/g' "$1"

# Replace console.error with logger.error
sed -i 's/console\.error(/logger.error(/g' "$1"

# Replace console.warn with logger.warn
sed -i 's/console\.warn(/logger.warn(/g' "$1"

# Add import if not exists
if ! grep -q "import { logger }" "$1"; then
  sed -i "1i import { logger } from '@/lib/logger';" "$1"
fi
```

**Note**: This is a starting point. Manual review and adjustment needed for proper context.
