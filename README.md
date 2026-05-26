# Teleporte

Teleporte is a minimalist, secure, and highly efficient ChatGPT handoff and teleportation gateway. It is designed to facilitate the seamless transfer of project context between AI sessions while maintaining strict privacy and security standards.

## Security

### NO-VIEW SECRET MODE
For any secret or token exclusively required by the Cloudflare Worker/API, Gemini will securely generate and store it directly in Cloudflare secrets. The value will never be displayed, stored in version control, or exposed through any logs or public assets. Reports will only confirm the existence and Cloudflare storage status of such secrets.

## Purpose
The primary goal of Teleporte is to provide a standardized "boot" sequence for AI agents entering a project environment. By following a structured protocol (Light-Load First), AI agents can quickly orient themselves without being overwhelmed by unnecessary data.

## Deployment
This project is designed to be deployed as a static site, ideally using **Cloudflare Pages**.

For deployment instructions, see [README_DEPLOY.md](README_DEPLOY.md).

## Getting Started
To use Teleporte for a handoff:
1. Update `00_LATEST_CHECKPOINT_READ_FIRST.md` with the latest project status.
2. Update `ai-handoff.json` with relevant metadata.
3. Place a fresh context vault (ZIP) in the `downloads/` directory.
4. Direct the incoming AI agent to the `/teleport/` gateway.

---
*Maintained by Teleporte*
