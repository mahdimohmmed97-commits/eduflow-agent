# Judge demo guide

This repository is not deployed. No hosting account was created for it. There is no public demo URL.

The official guide, read on 20 November 2026, says judges must evaluate without technical setup and without installing software or running code. It also asks for an accessible test link that stays active until the end of the Championship. The steps below install Node.js and run the app, so they do **not** meet that rule. They are a developer path for Mahdi and for anyone reviewing the code.

The recommendation is Option A: a hosted web link that still uses the fictional seed. That host is not created here. What it would require, and why Option C is only a fallback, is in `SUBMISSION_READINESS.md` section (d).

## Run a local copy

Requirements: Node.js 20 or newer, and npm. No database and no login.

```bash
git clone https://github.com/mahdimohmmed97-commits/eduflow-agent.git
cd eduflow-agent
git checkout cursor/submission-readiness-f7dd
npm ci
npm run dev
```

Open http://localhost:3000.

The branch above is the submission-readiness branch. The prototype it is based on is `cursor/eduflow-agent-prototype-a5df`. `main` does not contain the app.

Leave `OPENAI_API_KEY` unset. Drafts then use the local template, which is the path in `docs/DEMO_SCENARIO.md`. To try the model later, copy `.env.example` to `.env.local`, set the key on the server, and restart `npm run dev`. Do not put the key in the browser or in a commit.

## What to click

1. The interface opens in Arabic, right to left. Use the language toggle for English, left to right.
2. Press **Reset to demo scenario** before judging, so the browser is on the fictional story.
3. Follow `docs/DEMO_SCENARIO.md`. The people are fictional. Approving a draft does not send it. Copy only copies.
4. **About the agent and its limits** states what is built and what is not, including that there is no hosted copy.

The teacher name on the page is Ms. Sara Al Nuaimi. Choosing that role is not authentication.

## Checks a judge can run locally

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`docs/TEST_REPORT.md` records the last run that was actually executed for this branch, including what the tests do not cover.

## What a future hosted copy would still be

This branch does not deploy the app and does not choose a host. If Mahdi later approves a host and pays for it, a judge would open that URL in a browser and would not clone the repo. The same limits would still apply:

- No login. The teacher name on the page is not identity proof.
- Fictional seed data only. **Reset to demo scenario** restores it.
- The banner says class records are simulated and that WhatsApp, email, and SMS sending is simulated and never leaves the browser.
- Drafts saved in that browser only (`localStorage`, key `eduflow-agent-v2`).
- No database.
- An optional server-side model key. Without it, the local template is used. A live cost per task has not been measured.
- Approval still does not send.

Until that URL exists, do not treat any address as the Championship test link. The local commands above are not a substitute for it.
