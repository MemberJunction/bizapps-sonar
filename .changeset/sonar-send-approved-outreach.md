---
"@mj-biz-apps/sonar-actions": minor
"@mj-biz-apps/sonar-ng": minor
---

Send approved outreach through MJ Communications.

The Outreach tab's send only flipped a status and called itself simulated. `Sonar: Send Approved
Outreach` now hands each approved draft to `CommunicationEngine`.

`Sonar: Email Cohort` could not be reused: it sends one subject and body across many recipients with
merge fields, which is a campaign. These drafts are individually written per member, so there is
nothing to merge — this uses `SendSingleMessage`, one message per proposal.

Safe by default, because this is the first Sonar path that can reach a real person. `DryRun` defaults
to TRUE (renders everything, sends nothing, marks nothing Executed); `TestRecipient` redirects every
message to one verified address; only `Approved` rows are eligible and a real send moves them to
`Executed`, so a re-run cannot double-send while a failure stays Approved for retry. The tab runs it
in dry run only, so the queue deliberately does not drain from a single click.
