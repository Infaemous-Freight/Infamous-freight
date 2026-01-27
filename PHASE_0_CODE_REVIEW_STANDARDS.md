# Code Review Standards & Guidelines

**Organization:** Infamous Freight Enterprises  
**Effective Date:** January 27, 2026  
**Owner:** Tech Lead  
**Applies To:** All code changes in `main` branch

---

## 1. Code Review Requirements

### Merge Requirements for Production Code

**Standard Requirement (Most PRs):**

- [ ] Minimum 2 approvals (can be any 2 team members)
- [ ] All automated checks passing (tests, linting, type check)
- [ ] No merge conflicts
- [ ] Branch up to date with main

**Expedited Approval (Urgent Hot Fixes Only):**

- [ ] Minimum 1 approval (lead engineer only)
- [ ] All automated checks passing
- [ ] Used only for: Critical production bugs, security patches, 1-line typo
      fixes
- [ ] Requires: Manager awareness (post fix to #critical-fixes channel)
- [ ] Limit: Max 1 expedited approval per week

**Documentation/Non-Code:**

- [ ] Minimum 1 approval
- [ ] Used for: README, guides, configuration, CHANGELOG
- [ ] Fast-track: Can merge same day if approved

**Test Files:**

- [ ] Minimum 1 approval
- [ ] If test adds significant new coverage: 1 approval
- [ ] Used for: New test suites, test infrastructure updates

---

## 2. Merge Checklist - Automated Checks

**Required to Pass Before Merge:**

```
✅ All Tests Passing
   └─ pnpm test (Jest unit + integration tests)
   └─ No test failures or warnings
   └─ Coverage threshold met (85%+)

✅ Type Checking
   └─ pnpm check:types (TypeScript strict mode)
   └─ No TypeScript errors or unsafe any types
   └─ All function signatures properly typed

✅ Linting
   └─ pnpm lint (ESLint)
   └─ No linting errors or warnings
   └─ Code style consistent with project

✅ Formatting
   └─ pnpm format (Prettier)
   └─ Code auto-formatted to project style
   └─ No unformatted code

✅ Build Verification
   └─ pnpm build (API + Web)
   └─ No build errors
   └─ Bundle size not increased >50KB

✅ Security Scan
   └─ CodeQL automated scan (GitHub)
   └─ pnpm audit (no vulnerabilities)
   └─ No hardcoded secrets
   └─ No new security warnings
```

**GitHub Branch Protection Rule:**

```
Require status checks to pass before merging:
☑ ESLint / Prettier (Code Quality)
☑ TypeScript (Type Safety)
☑ Jest (Unit Tests)
☑ E2E Tests (Playwright)
☑ CodeQL (Security Scan)
☑ Build Check (API + Web)

Require branches to be up to date: ☑ YES
Require code reviews: ☑ YES (2 approvals)
Dismiss stale pull request approvals: ☑ YES
```

---

## 3. Manual Code Review Checklist

### For Every PR Review, Check:

**A. Does It Actually Work? (Functionality)**

- [ ] Logic is correct (does it do what the PR description says?)
- [ ] Happy path tested?
- [ ] Edge cases covered?
- [ ] Error handling present?

Example Comments:

```
✅ Good: "Function properly handles both paginated and non-paginated responses"
❌ Bad: "What if the array is empty? Will this crash?"
```

**B. Is It Secure? (Security)**

- [ ] No SQL injection risks (using parameterized queries?)
- [ ] No XSS vulnerabilities (data properly escaped?)
- [ ] No sensitive data in logs?
- [ ] No credentials/API keys hardcoded?
- [ ] Authentication check present?
- [ ] Authorization properly scoped?
- [ ] Rate limiting applied if needed?

Example Comments:

```
✅ Good: "Nice rate limiting here, prevents brute force"
❌ Bad: "This endpoint accepts user input directly in SQL query - SQL injection risk"
🔒 Security: "Is this endpoint public? Should check authz scopes"
```

**C. Is It Fast? (Performance)**

- [ ] No N+1 query problems?
- [ ] Large loops avoid expensive operations?
- [ ] Unnecessary re-renders avoided (React)?
- [ ] Caching used where appropriate?
- [ ] Any obvious performance regressions?

Example Comments:

```
✅ Good: "Batch loading here prevents N+1, nice"
❌ Bad: "This query runs inside a loop for 1000 items - will be slow"
⚡ Performance: "Consider caching this - will run 10x per second"
```

**D. Is It Testable? (Testing)**

- [ ] Code changes are covered by tests?
- [ ] > 85% coverage maintained?
- [ ] Tests check both happy path and errors?
- [ ] Mock dependencies properly?

Example Comments:

```
✅ Good: "Unit tests cover 5 scenarios, including error cases"
❌ Bad: "No tests here - are the error cases tested? Add test for when API returns 500"
```

**E. Is It Readable? (Code Quality)**

- [ ] Variable names are clear (not `a`, `x`, `result`)?
- [ ] Functions do one thing (not 100-line monster)?
- [ ] Comments explain WHY, not WHAT?
- [ ] No commented-out code left behind?
- [ ] New team member could understand this?

Example Comments:

```
✅ Good: "Variable names clear: 'potentiallyFailedShipments', 'maxRetries'"
❌ Bad: "Variable 'x' is unclear - what does it represent?"
📝 Clarity: "This function does 5 things - consider breaking into smaller functions"
```

**F. Does It Follow Patterns? (Architecture)**

- [ ] Matches existing code style?
- [ ] Uses existing utilities vs reinventing?
- [ ] Follows project structure/conventions?
- [ ] No over-engineering for future use cases?

Example Comments:

```
✅ Good: "Uses existing ApiResponse wrapper, consistent with other endpoints"
❌ Bad: "We have a validation utility already - use validateEmail() instead of regex"
🏗️ Architecture: "This pattern doesn't match our middleware setup, let's discuss"
```

**G. Is It Documented? (Documentation)**

- [ ] Complex logic has comments explaining WHY?
- [ ] JSDoc for public functions/exports?
- [ ] README/guide updated if user-facing change?
- [ ] If breaking change, noted in CHANGELOG?

Example Comments:

```
✅ Good: "Comments explain the 3-second timeout is for Stripe webhook timeout"
❌ Bad: "Why sleep 3000ms? This needs a comment"
📖 Docs: "This changes the API response format - should update API docs"
```

---

## 4. Review Process Workflow

### Step 1: Create PR

```
1. Create branch: git checkout -b feature/xxx
2. Make changes + commit
3. Run tests locally: pnpm test
4. Push: git push origin feature/xxx
5. Create GitHub PR (fill out template):
   - Title: "feat: brief description"
   - Description: (see PR template section below)
   - Link related issues/PRs
   - @mention 2+ reviewers based on change:
     - Backend changes: @backend-lead @backend-2
     - Frontend changes: @frontend-lead @frontend-2
     - Full-stack: @backend-lead @frontend-lead
```

### Step 2: Automated Checks Run

```
GitHub Actions triggers immediately:
├─ ESLint + Prettier
├─ TypeScript type check
├─ Jest unit tests
├─ E2E tests (Playwright)
├─ CodeQL security scan
└─ Build verification

Reviewers wait for ✅ ALL CHECKS PASSING before reviewing
If checks fail: Author fixes + pushes → Checks re-run
```

### Step 3: Manual Review

```
Reviewers review within SLA:
- Critical hotfix: 15 min review SLA
- Bug fix: 1 hour review SLA
- Feature: 24 hour review SLA
- Documentation: 3 business day SLA

Reviewers use checklist above:
1. Read PR description
2. Check code changes
3. Run locally if non-trivial
4. Add comments:
   ✅ "Looks good" = approve
   ❌ "This needs fixing" = request changes
   💭 "Can you clarify?" = comment (not blocking)
```

### Step 4: Address Feedback

```
Author responds to each comment:
- If agree with feedback: Fix code + push new commit
- If disagree: Respond with reason, TAG reviewer for discussion
- If need clarification: Ask in comment thread

Push again → Checks re-run → Reviewers re-approve
```

### Step 5: Merge

```
Once approved by 2+ reviewers:
1. All checks passing ✅
2. Branch up to date with main
3. No conflicts
4. Author clicks "Squash and merge"
5. Delete branch after merge
```

### Step 6: Verify Deployment

```
After merge to main:
- CI/CD pipeline runs automatically
- Code deployed to staging (if configured)
- Smoke tests run
- Author verifies: Staging environment has changes
```

---

## 5. PR Template (Add to GitHub)

**File Location:** `.github/pull_request_template.md`

```markdown
## Description

Brief description of changes (1-2 sentences)

## Type of Change

- [ ] Bug fix (fixes issue #xxx)
- [ ] New feature (related to issue #xxx)
- [ ] Performance improvement
- [ ] Refactoring
- [ ] Documentation change
- [ ] Configuration/infrastructure change
- [ ] Security improvement

## How Has This Been Tested?

Describe the testing you've done:

- Unit tests: [how many, what coverage]
- Manual testing: [what scenarios tested]
- Edge cases: [what worked/didn't work]

## Checklist

- [ ] My code follows the project's style (ran `pnpm format`)
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code (complex logic only)
- [ ] I have updated documentation (if needed)
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix works (or why N/A)
- [ ] New and existing unit tests pass locally: `pnpm test`
- [ ] TypeScript strict mode: `pnpm check:types`
- [ ] No new console.logs or debug code left behind
- [ ] No sensitive data (API keys, passwords) in code

## Screenshots (if UI change)

[Attach before/after if visual changes]

## Notes/Concerns

[Any known issues, TODOs, or architectural decisions to discuss?]

## Reviewers

@backend-lead @frontend-lead [or relevant team members]
```

---

## 6. Comment Style Guide

### Good Review Comments

**Praise good code:**

```
✅ Good: "I like how you used optional chaining here, makes the code cleaner"
```

**Ask questions instead of demanding:**

```
Good: "Have you considered using the existing validateEmail() function?"
Bad: "Use validateEmail() instead"
```

**Explain the WHY:**

```
Good: "This could be an N+1 query - at 1000+ shipments, each iteration
       would query the database. Consider using include/join instead."
Bad: "N+1 query problem"
```

**Offer solutions:**

```
Good: "Consider extracting this into a separate function for reusability"
Bad: "This is too long"
```

**Distinguish severity:**

```
🔴 BLOCKING: Must fix before merge
   "SQL injection risk - use parameterized query"

🟡 IMPORTANT: Should fix before merge
   "This causes N+1 queries, will be slow at scale"

🟠 NICE-TO-HAVE: Can merge but suggest improvement
   "Consider extracting helper function for reusability"

🔵 NITPICK: Just a suggestion, totally optional
   "I prefer camelCase over snake_case (minor style thing)"
```

**Use reactions for quick feedback:**

```
👍 Approve (same as click Approve button)
🚀 Looks great!
🤔 Let me think about this
❓ Question/clarification needed
```

---

## 7. Common Review Scenarios

### Scenario 1: Reviewer Doesn't Understand Code

**Don't say:** "This doesn't make sense"  
**Do say:** "Can you explain why you chose this approach over [alternative]?
Help me understand the tradeoff"

### Scenario 2: Reviewer Disagrees with Approach

**Don't approve if you disagree.** Instead:

```
"I see what you're doing, but let me discuss an alternative approach.
Could we do it like [this] instead? Benefits: [list]"

[If debate: Tag Tech Lead to help decide]
```

### Scenario 3: Nitpicky Comment

**Make it OK to ignore:**

```
"Minor: Consider renaming 'x' to 'retryCount' for clarity
(no need to change if you prefer current name)"
```

### Scenario 4: Simple One-Line Fix Needed

**Make it a suggestion:**

```
"Simple fix: Change 'const shipment' to 'const shipment: Shipment'
for type safety (TypeScript strict mode)"
```

### Scenario 5: Great Code, Approve It!

**Be encouraging:**

```
"This is well-structured! Love how you handled the error cases. ✅"
```

---

## 8. Team Norms

### What Reviewers Should Do

✅ **DO:**

- [ ] Review PRs within SLA (15 min to 24 hours depending on type)
- [ ] Ask clarifying questions (don't assume intent)
- [ ] Praise good code (encourages author)
- [ ] Suggest improvements (helps team learn)
- [ ] Be respectful and helpful (code review is not personal)
- [ ] Check for security/performance issues
- [ ] Verif tests cover the changes
- [ ] Approve if it's good (don't wait for perfection)

❌ **DON'T:**

- [ ] Use code review to assert authority or nitpick everything
- [ ] Demand changes without explanation
- [ ] Approve without actually reviewing
- [ ] Request changes after author goes home (let them sleep)
- [ ] Hold up PR waiting for your review (ping reviewers)
- [ ] Leave the PR vulnerable to merge (if urgent: talk to team)

### What Authors Should Do

✅ **DO:**

- [ ] Make PRs focused and small (<400 lines)
- [ ] Write clear descriptions (why, not what)
- [ ] Respond to feedback quickly
- [ ] Push fixes + @ mention reviewer (don't wait silently)
- [ ] Celebrate when code is merged!

❌ **DON'T:**

- [ ] Create 2000-line PRs (split into smaller ones)
- [ ] Argue with reviewers (discuss, then defer to lead if disagree)
- [ ] Disappear after creating PR (respond to feedback)
- [ ] Force-push unless told to (can lose review comments)

---

## 9. Review Metrics & Goals

### Track These Monthly

```
Metric: Average Review Time
Goal: <24 hours for features, <4 hours for bugs
Measure: Time from PR created → approval

Metric: Review Coverage
Goal: 100% of PRs reviewed by 2+ people
Measure: PRs merged with <2 approvals?

Metric: Rework Rate
Goal: <20% of PRs have "changes requested" iterations
Measure: If high: Either poor code or too nitpicky reviews

Metric: Merge Commit Hygiene
Goal: 100% of commits have meaningful messages
Measure: Can grep commits without confused "WireFrame updated"?
```

---

## 10. Escalation: When Disagreement Occurs

### If Reviewer & Author Disagree

**Escalation Path:**

1. **Status Quo:** Keep discussion in PR comments (brief, professional)
2. **Timeout:** If unresolved after 2 hours, @mention Tech Lead
3. **Discussion:** Tech lead reviews context and decides
4. **Decision:** Tech lead makes final call (not always "right", but decided)

**Examples:**

```
AUTHOR: "I want to use GraphQL"
REVIEWER: "REST is simpler, let's stick with REST"
→ Tech Lead decides based on project priorities + team skillset

AUTHOR: "Let's use external npm package X"
REVIEWER: "Security risk, too many dependencies"
→ Tech Lead evaluates risk vs benefit
```

**Principle:** Tech lead breaks ties, but should explain their reasoning.

---

## 11. Training & Onboarding

### New Team Members: First Code Review

**What to Expect:**

- Your first aPR will likely have more feedback (learning opportunities)
- Reviewers will explain the "why" behind feedback
- You're not expected to be perfect immediately
- Mistakes are learning - we're kind about it

**Your First Review (as reviewer):**

- Start by reviewing PRs from people senior to you
- Ask questions in comments if unsure
- Don't approve if truly unsure (that's fine)
- Tag tech lead if uncomfortable with your review

---

## 12. Continuous Improvement

### Monthly Code Review Retrospective

**First Friday of each month, 30 min meeting:**

```
Discussion points:
1. Were reviews helpful?
2. Did we catch important issues?
3. Any PRs that slip through with bugs?
4. Reviewer burnout? PRs waiting too long?
5. Suggested adjustments?
```

---

## Summary: Code Review Workflow

```
Author Creates PR
        ↓
Automated Checks Run (↕ must pass)
        ↓
Reviewers Read + Check Against Checklist
        ↓
Reviewers Either:
├─ Approve ✅ (add suggestions as nice-to-have)
├─ Comment 💭 (ask clarifying questions)
└─ Request Changes 🔴 (blockers for merge)
        ↓
Author Responds to Feedback
        ↓
Author Pushes Fixes
        ↓
Checks Re-run + Reviewers Re-review
        ↓
All Approvals → Merge ✅
        ↓
Deploy to Production
```

---

**Document Version:** 1.0  
**Effective Date:** January 27, 2026  
**Review Cadence:** Monthly (first Friday)  
**Owner:** Tech Lead  
**Next Update:** April 2026 (after first quarter)
