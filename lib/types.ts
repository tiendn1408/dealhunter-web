export type AlertConditionType = 'drop_percent' | 'target_price' | 'lowest_in_days';

export interface AlertRule {
  id: string;
  user_id: string;
  product_source_id: string;
  rule_type: AlertConditionType;
  threshold_value: number;
  active: boolean;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAlertPayload {
  rule_type: AlertConditionType;
  threshold_value: number;
  expires_in_days?: number;
}

export interface PriceNotification {
  id: string;
  user_id: string;
  alert_rule_id: string;
  channel: string;
  recipient: string;
  status: 'queued' | 'sent' | 'failed';
  price_before: number;
  price_after: number;
  sent_at?: string | null;
  read_at?: string | null;
  created_at: string;
  product_title?: string;
  platform?: string;
  product_url?: string;
}

export interface UserProfile {
  user_id: string;
  zalo_id?: string;
  phone?: string;
  zalo_connected: boolean;
  created_at: string;
}

export interface ConnectZaloPayload {
  zalo_id?: string;
  phone?: string;
}

// Phase 3: Cross-platform Price Comparison types

export interface SourcePrice {
  source_id: string;
  product_id: string;
  platform: string;
  seller_name: string;
  canonical_url: string;
  listed_price: number;
  shipping_fee: number;
  effective_price: number;
  in_stock: boolean;
  is_best_deal: boolean;
  captured_at: string | null;
}

export interface BestDealSummary {
  platform: string;
  effective_price: number;
  saving_vs_most_expensive: number;
  saving_percent: number;
}

export interface ComparisonResult {
  product_id: string;
  product_title: string;
  comparison_available: boolean;
  sources: SourcePrice[];
  best_deal: BestDealSummary | null;
  computed_at: string;
}

export interface ProductGroupSummary {
  product_id: string;
  product_title: string;
  best_price: number | null;
  best_platform: string;
  source_count: number;
}

export interface LinkSourcePayload {
  url: string;
}

export interface LinkSourceResponse {
  source_id: string;
  platform: string;
  message: string;
}

