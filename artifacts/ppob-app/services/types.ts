export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  balance: number;
  registered_at: string;
  last_login: string | null;
  login_count: number;
  transaction_count: number;
  total_spent: number;
  device_id?: string;
}
