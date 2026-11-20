# Vercel demo hosting

This file is a checklist for a later demo. It does not deploy anything. The owner has not approved hosting. Do not run `vercel deploy`, do not create a project, and do not add an API key while following this page as a review.

The app to host is the prototype branch `cursor/eduflow-agent-prototype-a5df`. `main` stays the original README commit `c3f21387f75d6e61b9a27833c46fc7a765b15763`. Choosing that prototype branch in Vercel does not merge it into `main`.

## What a hosted copy would be

- Next.js app, no database, no login.
- Class records are the fictional seed in `lib/seed.ts`.
- Leave every environment variable empty. With no `OPENAI_API_KEY`, `POST /api/agent` returns `source: "template"` and the draft badge says **Local template draft** / **مسودة من القالب المحلي**.
- `POST /api/approve` never sends. `deliverApprovedDraft` returns `sending_disabled`.
- The only outbound call in the code is `https://api.openai.com/v1/chat/completions`, and only when `OPENAI_API_KEY` is set. Do not set it for this demo.

`vercel.json` is not required. Vercel detects Next.js from `package.json`.

## Exact steps, when the owner approves

1. Sign in to Vercel with the account that will pay if the plan is not Hobby. This repository does not create that account.
2. Import `https://github.com/mahdimohmmed97-commits/eduflow-agent`. Framework preset: Next.js.
3. Production Branch: `cursor/eduflow-agent-prototype-a5df`. Do not use `main`. A Preview deployment of that same branch is the other way to get a URL without making it the production branch. Either way, deploy only that branch.
4. Environment variables: add none. Do not paste `OPENAI_API_KEY` or `OPENAI_MODEL`.
5. Install command: `npm ci` (a lockfile is committed).
6. Build command: `npm run build` (`next build`). Leave the start command empty. Vercel serves the Next.js build itself. `npm start` / `next start` is only for a local check of the production build.
7. Node.js version: 22.x, the version in `.github/workflows/ci.yml` (`node-version: 22`). The README also allows Node 20 for local development. Use 22 on Vercel so the host matches CI.
8. Deploy only after the owner says so. Then open the URL, press **Reset to demo scenario**, and confirm the draft badge says the local template.

Security headers are set in `next.config.ts` for every path: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, and `Permissions-Policy` with camera, microphone, and geolocation disabled. There is no content-security-policy, because the locale bootstrap is an inline script and a strict policy would need a tested exception.

## Recommended project settings

From the Hobby plan page read on 20 November 2026 (https://vercel.com/docs/plans/hobby):

> Deployment Protection: Vercel Authentication for preview and production deployments, Deployment Protection Exceptions, and Shareable Links.

> Spend Management: N/A on Hobby. Configurable on Pro.

> DDoS Mitigation: On by default.

Prefer a Shareable Link for judges over turning Deployment Protection off for the whole project. The two POST routes have no login. Anyone who can open the site can call them. A shareable link still exposes those routes to whoever has the link. Turning protection off makes the same routes public.

Do not add an OpenAI key. A public link plus a key would let strangers spend the key. With the key unset, those calls cannot create a model bill.

There is no application-level rate limit. An in-memory limit would not cover every serverless instance, so it is not in the code. Both routes cap the body at 64,000 characters (`payload_too_large` / HTTP 413). Hobby includes DDoS mitigation by default and up to 3 WAF custom rules. That is the place for a request cap if the link is shared. Hobby does not include spend management. If the account is upgraded to Pro, set a spend cap before sharing the link. The prices below are the only ones quoted from Vercel for that upgrade.

## Plan and cost

Fetched on 20 November 2026.

Hobby plan page, https://vercel.com/docs/plans/hobby:

> The Hobby plan is free and includes a generous set of features on a per month basis.

> As the Hobby plan is a free tier there are no billing cycles. In most cases, if you exceed your usage limits on the Hobby plan, you will have to wait until 30 days have passed before you can use the feature again.

> Developer seats cost $20 per user / month, while Viewer seats are free.

Included Hobby amounts on that page include the first 100 GB of Fast Data Transfer, the first 10 GB of Fast Origin Transfer, the first 1,000,000 CDN requests, 4 CPU-hours of Active CPU, 360 GB-hours of provisioned memory, and the first 1,000,000 function invocations. The same page says password protection, which is a Pro Deployment Protection extra, is "$20 per month per protected project".

Fair Use Guidelines, https://vercel.com/docs/limits/fair-use-guidelines (page last updated 2026-11-12 in the document header):

> Vercel usage is subject to these fair use guidelines across plans and usage-based resources.

The Hobby column on that page repeats the first 100 GB, first 1,000,000 function invocations, first 10 GB origin transfer, 4 hours of active CPU, and 360 GB-hours of provisioned memory. The headings "Examples of fair use" and "Never fair use" were on the page. Their bullet lists did not appear in the copy retrieved on 20 November 2026, so this note does not invent examples.

The binding Hobby restriction found the same day is in the Terms of Service, https://vercel.com/legal/terms#hobby-plan:

> You shall only use the Services under a Hobby plan for your personal or non-commercial use.

The same Hobby section says Vercel may disable or remove a Hobby deployment at its discretion. A competition demo shared with judges is not assumed to be personal or non-commercial. If the owner decides the use is not personal and non-commercial, Hobby does not fit, and the upgrade path on the Hobby page is a Pro seat at $20 per user per month. Spend management exists only on Pro. This review does not choose the plan and does not start a trial.

A separate Hobby terms sentence, https://vercel.com/legal/terms, says that on a Hobby plan or a trial Pro plan Vercel may use Your Content to train models and may share it with third parties for that purpose. A paid Pro plan does not enable that by default. The demo data is fictional, but text a visitor types would be included in "Your Content". That is a reason to read the terms before hosting, not a reason this file creates an account.

No model price is stated here. Cost per task in the product is not measured. With no API key there is no model call to bill.

## What this hosting would not add

No login, no database, no WhatsApp, no email, no SMS, and no real student data. Reset to demo scenario restores the fictional seed in that browser only (`localStorage` key `eduflow-agent-v2`). The language choice stays in `eduflow-locale`.
