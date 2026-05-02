export interface AppConfig {
  digiflazzUsername: string;
  digiflazzApiKey: string;
  cacheTtlMinutes: number;
  adminToken: string;
  midtransServerKey: string;
  midtransSandbox: boolean;
}

const cfg: AppConfig = {
  digiflazzUsername: process.env["DIGIFLAZZ_USERNAME"] || "",
  digiflazzApiKey: process.env["DIGIFLAZZ_API_KEY"] || "",
  cacheTtlMinutes: 30,
  adminToken: process.env["ADMIN_TOKEN"] || "Rioaldwi",
  midtransServerKey: process.env["MIDTRANS_SERVER_KEY"] || "",
  midtransSandbox: process.env["MIDTRANS_SANDBOX"] !== "false",
};

export function getConfig(): AppConfig {
  return cfg;
}

export function updateConfig(patch: Partial<Omit<AppConfig, "adminToken">>) {
  if (patch.digiflazzUsername !== undefined) cfg.digiflazzUsername = patch.digiflazzUsername;
  if (patch.digiflazzApiKey !== undefined) cfg.digiflazzApiKey = patch.digiflazzApiKey;
  if (patch.cacheTtlMinutes !== undefined) cfg.cacheTtlMinutes = Math.max(5, patch.cacheTtlMinutes);
  if (patch.midtransServerKey !== undefined) cfg.midtransServerKey = patch.midtransServerKey;
  if (patch.midtransSandbox !== undefined) cfg.midtransSandbox = patch.midtransSandbox;
}

export function isDemo(): boolean {
  return !cfg.digiflazzUsername || !cfg.digiflazzApiKey;
}

export function isMidtransConfigured(): boolean {
  return !!cfg.midtransServerKey;
}
