# PostHog Self-driving setup report

## Summary

PostHog Self-driving is configured for this project: Session Replay, Error Tracking, and Support are enabled; health, error-tracking, and support signal sources are enabled; and the scout troop and two Replay Vision monitors are active. Findings will begin appearing in the [Self-driving inbox](https://us.posthog.com/project/628081/inbox) within about 30 minutes as data arrives.

## AI data processing

Approved by the organization-level setup gate.

## GitHub

Connected before this run through the PostHog GitHub App. No GitHub Issues responder was enabled because no connected tools were selected.

## Products enabled

| Product | Result | Notes |
|---|---|---|
| Session Replay | Already enabled | This is an Expo/React Native app, and no recordings exist yet. The server toggle is on, but React Native Session Replay still needs to be configured and verified in the mobile build. |
| Error Tracking | Enabled | The app already calls `captureException` in its authentication and sign-out flows; verify that mobile exceptions begin arriving. |
| Support (Conversations) | Enabled | Tickets will begin arriving only after an inbound email, inbox, or Slack channel is connected in PostHog. |

## Signal sources

| Signal source | Action | Notes |
|---|---|---|
| `health_checks` / `health_issue` | Enabled | Configuration ID: `01a0d81c-ea2e-77b6-989f-a25385b95cd5`. |
| `error_tracking` / `issue_created` | Enabled | Configuration ID: `01a0d81c-eab8-79fa-9c58-bc3fd0a18f7a`. |
| `error_tracking` / `issue_reopened` | Enabled | Configuration ID: `01a0d81c-eb3d-7676-83f0-46a126994ee3`. |
| `error_tracking` / `issue_spiking` | Enabled | Configuration ID: `01a0d81c-eb27-7492-a24e-6d1527b05896`. |
| `conversations` / `ticket` | Enabled | Configuration ID: `01a0d81c-eb23-7f0f-8a71-b18581f0b478`; remains idle until a support channel is connected. |
| `signals_scout` / `cross_source_issue` | On by default | No opt-out row was present or created. |
| `session_replay` / `session_analysis_cluster` | Skipped | Retired source; Replay Vision scanners provide replay coverage instead. |
| `replay_vision` | Skipped as a source row | The scanners are self-authorizing through `emits_signals: true`. |

## Connected tools

No connected tools were selected. GitHub Issues, Linear, Jira, Sentry, and Zendesk were all left as **not used**; no connected-tool responders or warehouse sources were created.

## Scout troop

**Run budget:** 100 runs/day maximum, 0 used today, 100 remaining. Announcement: “Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more.”

| Status | Scout(s) | Reason |
|---|---|---|
| Enabled | General | Cross-product correlations and surfaces without a dedicated enabled specialist. |
| Enabled | Product analytics | Core app-flow, retention, lifecycle, stickiness, and path regressions. |
| Enabled | Account access activity (custom) | Sustained account-access drops or verification friction; described below. |
| Enabled | Subscription-detail engagement (custom) | Sustained subscription-detail engagement changes; described below. |
| Disabled | Error tracking | Covered by the native Error Tracking sources. |
| Disabled | Session replay | Covered by the Replay Vision scanners below. |
| Disabled | AI observability, APM, CSP violations, customer analytics, data pipelines, data warehouse, experiments, feature flags, logs, revenue analytics, surveys, web analytics, web vitals | No evidence that these product surfaces are actively used in this repo. Enable the relevant scout later if the product adopts that surface. |
| Disabled | Anomaly detection, observability gaps, insight alerts, inbox validation, PR follow-up, skills store, tasks, conversations, MCP tool calls, Replay Vision trend analysis | Kept off to keep a new troop focused; re-enable when these operational surfaces have sustained data or shipped-fix history. |

## Custom scouts

| Scout | What it watches | Discriminator and rationale |
|---|---|---|
| `signals-scout-account-access-activity` | Successful account access and verification retries from `app/(auth)/sign-in.tsx` and `app/(auth)/sign-up.tsx`. | Reports only sustained, broad-reach access declines while app activity remains present, or materially elevated verification retries relative to completion. This covers access-flow liveness, which is not guaranteed to fire under the saved-flow conversion watcher. |
| `signals-scout-subscription-detail-engagement` | Subscription-detail interaction from `app/(tabs)/index.tsx`. | Reports only a sustained decline in detail-opening reach normalized for app activity, or a persistent unexpected mix shift. This covers core subscription-management engagement rather than generic flow conversion. |

The authentication and subscription-management candidates were approved and created; none were declined. Error bursts and replay analysis were considered but ruled out because they are already covered by the native Error Tracking source and Replay Vision scanners, respectively. If either custom scout becomes noisy, set its config’s `emit` field to `false` in PostHog to keep it in dry-run mode.

## Replay Vision scanners

A scanner is an LLM that watches individual session recordings on a schedule and pushes confirmed visible defects into the inbox. These are the only items in this setup that consume Replay Vision quota; findings arrive at half weight and require corroboration before promotion into a report.

There are no recordings yet, so both scanners are armed and will start work when recordings begin. Estimated spend is currently 0 credits/month because the last 7-day sizing window found 0 matching sessions. The organization has 2,500 Replay Vision credits remaining this period.

| Status | Scanner | What it watches | Query scope | Sampling | Estimate |
|---|---|---|---|---|---|
| Created | Recurrly account access breakage | Visible breakage while creating and email-verifying an account. Account creation is the current identifiable completion flow for access to subscription management. | Recordings with a current URL containing `/sign-up`. | 50% | 0 observations/month; 0 credits/month. |
| Created | Recurrly subscription-management frustration | Visible struggle accessing an account or understanding and opening subscription details. | `$rageclick` recordings only; deliberately has no URL filter. | 100% | 0 observations/month; 0 credits/month. |

## Project files

| File | Change |
|---|---|
| `posthog-self-driving-report.md` | Created this configuration report. |

No application source files were changed during this Self-driving setup. Custom scout definitions and Replay Vision scanners were created in PostHog.

## Follow-ups

- [ ] Configure and validate React Native Session Replay in the Expo mobile build, then confirm the first recording reaches PostHog. The current project has no recordings.
- [ ] Connect an inbound Support channel (email, inbox, or Slack) in PostHog so enabled Conversations ticket signals have data.
- [ ] Verify the first mobile `captureException` events arrive in Error Tracking after a real error occurs.
- [ ] Rate early Replay Vision observations in the scanner UI with thumbs up/down to receive configuration recommendations.

## What happens next

The scout coordinator picks up fresh configurations within about 30 minutes. Scout runs draw from the daily budget, findings cluster into reports in the Self-driving inbox, and immediately actionable reports can proceed to coding tasks.
