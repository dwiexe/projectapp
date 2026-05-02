import { Router } from "express";
import crypto from "crypto";
import { getConfig, isDemo } from "../lib/config";

const router = Router();

const DIGIFLAZZ_BASE_URL = "https://api.digiflazz.com/v1";

function makeMd5Sign(...parts: string[]) {
  return crypto.createHash("md5").update(parts.join("")).digest("hex");
}

interface DigiProduct {
  buyer_sku_code: string;
  product_name: string;
  category: string;
  brand: string;
  type: string;
  seller_name: string;
  price: number;
  buyer_product_status: boolean;
  seller_product_status: boolean;
  unlimited_stock: boolean;
  stock: number;
  multi: boolean;
  start_cut_off: string;
  end_cut_off: string;
  desc: string;
}

const CATEGORY_MAP: Record<string, string[]> = {
  "Pulsa":      ["Pulsa"],
  "Data":       ["Data", "Paket Data", "Paket Internet"],
  "PLN":        ["PLN Prabayar", "PLN", "Listrik"],
  "E-Money":    ["E-Wallet", "E-Money", "Dompet Digital"],
  "Games":      ["Games", "Voucher Game", "Game", "Gaming"],
  "Masa Aktif": ["Masa Aktif", "Perpanjang"],
  "SMS":        ["SMS", "Paket SMS"],
  "Telepon":    ["Telepon", "Paket Telepon", "Nelpon"],
  "TV":         ["TV Kabel", "TV", "Streaming", "Paket TV"],
};

let productCache: DigiProduct[] = [];
let lastSync: Date | null = null;

function mapCategory(digiCategory: string): string | null {
  const lc = digiCategory.toLowerCase();
  for (const [ourCat, digiCats] of Object.entries(CATEGORY_MAP)) {
    if (digiCats.some((dc) => lc.includes(dc.toLowerCase()))) return ourCat;
  }
  return null;
}

export function getCacheInfo() {
  const cfg = getConfig();
  const ttlMs = cfg.cacheTtlMinutes * 60 * 1000;
  const nextSync = lastSync ? new Date(lastSync.getTime() + ttlMs) : null;
  return {
    total: isDemo() ? getDemoProducts().length : productCache.length,
    lastSync,
    nextSync,
  };
}

export function clearCache() {
  productCache = [];
  lastSync = null;
}

export function markSynced() {
  lastSync = new Date();
}

async function syncFromDigiflazz(): Promise<DigiProduct[]> {
  const cfg = getConfig();
  const sign = makeMd5Sign(cfg.digiflazzUsername, cfg.digiflazzApiKey, "pricelist");
  const url = `${DIGIFLAZZ_BASE_URL}/price-list`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cmd: "prepaid", username: cfg.digiflazzUsername, sign }),
  });
  if (!res.ok) throw new Error(`Digiflazz HTTP ${res.status}`);
  const json = await res.json() as { data: unknown; rc?: string; message?: string };
  if (!Array.isArray(json.data)) {
    const msg = (json as Record<string, string>).message || JSON.stringify(json).slice(0, 200);
    throw new Error(`Digiflazz error: ${msg}`);
  }
  return (json.data as DigiProduct[]).filter(
    (p) => p.buyer_product_status && p.seller_product_status && p.type === "Prepaid"
  );
}

export async function triggerSync(): Promise<number> {
  const fresh = await syncFromDigiflazz();
  productCache = fresh;
  lastSync = new Date();
  console.log(`[PPOB] Manual sync: ${fresh.length} products`);
  return fresh.length;
}

async function getProducts(): Promise<DigiProduct[]> {
  if (isDemo()) return getDemoProducts();
  const cfg = getConfig();
  const ttlMs = cfg.cacheTtlMinutes * 60 * 1000;
  if (productCache.length === 0 || !lastSync || Date.now() - lastSync.getTime() > ttlMs) {
    try {
      const fresh = await syncFromDigiflazz();
      productCache = fresh;
      lastSync = new Date();
      console.log(`[PPOB] Auto-sync: ${fresh.length} products`);
    } catch (err) {
      console.error("[PPOB] Sync failed:", err);
      if (productCache.length === 0) {
        console.warn("[PPOB] Sync failed & cache empty — using demo products as fallback");
        return getDemoProducts();
      }
    }
  }
  return productCache.length > 0 ? productCache : getDemoProducts();
}

router.get("/sync-status", (_req, res) => {
  const info = getCacheInfo();
  const cfg = getConfig();
  res.json({
    success: true,
    data: {
      is_demo: isDemo(),
      total_products: info.total,
      last_sync: info.lastSync,
      next_sync: info.nextSync,
      cache_ttl_minutes: cfg.cacheTtlMinutes,
    },
  });
});

router.get("/kategori", (_req, res) => {
  const categories = Object.keys(CATEGORY_MAP).map((name) => {
    const emojis: Record<string, string> = {
      "Pulsa": "📱", "Data": "📶", "PLN": "⚡", "E-Money": "💳",
      "Games": "🎮", "Masa Aktif": "⏰", "SMS": "💬", "Telepon": "📞", "TV": "📺",
    };
    return { id: name.toLowerCase().replace(/\s+/g, "-"), name, emoji: emojis[name] || "🔷" };
  });
  res.json({ success: true, data: categories });
});

router.get("/operator", async (req, res) => {
  const { kategori } = req.query as Record<string, string>;
  try {
    const products = await getProducts();
    const filtered = kategori
      ? products.filter((p) => mapCategory(p.category) === kategori)
      : products;
    const brandMap = new Map<string, { name: string; count: number }>();
    for (const p of filtered) {
      if (!brandMap.has(p.brand)) brandMap.set(p.brand, { name: p.brand, count: 0 });
      brandMap.get(p.brand)!.count++;
    }
    const operators = Array.from(brandMap.values()).sort((a, b) => b.count - a.count);
    return res.json({ success: true, data: operators });
  } catch (err) {
    return res.status(500).json({ success: false, message: String(err) });
  }
});

router.get("/produk", async (req, res) => {
  const { kategori, brand } = req.query as Record<string, string>;
  try {
    let products = await getProducts();
    if (kategori && kategori !== "Semua") {
      products = products.filter((p) => mapCategory(p.category) === kategori);
    }
    if (brand) {
      products = products.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
    }
    return res.json({ success: true, data: products });
  } catch (err) {
    return res.status(500).json({ success: false, message: String(err) });
  }
});

router.post("/transaksi", async (req, res) => {
  const { buyer_sku_code, customer_no, ref_id } = req.body as {
    buyer_sku_code: string; customer_no: string; ref_id: string;
  };
  if (!buyer_sku_code || !customer_no || !ref_id) {
    return res.status(400).json({ success: false, message: "Parameter tidak lengkap" });
  }
  if (isDemo()) {
    await new Promise((r) => setTimeout(r, 1200));
    const isSuccess = Math.random() > 0.1;
    return res.json({
      success: true,
      data: {
        ref_id, customer_no, buyer_sku_code,
        message: isSuccess ? "Sukses" : "Gagal",
        status: isSuccess ? "Sukses" : "Gagal",
        sn: isSuccess ? `SN${Date.now()}` : null,
        rc: isSuccess ? "00" : "99",
        buyer_last_saldo: 90000,
        selling_price: 10000,
        desc: isSuccess ? "Transaksi berhasil" : "Transaksi gagal",
      },
    });
  }
  const cfg = getConfig();
  const sign = makeMd5Sign(cfg.digiflazzUsername, cfg.digiflazzApiKey, ref_id);
  const url = `${DIGIFLAZZ_BASE_URL}/transaction`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cmd: "prepaid", username: cfg.digiflazzUsername, buyer_sku_code, customer_no, ref_id, sign, testing: false }),
    });
    const json = await r.json() as { data: unknown };
    return res.json({ success: true, data: json.data });
  } catch (err) {
    return res.status(500).json({ success: false, message: String(err) });
  }
});

router.post("/cek-status", async (req, res) => {
  const { ref_id } = req.body as { ref_id: string };
  if (!ref_id) return res.status(400).json({ success: false, message: "ref_id diperlukan" });
  if (isDemo()) {
    return res.json({ success: true, data: { ref_id, status: "Sukses", message: "Transaksi berhasil diproses", rc: "00" } });
  }
  const cfg = getConfig();
  const sign = makeMd5Sign(cfg.digiflazzUsername, cfg.digiflazzApiKey, ref_id);
  const url = `${DIGIFLAZZ_BASE_URL}/transaction`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cmd: "inq-pasca", username: cfg.digiflazzUsername, ref_id, sign }),
    });
    const json = await r.json() as { data: unknown };
    return res.json({ success: true, data: json.data });
  } catch (err) {
    return res.status(500).json({ success: false, message: String(err) });
  }
});

router.post("/topup", async (req, res) => {
  const { amount, payment_method } = req.body as { amount: number; payment_method: string };
  if (!amount || amount < 10000) {
    return res.status(400).json({ success: false, message: "Nominal minimal Rp 10.000" });
  }
  const trx_id = `TU${Date.now()}`;
  return res.json({
    success: true,
    data: {
      trx_id, amount, payment_method: payment_method || "Transfer Bank",
      status: "pending",
      va_number: `8277${Math.floor(Math.random() * 1000000000).toString().padStart(9, "0")}`,
      expired_at: new Date(Date.now() + 3600000).toISOString(),
      message: "Silakan lakukan pembayaran sesuai instruksi",
    },
  });
});

function getDemoProducts(): DigiProduct[] {
  const make = (sku: string, name: string, cat: string, brand: string, price: number, desc: string): DigiProduct => ({
    buyer_sku_code: sku, product_name: name, category: cat, brand,
    type: "Prepaid", seller_name: "Demo", price,
    buyer_product_status: true, seller_product_status: true,
    unlimited_stock: true, stock: 999, multi: false,
    start_cut_off: "00:00", end_cut_off: "23:59", desc,
  });

  return [
    make("TL5","Telkomsel 5.000","Pulsa","Telkomsel",6000,"Pulsa Telkomsel Rp 5.000"),
    make("TL10","Telkomsel 10.000","Pulsa","Telkomsel",11500,"Pulsa Telkomsel Rp 10.000"),
    make("TL25","Telkomsel 25.000","Pulsa","Telkomsel",26500,"Pulsa Telkomsel Rp 25.000"),
    make("TL50","Telkomsel 50.000","Pulsa","Telkomsel",51500,"Pulsa Telkomsel Rp 50.000"),
    make("TL100","Telkomsel 100.000","Pulsa","Telkomsel",102000,"Pulsa Telkomsel Rp 100.000"),
    make("XL5","XL 5.000","Pulsa","XL Axiata",6000,"Pulsa XL Rp 5.000"),
    make("XL10","XL 10.000","Pulsa","XL Axiata",11500,"Pulsa XL Rp 10.000"),
    make("XL25","XL 25.000","Pulsa","XL Axiata",26000,"Pulsa XL Rp 25.000"),
    make("XL50","XL 50.000","Pulsa","XL Axiata",51000,"Pulsa XL Rp 50.000"),
    make("IST5","Indosat 5.000","Pulsa","Indosat Ooredoo",6000,"Pulsa Indosat Rp 5.000"),
    make("IST10","Indosat 10.000","Pulsa","Indosat Ooredoo",11500,"Pulsa Indosat Rp 10.000"),
    make("IST25","Indosat 25.000","Pulsa","Indosat Ooredoo",26000,"Pulsa Indosat Rp 25.000"),
    make("TRI5","Tri 5.000","Pulsa","Tri",6000,"Pulsa Tri Rp 5.000"),
    make("TRI10","Tri 10.000","Pulsa","Tri",11000,"Pulsa Tri Rp 10.000"),
    make("SF5","Smartfren 5.000","Pulsa","Smartfren",6000,"Pulsa Smartfren Rp 5.000"),
    make("SF10","Smartfren 10.000","Pulsa","Smartfren",11000,"Pulsa Smartfren Rp 10.000"),
    make("TSEL1GB7","Telkomsel 1GB/7 Hari","Data","Telkomsel",12000,"Paket Data 1GB berlaku 7 hari"),
    make("TSEL3GB30","Telkomsel 3GB/30 Hari","Data","Telkomsel",35000,"Paket Data 3GB berlaku 30 hari"),
    make("TSEL5GB30","Telkomsel 5GB/30 Hari","Data","Telkomsel",50000,"Paket Data 5GB berlaku 30 hari"),
    make("TSEL10GB30","Telkomsel 10GB/30 Hari","Data","Telkomsel",80000,"Paket Data 10GB berlaku 30 hari"),
    make("XL1GB7","XL 1GB/7 Hari","Data","XL Axiata",11000,"Paket Data 1GB berlaku 7 hari"),
    make("XL2GB30","XL 2GB/30 Hari","Data","XL Axiata",20000,"Paket Data 2GB berlaku 30 hari"),
    make("XL5GB30","XL 5GB/30 Hari","Data","XL Axiata",47000,"Paket Data 5GB berlaku 30 hari"),
    make("IST1GB7","Indosat 1GB/7 Hari","Data","Indosat Ooredoo",10000,"Paket Data 1GB berlaku 7 hari"),
    make("IST5GB30","Indosat 5GB/30 Hari","Data","Indosat Ooredoo",45000,"Paket Data 5GB berlaku 30 hari"),
    make("TRI1GB","Tri 1GB/7 Hari","Data","Tri",10000,"Paket Data 1GB berlaku 7 hari"),
    make("SF2GB","Smartfren 2GB/30 Hari","Data","Smartfren",22000,"Paket Data 2GB berlaku 30 hari"),
    make("PLN20","Token PLN 20.000","PLN Prabayar","PLN",21500,"Token Listrik PLN 20.000"),
    make("PLN50","Token PLN 50.000","PLN Prabayar","PLN",51500,"Token Listrik PLN 50.000"),
    make("PLN100","Token PLN 100.000","PLN Prabayar","PLN",101500,"Token Listrik PLN 100.000"),
    make("PLN200","Token PLN 200.000","PLN Prabayar","PLN",201500,"Token Listrik PLN 200.000"),
    make("PLN500","Token PLN 500.000","PLN Prabayar","PLN",501500,"Token Listrik PLN 500.000"),
    make("GOPAY10","GoPay 10.000","E-Wallet","GoPay",11000,"Top Up GoPay Rp 10.000"),
    make("GOPAY25","GoPay 25.000","E-Wallet","GoPay",26000,"Top Up GoPay Rp 25.000"),
    make("GOPAY50","GoPay 50.000","E-Wallet","GoPay",51000,"Top Up GoPay Rp 50.000"),
    make("GOPAY100","GoPay 100.000","E-Wallet","GoPay",101000,"Top Up GoPay Rp 100.000"),
    make("OVO10","OVO 10.000","E-Wallet","OVO",11000,"Top Up OVO Rp 10.000"),
    make("OVO25","OVO 25.000","E-Wallet","OVO",26000,"Top Up OVO Rp 25.000"),
    make("OVO50","OVO 50.000","E-Wallet","OVO",51000,"Top Up OVO Rp 50.000"),
    make("DANA10","DANA 10.000","E-Wallet","DANA",11000,"Top Up DANA Rp 10.000"),
    make("DANA50","DANA 50.000","E-Wallet","DANA",51000,"Top Up DANA Rp 50.000"),
    make("SHOPEE10","ShopeePay 10.000","E-Wallet","ShopeePay",11000,"Top Up ShopeePay Rp 10.000"),
    make("SHOPEE50","ShopeePay 50.000","E-Wallet","ShopeePay",51000,"Top Up ShopeePay Rp 50.000"),
    make("LINKAJA10","LinkAja 10.000","E-Wallet","LinkAja",11000,"Top Up LinkAja Rp 10.000"),
    make("LINKAJA50","LinkAja 50.000","E-Wallet","LinkAja",51000,"Top Up LinkAja Rp 50.000"),
    make("FF140","Free Fire 140 Diamond","Games","Free Fire",19000,"Free Fire 140 Diamond"),
    make("FF720","Free Fire 720 Diamond","Games","Free Fire",89000,"Free Fire 720 Diamond"),
    make("FF2180","Free Fire 2180 Diamond","Games","Free Fire",249000,"Free Fire 2180 Diamond"),
    make("ML86","Mobile Legends 86 Diamond","Games","Mobile Legends",16000,"Mobile Legends 86 Diamond"),
    make("ML172","Mobile Legends 172 Diamond","Games","Mobile Legends",30000,"Mobile Legends 172 Diamond"),
    make("ML520","Mobile Legends 520 Diamond","Games","Mobile Legends",85000,"Mobile Legends 520 Diamond"),
    make("ML1060","Mobile Legends 1060 Diamond","Games","Mobile Legends",165000,"Mobile Legends 1060 Diamond"),
    make("PUBG60","PUBG Mobile 60 UC","Games","PUBG Mobile",14000,"PUBG Mobile 60 UC"),
    make("PUBG300","PUBG Mobile 300 UC","Games","PUBG Mobile",65000,"PUBG Mobile 300 UC"),
    make("PUBG600","PUBG Mobile 600 UC","Games","PUBG Mobile",125000,"PUBG Mobile 600 UC"),
    make("GENSHIN160","Genshin Impact 160 Genesis","Games","Genshin Impact",38000,"Genshin Impact 160 Genesis Crystal"),
    make("GENSHIN980","Genshin Impact 980 Genesis","Games","Genshin Impact",210000,"Genshin Impact 980 Genesis Crystal"),
    make("AOV50","Arena of Valor 50 Token","Games","Arena of Valor",9000,"Arena of Valor 50 Token"),
    make("MLBB_WP","Mobile Legends Twilight Pass","Games","Mobile Legends",17500,"ML Twilight Pass"),
    make("TSEL_MA30","Telkomsel Masa Aktif 30 Hari","Masa Aktif","Telkomsel",8500,"Perpanjang masa aktif 30 hari"),
    make("TSEL_MA60","Telkomsel Masa Aktif 60 Hari","Masa Aktif","Telkomsel",15000,"Perpanjang masa aktif 60 hari"),
    make("XL_MA30","XL Masa Aktif 30 Hari","Masa Aktif","XL Axiata",7500,"Perpanjang masa aktif 30 hari"),
    make("IST_MA30","Indosat Masa Aktif 30 Hari","Masa Aktif","Indosat Ooredoo",7500,"Perpanjang masa aktif 30 hari"),
    make("TRI_MA30","Tri Masa Aktif 30 Hari","Masa Aktif","Tri",7000,"Perpanjang masa aktif 30 hari"),
    make("TSEL_SMS50","Telkomsel 50 SMS","SMS","Telkomsel",3500,"Paket SMS 50 SMS/hari x 7 hari"),
    make("TSEL_SMS100","Telkomsel 100 SMS","SMS","Telkomsel",6500,"Paket SMS 100 SMS/hari x 30 hari"),
    make("XL_SMS50","XL 50 SMS","SMS","XL Axiata",3000,"Paket SMS 50 SMS/hari"),
    make("IST_SMS50","Indosat 50 SMS","SMS","Indosat Ooredoo",3500,"Paket SMS 50 SMS/hari"),
    make("TSEL_TEL30","Telkomsel 30 Menit","Telepon","Telkomsel",7500,"Paket 30 menit sesama Telkomsel"),
    make("TSEL_TEL60","Telkomsel 60 Menit","Telepon","Telkomsel",14000,"Paket 60 menit sesama Telkomsel"),
    make("XL_TEL30","XL 30 Menit","Telepon","XL Axiata",7000,"Paket 30 menit sesama XL"),
    make("IST_TEL30","Indosat 30 Menit","Telepon","Indosat Ooredoo",7000,"Paket 30 menit sesama Indosat"),
    make("TRANSVISION_BAS","Transvision Basic","TV Kabel","Transvision",99000,"Paket TV Transvision Basic/bulan"),
    make("TRANSVISION_STD","Transvision Standard","TV Kabel","Transvision",179000,"Paket TV Transvision Standard/bulan"),
    make("NEXMEDIA_BAS","Nexmedia Basic","TV Kabel","Nexmedia",79000,"Paket TV Nexmedia Basic/bulan"),
    make("NEXMEDIA_STD","Nexmedia Standard","TV Kabel","Nexmedia",149000,"Paket TV Nexmedia Standard/bulan"),
    make("KVIDIO_1","Vidio 1 Bulan","TV Kabel","Vidio",18000,"Streaming Vidio Premier 1 bulan"),
    make("KVIDIO_3","Vidio 3 Bulan","TV Kabel","Vidio",50000,"Streaming Vidio Premier 3 bulan"),
  ];
}

export default router;
