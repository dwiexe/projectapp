import { Router } from "express";
import { query, queryOne } from "../lib/db";
import { getConfig } from "../lib/config";

const router = Router();

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
}

function adminAuth(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) {
  const token = req.headers["x-admin-token"] || req.query?.token;
  const { adminToken } = getConfig();
  if (!token || token !== adminToken) {
    return res.status(401).json({ success: false, message: "Akses ditolak." });
  }
  return next();
}

// Register user
router.post("/register", async (req, res) => {
  const { id, name, email, phone, password, balance } = req.body as StoredUser;
  if (!id || !email || !password) {
    return res.status(400).json({ success: false, message: "Data tidak lengkap" });
  }
  try {
    await query(
      `INSERT INTO users (id, name, email, phone, password, balance)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO NOTHING`,
      [id, name || "", email, phone || "", password, balance ?? 0]
    );
    return res.json({ success: true, data: { id } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return res.status(409).json({ success: false, message: "Email sudah terdaftar" });
    }
    console.error("[users/register]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Login — sync & update last_login (DENGAN CCTV)
router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  
  // CCTV 1: Lihat apa yang masuk dari HP (tanda kutip ditambahkan untuk melihat spasi)
  console.log(`[CCTV LOGIN] Ada yang mencoba masuk -> Email: '${email}', Pass: '${password}'`);

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email & password diperlukan" });
  }
  
  try {
    const user = await queryOne<StoredUser & { id: string }>(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    // CCTV 2: Cek kalau emailnya tidak ada
    if (!user) {
       console.log(`[CCTV LOGIN] Gagal: Email '${email}' TIDAK ADA di Database!`);
       return res.json({ success: true, synced: false });
    }

    // CCTV 3: Cek kalau passwordnya beda
    if (user.password !== password) {
       console.log(`[CCTV LOGIN] Gagal: Password beda. Di DB: '${user.password}', Input HP: '${password}'`);
       return res.json({ success: true, synced: false });
    }

    console.log(`[CCTV LOGIN] BERHASIL: Buka pintu untuk ${email}`);
    await query(
      `UPDATE users SET last_login = NOW(), login_count = login_count + 1 WHERE id = $1`,
      [user.id]
    );
    return res.json({ success: true, synced: true, data: { id: user.id, balance: user.balance } });
  } catch (err) {
    console.error("[users/login]", err);
    return res.json({ success: true, synced: false });
  }
});

// Update balance
router.post("/update-balance", async (req, res) => {
  const { id, balance } = req.body as { id: string; balance: number };
  try {
    await query(`UPDATE users SET balance = $1 WHERE id = $2`, [balance, id]);
    return res.json({ success: true });
  } catch (err) {
    console.error("[users/update-balance]", err);
    return res.json({ success: true });
  }
});

// Record transaction (lightweight — just update counters)
router.post("/record-transaction", async (req, res) => {
  const { id, amount } = req.body as { id: string; amount: number };
  try {
    await query(
      `UPDATE users SET transaction_count = transaction_count + 1, total_spent = total_spent + $1 WHERE id = $2`,
      [amount || 0, id]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("[users/record-transaction]", err);
    return res.json({ success: true });
  }
});

// Record full transaction with ledger entry
router.post("/record-transaction-full", async (req, res) => {
  const {
    user_id, ref_id, product_name, category,
    buyer_sku_code, customer_no, amount,
    balance_before, balance_after, status, sn,
  } = req.body as {
    user_id: string; ref_id: string; product_name: string; category?: string;
    buyer_sku_code?: string; customer_no?: string; amount: number;
    balance_before: number; balance_after: number; status: string; sn?: string;
  };
  try {
    await query(
      `INSERT INTO transaction_history
         (user_id, ref_id, product_name, category, buyer_sku_code, customer_no, amount, balance_before, balance_after, status, sn)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (ref_id) DO UPDATE SET status = EXCLUDED.status, sn = EXCLUDED.sn`,
      [user_id, ref_id, product_name, category, buyer_sku_code, customer_no, amount, balance_before, balance_after, status, sn]
    );
    if (status === "success") {
      await query(
        `UPDATE users SET
           balance = $1,
           transaction_count = transaction_count + 1,
           total_spent = total_spent + $2
         WHERE id = $3`,
        [balance_after, amount, user_id]
      );
    }
    return res.json({ success: true });
  } catch (err) {
    console.error("[users/record-transaction-full]", err);
    return res.json({ success: true });
  }
});

// Record topup
router.post("/record-topup", async (req, res) => {
  const { user_id, amount, balance_before, balance_after, method, ref_id } = req.body as {
    user_id: string; amount: number; balance_before: number;
    balance_after: number; method?: string; ref_id?: string;
  };
  try {
    await query(
      `INSERT INTO topup_history (user_id, amount, balance_before, balance_after, method, ref_id)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [user_id, amount, balance_before, balance_after, method || "QRIS", ref_id]
    );
    await query(`UPDATE users SET balance = $1 WHERE id = $2`, [balance_after, user_id]);
    return res.json({ success: true });
  } catch (err) {
    console.error("[users/record-topup]", err);
    return res.json({ success: true });
  }
});

// Get user ledger (topup + transaction history)
router.get("/:userId/ledger", async (req, res) => {
  const { userId } = req.params;
console.log("Cek ID yang dikirim HP:", userId);

  // Proteksi: Jika ID tidak ada atau aneh, jangan kasih data apa pun!
  if (!userId || userId === "null" || userId === "undefined" || userId === "admin") {
    console.error("[users/ledger] Percobaan akses dengan ID tidak valid:", userId);
    return res.json({ success: true, data: { topups: [], transactions: [] } });
  }

  try {
    const topups = await query(
      `SELECT 'topup' as type, id::text, amount, balance_before, balance_after, method as detail, ref_id, created_at
       FROM topup_history WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    const transactions = await query(
      `SELECT 'transaction' as type, id::text, amount, balance_before, balance_after,
              product_name as detail, ref_id, status, created_at
       FROM transaction_history WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    return res.json({ success: true, data: { topups, transactions } });
  } catch (err) {
    console.error("[users/ledger] Database error:", err);
    return res.json({ success: true, data: { topups: [], transactions: [] } });
  }
});

// Admin: list all users
router.get("/admin/list", adminAuth, async (_req, res) => {
  try {
    const users = await query<StoredUser>(
      `SELECT id, name, email, phone, password, balance,
              created_at as registered_at, last_login, login_count,
              transaction_count, total_spent
       FROM users ORDER BY created_at DESC`
    );
    return res.json({ success: true, data: users, total: users.length });
  } catch (err) {
    console.error("[users/admin/list]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Admin: update balance
router.patch("/admin/:userId/balance", adminAuth, async (req, res) => {
  const { userId } = req.params;
  const { balance } = req.body as { balance: number };
  try {
    const user = await queryOne(
      `UPDATE users SET balance = $1 WHERE id = $2 RETURNING *`,
      [balance, userId]
    );
    if (!user) return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    return res.json({ success: true, data: user });
  } catch (err) {
    console.error("[users/admin/balance]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Admin: reset password
router.patch("/admin/:userId/password", adminAuth, async (req, res) => {
  const { userId } = req.params;
  const { password } = req.body as { password: string };
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: "Password minimal 6 karakter" });
  }
  try {
    const user = await queryOne(`UPDATE users SET password = $1 WHERE id = $2 RETURNING id`, [password, userId]);
    if (!user) return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    return res.json({ success: true });
  } catch (err) {
    console.error("[users/admin/password]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Admin: delete user
router.delete("/admin/:userId", adminAuth, async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await query(`DELETE FROM users WHERE id = $1 RETURNING id`, [userId]);
    if (!result.length) return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    return res.json({ success: true, message: "Akun dihapus." });
  } catch (err) {
    console.error("[users/admin/delete]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Admin: user topup history
router.get("/admin/:userId/topup-history", adminAuth, async (req, res) => {
  const { userId } = req.params;
  try {
    const data = await query(
      `SELECT * FROM topup_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [userId]
    );
    return res.json({ success: true, data });
  } catch (err) {
    console.error("[users/admin/topup-history]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Admin: user transaction history
router.get("/admin/:userId/transaction-history", adminAuth, async (req, res) => {
  const { userId } = req.params;
  try {
    const data = await query(
      `SELECT * FROM transaction_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [userId]
    );
    return res.json({ success: true, data });
  } catch (err) {
    console.error("[users/admin/transaction-history]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
