# Judge demo guide

This repository is not deployed. No hosting account was created for it. There is no public demo URL. A judge can run a copy on their own computer. A hosted copy is described only as a possible later step. This guide does not create one.

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

## If a hosted copy exists later

This branch does not deploy the app. If the owner later hosts it, a judge would open that URL in a browser. The same limits would still apply:

- No login.
- Fictional seed data, with Reset to demo scenario to restore it.
- Drafts saved in that browser only (`localStorage`, key `eduflow-agent-v2`).
- No database.
- No WhatsApp, email, or SMS sending.
- An optional server-side model key. Without it, the local template is used.
- Approval still does not send.

Until that host exists, use the local commands above. Do not treat a Vercel, GitHub Pages, or other URL as part of this submission.
