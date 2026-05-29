# Teleporte Latest Checkpoint Read First

This file is the canonical source of truth. If another route, log, checkpoint, or generated summary conflicts with this file, this file wins.

# LATEST CHECKPOINT: TELEPORTE COMMAND CENTER LIVE

## Current Mission
Teleporte is now the landing command center / arrival chamber for AI continuity. Its job is to preserve momentum across AI chats by showing the current mission, project state, next action, blockers, working routes, and agent roles.

## Project Status Summary
- Current Phase: Live command center / post-merge validation
- Stable Production Branch: main
- Command Center Status: Live
- Last Major Update: Command Center UI and backend routes were deployed and validated.
- Known Blockers: None currently known.
- Remaining Rule: Large future restructures must still branch off main and merge/deploy only after Tony approves.

## Source of Truth
- Canonical boss file: public/00_LATEST_CHECKPOINT_READ_FIRST.md
- Machine handoff: public/ai-handoff.json
- Project status: public/project-status.json
- Agent profiles: public/agent-profiles.json

## Working Live Routes
- /teleport/
- /api/latest
- /api/current-rules
- /api/handoff
- /api/project-status
- /api/validate
- /api/command-upgrade
- /api/save-log
- /openapi.json

## Public Universal AI Rules
- Preserve momentum.
- Do not create repeated verification loops.
- Do not ask Tony to manually verify what the AI can verify.
- Build/fix/enhance first, then run one final validation.
- Report changed files, working routes, failed routes, and true blockers only.
- Stop only for true blockers such as auth, billing, permissions, destructive risk, or missing secrets.
- Never expose, print, store, commit, log, or display secret values.

## Agent Family Rule
All AI agents are part of the same Teleporte working family. They share the same project truth, mission, status, next action, blockers, and universal rules.

Agent lanes:
- Gemini = builder/deployer
- ChatGPT = planner/coordinator/reviewer
- Copilot = code editor/file patcher
- Claude = reviewer/critic

Agent reports are evidence. Universal rules live in this source-boss file unless Tony explicitly promotes something else into the boss layer.

## Branch Safety Rule
Teleporte is launched and functional. Large restructures must happen on feature/fix branches first.

Do not merge or deploy production-impacting work unless Tony explicitly approves.

## Next Best Action
Use /teleport/ as the main entry point. For future work, read this checkpoint, check /api/project-status and /api/validate, then continue from the next best action without restarting old work.
