# Teleporte Latest Checkpoint Read First

This file is the canonical source of truth. If another route, log, checkpoint, or generated summary conflicts with this file, this file wins.

# LATEST CHECKPOINT: TELEPORTE COMMAND CENTER UPGRADE

## Current Mission
Turn Teleporte from a thin handoff gateway into a landing command center / arrival chamber for any AI.

## Project Status Summary
- Current Phase: Feature branch upgrade
- Stable Production Branch: main
- Active Upgrade Branch: feature/teleporte-command-center
- Last Major Update: GPT Actions can read/write Teleporte; large restructure must branch off main.
- Known Blockers: None technical right now. Merge/deploy requires Tony approval.

## Source of Truth
- Canonical boss file: public/00_LATEST_CHECKPOINT_READ_FIRST.md
- Machine handoff: public/ai-handoff.json
- Project status: public/project-status.json
- Agent profiles: public/agent-profiles.json

## Public Universal AI Rules
- Preserve momentum.
- Do not create repeated verification loops.
- Do not ask Tony to manually verify what the AI can verify.
- Build/fix/enhance first, then run one final validation.
- Report changed files, working routes, failed routes, and true blockers only.
- Stop only for true blockers such as auth, billing, permissions, destructive risk, or missing secrets.
- Never expose, print, store, commit, log, or display secret values.

## Branch Safety Rule
Teleporte is launched and functional. Large restructures must happen on feature branches.

Current restructure branch:
feature/teleporte-command-center

Do not merge to main or deploy production until Tony approves.

## Agent Layering
- Public Universal Rules are safe for any AI.
- Gemini-specific build behavior belongs in agent-profiles.json.
- Private operator context must be protected and must store secret names only, never values.

## Next Best Action
Validate the feature branch locally, commit real file changes, push branch, open PR, review, then merge/deploy only after approval.
