const BASE_URL = 'https://api.dwizy22.my.id/api';
export interface Product {
  buyer_sku_code: string;
  product_name: string;
  category: string;
  brand: string;
  type: string;
  price: number;
  desc: string;
  buyer_product_status: boolean;
}

export interface Operator {
  name: string;
  count: number;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
}

export interface TransactionResult {
  ref_id: string;
  customer_no: string;
  buyer_sku_code: string;
  message: string;
  status: string;
  sn?: string;
  rc: string;
  buyer_last_saldo: number;
  selling_price: number;
  desc?: string;
}

export interface TopUpResult {
  trx_id: string;
  amount: number;
  payment_method: string;
  status: string;
  va_number: string;
  expired_at: string;
  message: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = await res.json() as { success: boolean; data: T; message?: string };
  if (!json.success) throw new Error(json.message || "Terjadi kesalahan");
  return json.data;
}

export interface AdminStatus {
  mode: "demo" | "live";
  digiflazz_username: string;
  digiflazz_api_key_set: boolean;
  digiflazz_api_key_preview: string;
  cache_ttl_minutes: number;
  total_cached_products: number;
  last_sync: string | null;
  next_sync: string | null;
}

export interface AdminConfig {
  digiflazz_username: string;
  digiflazz_api_key_set: boolean;
  digiflazz_api_key_preview: string;
  cache_ttl_minutes: number;
}

async function adminFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}/admin${path}`, {
    headers: { "Content-Type": "application/json", "x-admin-token": token },
    ...options,
  });
  const json = await res.json() as { success: boolean; data?: T; message?: string };
  if (!json.success) throw new Error(json.message || "Terjadi kesalahan");
  return json.data as T;
}

export const admin = {
  async login(token: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const json = await res.json() as { success: boolean; message?: string };
    if (!json.success) throw new Error(json.message || "Login gagal");
    return { message: json.message || "OK" };
  },
  async getStatus(token: string): Promise<AdminStatus> {
    return adminFetch<AdminStatus>("/status", token);
  },
  async getConfig(token: string): Promise<AdminConfig> {
    return adminFetch<AdminConfig>("/config", token);
  },
  async updateConfig(token: string, config: {
    digiflazz_username?: string;
    digiflazz_api_key?: string;
    cache_ttl_minutes?: number;
  }): Promise<{ message: string }> {
    return adminFetch("/config", token, {
      method: "POST",
      body: JSON.stringify(config),
    });
  },
  async triggerSync(token: string): Promise<{ message: string; total: number }> {
    return adminFetch("/sync", token, { method: "POST" });
  },
  async clearCache(token: string): Promise<{ message: string }> {
    return adminFetch("/clear-cache", token, { method: "POST" });
  },
};

export interface QrisOrder {
  order_id: string;
  qr_string: string;
  qr_url: string;
  expires_at: string;
  amount: number;
  provider: "midtrans" | "demo";
}

export interface QrisStatus {
  order_id: string;
  status: "pending" | "paid" | "expired";
  amount: number;
  expires_at: string;
}

export const userApi = {
  async register(data: { id: string; name: string; email: string; phone: string; password: string; balance: number }) {
    try {
      await apiFetch("/users/register", { method: "POST", body: JSON.stringify(data) });
    } catch {}
  },
  async login(email: string, password: string) {
    try {
      await apiFetch("/users/login", { method: "POST", body: JSON.stringify({ email, password }) });
    } catch {}
  },
  async updateBalance(id: string, balance: number) {
    try {
      await apiFetch("/users/update-balance", { method: "POST", body: JSON.stringify({ id, balance }) });
    } catch {}
  },
  async recordTransaction(id: string, amount: number) {
    try {
      await apiFetch("/users/record-transaction", { method: "POST", body: JSON.stringify({ id, amount }) });
    } catch {}
  },
  async recordTransactionFull(data: {
    user_id: string; ref_id: string; product_name: string; category?: string;
    buyer_sku_code?: string; customer_no?: string; amount: number;
    balance_before: number; balance_after: number; status: string; sn?: string;
  }) {
    try {
      await apiFetch("/users/record-transaction-full", { method: "POST", body: JSON.stringify(data) });
    } catch {}
  },
  async recordTopup(data: {
    user_id: string; amount: number; balance_before: number;
    balance_after: number; method?: string; ref_id?: string;
  }) {
    try {
      await apiFetch("/users/record-topup", { method: "POST", body: JSON.stringify(data) });
    } catch {}
  },
};

export type { StoredUser } from "./types";

export const adminUserApi = {
  async listUsers(token: string): Promise<import("./types").StoredUser[]> {
    const res = await fetch(`${BASE_URL}/users/admin/list`, {
      headers: { "Content-Type": "application/json", "x-admin-token": token },
    });
    const json = await res.json() as { success: boolean; data: import("./types").StoredUser[]; message?: string };
    if (!json.success) throw new Error(json.message || "Gagal memuat data user");
    return json.data;
  },
  async updateBalance(token: string, userId: string, balance: number) {
    const res = await fetch(`${BASE_URL}/users/admin/${userId}/balance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ balance }),
    });
    const json = await res.json() as { success: boolean; message?: string };
    if (!json.success) throw new Error(json.message || "Gagal update saldo");
  },
  async resetPassword(token: string, userId: string, password: string) {
    const res = await fetch(`${BASE_URL}/users/admin/${userId}/password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ password }),
    });
    const json = await res.json() as { success: boolean; message?: string };
    if (!json.success) throw new Error(json.message || "Gagal reset password");
  },
  async deleteUser(token: string, userId: string) {
    const res = await fetch(`${BASE_URL}/users/admin/${userId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
    });
    const json = await res.json() as { success: boolean; message?: string };
    if (!json.success) throw new Error(json.message || "Gagal hapus user");
  },
};

export const qrisApi = {
  async create(amount: number, order_id?: string): Promise<QrisOrder> {
    return apiFetch<QrisOrder>("/qris/create", {
      method: "POST",
      body: JSON.stringify({ amount, order_id }),
    });
  },
  async checkStatus(orderId: string): Promise<QrisStatus> {
    return apiFetch<QrisStatus>(`/qris/status/${orderId}`);
  },
  async simulatePay(orderId: string): Promise<{ message: string }> {
    return apiFetch(`/qris/simulate-pay/${orderId}`, { method: "POST" });
  },
};

export const api = {
  async getCategories(): Promise<Category[]> {
    return apiFetch<Category[]>("/kategori");
  },

  async getOperators(kategori: string): Promise<Operator[]> {
    return apiFetch<Operator[]>(`/operator?kategori=${encodeURIComponent(kategori)}`);
  },

  async getProducts(kategori?: string, brand?: string): Promise<Product[]> {
    const params = new URLSearchParams();
    if (kategori && kategori !== "Semua") params.set("kategori", kategori);
    if (brand) params.set("brand", brand);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<Product[]>(`/produk${qs}`);
  },

  async syncProducts(): Promise<{ message: string; total: number }> {
    return apiFetch("/sync", { method: "POST" });
  },

  async doTransaction(params: {
    buyer_sku_code: string;
    customer_no: string;
    ref_id: string;
  }): Promise<TransactionResult> {
    return apiFetch<TransactionResult>("/transaksi", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  async checkStatus(ref_id: string): Promise<{ ref_id: string; status: string; message: string; rc: string }> {
    return apiFetch("/cek-status", {
      method: "POST",
      body: JSON.stringify({ ref_id }),
    });
  },

  async topUp(amount: number, payment_method: string): Promise<TopUpResult> {
    return apiFetch<TopUpResult>("/topup", {
      method: "POST",
      body: JSON.stringify({ amount, payment_method }),
    });
  },
};
