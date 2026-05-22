export * from './database';

// ---- UI State Types ---- //
export interface SidebarItem {
  label: string;
  href: string;
  icon: string;
  badge?: string | number;
  children?: SidebarItem[];
  roles?: string[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  action: () => void;
  group: string;
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface TableColumn<T = unknown> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
}

// ---- Analytics Types ---- //
export interface MetricCard {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'flat';
  icon?: string;
  sparkline?: number[];
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

// ---- Realtime Types ---- //
export interface RealtimeEvent<T = unknown> {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: T;
  old_record?: T;
  timestamp: string;
}

export type ViewMode = 'table' | 'kanban' | 'timeline' | 'grid' | 'map';

// ---- Feature Flags ---- //
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout_percentage: number;
  regions?: string[];
  created_at: string;
  updated_at: string;
}
