import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString('en-IN');
}

export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '…';
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateOrderNumber(): string {
  const prefix = 'WZ';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'text-yellow-500 bg-yellow-500/10',
    confirmed: 'text-blue-500 bg-blue-500/10',
    preparing: 'text-orange-500 bg-orange-500/10',
    ready_for_pickup: 'text-cyan-500 bg-cyan-500/10',
    picked_up: 'text-indigo-500 bg-indigo-500/10',
    in_transit: 'text-purple-500 bg-purple-500/10',
    delivered: 'text-green-500 bg-green-500/10',
    cancelled: 'text-red-500 bg-red-500/10',
    refunded: 'text-gray-500 bg-gray-500/10',
    online: 'text-green-500 bg-green-500/10',
    offline: 'text-gray-500 bg-gray-500/10',
    busy: 'text-orange-500 bg-orange-500/10',
    active: 'text-green-500 bg-green-500/10',
    inactive: 'text-gray-500 bg-gray-500/10',
  };
  return map[status] || 'text-gray-500 bg-gray-500/10';
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}
