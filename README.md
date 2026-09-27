# PhotoFlow — End-to-End Encrypted Photography Studio Management

PhotoFlow is a modern web and mobile-ready PWA for managing photography clients, project pipelines, shoot schedules, tasks, invoices/payments, and financial analytics.

Unlike traditional database-backed web apps or spreadsheet scripts, PhotoFlow keeps all business records **out of Postgres rows** and stores them as **client-side AES-GCM encrypted objects** inside a private **Supabase Storage** bucket (`photoflow-data`) with strict per-user isolation.

---

## Architecture Overview

```text
Supabase Auth (Email/Password + Recovery)
      ↓
Authenticated User Session (userId)
      ↓
Web Crypto API (256-bit AES-GCM per-user Data Encryption Key wrapped via PBKDF2-SHA256)
      ↓
Private Supabase Storage Bucket (`photoflow-data`)
      ↓
Isolated Encrypted Objects (`{userId}/clients.enc`, `projects.enc`, `tasks.enc`, `payments.enc`, `activities.enc`, `settings.enc`)
```

---

## 1. Create the Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and click **New Project**.
2. Choose your organization, give the project a name (`photoflow`), set a strong database password, and select the region closest to you.
3. Wait for the project to finish provisioning.

---

## 2. Configure Supabase Authentication

1. In your Supabase Dashboard, navigate to **Authentication → Providers → Email**.
2. Ensure **Enable Email provider** is turned ON.
3. Under **Authentication → URL Configuration**:
   - Set **Site URL** to your local or production URL (e.g. `http://localhost:3000` or your deployed domain).
   - Add `http://localhost:3000/**` and your production domain to **Redirect URLs** so password recovery links redirect back to PhotoFlow cleanly.

---

## 3. Create the Private Storage Bucket & 4. Configure Storage Policies

1. In your Supabase Dashboard, open the **SQL Editor**.
2. Copy the entire contents of [`supabase/setup.sql`](./supabase/setup.sql) and click **Run**.
3. This script automatically:
   - Creates the **private** bucket `photoflow-data` (`public = false`).
   - Creates 4 strict Row-Level Security (RLS) policies on `storage.objects` (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) enforcing:
     ```sql
     bucket_id = 'photoflow-data' AND (storage.foldername(name))[1] = (select auth.uid()::text)
     ```
   - Ensures no user can ever list, read, overwrite, or delete another user's encrypted objects.

---

## 5. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your project's public URL and publishable/anon key from **Project Settings → API**:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-or-publishable-key
```

> **Security Note:** Never place your `service_role` secret key in `.env` or frontend code. PhotoFlow uses only the publishable/anon key paired with authenticated user JWTs and Storage RLS policies.

---

## 6. Install Dependencies

```bash
npm install
```

---

## 7. Run Locally

```bash
npm run dev
```

The application starts on `http://localhost:3000`.

---

## 8. Build for Production

```bash
npm run build
npm run preview
```

This runs TypeScript verification, bundles the React application, and generates the PWA `manifest.webmanifest` and Workbox service worker in `dist/`.

---

## 9. Deployment

Deploy the static `dist/` directory to any modern static host (Cloud Run, Vercel, Netlify, Cloudflare Pages):

- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Configure single-page application (SPA) rewrite rules so all routes resolve to `/index.html`.

---

## 10. How Encryption Setup Works

1. **Per-User Random Data Encryption Key (DEK):**
   On your first sign-in, PhotoFlow uses the browser's native Web Crypto API (`crypto.subtle.generateKey`) to generate a cryptographically random 256-bit `AES-GCM` Data Encryption Key.
2. **Passphrase Key Wrapping (PBKDF2 + AES-GCM):**
   You choose an Encryption Vault Passphrase. PhotoFlow derives a 256-bit Key-Encryption Key (KEK) using `PBKDF2-SHA256` with 250,000 iterations and a random 16-byte cryptographic salt.
3. **Zero-Knowledge Key Storage:**
   The random DEK is encrypted (wrapped) with the KEK and stored at `{userId}/key-bundle.json` alongside a verification cipher block. The plaintext DEK is **never** uploaded to Supabase or stored in plaintext `localStorage`.
4. **Optional Device Remember (Non-Extractable Web Crypto IndexedDB Key):**
   If you enable "Remember on this device", PhotoFlow generates a non-extractable Web Crypto `AES-GCM` device key stored inside browser `IndexedDB` to wrap the DEK locally for seamless device unlock without exposing raw key bytes.
5. **Dataset Encryption & Concurrency Protection:**
   Each logical dataset (`clients.enc`, `projects.enc`, `tasks.enc`, `payments.enc`, `activities.enc`, `settings.enc`) is serialized with version numbers and timestamps, encrypted with a fresh 96-bit random IV via `AES-GCM`, and uploaded to `photoflow-data/{userId}/...` along with versioned snapshots (`{userId}/snapshots/{dataset}/v-000001.enc`) and an encrypted manifest (`{userId}/manifest.enc`) to detect concurrent modifications across devices.
