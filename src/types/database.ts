// Auto-synced from Supabase schema — update via `mcp_supabase_generate_typescript_types`

export type UserRole = 'platform_admin' | 'store_admin' | 'support' | 'delivery_partner' | 'analyst' | 'customer';
export type AdminRole = Exclude<UserRole, 'customer' | 'delivery_partner'>;

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type DeliveryPartnerStatus = 'online' | 'offline' | 'busy' | 'on_break';

export type PaymentMethod = 'cod' | 'upi' | 'card' | 'wallet' | 'netbanking';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  discount_amount: number;
  delivery_fee: number;
  tax_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  delivery_address_id: string | null;
  delivery_partner_id: string | null;
  warehouse_id: string | null;
  notes: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimated_delivery_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  brand_id: string | null;
  sku: string | null;
  barcode: string | null;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  tax_rate: number;
  weight: number | null;
  unit: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  parent_id: string | null;
  created_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  capacity: number | null;
  manager_id: string | null;
  created_at: string;
}

export interface DeliveryPartner {
  id: string;
  user_id: string;
  vehicle_type: string | null;
  vehicle_number: string | null;
  license_number: string | null;
  status: DeliveryPartnerStatus;
  current_latitude: number | null;
  current_longitude: number | null;
  is_verified: boolean;
  rating: number | null;
  total_deliveries: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  polygon: unknown;
  warehouse_id: string | null;
  base_delivery_fee: number;
  min_order_amount: number;
  estimated_delivery_minutes: number;
  is_active: boolean;
  created_at: string;
}
