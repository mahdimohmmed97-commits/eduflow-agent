# Submission readiness

This note was rewritten on 20 November 2026 after the official Submit page, the Submission Guide PDF, and the FAQ were read. It replaces the earlier inventory, which used organizer emails through 17 November 2026 and the labels Identify, Build, and Validate. Those three labels are not in the official guide. They are not used below.

This file is an inventory. It is not a claim that the submission is complete. Automated tests in `docs/TEST_REPORT.md` are engineering checks. They are not evidence of business value, demand, or user validation. No interview, observation, customer, price, or willingness to pay is recorded in this repository. None is invented here.

## Sources

Quoted text below is taken from the materials read on 20 November 2026:

- Submit page: https://create-ai-agents-competition.in.howspace.com/submit
- FAQ: https://create-ai-agents-competition.in.howspace.com/faq
- Submission Guide PDF (no separate file URL was supplied with that reading)

The guide also says: "Use the portal's final published technical and eligibility instructions as the authority." Those portal instructions are not visible until 4 December 2026. This file cannot replace them.

## Official definition

Submission Guide PDF:

> "An agent pursues a goal by selecting steps, using relevant information or tools, and carrying out actions."

The steps named in that guide are: Receive a goal, Determine steps, Use tools or data, Take action, Return a result.

> "A chatbot answer, static mockup or promotional concept alone does not demonstrate a working agent. If an integration is simulated, identify it clearly."

In this repository the inbox trace (`lib/decide.ts`) shows a goal, the steps the code chose, the data it used, a decision, an action, and a result. The action is a draft that waits for a person. WhatsApp, email, and SMS are not connected. The banner in `lib/i18n.ts` says the class records are simulated and that sending is simulated and never leaves the browser. The approved card also says "Sending is simulated" and "Not sent".

## Minimum working prototype

Submission Guide PDF:

> "Build one meaningful and testable workflow. A public launch is not required."

The same guide asks for these five points:

1. A real task can be triggered.
2. The agent makes a meaningful decision about how to proceed.
3. It uses relevant information or tools and performs an action.
4. The workflow produces an observable result.
5. You demonstrate testing, limits and appropriate oversight.

| Point | Status | Evidence | Gap | Who |
| --- | --- | --- | --- | --- |
| 1. A task can be triggered | Partial | The buttons **Prepare parent draft**, **Prepare student draft**, and **Prepare urgent drafts** start the workflow (`lib/i18n.ts`, `components/inbox.tsx`). | A judge cannot press them without installing Node and running the app. There is no test link. | Code already implements the buttons. A reachable link is Mahdi's decision; see section (d). |
| 2. A meaningful decision | Partial | `lib/risk.ts` calculates an experimental indicator from past-due fictional rows. The screen labels the score and level as experimental and not a real assessment. `lib/decide.ts` splits urgent, watch, and no-message. On a fresh reset the urgent names are Sultan Al Mutairi, Maryam Al Otaibi, Ahmed Al Zahrani, and Lina Khan. Noura Al Dosari gets no message. | The decision is over fictional rows, not a real class. | Code. |
| 3. Information, tools, and an action | Partial | Data is `lib/seed.ts`. Wording is a local template, or OpenAI on the server only when `OPENAI_API_KEY` is set (`lib/agent.ts`, `app/api/agent/route.ts`). The action is a draft. | Delivery to WhatsApp, email, and SMS is simulated and labeled, not performed. | Code. |
| 4. An observable result | Partial | A draft is pending, approved, or rejected. `deliverApprovedDraft` always returns `sending_disabled` (`lib/approval.ts`). The plan result says how many drafts were approved and that messages sent are 0. | The result exists only in the browser that ran the app. | Code. |
| 5. Testing, limits, and oversight | Partial | `docs/TEST_REPORT.md`, `docs/ARCHITECTURE.md`, the About page (`components/about-view.tsx`), and the approve step. | No user testing. Judge access without setup is missing. | Tests and oversight code exist. User validation is Mahdi. Access is section (d). |

FAQ: "Clearly labelled simulated inputs are permitted, provided the AI agent performs a real, functioning workflow."

FAQ: a working, testable MVP is enough at submission. Grand Finale participants need a fully functional live agent.

FAQ: participants pay operating costs, including usage during judging.

## (a) Requirements and evidence

### Test access

Submission Guide PDF:

> "Give judges test access: a link, credentials or a controlled demo."

> "Keep test access active until the end of the Championship."

> "Disclose simulated data and known limitations."

Judges must evaluate "without requiring technical setup" and "without installing software or running code".

| Requirement | Status | Evidence | Gap |
| --- | --- | --- | --- |
| Test link, credentials, or a controlled demo that needs no install | Missing | `docs/JUDGE_DEMO_GUIDE.md` tells a developer to clone the repo and run `npm run dev`. That is an install. | No public URL. No account. No hosted demo. Section (d). |
| Access kept until the end of the Championship | Not verifiable | Nothing is hosted. The notes read on 20 November 2026 do not give the Championship end date. Semi-finalists are announced on 29 January 2027. | Cannot be proven until a link exists and is still up. |
| Simulated data and limits disclosed | Done in the local interface | Banner: "Class records are simulated. WhatsApp, email, and SMS sending is simulated and never leaves this browser." (`lib/i18n.ts`). About page lists what is not built. `docs/ARCHITECTURE.md` and `docs/TEST_REPORT.md` list limits. | Disclosure on a judge-facing link does not exist, because the link does not exist. |

### The four portal components

These four are what the portal asks for. Details are in section (e).

| Component | Status | Evidence | Gap | Who |
| --- | --- | --- | --- | --- |
| 1. Working AI Agent Prototype: an accessible test link that stays active until the end of the Championship | Missing as a submission. The workflow itself is partial. | App under `app/` and `lib/`. Local tests in `docs/TEST_REPORT.md`. Actions on `be8bfe4495c8ec7e3833c2fbb60e15936321b5d7`: https://github.com/mahdimohmmed97-commits/eduflow-agent/actions/runs/44762753660. Actions on `0b18fbda296e7ec5b56f9a095dfb8cd935e5f8f2`: https://github.com/mahdimohmmed97-commits/eduflow-agent/actions/runs/44763016797. Actions on the guide-alignment commit `4cc350da0667193686874295a18dfbf1f22e6eb3`: https://github.com/mahdimohmmed97-commits/eduflow-agent/actions/runs/44766553686. | No test link. Local setup does not meet the no-install rule. | Mahdi approves a host or records Option C. Code does not deploy from this branch. |
| 2. Pitch deck, 12 to 15 slides, in the official order, with a clear business model | Missing | Not in this repository. | Revenue is not required. A business model is mandatory. None is written here. | Mahdi. |
| 3. Demo video, 2 minutes maximum | Missing | `docs/DEMO_SCENARIO.md` is a script. It is not a recording. | Webcam, spoken English, and an embed on slide 4 are not done. | Mahdi. |
| 4. Pitch video, 6 minutes maximum | Missing | Not in this repository. | Face throughout, 1080p, unlisted YouTube, Vimeo, or Canva link, checked in a private window. | Mahdi. |

### Judging criteria

These are the official labels and weights from the Submission Guide PDF. Identify, Build, and Validate are not among them.

| Criterion | Weight | Status | Evidence | Gap | Who |
| --- | --- | --- | --- | --- | --- |
| Real Value & Problem Validation | 20% | Missing | The landing page describes a homework follow-up task for a fictional Dubai school and a fictional Riyadh center. | No teacher interview, no observation, no stated learning, no change made because of a user, no pilot, no willingness to pay. Automated tests are not this criterion. | Mahdi. |
| Technical Execution & Reliability | 20% | Partial | The workflow, fallbacks, and tests named above. `docs/TEST_REPORT.md` records two local runs on 20 November 2026, each 17 passed and 0 failed. The guide-alignment run duration was 4220.219759 ms. The same file lists what was not clicked. | Judges cannot run it without setup. The claims check is a keyword and pattern list (`lib/claims.ts`). A paraphrase can pass. The live model API was not called in the tests. | Code for the workflow. Mahdi for a link judges can open. |
| Trust, Safety & Human Oversight | 15% | Partial | Approval is required (`lib/approval.ts`, `app/api/approve/route.ts`). Sending stays off. The page role "teacher" is not a login (`lib/i18n.ts`, `roleNotIdentity`). Phone numbers are not fields on the reminder request (`lib/agent.ts`). Out-of-scope and invalid bodies return `invalid_request`. Timeout, offline, and server errors fall back to a labeled template (`lib/client-agent.ts`). | A person who can open the page can press approve. That is not identity proof. Real personal data is not in the product, so protection of a real school record is not demonstrated. | Code for the current stops. Mahdi explains this in the deck. |
| Innovation & Defensibility | 15% | Missing | No competitor or differentiation note is in the repo. | Do not invent one. | Mahdi. |
| Business Viability & Scalability | 20% | Missing | No customers, no pricing, no operating-cost figure, no growth plan. | The guide asks for a model, customers, pricing, operating costs, and growth in the UAE and the world. Revenue is not required. A clear business model is mandatory. Cost per task is not measured. | Mahdi. |
| Pitch & Communication | 10% | Missing | The docs are in English. The app opens in Arabic and has an English toggle. | Deck, both videos, webcam, and the unlisted link are absent. | Mahdi. |

The guide's strong-submission guidance asks a submission to summarise standard and challenging test cases, expected versus actual results, failures, improvements and retests, and to report rates where measurable. Quantify benefit with labelled estimates versus tested results. Validate the business opportunity with a specific customer, evidence of demand, differentiation, and cost versus users. Explain the information accessed, its protection, the approval points, and how uncertainty, failures, and out-of-scope requests are handled.

What this repo can show of that list is only the engineering half: `docs/TEST_REPORT.md` and `docs/ARCHITECTURE.md`. It cannot show a customer, demand, or a tested benefit for a teacher. The measured prepare duration is labeled as not time saved for the teacher. No benefit rate is claimed.

### Categories

The guide names four categories: Best Societal, Best Personal, Best Business, and Best Youth AI Agent. This repository does not choose one.

### Portal rules that are not uploads

- The portal also asks AI Agent Business Canvas questions. The Canvas and the 13-field Agent Card are planning templates, not mandatory uploads.
- Submissions cannot be edited. They can only be resubmitted.
- Submissions open on 4 December 2026 and close on 4 January 2027 at 11:59 AM Dubai time (GST). The time is in the morning.
- Semi-finalists are announced on 29 January 2027.

## (b) Who completes what is missing

### Mahdi

- Teacher interviews and observations: who was interviewed or observed, what was learned, reactions, and what changed because of that. If there is no pilot and no willingness to pay, the deck must not present assumptions as validated findings. The guide's slide 7 says: "Assumptions presented as validated findings" must be avoided.
- Pricing and the business model. Revenue is not required. A clear model is mandatory.
- Customers, market, competition, differentiation, and go-to-market.
- The 12 to 15 slide deck, in the official order, in English.
- The demo video and the pitch video, including the webcam overlay, the face visible throughout the pitch video, spoken English, 1080p 16:9, and clear audio.
- An unlisted YouTube, Vimeo, or Canva link, opened in a private window to confirm it plays.
- The Canvas answers in the portal.
- Choosing a category.
- On 4 December 2026, reading the portal's final technical and eligibility instructions and treating them as the authority. Resubmit if an earlier upload was wrong. It cannot be edited in place.
- If a hosted link is used: explicit approval, the host he chooses, and payment of operating costs, including judging usage.

### Code, already done or still possible in the repo

Already in the repo, and not a substitute for Mahdi's list:

- One workflow from a button to a visible decision, a draft, a human approve or reject, and a result that is not sent.
- Simulated-data and simulated-sending labels.
- **Reset to demo scenario**, which restores `lib/seed.ts`.
- Claims blocking, timeout and offline fallback, and tests.

Still possible later in code, only if Mahdi asks: an English-first default, a tighter claims check, or whatever the 4 December portal instructions add. This branch does not deploy and does not add a host.

## (c) Not provable yet

| Claim | Why it cannot be proven from this repo |
| --- | --- |
| User validation | No interview, observation, or user test has been done. |
| Demand | No customer and no evidence of demand are in the repo. |
| Willingness to pay | None has been asked or recorded. |
| Live cost per task | No model bill and no host bill have been measured. The About page says no amount is shown. With no API key, drafting uses the local template and makes no model call. That is not a measured price. |
| A hosted link that stays up until the end of the Championship | No link exists. The Championship end date was not in the notes read on 20 November 2026. |

## (d) How judges can test without real data

Judges are supposed to evaluate without technical setup and without installing software or running code. Cloning this repository and running `npm run dev` does not meet that rule. `docs/JUDGE_DEMO_GUIDE.md` is a developer path only.

Fictional data is already the only class record (`lib/seed.ts`). The FAQ allows clearly labelled simulated inputs when the agent still performs a real workflow. The app already shows the simulated banner, "Sending is simulated", and **Reset to demo scenario**.

**Recommendation: Option A, and do not build it in this branch.**

Option A in the Submission Guide PDF is an interactive prototype, such as a web app, given as a working link or a test account. That is the option that matches both "an accessible test link" and "without installing software or running code". A public launch is not required, so the link can be an unlisted test URL. It still has to stay active until the end of the Championship.

What Mahdi would have to decide before that link exists:

1. Explicit approval to host.
2. Which host.
3. Payment of operating costs, including usage while judges try it (FAQ).
4. Leave `OPENAI_API_KEY` unset unless he accepts a model bill. The template path still runs the workflow.
5. Keep the fictional seed. Do not load real students.
6. Leave **Reset to demo scenario** and the simulated-data labels in place.
7. Keep the URL working until the Championship ends.

This branch does not deploy, does not create a hosting account, and does not pick a vendor.

**Fallback, not the recommendation: Option C.**

Option C is a recorded demo plus execution logs and test results. Live verification may be requested. `docs/DEMO_SCENARIO.md` plus `docs/TEST_REPORT.md` are the logs and the script. They are not a video. Option C does not by itself satisfy "an accessible test link" if a judge or the organizers ask to open the agent. Use it only if Mahdi does not approve hosting before 4 January 2027 at 11:59 AM GST.

Option B (Make, n8n, or an API with a simple web or chat interface plus execution logs) is not how this app is built. It is not recommended.

## (e) Deliverables

| Material | Maximum | Language | Format | Where it goes |
| --- | --- | --- | --- | --- |
| Working AI Agent Prototype | No duration. A public launch is not required. | The guide does not say the app UI must be English. The deck and both videos must be English. | An accessible test link that stays active until the end of the Championship. Option A is a working link or test account. Option C is a recording plus logs, with possible live verification. | Official portal. |
| Pitch deck | 12 to 15 slides. | English. | Slide order: Cover; 1 Business concept and agent; 2 Problem and solution; 3 Customers and market; 4 How the agent works (embed the 2-minute demo, disclose simulated data and limitations, cost per task, how personal data is handled, a link or QR for judges); 5 Architecture and safety (architecture, data and privacy, human oversight); 6 Performance metrics ("Real numbers from your own tests, with sample size"); 7 User validation (who was interviewed or observed, what was learned, reactions, what changed, and pilot or willingness-to-pay evidence if it exists); 8 Differentiation and competition; 9 Revenue model; 10 Go-to-market; 11 Roadmap and milestones; 12 Founder story and team; Closing. | Official portal. Slide 4 holds the demo video. |
| Demo video | 2 minutes maximum. A longer optional demo is allowed. | English. The participant explains verbally. | Screen recording of the real working agent: trigger, actions, and outcome. Sample data labeled. Any sped-up wait labeled. "Every number comes from your own work." Participant visible in a corner webcam overlay. | Embedded on deck slide 4. Also the first part of the pitch video. |
| Pitch video | 6 minutes maximum. | English. | The 2-minute demo plus a 4-minute continuous deck presentation. Face visible throughout. 1080p, 16:9, clear audio. | Unlisted YouTube, Vimeo, or Canva link, checked in a private window, then submitted in the portal. |
| AI Agent Business Canvas | Not a file-size rule in the notes. | The portal's language. | Questions in the portal. A planning template, not a mandatory upload. | Portal questions. Mahdi answers them. |
| Agent Card | 13 fields. Not a mandatory upload. | This copy is English. | Planning template. The filled card from this repo is the next section. | Not uploaded as a required file. Useful as notes for the deck and the portal. |

## Agent Card

Planning notes only, filled from this repository on 20 November 2026. Not a mandatory upload. Unknowns are marked unknown. Nothing here is a customer or a price.

| Field | Fact from this repo |
| --- | --- |
| Defined task | Prepare a follow-up draft for students whose fictional homework is late or missing, then wait for a person to edit, reject, or approve it. Do not send it. |
| Trigger | A person presses **Prepare parent draft**, **Prepare student draft**, or **Prepare urgent drafts** on the follow-up agent page. There is no clock, email, or school-system trigger. |
| Workflow | Receive the goal shown in `lib/decide.ts`. Determine steps from `lib/risk.ts` (urgent draft, watch, or no message). Use `lib/seed.ts` and either the local template or optional server-side OpenAI. Take the action of writing a draft. Return a pending, approved, or rejected card, with messages sent equal to 0. |
| Tools and integrations | Browser app, `POST /api/agent`, `POST /api/approve`. Optional OpenAI chat completions when a server key exists. WhatsApp, email, and SMS are copy formats only. Those integrations are simulated and labeled. |
| Data sources | Fictional seed in `lib/seed.ts` (2 classes, 15 students, 6 assignments). Edits stay in `localStorage` key `eduflow-agent-v2`. No database and no real student data. |
| Shape | Next.js web app. It is not hosted. It opens in Arabic, right to left, with an English toggle. |
| Human approval points | **Approve this text** in the inbox, and `POST /api/approve`. Both call `approveDraft`. The actor must be `teacher`. `agent` and `system` are refused. The button passes that role from the page. It is not a login. Copy does not send. |
| When unsure or it fails | A request that does not finish within 4 seconds, an offline browser, or a non-OK agent response other than 400 shows the local template and labels the fallback. A 400 does not create a draft (`invalid_request` or `duplicate_student_id`). Model text with a grade, another person, or a figure that was not supplied is replaced by the template. The same claims check blocks approval of edited text. Empty text is refused. The claims check can miss a paraphrase. |
| Data handling | Names and phones in the demo are fictional. The reminder body sent to `/api/agent` includes names, class, subject, assignment, due date, tone, and status. It does not include the phone number. The model key stays on the server. There is no account. |
| Cost per task | Not measured. No dirham or dollar figure is shown. No host bill exists. |
| Built and planned | Built: the workflow, the labels, the reset, and the tests. The About page lists what is not built: real delivery, a real school record, accounts for more than one teacher, a parent reply inside the product, and a timed study with real teachers. |
| Limitations | No judge link. No user validation. Simulated school data. Sending is simulated. The teacher role is not identity. The claims guard is not a full reading of the sentence. Measured preparation time is not time saved. The weekly seed points 38, 46, and 52 are fictional story data and are not shown as an outcome. |
| Links | This repo and pull request https://github.com/mahdimohmmed97-commits/eduflow-agent/pull/5. No demo URL. No video URL. |

## Schedule

| Date | Fact | Source |
| --- | --- | --- |
| 4 December 2026 | Submissions open. The portal's final technical and eligibility instructions become the authority. They were not visible on 20 November 2026. | Submit page and Submission Guide PDF, as read that day. |
| 4 January 2027 at 11:59 AM Dubai time (GST) | Submissions close. The time is 11:59 in the morning, not the evening. | Submission Guide PDF, as read on 20 November 2026. |
| 29 January 2027 | Semi-finalists are announced. | Submission Guide PDF, as read on 20 November 2026. |

A submission cannot be edited. It can only be resubmitted.
