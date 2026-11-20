# Submission readiness

This note was written on 20 November 2026. It is an honest inventory of this repository. It is not a claim that the championship submission is complete.

## What was known, and what was not

The facts below come from the organizers' emails available to this project through 17 November 2026:

- The required materials are a working AI agent prototype, a pitch deck, a 2-minute demo video, and a 6-minute pitch video.
- Those materials are in English.
- The judging axes are Identify, Build, and Validate.
- The Submission Portal opens on 4 December 2026.
- The deadline is 4 January 2027.

The detailed official guidelines exist only on the Howspace platform. They were not available when this file was written. This file does not invent extra requirements or a scoring rubric. Every item that is not one of the facts above is marked **to be verified against the official Howspace guidelines**.

No teacher interview and no user testing have been done. Nothing in this repository is feedback from a teacher or a parent.

## Schedule

| Fact | Status | Evidence | Gap |
| --- | --- | --- | --- |
| Submission Portal opens 4 December 2026 | Known date | Organizer emails through 17 November 2026 | The portal form itself was not available. What the form asks for is **to be verified against the official Howspace guidelines**. |
| Deadline 4 January 2027 | Known date | Organizer emails through 17 November 2026 | Same gap as the portal. |

## Required materials

| Material | Status | Evidence | Gap |
| --- | --- | --- | --- |
| Working AI agent prototype | Partial | This repository: `app/`, `lib/`, `tests/`. Local `npm test` is recorded in `docs/TEST_REPORT.md` (17 passed, 0 failed). GitHub Actions passed on the prototype merge `913ef875da749bf7e8c97f03ebe086829b33b586` (https://github.com/mahdimohmmed97-commits/eduflow-agent/actions/runs/44759849550) and on submission commit `be8bfe4495c8ec7e3833c2fbb60e15936321b5d7` (https://github.com/mahdimohmmed97-commits/eduflow-agent/actions/runs/44762753660). | The prototype is not on `main`. It is not deployed. There is no public demo URL. The default interface is Arabic, with an English toggle. Whether the prototype itself must be English-only is **to be verified against the official Howspace guidelines**. |
| Pitch deck | Missing | Not in this repository | Out of the repository's scope. The owner has to make it. |
| 2-minute demo video | Missing | `docs/DEMO_SCENARIO.md` is a script for a recording. It is not a video | Out of the repository's scope. The owner has to record it in English. |
| 6-minute pitch video | Missing | Not in this repository | Out of the repository's scope. The owner has to record it in English. |
| English language for the materials | Partial | This file and `docs/` are in English. The app has an English interface (`lib/i18n.ts`) | The deck and both videos do not exist yet. The app still opens in Arabic. |

## Judging axes

The emails name the three axes. They do not define the rubric. The rows below use only that fact.

| Axis | Status | Evidence | Gap |
| --- | --- | --- | --- |
| Identify | Partial | The landing page and `components/about-view.tsx` describe a homework follow-up task for a fictional Dubai school and a fictional Riyadh center. The agent inbox shows the goal, the steps it chose, the data it used, and the decision (`lib/decide.ts`) | No teacher interview and no evidence that this is the problem a real teacher named. What Identify requires beyond the axis name is **to be verified against the official Howspace guidelines**. |
| Build | Partial | A local prototype prepares a draft, blocks unsupported claims, and refuses to send. See `docs/ARCHITECTURE.md`, `lib/agent.ts`, `lib/approval.ts`, `app/api/agent/route.ts`, and `app/api/approve/route.ts`. Automated tests are in `tests/` | The build is a demo on fictional data. It is not merged to `main` and not hosted. The Build rubric is **to be verified against the official Howspace guidelines**. |
| Validate | Missing | There is no interview note, no user-test note, and no teacher feedback anywhere in this repository. `docs/TEST_REPORT.md` records automated tests and the manual checks that were or were not done. Those are engineering checks, not validation with users | This is a real gap. Do not describe the automated tests as teacher validation. What Validate requires beyond the axis name is **to be verified against the official Howspace guidelines**. |

## What this repository deliberately does not contain

- No real sending to WhatsApp, email, or SMS.
- No real student data. Names, phones, and schools in `lib/seed.ts` are fictional.
- No login and no database. Edits stay in `localStorage` under `eduflow-agent-v2`.
- No deployment and no hosting account created for this work.
