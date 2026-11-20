# Test report

This report records commands that were actually run. It does not borrow numbers from an earlier day.

## Local run on 20 November 2026

Working tree: branch `cursor/submission-readiness-f7dd`, after the submission-readiness edits and before that commit was pushed. Node.js v22.23.4.

| Command | Result |
| --- | --- |
| `npm run lint` (`eslint`) | Passed. Exit code 0. No findings printed. |
| `npm run typecheck` (`tsc --noEmit`) | Passed. Exit code 0. |
| `npm test` | Passed. See the counts below. |
| `npm run build` (`next build`, Next.js 16.4.6) | Passed. Routes include `/`, `/about`, `/agent`, `/api/agent`, `/api/approve`, `/assignments`, `/classes`, `/dashboard`, and `/icon.svg`. |

`npm test` is `node --import tsx --test tests/*.test.ts`. The runner printed:

```
# tests 17
# suites 0
# pass 17
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 4170.595827
```

## What each area covers

`tests/missing-work.test.ts` (3 tests, all passed):

- The seeded Linear Equations homework lists only students who have not submitted.
- A missing submission row counts as not submitted, and a conflicting submitted row does not.
- An unexpected status is ignored, and a roster gap can be filled without inventing another class.

`tests/phase2.test.ts` (7 tests, all passed):

- Creating, editing, rejecting, and approving a draft never marks it sent.
- `POST /api/approve` refuses edited text that fails the claims check, including a full-marks phrase and another student's name, and never sends it. A clean teacher approval returns `sending_disabled`. An agent actor is refused.
- Approval is blocked when edited text adds an unsupported claim.
- A timeout and an offline failure both fall back to the local template without a send flag.
- Measured preparation time is a sum of real durations, and the formatted label does not say the time was saved.
- The missing-submission count uses students who have no submission on past-due work.
- Arabic and English interface strings stay paired, with the right page direction, and the measured-time sentence says it is not time saved.

`tests/safety.test.ts` (7 tests, all passed):

- Templates and channel text do not promise marks or a school policy.
- Model text that adds grades, people, or unknown numbers falls back to the supplied record.
- Duplicate student ids and incomplete requests are rejected.
- A draft stays unsent until a teacher approves it, and approval still does not send it.
- The agent API drafts from the supplied record and never delivers a message.
- A hung agent request falls back to the local template. This test is allowed 10 seconds and finished inside the 4170.595827 ms total.
- Application code has no outbound delivery endpoint.

## GitHub Actions

Pull request #5, commit `be8bfe4495c8ec7e3833c2fbb60e15936321b5d7`, run 9:

https://github.com/mahdimohmmed97-commits/eduflow-agent/actions/runs/44762753660

That run completed with conclusion `success` on 20 November 2026. It ran lint, typecheck, test, and build on that commit. This paragraph was added after that run, so the commit that contains this paragraph has its own later Actions run.

The prototype merge commit `913ef875da749bf7e8c97f03ebe086829b33b586` also passed:

https://github.com/mahdimohmmed97-commits/eduflow-agent/actions/runs/44759849550

## Manual checks in this pass

These were done on 20 November 2026 in headless Chrome against `next start` on http://127.0.0.1:3000, using the production build from the `npm run build` above. `npm run dev` did not serve pages in this environment: Turbopack reported it could not find `@tailwindcss/turbopack` even though Node could resolve that file. The production server did serve the pages.

- The About page in Arabic showed "لا نعرض وقتاً موفّراً ولا تكلفة مقدّرة" and "لا تسجيل دخول ولا نسخة مستضافة من هذا المستودع". The header button was "إعادة سيناريو العرض".
- After clicking English, the same page showed "No time-saved figure and no estimated cost are shown.", "No login, and this repository has no hosted copy.", and "Reset to demo scenario".
- The follow-up agent, on a fresh load, showed the decision in `docs/DEMO_SCENARIO.md`: urgent Sultan Al Mutairi, Maryam Al Otaibi, Ahmed Al Zahrani, and Lina Khan; no message for Noura Al Dosari; messages sent 0.
- Prepare parent draft for Sultan Al Mutairi produced a local template to Munira Al Mutairi about Essay: My City. Adding `full marks guaranteed` and pressing Approve this text left the card pending and showed: "This text cannot be approved because it mentions a grade or a policy that is not in the record."
- Removing that sentence and approving again marked the card Approved and Not sent. The plan result changed to 1 draft approved and messages sent 0. The measured panel showed 4 students who have not submitted and the sentence "This is the measured preparation time, not time saved for the teacher."

Not clicked in this pass: Reject draft, Prepare a new draft, Copy, the offline browser path, and a mobile viewport. Reject, timeout, and offline are covered by the automated tests above. Copy was not inspected. No teacher used the app.

## Limits

- The claims guard in `lib/claims.ts` matches phrases, percentages, fractions, letter grades, and phone-like numbers. A paraphrase that avoids those patterns can be approved. That is not a full reading of the sentence.
- Automated tests do not call the live OpenAI API. The build set `OPENAI_API_KEY` only in GitHub Actions as an empty string, on the earlier run linked above.
- There is no teacher interview and no user test. Passing these 17 tests is not validation with a teacher.
- Class counts, risk scores, and the on-time figures on screen come from the fictional seed. The weekly story points 38, 46, and 52 are not shown and are not a result.
- Nothing was deployed. There is no hosted URL to test.
