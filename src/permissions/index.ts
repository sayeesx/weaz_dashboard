import type { AdminRole } from '@/types';

// ---- Route-level permission map ---- //
export const ROUTE_PERMISSIONS: Record<string, AdminRole[]> = {
  '/dashboard':   ['platform_admin', 'store_admin', 'support', 'analyst'],
  '/orders':      ['platform_admin', 'store_admin', 'support'],
  '/products':    ['platform_admin', 'store_admin'],
  '/customers':   ['platform_admin', 'store_admin', 'support'],
  '/delivery':    ['platform_admin', 'store_admin'],
  '/inventory':   ['platform_admin', 'store_admin'],
  '/live':        ['platform_admin', 'store_admin'],
  '/dispatch':    ['platform_admin', 'store_admin'],
  '/incidents':   ['platform_admin', 'store_admin', 'support'],
  '/analytics':   ['platform_admin', 'analyst'],
  '/finance':     ['platform_admin'],
  '/marketing':   ['platform_admin', 'store_admin'],
  '/support':     ['platform_admin', 'support'],
  '/settings':    ['platform_admin'],
  '/system':      ['platform_admin'],
  '/ops':         ['platform_admin'],
  '/flags':       ['platform_admin'],
  '/ai':          ['platform_admin', 'analyst'],
};

// ---- Action-level permissions ---- //
type Action =
  | 'orders.view' | 'orders.create' | 'orders.edit' | 'orders.cancel' | 'orders.refund' | 'orders.assign'
  | 'products.view' | 'products.create' | 'products.edit' | 'products.delete' | 'products.bulk_upload'
  | 'customers.view' | 'customers.ban' | 'customers.refund' | 'customers.credit' | 'customers.impersonate'
  | 'delivery.view' | 'delivery.assign' | 'delivery.override' | 'delivery.zones'
  | 'inventory.view' | 'inventory.adjust' | 'inventory.transfer'
  | 'analytics.view' | 'analytics.export'
  | 'finance.view' | 'finance.settlements' | 'finance.refunds'
  | 'marketing.view' | 'marketing.create' | 'marketing.publish'
  | 'support.view' | 'support.manage'
  | 'settings.view' | 'settings.edit'
  | 'system.view' | 'system.manage'
  | 'flags.view' | 'flags.edit'
  | 'ai.view' | 'ai.execute';

const ACTION_PERMISSIONS: Record<Action, AdminRole[]> = {
  'orders.view':        ['platform_admin', 'store_admin', 'support'],
  'orders.create':      ['platform_admin', 'store_admin'],
  'orders.edit':        ['platform_admin', 'store_admin'],
  'orders.cancel':      ['platform_admin', 'store_admin', 'support'],
  'orders.refund':      ['platform_admin'],
  'orders.assign':      ['platform_admin', 'store_admin'],
  'products.view':      ['platform_admin', 'store_admin'],
  'products.create':    ['platform_admin', 'store_admin'],
  'products.edit':      ['platform_admin', 'store_admin'],
  'products.delete':    ['platform_admin'],
  'products.bulk_upload': ['platform_admin'],
  'customers.view':     ['platform_admin', 'store_admin', 'support'],
  'customers.ban':      ['platform_admin'],
  'customers.refund':   ['platform_admin'],
  'customers.credit':   ['platform_admin', 'store_admin'],
  'customers.impersonate': ['platform_admin'],
  'delivery.view':      ['platform_admin', 'store_admin'],
  'delivery.assign':    ['platform_admin', 'store_admin'],
  'delivery.override':  ['platform_admin'],
  'delivery.zones':     ['platform_admin'],
  'inventory.view':     ['platform_admin', 'store_admin'],
  'inventory.adjust':   ['platform_admin', 'store_admin'],
  'inventory.transfer': ['platform_admin'],
  'analytics.view':     ['platform_admin', 'analyst'],
  'analytics.export':   ['platform_admin', 'analyst'],
  'finance.view':       ['platform_admin'],
  'finance.settlements': ['platform_admin'],
  'finance.refunds':    ['platform_admin'],
  'marketing.view':     ['platform_admin', 'store_admin'],
  'marketing.create':   ['platform_admin', 'store_admin'],
  'marketing.publish':  ['platform_admin'],
  'support.view':       ['platform_admin', 'support'],
  'support.manage':     ['platform_admin', 'support'],
  'settings.view':      ['platform_admin'],
  'settings.edit':      ['platform_admin'],
  'system.view':        ['platform_admin'],
  'system.manage':      ['platform_admin'],
  'flags.view':         ['platform_admin'],
  'flags.edit':         ['platform_admin'],
  'ai.view':            ['platform_admin', 'analyst'],
  'ai.execute':         ['platform_admin'],
};

export function hasRouteAccess(role: AdminRole, path: string): boolean {
  const basePath = '/' + path.split('/').filter(Boolean)[0];
  const allowedRoles = ROUTE_PERMISSIONS[basePath];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

export function hasPermission(role: AdminRole, action: Action): boolean {
  const allowedRoles = ACTION_PERMISSIONS[action];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

export function isAdminRole(role: string): role is AdminRole {
  return ['platform_admin', 'store_admin', 'support', 'analyst'].includes(role);
}

export const BLOCKED_ROLES = ['customer', 'delivery_partner'] as const;

export function isBlockedRole(role: string): boolean {
  return (BLOCKED_ROLES as readonly string[]).includes(role);
}
