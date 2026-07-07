export interface Space {
  id: number;
  name: string;
  area: number;
  area_category: "small" | "medium" | "large";
  monthly_rent: number;
  yearly_rent: number;
  address: string;
  description: string;
  floor_height: number;
  ground_load: number;
  power_capacity: number;
  has_crane: boolean;
  has_forklift: boolean;
  floor_material: string;
  fire_rating: string;
  drainage: string;
  ventilation: string;
  has_office: boolean;
  parking: string;
  loading_platform: boolean;
  images: string;
  status: "available" | "rented" | "maintenance";
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  order_no: string;
  contact_name: string;
  contact_phone: string;
  space_id: number;
  rent_type: "monthly" | "yearly";
  start_date: string;
  duration: number;
  total_amount: number;
  status:
    | "pending"
    | "reviewing"
    | "approved"
    | "rejected"
    | "signed"
    | "active"
    | "completed"
    | "cancelled";
  admin_remark?: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export const AREA_LABELS: Record<string, string> = {
  small: "小型",
  medium: "中型",
  large: "大型",
};

export const STATUS_LABELS: Record<string, string> = {
  available: "可租",
  rented: "已出租",
  maintenance: "维护中",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "待审核",
  reviewing: "审核中",
  approved: "已通过",
  rejected: "已拒绝",
  signed: "已签约",
  active: "租赁中",
  completed: "已完成",
  cancelled: "已取消",
};
