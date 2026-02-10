# Vercel Deployment Guide (v2)

All v2 code is self-contained in the `v2/` folder. Follow these steps to deploy to Vercel.

## Prerequisites

- [Vercel account](https://vercel.com/signup)
- GitHub repo: `Culhane/Culhane.github.io` (or your fork)

## Step 1: Import Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import** next to your repository `Culhane.github.io`
3. If the repo is not listed, click **Import Third-Party Git Repository** and connect GitHub

## Step 2: Configure Root Directory

**Important:** The repo root contains legacy files. v2 must be set as the root.

1. In **Configure Project**, expand **Root Directory**
2. Click **Edit** and set `v2`
3. Confirm the path shows `v2`

## Step 3: Environment Variables

Add the variables from `.env.example` in **Environment Variables**:

| Name | Required | Description |
|------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only) |
| `R2_ENDPOINT` | Yes | Cloudflare R2 endpoint |
| `R2_ACCESS_KEY_ID` | Yes | R2 access key |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 secret key |
| `R2_BUCKET_NAME` | Yes | R2 bucket name |
| `R2_PUBLIC_URL` | Yes | Public URL for R2 (e.g. `https://files.dennisculhane.com`) |

**Optional for subpath deployment (e.g. dennisculhane.com/v2):**

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_BASE_PATH` | `/v2` |

Leave `NEXT_PUBLIC_BASE_PATH` unset if v2 is the primary site (e.g. `app.dennisculhane.com`).

## Step 4: Deploy

1. Click **Deploy**
2. Wait for the build to complete (~2–5 minutes)
3. Vercel will provide a URL like `xxx.vercel.app`

## Step 5: Custom Domain (Optional)

1. Open **Project Settings** → **Domains**
2. Add your domain (e.g. `app.dennisculhane.com` or `dennisculhane.com`)
3. Update DNS as instructed by Vercel

## Build Settings (Defaults)

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Build Command | `pnpm build` |
| Output Directory | `.next` (auto) |
| Install Command | `pnpm install` |

## Troubleshooting

- **Build fails:** Ensure Root Directory is `v2`
- **Env errors:** Check that all required variables are set in Vercel
- **404 on routes:** If using a subpath, set `NEXT_PUBLIC_BASE_PATH` correctly
