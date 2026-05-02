import { Router } from "express";
import { getConfig, isMidtransConfigured } from "../lib/config";

const router = Router();

interface QrisOrder {
  order_id: string;
  amount: number;
  qr_string: string;
  qr_url: string;
  status: "pending" | "paid" | "expired";
  created_at: Date;
  expires_at: Date;
}

const pendingOrders = new Map<string, QrisOrder>();

function getMidtransBaseUrl() {
  const cfg = getConfig();
  return cfg.midtransSandbox
    ? "https://api.sandbox.midtrans.com/v2"
    : "https://api.midtrans.com/v2";
}

function getMidtransAuth() {
  const cfg = getConfig();
  return Buffer.from(`${cfg.midtransServerKey}:`).toString("base64");
}

async function createMidtransQris(orderId: string, amount: number): Promise<{ qr_string: string; qr_url: string }> {
  const baseUrl = getMidtransBaseUrl();
  const res = await fetch(`${baseUrl}/charge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${getMidtransAuth()}`,
      "Accept": "application/json",
    },
    body: JSON.stringify({
      payment_type: "qris",
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      qris: { acquirer: "gopay" },
    }),
  });
  const json = await res.json() as {
    qr_string?: string;
    actions?: Array<{ name: string; url: string }>;
    status_code?: string;
    status_message?: string;
  };
  if (!json.qr_string) {
    throw new Error(json.status_message || "Gagal membuat QRIS dari Midtrans");
  }
  const qrAction = json.actions?.find((a) => a.name === "generate-qr-code");
  return {
    qr_string: json.qr_string,
    qr_url: qrAction?.url || "",
  };
}

function makeDemoQrisString(orderId: string, amount: number): string {
  const amountStr = amount.toString().padStart(10, "0");
  return [
    "00020101021226790014ID.CO.MIDTRANS.WWW",
    `0118${orderId.slice(0, 18)}`,
    "0215ID.CO.DEMO.PPOB",
    "5802ID",
    "5303360",
    `54${amountStr.length.toString().padStart(2, "0")}${amountStr}`,
    "6304ABCD",
  ].join("");
}

router.post("/create", async (req, res) => {
  const { amount, order_id } = req.body as { amount: number; order_id?: string };
  if (!amount || amount < 1000) {
    return res.status(400).json({ success: false, message: "Nominal minimal Rp 1.000" });
  }

  const orderId = order_id || `PAYKITA-${Date.now()}`;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  if (isMidtransConfigured()) {
    try {
      const { qr_string, qr_url } = await createMidtransQris(orderId, amount);
      const order: QrisOrder = {
        order_id: orderId, amount, qr_string, qr_url,
        status: "pending",
        created_at: new Date(),
        expires_at: expiresAt,
      };
      pendingOrders.set(orderId, order);
      return res.json({
        success: true,
        data: { order_id: orderId, qr_string, qr_url, expires_at: expiresAt, amount, provider: "midtrans" },
      });
    } catch (err) {
      console.error("[QRIS] Midtrans error:", err);
    }
  }

  const qrString = makeDemoQrisString(orderId, amount);
  const order: QrisOrder = {
    order_id: orderId, amount,
    qr_string: qrString,
    qr_url: "",
    status: "pending",
    created_at: new Date(),
    expires_at: expiresAt,
  };
  pendingOrders.set(orderId, order);
  return res.json({
    success: true,
    data: { order_id: orderId, qr_string: qrString, qr_url: "", expires_at: expiresAt, amount, provider: "demo" },
  });
});

router.get("/status/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const order = pendingOrders.get(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order tidak ditemukan" });
  }

  if (new Date() > order.expires_at && order.status === "pending") {
    order.status = "expired";
  }

  if (isMidtransConfigured() && order.status === "pending") {
    try {
      const baseUrl = getMidtransBaseUrl();
      const checkRes = await fetch(`${baseUrl}/${orderId}/status`, {
        headers: { "Authorization": `Basic ${getMidtransAuth()}` },
      });
      const json = await checkRes.json() as { transaction_status?: string; fraud_status?: string };
      if (json.transaction_status === "settlement" || json.transaction_status === "capture") {
        order.status = "paid";
      } else if (json.transaction_status === "expire" || json.transaction_status === "cancel") {
        order.status = "expired";
      }
    } catch (err) {
      console.error("[QRIS] Status check error:", err);
    }
  }

  return res.json({
    success: true,
    data: {
      order_id: orderId,
      status: order.status,
      amount: order.amount,
      expires_at: order.expires_at,
    },
  });
});

router.post("/simulate-pay/:orderId", (req, res) => {
  const { orderId } = req.params;
  const order = pendingOrders.get(orderId);
  if (!order) return res.status(404).json({ success: false, message: "Order tidak ditemukan" });
  if (order.status !== "pending") return res.json({ success: false, message: `Status: ${order.status}` });
  order.status = "paid";
  return res.json({ success: true, message: "Pembayaran berhasil disimulasikan" });
});

export default router;
