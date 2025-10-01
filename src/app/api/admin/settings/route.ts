import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { prisma } from 'src/lib/prisma';
import { withAuth } from 'src/lib/middleware/auth';
import {
  handleAPIError,
  validateMethod,
  successResponse,
  validateContentType,
} from 'src/lib/api-response';
import { logger } from 'src/lib/logger';
import { getMultipleSettings, setSettingValue, clearSettingsCache } from 'src/lib/settings';

// Validation schema for updating settings
const updateSettingsSchema = z.object({
  virtualMultiplier: z.number().min(0.1).max(100).optional(),
  itemHideTimeoutDays: z.number().int().min(1).max(365).optional(),
});

// GET /api/admin/settings - Fetch all system settings
export const GET = withAuth(
  async (request: NextRequest) => {
    try {
      validateMethod(request, ['GET']);

      // Check if user is admin
      if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
        return handleAPIError(
          {
            name: 'ForbiddenError',
            message: 'Only administrators can access system settings',
          },
          403
        );
      }

      // Fetch all settings from database
      const allSettings = await prisma.systemSetting.findMany({
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
      });

      // Transform to key-value format
      const settingsObject: Record<string, any> = {};
      allSettings.forEach((setting) => {
        let parsedValue: any;
        switch (setting.dataType) {
          case 'NUMBER':
            parsedValue = parseFloat(setting.value);
            break;
          case 'BOOLEAN':
            parsedValue = setting.value.toLowerCase() === 'true';
            break;
          case 'JSON':
            parsedValue = JSON.parse(setting.value);
            break;
          default:
            parsedValue = setting.value;
        }
        settingsObject[setting.key] = parsedValue;
      });

      logger.info('System settings fetched', {
        userId: request.user.id,
        settingsCount: allSettings.length,
      });

      return successResponse(
        {
          settings: settingsObject,
          details: allSettings,
        },
        { message: 'Settings retrieved successfully' }
      );
    } catch (error) {
      logger.error('Error fetching system settings', error);
      return handleAPIError(error);
    }
  },
  { required: true }
);

// PUT /api/admin/settings - Update system settings
export const PUT = withAuth(
  async (request: NextRequest) => {
    try {
      validateMethod(request, ['PUT']);
      validateContentType(request);

      // Check if user is admin
      if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
        return handleAPIError(
          {
            name: 'ForbiddenError',
            message: 'Only administrators can update system settings',
          },
          403
        );
      }

      const body = await request.json();
      const validatedData = updateSettingsSchema.parse(body);

      logger.info('System settings update attempt', {
        userId: request.user.id,
        updates: Object.keys(validatedData),
      });

      // Update each setting
      const updates: Array<{ key: string; value: any }> = [];

      if (validatedData.virtualMultiplier !== undefined) {
        await setSettingValue('virtualMultiplier', validatedData.virtualMultiplier, {
          description: 'Multiplier for calculating virtual balance from real balance',
          category: 'BALANCE',
          dataType: 'NUMBER',
        });
        updates.push({ key: 'virtualMultiplier', value: validatedData.virtualMultiplier });
      }

      if (validatedData.itemHideTimeoutDays !== undefined) {
        await setSettingValue('itemHideTimeoutDays', validatedData.itemHideTimeoutDays, {
          description: 'Number of days after auction end before hiding from public views',
          category: 'AUCTION',
          dataType: 'NUMBER',
        });
        updates.push({ key: 'itemHideTimeoutDays', value: validatedData.itemHideTimeoutDays });
      }

      // Clear settings cache
      clearSettingsCache();

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: request.user.id,
          targetId: request.user.id,
          entityType: 'system_setting',
          entityId: 'settings',
          action: 'settings_updated',
          newValues: validatedData,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });

      logger.info('System settings updated successfully', {
        userId: request.user.id,
        updates,
      });

      // Fetch updated settings
      const updatedSettings = await getMultipleSettings([
        'virtualMultiplier',
        'itemHideTimeoutDays',
      ]);

      return successResponse(
        {
          settings: updatedSettings,
          updates,
        },
        { message: 'Settings updated successfully' }
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleAPIError({
          name: 'ValidationError',
          message: 'Invalid settings data',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      logger.error('Error updating system settings', error);
      return handleAPIError(error);
    }
  },
  { required: true }
);
