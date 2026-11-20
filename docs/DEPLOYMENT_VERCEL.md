# Vercel demo, written for a first deploy

This page is a checklist. It does not deploy anything. The owner approved a Pro budget of about $20 per month in principle, and wants a link that can stay up until 6 May 2027. He has not approved starting the paid subscription or pressing Deploy. He will create the Vercel account himself and connect only `https://github.com/mahdimohmmed97-commits/eduflow-agent`.

Do not run `vercel`, `vercel link`, or `vercel deploy`. Do not change the GitHub default branch. `main` stays `c3f21387f75d6e61b9a27833c46fc7a765b15763`. The app to host is `cursor/eduflow-agent-prototype-a5df`.

`vercel.json` is not in this repository. Vercel detects Next.js. A file that turned deployments off would also block the branch we want, so it is not added.

## What the hosted copy is

- Next.js, no database, no login, fictional seed in `lib/seed.ts`.
- Add no environment variables for the demo. `AI_PROVIDER` stays unset or `none`. With no key, `POST /api/agent` returns `source: "template"` and the badge says **Local template draft** / **مسودة من القالب المحلي**.
- `POST /api/approve` never sends.
- A model is called only later, and only if the owner sets `AI_PROVIDER` to `openai` or `anthropic` and adds that provider’s key. Do not do that for this demo.

## 1. Deploy the prototype branch, not main

Read on 20 November 2026.

https://vercel.com/docs/git says a new project’s production branch is chosen in this order:

> The `main` branch.
> If not present, the `master` branch.
> If not present, the Git repository's default branch.

The same page says that after you pick the repository you configure the project, and then:

> When your settings are correct, you can select the Deploy button to initiate a deployment.

The import screen described there sets the name, framework, root, build settings, and environment variables. It does not list a production-branch field. So the Deploy button on import builds `main`. That is a real deploy. Do not press it until the owner accepts that first build.

Changing the production branch is documented after the project exists, on https://vercel.com/docs/git :

> On the Environments page in the Project Settings, you can change your production branch:
> Click on the Production environment and go to Branch Tracking
> Change the name of the branch and click Save
>
> Whenever a new commit is then pushed to the branch you configured here, a production deployment will be created for you.

Saving that setting does not, in the text above, deploy by itself. The next push to `cursor/eduflow-agent-prototype-a5df` does. Flag that push.

A preview of one branch, without making it production, is also documented on that page under “Creating a deployment from a Git reference”:

> Branch-Based Deployments: Provide the full name or URL of a branch when you want to build the most recent changes from that specific branch
> Select Create Deployment. Vercel will build and deploy your commit or branch as usual

That button is a deploy. Use it only after the owner says to deploy. If the production branch is still `main`, this branch deploy is a Preview. The preview URL can be the judge link. It does not merge anything into `main`.

Ignored Build Step, https://vercel.com/docs/project-configuration/project-settings :

> If the command exits with code `1`, the build continues as normal
> If the command exits with code `0`, the build is immediately aborted, and the deployment state is set to `CANCELED`
>
> Canceled builds are counted as full deployments as they execute a build command in the build step.

A custom command that continues only for the prototype branch:

```bash
if [ "$VERCEL_GIT_COMMIT_REF" = "cursor/eduflow-agent-prototype-a5df" ]; then exit 1; else exit 0; fi
```

Put that in Project Settings, Build and Deployment, Ignored Build Step, Custom. Exit 1 builds. Exit 0 cancels. A push to `main` still creates a deployment and then cancels the build, and that canceled build can count toward the quota. It does not change GitHub.

### Recommended path

1. Create the Vercel account and the Pro plan only when the owner is ready to pay. Stop there if he is not.
2. Import only this repository. On the import screen, add no environment variables. Framework: Next.js. Node.js: 22.x, the version in `.github/workflows/ci.yml`. Install: `npm ci`. Build: `npm run build`. Leave Start empty. Vercel serves the Next.js build. `npm start` is only for a local check.
3. Do not press Deploy yet. If the screen has no other way to save the project, stop and ask the owner. Pressing Deploy builds `main`, which is the old README, not this app.
4. After a project exists, set Ignored Build Step to the command above so later pushes to `main` do not finish a build.
5. Set Production, Branch Tracking, to `cursor/eduflow-agent-prototype-a5df`. Do not change GitHub’s default branch.
6. When the owner approves the deploy, use Deployments, Create Deployment, and enter the branch `cursor/eduflow-agent-prototype-a5df`. If step 5 is already saved, a push to that branch also creates a production deployment. Either one is the deploy. Wait for his yes.
7. Open the URL and run the checklist below. If the first URL is a Preview, that is enough for judges. Production is only the branch named in Branch Tracking.

Do not deploy `main` on purpose. If import already built it before the ignore rule existed, delete that deployment after the prototype URL works. Deleting is covered below. It does not change Git.

## 2. What Pro can cost beyond $20

Fetched 20 November 2026. Prices are USD and, on the Pro plan page, exclude tax.

https://vercel.com/docs/plans/pro-plan :

> $20/month Pro platform fee
> 1 deploying team seat included
> $20/month in usage credit

> Once you have used your monthly credit, Vercel bills additional usage on-demand.

> By default, Vercel enables spend management notifications for new customers at a spend amount of $200 per billing cycle.

> Additional paid seats (Owner or Member roles) for $20/month each
> Unlimited free Viewer seats

The same page lists add-ons. Do not turn these on:

- Password Protection: “$20 per month per protected project”
- Observability Plus: “$1.20 per 1 million events”
- Web Analytics Plus: “$10/month”
- Speed Insights Plus: “$10/month per project, plus $0.65 per 10,000 events”
- Preview Deployment Suffix: “$100/month”
- Static IPs: “$100/month per project”
- SAML Single Sign-On: “$300/month”
- Flags Explorer: “$250/month”

https://vercel.com/pricing also says Pro is “$20/mo.” and “Pro plans have a $20 included credit”. A free first-year domain renews at the normal price after year one. Do not claim a domain unless the owner wants one. The `*.vercel.app` URL is enough.

https://vercel.com/docs/spend-management :

> Setting a budget does not stop usage on its own. To stop incurring costs above the budget amount, turn on Pause production deployments

> Spend Management is available at no additional cost to Pro teams

> On Pro, a team budget only counts usage beyond the monthly credit, while project and product budgets count all of their usage, including usage the credit covers.

> Pausing is not instantaneous. Because Vercel checks your spend every few minutes, projects can keep serving traffic and accruing usage for several minutes after your spend reaches the budget amount.

> Pausing only affects production deployments.

Seats and add-ons are monthly charges and, on that page, are not what the metered budget stops. Do not add seats. Do not add Password Protection. Use a Shareable Link if judges need access through Deployment Protection. A public preview has no login on the two POST routes.

### Settings to turn on before sharing the link

- One project budget of $20 for this project, with Pause production turned on. On Pro that budget counts usage before the credit, so it can pause the project while the $20 credit still covers it.
- Leave the default team notification, or lower the team on-demand budget from the default $200 toward $0 if the dashboard allows $0. The page says new customers start at $200 of on-demand notifications. $200 is above the owner’s base budget. Lower it. Turn on pause at 100% so the hard stop exists.
- Notifications at 50%, 75%, and 100% are described on https://vercel.com/changelog/set-budgets-for-projects-and-products-in-spend-management (16 November 2026).
- No OpenAI key and no Anthropic key, so a public visitor cannot create a model bill.
- No Observability Plus, no analytics plus, no extra domain, no extra seats.

This app does not measure a dollar cost per task. With no model key there is no model invoice from this repository.

## 3. Build with no keys

Local check, already in CI as well: `npm ci`, then `npm run build`, then `npm start`, with `AI_PROVIDER`, `OPENAI_API_KEY`, and `ANTHROPIC_API_KEY` unset. `POST /api/agent` with a valid reminder returns `source: "template"` and no `sent` field. Tests cover no key, `AI_PROVIDER=none` even when keys are present, OpenAI, and Anthropic. The model calls in tests use a fake `fetch`. No live model was called.

## 4. Checklist after the URL exists

Do this on the live URL. Do not tick a line you did not try.

Desktop (about 1280×800) and a phone width (390×844), in Arabic and in English:

- The banner says class records are simulated and that WhatsApp, email, and SMS never leave the browser.
- Reset to demo scenario, then Restore. The inbox comes back. Language stays.
- Prepare a parent draft for Sultan. The badge says Local template draft / مسودة من القالب المحلي.
- Arabic draft text is right-aligned. English draft text is left-aligned. Check one case where the draft language and the page language differ.
- Approve the text. Badges include Approved, Sending is simulated / إرسال محاكى, and Not sent / لم تُرسل. Nothing is delivered.
- The risk pill says it is an experimental indicator from fictional simulated data.
- Browser network log: requests go to this site’s own host. No `api.openai.com` and no `api.anthropic.com`.
- Response headers include `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN`, and a Permissions-Policy that disables camera, microphone, and geolocation.
- `POST /api/agent` with a body larger than 64,000 characters returns HTTP 413.

## 5. How to stop it

Fetched 20 November 2026. These actions do not change GitHub `main`.

- Instant rollback, https://vercel.com/docs/instant-rollback : on the project overview, Instant Rollback, pick an earlier production deployment, Confirm Rollback. “The rollback happens instantaneously.” Afterward, new pushes do not replace that deployment until you promote one again.
- Pause the project, https://vercel.com/docs/projects/managing-projects : Settings, General, Pause Project. Visitors then see `503 DEPLOYMENT_PAUSED`. Resume is on the same page. Pause stops production traffic. It does not delete the project.
- Spend pause, https://vercel.com/docs/spend-management : a project budget with Pause production stops that project when the budget is reached. It can lag by a few minutes.
- Deployment Protection: leave Vercel Authentication on, and share a Shareable Link, if the dashboard offers it. Turning protection off makes the site public. Do not buy Password Protection.
- Delete one deployment, https://vercel.com/docs/deployments/managing-deployments : Deployments, open the deployment, …, Delete. “Deleting a deployment prevents you from using instant rollback on it.”
- Delete the project, https://vercel.com/docs/projects/managing-projects : Settings, General, Delete Project, type the name. This deletes deployments, domains, environment variables, and settings.
- Disconnect Git, https://vercel.com/docs/project-configuration/git-settings : Settings, Git, Connected Git Repository, Disconnect. New pushes then do not deploy. The current URL can stay up until you pause or delete it.

If something looks wrong, pause first. Delete the project only if the owner wants it gone.

## 6. A model later, still off today

`.env.example` has `AI_PROVIDER=none`, empty `OPENAI_API_KEY`, empty `ANTHROPIC_API_KEY`, `OPENAI_MODEL=gpt-4o-mini`, and `ANTHROPIC_MODEL=claude-sonnet-4-5`. No real key is in the repo.

`lib/model-provider.ts` chooses the call:

- `none`, `off`, an unknown value, or a selected provider with an empty key: local template, no network.
- `openai` plus `OPENAI_API_KEY`: `https://api.openai.com/v1/chat/completions` only.
- `anthropic` plus `ANTHROPIC_API_KEY`: `https://api.anthropic.com/v1/messages` only. Confirm the model id on Anthropic’s site before enabling it. A rejected model falls back to the template.
- An empty `AI_PROVIDER` with only `OPENAI_API_KEY` still calls OpenAI, so an older local note keeps working. An Anthropic key does nothing until `AI_PROVIDER=anthropic`.

Any model text still goes through `resultFromModel`. Unsafe or ungrounded text is replaced by the template. The teacher still approves before the card says approved, and approval still does not send.

Do not set either key on Vercel for the public demo.
