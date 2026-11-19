# Changelog

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
- The browser does not draft a request the checker has already rejected. Network failures still use the local template for a valid request.
- A draft starts as waiting for the teacher. Only `actor: "teacher"` can approve it. Approval stores the draft and sets nothing to sent. `deliverApprovedDraft` always returns `sending_disabled`. The only API route is `POST /api/agent`, and the only outbound call it can make is OpenAI chat completions for wording.
- `npm test` runs the new Node tests. GitHub Actions runs it with lint and typecheck.

### What did not change

The screens, seeded story, tone and channel choices, copy button, and “nothing is sent” activity text are still there. Approving a draft still happens when the teacher clicks the approve button. Copying still only copies.
