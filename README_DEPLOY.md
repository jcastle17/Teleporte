# Deploying Teleporte to Cloudflare Pages

This guide explains how to deploy this static handoff site to Cloudflare Pages.

## Prerequisites
- A GitHub account with this repository pushed.
- A Cloudflare account.

## Steps

1. **Log in to Cloudflare Dashboard**: Go to [dash.cloudflare.com](https://dash.cloudflare.com).
2. **Navigate to Workers & Pages**: Click on "Workers & Pages" in the sidebar.
3. **Create a New Application**: Click "Create application" -> "Pages" -> "Connect to Git".
4. **Select Repository**: Select the `Teleporte` repository.
5. **Configure Build Settings**:
    - **Project Name**: `teleporte` (or your preferred name)
    - **Production Branch**: `main`
    - **Framework Preset**: `None`
    - **Build Command**: (Leave empty)
    - **Build Output Directory**: `/` (The root directory)
6. **Environment Variables**: None required.
7. **Save and Deploy**: Click "Save and Deploy".

## Post-Deployment
- Cloudflare will provide a `pages.dev` URL (e.g., `teleporte.pages.dev`).
- Your site will automatically update whenever you push to the `main` branch.

## Files to Update Before Use
- Replace `00_LATEST_CHECKPOINT_READ_FIRST.md` with your actual project status.
- Upload your `CHATGPT_START_HERE_teleport_handoff_vault_latest.zip` to the `downloads/` folder.
