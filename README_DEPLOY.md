# Deploying Teleporte to Cloudflare (Worker + D1)

This guide explains how to deploy Teleporte as a self-updating handoff system.

## Prerequisites
- A Cloudflare account.
- `wrangler` CLI installed and authenticated (or use the Cloudflare Dashboard).

## 1. Create D1 Database
Create a D1 database named `teleporte-db`:
```bash
npx wrangler d1 create teleporte-db
```
Take note of the `database_id` and update it in `wrangler.jsonc`.

## 2. Initialize Database Schema
Apply the migration to create the `handoff_entries` table:
```bash
npx wrangler d1 migrations apply teleporte-db --remote
```
(For local testing, use `--local`)

## 3. Set Update Secret
Create a secret named `UPDATE_TOKEN` to secure the `/api/intake` endpoint:
```bash
npx wrangler secret put UPDATE_TOKEN
```
Enter a strong, private token when prompted.

## 4. Deployment
Deploy the Worker and its static assets:
```bash
npx wrangler deploy
```

## 5. Usage / Test URLs
- **Main Gateway**: `https://teleporte.<your-subdomain>.workers.dev/teleport/`
- **Admin Intake**: `https://teleporte.<your-subdomain>.workers.dev/admin/`
- **Latest State API**: `https://teleporte.<your-subdomain>.workers.dev/api/latest`
- **Logs API**: `https://teleporte.<your-subdomain>.workers.dev/api/logs`

## Verification
1. Visit the `/admin/` page.
2. Enter your `UPDATE_TOKEN`.
3. Submit a "checkpoint" entry.
4. Visit `/api/latest` to verify it appears.
5. Visit `/teleport/` to see the updated instructions for future agents.

## Important Notes
- **Do not** share your `UPDATE_TOKEN`.
- The `/api/intake` endpoint requires either a `token` in the JSON body or a Bearer token in the `Authorization` header.
- Static assets are served from the `./public` directory.
