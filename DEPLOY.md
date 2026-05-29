# Panduan Deploy: Catatan Pribadi

## Prasyarat
- Akun GitHub
- Akun Supabase (supabase.com)
- Akun Vercel (vercel.com)
- Node.js >= 18

---

## Langkah 1 — Setup Supabase

### 1.1 Buat Project
1. Buka https://supabase.com/dashboard
2. Klik **New project**
3. Isi nama project, password database, pilih region terdekat (Singapore)
4. Tunggu provisioning selesai (~2 menit)

### 1.2 Jalankan Migration
1. Buka **SQL Editor** di sidebar Supabase
2. Klik **New query**
3. Salin seluruh isi file `supabase/migrations/001_initial.sql`
4. Klik **Run**
5. Pastikan tidak ada error merah

### 1.3 Aktifkan Google OAuth (opsional)
1. Buka **Authentication > Providers > Google**
2. Toggle **Enable**
3. Buka https://console.cloud.google.com
4. Buat project baru > **APIs & Services > Credentials**
5. Buat **OAuth 2.0 Client ID** (tipe: Web application)
6. Tambahkan Authorized redirect URI:
   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```
7. Salin **Client ID** dan **Client Secret** ke Supabase

### 1.4 Ambil Credentials
1. Buka **Project Settings > API**
2. Salin:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Langkah 2 — Setup Lokal

```bash
# Clone atau ekstrak project
cd catatan-pribadi

# Install dependencies
npm install

# Buat file environment
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```bash
# Jalankan development server
npm run dev
# Buka http://localhost:3000
```

---

## Langkah 3 — Push ke GitHub

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/<username>/catatan-pribadi.git
git push -u origin main
```

---

## Langkah 4 — Deploy ke Vercel

### 4.1 Import Project
1. Buka https://vercel.com/new
2. Klik **Import** pada repository `catatan-pribadi`
3. Framework preset: **Next.js** (terdeteksi otomatis)

### 4.2 Environment Variables
Di halaman konfigurasi Vercel, tambahkan:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL dari Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key dari Supabase |

### 4.3 Deploy
Klik **Deploy**. Vercel akan build dan deploy otomatis (~1-2 menit).

### 4.4 Update Supabase Auth Redirect URL
Setelah deploy, salin URL production Vercel (contoh: `https://catatan-pribadi.vercel.app`).

1. Buka Supabase **Authentication > URL Configuration**
2. **Site URL**: `https://catatan-pribadi.vercel.app`
3. **Redirect URLs**: tambahkan `https://catatan-pribadi.vercel.app/**`
4. Klik **Save**

---

## Langkah 5 — Verifikasi

Buka URL production Vercel dan pastikan:
- [ ] Halaman `/login` tampil dengan benar
- [ ] Registrasi akun baru berfungsi
- [ ] Email konfirmasi terkirim
- [ ] Setelah konfirmasi, bisa login
- [ ] Membuat catatan baru berfungsi
- [ ] Auto-save bekerja (indikator "tersimpan")
- [ ] Logout berfungsi

---

## Continuous Deployment

Setiap `git push` ke branch `main` akan otomatis trigger deployment baru di Vercel.
