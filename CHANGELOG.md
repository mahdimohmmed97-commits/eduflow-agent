# Changelog

## Vercel prep, still not deployed

- `docs/DEPLOYMENT_VERCEL.md` explains how to host `cursor/eduflow-agent-prototype-a5df` without changing `main`, what Pro can cost beyond the $20 platform fee, how to pause or delete a project, and a checklist for the live URL. Nothing was deployed.
- `AI_PROVIDER` can later be `none`, `openai`, or `anthropic`. The default and an empty key stay on the local template. No key is set. Model text still passes the claims check, and approval still does not send.

## Draft direction and risk label

- A draft’s text, editor, and approved view use the draft’s own language for `lang`, `dir`, alignment, and `unicode-bidi: plaintext`. An Arabic draft stays right-aligned inside an English page, and an English draft stays left-aligned inside an Arabic page.
- Every visible risk score and level says it is an experimental indicator calculated from fictional simulated data, not a real assessment.

## Pre-deployment review

- `docs/DEPLOYMENT_VERCEL.md` describes a possible Vercel demo of `cursor/eduflow-agent-prototype-a5df` only. Nothing was deployed. No API key is required.
- `POST /api/approve` now rejects a body over 64,000 characters, matching the agent route. Response headers from `next.config.ts` set nosniff, a referrer policy, same-origin framing, and disabled camera, microphone, and geolocation.
- A test checks that a missing `OPENAI_API_KEY` returns the local template and does not call OpenAI. The screen label for that source is "Local template" / "قالب محلي".

## Official guide pass — 20 November 2026

- `SUBMISSION_READINESS.md` now follows the Submit page, the Submission Guide PDF, and the FAQ read that day. Identify, Build, and Validate are not the official criteria. The deadline in that note is 4 January 2027 at 11:59 AM Dubai time (GST).
- The local clone path is documented as a developer path. It does not meet the rule that judges evaluate without installing software. No host was created.

## Phase 3 — submission readiness notes

- The README no longer describes an estimated time saved, a story improvement rate, or a model-cost guess. The weekly seed points 38, 46, and 52 stay in `lib/seed.ts` as fictional story data. They are not shown as an outcome.
- The About page no longer says figures are marked as estimates, and it no longer points judges at a hosted link. There is no hosted copy.
- Submission notes, a fixed demo scenario, a test report, an architecture note, and a local judge guide were added. Nothing was deployed.

## Phase 2 review

- The home page and dashboard no longer show an estimated time saved, a story improvement rate, or a model-cost guess.
- The measured preparation time says it is not time saved for the teacher. Counts from the fictional record are labeled as demo data.
- Approving edited text, including through `/api/approve`, runs the claims check and still does not send.

## Phase 2 — teacher experience and measured follow-up

- The inbox shows the prepare, edit, and approve-or-reject steps, and each draft is marked pending review, approved, or rejected.
- Model drafts, local templates, and templates shown after a timeout or a lost connection are labeled separately. Approval of edited text is refused when it adds a grade, a school policy, an unknown figure, or another student. Approval still does not send.
- A panel counts students who have not submitted, drafts prepared, drafts approved, and the measured duration of prepare requests in this browser. It does not estimate time saved.
- The approve button still passes the teacher role from the page. That is not a login.

## Review before merge

- Student ids are identifiers. The parser trims whitespace and lowercases them, so `Stu-01` and `stu-01` are the same id. Names are not lowercased.
- Preparing a draft no longer marks it approved. The teacher can edit the text, reject it, or approve that exact text. Copying still does not send. The button label is a role chosen by the page, not a login check.
- If the draft request does not finish within four seconds, or the browser is offline, the page shows the local template instead of leaving the button spinning.

## Phase 1 — safety and reliability

This pass starts from Pull Request #1 (`cursor/eduflow-agent-prototype-a5df`). `main` still contains only the original README, so the prototype code is not there yet. These fixes sit on a new branch and do not merge or deploy anything.

### What was wrong

- Reminder templates promised a full mark, or said a mark would be affected. No grade and no school rule were present in the data.
- The agent request accepted the same student id twice, so one student could be turned into two drafts.
- If the model answered, its text was kept whenever it was non-empty. It could add a grade, a percentage, a phone number, or another person.
- A student with no submission row was invisible to the follow-up list, while the assignment table treated that gap as “not submitted”.
- A rejected API request still fell back to a local draft in the browser.
- Approving a draft was a direct write. There was no shared check that the actor is the teacher, and no single place that refuses delivery.
- The project had lint, typecheck, and build, and no automated test script.

### What changed

- Templates in Arabic and English, formal and friendly, including the short SMS line, now state only the supplied assignment, date, and names. They ask for the work or thank the student for a late submission. They do not mention marks or a school policy.
- Reminder requests with a repeated student id return `400` and `duplicate_student_id`. Summary flags may still name the same student once per assignment, because that is a real record. An identical flag repeated twice is rejected. A rate above 100, a non-boolean due flag, and other incomplete bodies return `invalid_request`.
- Model text is kept only when it stays on the supplied names and figures. A full mark, a guaranteed grade, a school policy, an unknown percentage, a phone number, or another student’s name is replaced with the local template. Students who were not in the request are dropped.
- Missing submission rows count as not submitted for students on that class roster. A row that says the work was submitted wins over a conflicting “not submitted” row, so the agent does not invent a missing assignment. Follow-up still ignores work that is not past due. The teacher can now save a status for a roster student who had no row.
- The browser does not draft a request the checker has already rejected. A network failure, including a request that does not finish within four seconds, still uses the local template for a valid request.
- A draft starts as waiting for the teacher. Only `actor: "teacher"` can approve it. Approval stores the draft and sets nothing to sent. `deliverApprovedDraft` always returns `sending_disabled`. The only API route is `POST /api/agent`, and the only outbound call it can make is OpenAI chat completions for wording.
- `npm test` runs the new Node tests. GitHub Actions runs it with lint and typecheck.

### What did not change

The screens, seeded story, tone and channel choices, copy button, and “nothing is sent” activity text are still there. Approving a draft still happens when the teacher clicks the approve button. Copying still only copies.
