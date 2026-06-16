/**
 * Single source of truth for every permission string in the system.
 * The Role form, the permission helper (can()), and every module action
 * all import from here — strings are never retyped elsewhere.
 */
export const PERMISSIONS = [
  'Manage Adjustments',
  'Manage Transfers',
  'Manage Roles',
  'Manage Brands',
  'Manage Currency',
  'Manage Warehouses',
  'Manage Units',
  'Manage Product Categories',
  'Manage Products',
  'Manage Suppliers',
  'Manage Customers',
  'Manage Users',
  'Manage Expense Categories',
  'Manage Expenses',
  'Manage Setting',
  'Manage Dashboard',
  'Manage Pos Screen',
  'Manage Purchase',
  'Manage Sale',
  'Manage Purchase Return',
  'Manage Sale Return',
  'Manage Email Templates',
  'Manage Reports',
  'Manage Quotations',
  'Manage Sms Templates',
  'Manage Sms Apis',
  'Manage Language',
] as const;

export type Permission = typeof PERMISSIONS[number];

export const PERMISSION_SET = new Set<string>(PERMISSIONS);
