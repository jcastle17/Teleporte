# 🏁 LATEST CHECKPOINT: [PROJECT NAME]

> **IMPORTANT:** This file is the canonical source of truth. If another route, log, checkpoint, or generated summary conflicts with this file, this file wins. This is the primary entry point for AI agents. Read this file in its entirety before proceeding to deeper project layers.

### ANTI-VERIFICATION-LOOP RULE

Do not turn coding, website, Cloudflare, GitHub, Codespaces, Wrangler, Gemini, Copilot, or deployment work into repeated check/build/re-check loops.

The AI should:
- assess current state once,
- decide what is missing,
- build or fix what is needed,
- run one final validation at the end,
- report what changed,
- report what it verified,
- report what is functional,
- report any true blockers.

Do not ask Tony to manually verify anything the AI can verify.

Do not repeatedly reconfirm small steps.

Do not pause after every minor check.

Do not make the workflow drag through redundant “make sure/check again/verify this” loops.

Stop only for true blockers:
- secrets/tokens/passwords/API keys,
- billing/payment,
- DNS/custom domains,
- destructive commands,
- force push,
- unresolved merge conflicts,
- missing permissions,
- major ambiguous decisions.

This rule outranks older workflow instructions if they conflict.

## 📅 Handoff Date: 2026-05-23
## 🎯 Current Mission
*Describe the immediate, high-priority goal of the project here.*

---

## 🚦 Project Status Summary
- **Current Phase:** [e.g., Development / Alpha / Maintenance]
- **Last Major Update:** [Briefly describe the last significant change]
- **Known Blockers:** [List any immediate obstacles]

## 🛠️ Environment & Stack
- **OS:** Linux (Codespaces)
- **Primary Tools:** [e.g., Node.js, Python, Git]
- **Target Platform:** [e.g., Cloudflare Pages]

## 📋 Next Steps for Incoming AI
1. **Verify Context:** Read `ai-handoff.json` for machine-readable configurations.
2. **Light-Load First:** Browse the repository structure to understand the layout.
3. **Deep-Read:** Only if specific technical details are missing, proceed to download the handoff vault from the `/downloads/` directory.
4. **Action:** [State the first specific task the AI should perform]

---
## 🛡️ Security Reminder
**DO NOT** store or transmit secrets, tokens, or PII. Use placeholders and environment variables where necessary.
