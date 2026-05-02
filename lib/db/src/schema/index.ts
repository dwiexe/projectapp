import { pgTable, text, timestamp, integer, boolean, bigserial, bigint } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: bigserial("id", { mode: "number" }).primaryKey(), // <-- Dirubah jadi angka raksasa
  username: text("username").unique(),
  name: text("name").notNull(),
  phone: text("phone").unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("user"),
  balance: integer("balance").default(0),
  saldo: integer("saldo").default(0),
  status: boolean("status").default(true),
  lastLogin: timestamp("last_login"),
  loginCount: integer("login_count").default(0),
  transactionCount: integer("transaction_count").default(0),
  totalSpent: integer("total_spent").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const configs = pgTable("configs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  key: text("key").unique(),
  value: text("value"),
  digiflazzUsername: text("digiflazz_username"),
  digiflazzApiKey: text("digiflazz_api_key"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const topupHistory = pgTable("topup_history", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: bigint("user_id", { mode: "number" }), // <-- Menyesuaikan ID User
  amount: integer("amount"),
  balanceBefore: integer("balance_before"),
  balanceAfter: integer("balance_after"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactionHistory = pgTable("transaction_history", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: bigint("user_id", { mode: "number" }), // <-- Menyesuaikan ID User
  productName: text("product_name"), 
  category: text("category"),
  buyerSkuCode: text("buyer_sku_code"),
  customerNo: text("customer_no"),
  sn: text("sn"),
  refId: text("ref_id").unique(),
  amount: integer("amount"),
  balanceBefore: integer("balance_before"),
  balanceAfter: integer("balance_after"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});
