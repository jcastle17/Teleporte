# Teleporte

Teleporte is a minimalist, secure, and highly efficient ChatGPT handoff and teleportation gateway. It is designed to facilitate the seamless transfer of project context between AI sessions while maintaining strict privacy and security standards.

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
