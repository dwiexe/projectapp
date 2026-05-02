# Workspace

## Overview

pnpm workspace monorepo menggunakan TypeScript. Setiap package mengelola dependensinya sendiri.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### PPOB App (Mobile - Expo/React Native)
- **Path**: `artifacts/ppob-app/`
- **Tipe**: Expo mobile app
- **Fitur**:
  - Autentikasi: Login, Register, Logout, Reset Password (via AsyncStorage)
  - Dashboard: Saldo user, menu layanan, banner promo
  - Transaksi: Pilih produk, input nomor tujuan, konfirmasi, hasil
  - Riwayat Transaksi: List dengan filter status
  - Top Up Saldo: QRIS (Midtrans/demo), VA bank
  - QRIS Payment: QR Code display, countdown timer, auto polling status, simulasi bayar (demo)
  - Admin Panel: Digiflazz config, Midtrans config, cache management (akses via 5× tap versi)
  - Profile: Statistik, logout
- **Layanan**: Pulsa, Paket Data, PLN, E-Wallet, Game
- **Context**: AuthContext (user & saldo), TransactionContext (riwayat)

### API Server (Backend - Node.js Express)
- **Path**: `artifacts/api-server/`
- **Endpoint PPOB**:
  - `GET /api/produk?kategori=...` — List produk dari Digiflazz (atau demo data)
  - `POST /api/transaksi` — Buat transaksi baru
  - `POST /api/cek-status` — Cek status transaksi
  - `POST /api/topup` — Simulasi top up saldo
- **Integrasi**: Digiflazz API (via env `DIGIFLAZZ_USERNAME` & `DIGIFLAZZ_API_KEY`)
- **Mode Demo**: Jika API key tidak diset, gunakan data produk demo

## Environment Variables

Untuk integrasi Digiflazz API yang sesungguhnya, set:
- `DIGIFLAZZ_USERNAME` — Username akun Digiflazz
- `DIGIFLAZZ_API_KEY` — API Key Digiflazz (Production)
- `ADMIN_TOKEN` — Token admin (default: `Rioaldwi`)

Untuk QRIS Midtrans (opsional):
- `MIDTRANS_SERVER_KEY` — Server Key dari dashboard Midtrans
- `MIDTRANS_SANDBOX` — `true` (sandbox/testing) atau `false` (produksi)

Tanpa DIGIFLAZZ env, backend berjalan dalam mode demo dengan data produk simulasi.
Tanpa MIDTRANS_SERVER_KEY, QRIS berjalan dalam mode Demo (QR tidak bisa dibayar sungguhan).
Semua konfigurasi juga bisa diatur via Admin Panel di aplikasi (kecuali ADMIN_TOKEN).

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Arsitektur Mobile

```
app/
  index.tsx                    # Route guard (auth redirect)
  _layout.tsx                  # Root layout dengan semua provider
  auth/
    login.tsx                  # Halaman login
    register.tsx               # Halaman registrasi
    reset-password.tsx         # Reset password
  (tabs)/
    _layout.tsx                # Tab bar (Beranda, Riwayat, Profil)
    index.tsx                  # Dashboard/Beranda
    history.tsx                # Riwayat transaksi
    profile.tsx                # Profil user
  transaction/
    products.tsx               # Pilih produk & nomor tujuan
    confirm.tsx                # Konfirmasi transaksi
    result.tsx                 # Hasil transaksi
    detail.tsx                 # Detail transaksi
  topup.tsx                    # Top up saldo

context/
  AuthContext.tsx              # State autentikasi & saldo
  TransactionContext.tsx       # State riwayat transaksi

services/
  api.ts                       # HTTP client ke backend

components/
  BalanceCard.tsx              # Kartu saldo dengan gradient
  ServiceGrid.tsx              # Grid menu layanan
  TransactionCard.tsx          # Item riwayat transaksi
  ProductItem.tsx              # Item produk
  ui/
    Button.tsx                 # Komponen button reusable
    Input.tsx                  # Komponen input reusable
```

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
