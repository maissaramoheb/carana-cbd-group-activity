# Run 09 monitoring follow-up

Scope: native monitoring and Node.js consistency only. Baseline is Run 09 commit `d4c79aff8c4c53d9e5700eb2f7c7575ef5b1046e`, production deployment `dpl_eNTkZK9uYxMcMvVMpVBnCNvNRT1p`. No design, instructional, narration or storage changes are authorized here. Only this chat was active in CARANA at the initial app inventory; the checkout was clean.

## Native Agent Installation check

The authenticated project API has no Git repository link, the project overview offers **Connect Git**, and the Speed Insights installer explicitly reports **Missing GitHub Connection**. The GitHub commit metadata attached by the CLI is not a project Git integration. Therefore native installation is currently unavailable for this project.

[Vercel Agent Installation](https://vercel.com/docs/agent/installation) is free and can generate an integration pull request for a GitHub-connected project; underlying analytics usage can still be billable. No repository connection, installer dispatch, Agent subscription, promotional credit, auto-reload, competing PR or automatic deployment was created. The existing isolated branch remains the sole integration change. Connecting Git solely to duplicate this small integration would add release coordination risk without changing the cost restrictions.

## Zero-additional-cost policy

The owner explicitly declined new fees, paid add-ons and usage overages. Account inspection confirms an active Pro subscription, a zero included-event threshold for `webAnalyticsEvent`, and zero subscribed quantity for the paid `analytics` add-on. Existing analytics controls allow a $500 ceiling, not a zero-cost guarantee; they were not changed.

Web Analytics transmission is therefore **disabled** in the shipped configuration. No visitor/pageview, geographic, referral or custom-event collection is claimed. The official integration and six finite educational events are implemented and locally testable, but no paid event is sent. Changing this decision requires owner authorization and a verified allowance/cost safeguard. An ordinary shared usage credit does not reserve enough allowance to guarantee zero additional charges.

Only free Speed Insights is enabled, with 10% sampling and soft navigation collection disabled. Vercel documents a shared team allowance of 10,000 free events over 30 days, with collection pausing at the limit and no event charges. Speed Insights Plus is not activated. The free dashboard exposes Real Experience Score and limited route breakdowns; full LCP/INP/CLS and device breakdowns are Plus features. No paid alternative is substituted.

Sources checked: [Web Analytics pricing](https://vercel.com/docs/analytics/limits-and-pricing), [Speed Insights pricing](https://vercel.com/docs/speed-insights/limits-and-pricing), [spending controls](https://vercel.com/docs/spend-management), [project/product budget release](https://vercel.com/changelog/set-budgets-for-projects-and-products-in-spend-management). Budgets that pause production can interrupt sites; no pause or budget configuration is changed. The installed CLI does not expose the documented `budgets` command, and the authenticated project interface does not expose a zero-dollar hard cap; no existing hard cap is claimed.

## Runtime correction

Before: dashboard project Node 26.x, repository `>=22` (resolves to the newest supported major), immutable production deployment metadata Node 24.x, and explicit prebuilt API function configuration `nodejs22.x`. The original build ran locally under Node 26.9.0. A static HTML application has no browser-side Node dependency; the five small proxy functions use supported Node built-ins.

Now the repository/lockfile and project select **22.x**, matching the existing function packaging. Tests and build run under temporary Node 22.23.5 tooling; one pinned official monitoring SDK is added and the persistent local AI service runtime is not changed. The health endpoint returns only `X-CARANA-Node-Major` so preview execution can establish the actual serverless major without exposing secrets. Old deployment metadata and historical warnings are immutable; new previews/deployments must be checked separately.

## Privacy and implementation

The build adds two deferred scripts to ten known learner HTML outputs. Original single-file source activities remain intact. Nothing is injected into owner review or demonstration pages. The sole dependency is the official `@vercel/speed-insights@2.1.0` SDK. The build copies its 4.2 KB standalone browser module and license; no framework or transitive runtime dependency is installed. It replaces direct script initialization during the final bounded compatibility check. There are no cookies, identifiers, learner-storage reads, input observers or conversation capture.

Allowed custom event names: `lesson_started`, `lesson_completed`, `workbench_opened`, `checkpoint_completed`, `language_selected`, `ai_assistant_opened`. Only finite target IDs and `en`/`fr-FR`/`ar` can enter the two metadata fields. Completion events arise from successful existing progression actions, not imports or restored state. Lesson 1 completion retains its existing workbench confirmation requirement; Lessons 2–6 retain their existing guided-study checkpoint definition. Answers, scores, names, access codes, draft content and AI text never enter the event API. With Web Analytics disabled, even these safe events are not queued or transmitted.

Fixed reporting paths remove arbitrary queries/fragments and normalize both aliases to one route namespace while retaining the actual first-party origin. One SDK instance per document and manual logical pageviews prevent duplicate initialization or language-only pageview inflation. No cross-domain user fingerprinting is introduced; deduplication of an anonymous person who independently visits both origins cannot be guaranteed without additional identification.

`npm run test:monitoring` checks disabled paid collection, URL redaction, duplicate initialization/pageviews, finite metadata, completion deduplication and offline/owner-page exclusion. Existing multilingual, progress, AI and muted audio regressions remain required. Final deployed evidence and exact release state are recorded in the external follow-up release report; a loaded script alone is not proof of received telemetry.

Dashboards: [Speed Insights](https://vercel.com/delta4ce20-5830s-projects/carana-cbd-elearning/speed-insights), [Web Analytics (collection disabled)](https://vercel.com/delta4ce20-5830s-projects/carana-cbd-elearning/analytics), [Build settings](https://vercel.com/delta4ce20-5830s-projects/carana-cbd-elearning/settings/build-and-deployment).
