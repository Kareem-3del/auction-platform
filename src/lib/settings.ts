/**
 * System Settings Helper
 * Provides utilities for fetching and managing system-wide settings from database
 */

import { prisma } from './prisma';
import { logger } from './logger';

// Cache for settings to reduce database queries
const settingsCache = new Map<string, { value: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get a system setting value by key
 * @param key - Setting key
 * @param defaultValue - Default value if setting doesn't exist
 * @returns Setting value parsed according to its dataType
 */
export async function getSettingValue<T = any>(
  key: string,
  defaultValue: T
): Promise<T> {
  try {
    // Check cache first
    const cached = settingsCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.value as T;
    }

    // Fetch from database
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      logger.warn(`Setting "${key}" not found, using default value`, {
        key,
        defaultValue,
      });
      return defaultValue;
    }

    // Parse value based on dataType
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

    // Update cache
    settingsCache.set(key, { value: parsedValue, timestamp: Date.now() });

    return parsedValue as T;
  } catch (error) {
    logger.error(`Error fetching setting "${key}"`, error);
    return defaultValue;
  }
}

/**
 * Set a system setting value
 * @param key - Setting key
 * @param value - New value
 * @param description - Optional description
 * @param category - Setting category
 * @param dataType - Data type (STRING, NUMBER, BOOLEAN, JSON)
 */
export async function setSettingValue(
  key: string,
  value: any,
  options?: {
    description?: string;
    category?: string;
    dataType?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
    isPublic?: boolean;
  }
): Promise<void> {
  try {
    // Determine data type if not provided
    const dataType = options?.dataType || inferDataType(value);

    // Convert value to string
    const stringValue = valueToString(value, dataType);

    // Upsert setting
    await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value: stringValue,
        description: options?.description,
        category: options?.category,
        dataType,
        isPublic: options?.isPublic,
      },
      create: {
        key,
        value: stringValue,
        description: options?.description,
        category: options?.category || 'GENERAL',
        dataType,
        isPublic: options?.isPublic || false,
      },
    });

    // Invalidate cache
    settingsCache.delete(key);

    logger.info(`Setting "${key}" updated`, { key, value });
  } catch (error) {
    logger.error(`Error setting "${key}"`, error);
    throw error;
  }
}

/**
 * Get multiple settings at once
 * @param keys - Array of setting keys
 * @returns Object with key-value pairs
 */
export async function getMultipleSettings(
  keys: string[]
): Promise<Record<string, any>> {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: keys },
      },
    });

    const result: Record<string, any> = {};
    settings.forEach((setting) => {
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
      result[setting.key] = parsedValue;
    });

    return result;
  } catch (error) {
    logger.error('Error fetching multiple settings', error);
    throw error;
  }
}

/**
 * Clear settings cache
 */
export function clearSettingsCache(key?: string): void {
  if (key) {
    settingsCache.delete(key);
  } else {
    settingsCache.clear();
  }
}

/**
 * Initialize default settings
 */
export async function initializeDefaultSettings(): Promise<void> {
  const defaults = [
    {
      key: 'virtualMultiplier',
      value: '1',
      description: 'Multiplier for calculating virtual balance from real balance',
      category: 'BALANCE',
      dataType: 'NUMBER' as const,
      isPublic: false,
    },
    {
      key: 'itemHideTimeoutDays',
      value: '30',
      description: 'Number of days after auction end before hiding from public views',
      category: 'AUCTION',
      dataType: 'NUMBER' as const,
      isPublic: false,
    },
  ];

  for (const setting of defaults) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  logger.info('Default system settings initialized');
}

// Helper functions

function inferDataType(value: any): 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' {
  if (typeof value === 'number') return 'NUMBER';
  if (typeof value === 'boolean') return 'BOOLEAN';
  if (typeof value === 'object') return 'JSON';
  return 'STRING';
}

function valueToString(value: any, dataType: string): string {
  if (dataType === 'JSON') {
    return JSON.stringify(value);
  }
  return String(value);
}

// LEGACY COMPATIBILITY - Keep old function names working
export async function getVirtualBalanceMultiplier(): Promise<number> {
  return getSettingValue('virtualMultiplier', 1);
}
