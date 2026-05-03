---
name: Launch blocker
description: Track a launch-blocking issue before private beta, paid beta, or public launch
title: "[Launch Blocker]: "
labels: [production, operations]
assignees: ""
---

## Summary
Describe the launch-blocking issue in one or two sentences.

## Launch gate impacted
- [ ] Private beta
- [ ] Paid beta
- [ ] Public launch

## Severity
- [ ] Critical — blocks launch
- [ ] High — blocks paid/public launch unless workaround is documented
- [ ] Medium — launch may proceed if assigned and documented
- [ ] Low — launch may proceed
- [ ] Unknown — treat as failed until verified

## Evidence
Paste command output, screenshots, dashboard links, logs, or reproduction notes.

```text
Evidence goes here.
```

## Expected result
What should have happened?

## Actual result
What happened instead?

## Root cause
Known, suspected, or unknown.

## Workaround
Document any safe temporary workaround. Write `None` if no workaround exists.

## Fix plan
- [ ] Owner assigned
- [ ] Fix identified
- [ ] Fix implemented
- [ ] Fix reviewed
- [ ] Fix deployed

## Retest proof
Paste evidence that the blocker was retested after the fix.

## Launch decision
- [ ] Still blocked
- [ ] Cleared for private beta
- [ ] Cleared for paid beta
- [ ] Cleared for public launch
