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
