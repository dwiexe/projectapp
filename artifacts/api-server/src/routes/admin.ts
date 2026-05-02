import { Router, type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";
import { getConfig, updateConfig, isDemo, isMidtransConfigured } from "../lib/config";
import {
  getCacheInfo,
  triggerSync,
  clearCache,
  markSynced,
} from "./ppob";

const router = Router();

function adminAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["x-admin-token"] || req.body?.admin_token || req.query?.token;
  const { adminToken } = getConfig();
  if (!token || token !== adminToken) {
    return res.status(401).json({ success: false, message: "Akses ditolak. Token admin tidak valid." });
  }
  return next();
}

router.post("/login", (req, res) => {
  const { token } = req.body as { token: string };
  const { adminToken } = getConfig();
  if (!token || token !== adminToken) {
    return res.status(401).json({ success: false, message: "Token admin salah." });
  }
  return res.json({ success: true, message: "Login admin berhasil." });
});

router.get("/status", adminAuth, (_req, res) => {
  const cfg = getConfig();
  const cache = getCacheInfo();
  return res.json({
    success: true,
    data: {
      mode: isDemo() ? "demo" : "live",
      digiflazz_username: cfg.digiflazzUsername || "(belum diset)",
      digiflazz_api_key_set: !!cfg.digiflazzApiKey,
      digiflazz_api_key_preview: cfg.digiflazzApiKey
        ? cfg.digiflazzApiKey.slice(0, 4) + "****" + cfg.digiflazzApiKey.slice(-4)
        : "(belum diset)",
      cache_ttl_minutes: cfg.cacheTtlMinutes,
      total_cached_products: cache.total,
      last_sync: cache.lastSync,
      next_sync: cache.nextSync,
      midtrans_configured: isMidtransConfigured(),
      midtrans_sandbox: cfg.midtransSandbox,
    },
  });
});

router.get("/config", adminAuth, (_req, res) => {
  const cfg = getConfig();
  return res.json({
    success: true,
    data: {
      digiflazz_username: cfg.digiflazzUsername,
      digiflazz_api_key_set: !!cfg.digiflazzApiKey,
      digiflazz_api_key_preview: cfg.digiflazzApiKey
        ? cfg.digiflazzApiKey.slice(0, 4) + "****" + cfg.digiflazzApiKey.slice(-4)
        : "",
      cache_ttl_minutes: cfg.cacheTtlMinutes,
    },
  });
});

router.post("/config", adminAuth, async (req, res) => {
  const {
    digiflazz_username,
    digiflazz_api_key,
    cache_ttl_minutes,
    midtrans_server_key,
    midtrans_sandbox,
  } = req.body as {
    digiflazz_username?: string;
    digiflazz_api_key?: string;
    cache_ttl_minutes?: number;
    midtrans_server_key?: string;
    midtrans_sandbox?: boolean;
  };
  updateConfig({
    digiflazzUsername: digiflazz_username,
    digiflazzApiKey: digiflazz_api_key,
    cacheTtlMinutes: cache_ttl_minutes,
    midtransServerKey: midtrans_server_key,
    midtransSandbox: midtrans_sandbox,
  });
  if (digiflazz_username || digiflazz_api_key) clearCache();
  return res.json({ success: true, message: "Konfigurasi berhasil diperbarui." });
});

router.post("/sync", adminAuth, async (_req, res) => {
  if (isDemo()) {
    markSynced();
    const info = getCacheInfo();
    return res.json({
      success: true,
      message: `Demo mode — ${info.total} produk demo aktif. Sync waktu diperbarui.`,
      total: info.total,
      last_sync: info.lastSync,
      next_sync: info.nextSync,
    });
  }
  try {
    const total = await triggerSync();
    const info = getCacheInfo();
    return res.json({
      success: true,
      message: `Sync berhasil. ${total} produk diperbarui.`,
      total,
      last_sync: info.lastSync,
      next_sync: info.nextSync,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: String(err) });
  }
});

router.post("/clear-cache", adminAuth, (_req, res) => {
  clearCache();
  return res.json({ success: true, message: "Cache produk dikosongkan." });
});

export default router;
