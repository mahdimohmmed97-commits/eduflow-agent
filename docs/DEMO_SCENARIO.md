# Demo scenario

This is a fixed, fictional walkthrough for the demo video. Every person in it is invented. Nothing in the product sends a message. The video itself is not in this repository. Mahdi records it.

The Submission Guide PDF, read on 20 November 2026, limits that recording to 2 minutes maximum. A longer optional demo is allowed as a separate extra, not as a replacement for the 2-minute cut. The recording has to show the real working agent: the trigger, the actions, and the outcome. Sample data must be labeled on screen. Any sped-up wait must be labeled. "Every number comes from your own work." The participant is visible in a corner webcam and explains the path out loud, in English. The file is embedded on slide 4 of the deck. This page is only the script.

The story is stored in `lib/seed.ts`. Due dates are offsets from today in Asia/Dubai (the math class) or Asia/Riyadh (the English class), so the same students stay urgent on any calendar day. Header button **Reset to demo scenario** / **إعادة سيناريو العرض** writes that seed back into this browser and clears drafts. The storage key is `eduflow-agent-v2`.

The page shows **Ms. Sara Al Nuaimi** / **أ. سارة النعيمي** as the coordinator. That label is a page value. It is not a login and it does not prove who is clicking.

## The task

Prepare parent follow-ups for students who keep missing work. Stop for a person to edit, reject, or approve the text. Send nothing.

## How the agent chooses its steps

On a fresh reset, the inbox trace (`lib/decide.ts`, fed by `lib/risk.ts`) is:

1. **Goal.** Prepare parent follow-ups for students who keep missing work, and send nothing.
2. **Steps chosen.** Score only due assignments. Urgent cases get a parent draft. A single case stays on watch. Someone back on time gets no message. Stop for approval.
3. **Data and tools.** The submission record in this browser. Class time is Asia/Dubai or Asia/Riyadh. Wording comes from a local template, or from OpenAI on the server when `OPENAI_API_KEY` is set. WhatsApp, email, and SMS are not connected.
4. **Decision.** From the fictional record, after Reset to demo scenario:
   - Urgent: Sultan Al Mutairi, Maryam Al Otaibi, Ahmed Al Zahrani, Lina Khan.
   - Watch only: Joud Al Balushi, Sara Al Qahtani, Omar Al Harbi, Majed Al Ali.
   - No message: Noura Al Dosari, because she was late on Fractions and then on time for Linear Equations.
5. **Action.** Write the draft in the tone and channel selected on the page, then wait. Copying does not send.
6. **Result.** On a fresh reset: 0 drafts approved, 4 urgent cases waiting, 0 messages sent.

The risk numbers are an experimental indicator over the fictional simulated rows (a missing submission adds more than a late one, and a repeated pattern adds more). The interface labels every score and level as experimental and fictional. They are not a real assessment and not a school result. The seed also contains weekly story points 38, 46, and 52. Those points are not shown.

## Which data it uses

For the recording, use Sultan Al Mutairi (`stu-12`):

- School: Ishraq Training Center, Riyadh (fictional).
- Class: Grade 10 — B, English.
- Assignment: My City essay (`asg-essay`), already due.
- Parent name in the record: Munira Al Mutairi.
- Status used for the draft: not submitted.

The other urgent rows are Maryam Al Otaibi and Ahmed Al Zahrani on Linear Equations at Al Noor International School in Dubai, and Lina Khan on the same essay. Do not add a real student.

## Recording script

Start from Reset to demo scenario, with no API key, so the draft source is the local template. Switch the interface to English before recording. The official demo is in English. Say on camera that the students are fictional and that sending is simulated. Times below are a guide for a cut of at most 2 minutes. Do not present the risk scores or the on-time counts as a school result. The score is an experimental indicator calculated from fictional simulated data, not a real assessment.

| Time | Do this | What should be on screen |
| --- | --- | --- |
| 0:00 | Open the app and press **Reset to demo scenario**. Confirm. | The fictional story is restored. Drafts prepared and approved go back to zero. |
| 0:15 | Open **Follow-up agent**. | The six steps above, including the decision names. |
| 0:35 | On Sultan Al Mutairi, press **Prepare parent draft**. | A pending draft. The hint says preparing does not approve the message or send it. The source badge says local template. |
| 0:55 | In the text area, add the sentence `full marks guaranteed`, then press **Approve this text**. | Approval is refused. The card stays pending. The alert says the text mentions a grade or a policy that is not in the record. |
| 1:15 | Delete that sentence so the text again uses only the assignment, the date, and the names. Press **Approve this text**. | Status becomes **Approved**. The card still says the message was not sent. |
| 1:35 | Press **Copy**. Then point at the measured panel. | Copy only copies. The panel shows the not-submitted count, drafts prepared, drafts approved, and the measured prepare duration, with the sentence that this is not time saved for the teacher. |

Optional, if time remains: press **Reject draft** on a second student, then **Prepare a new draft**. Rejecting does not send, and the new draft starts pending again.

## Outcome

After the path above, one parent draft for Sultan is approved in this browser and zero messages have been sent. There is no WhatsApp, email, or SMS delivery. Closing the tab keeps the approval only in this browser's `localStorage`. Reset to demo scenario removes it.
