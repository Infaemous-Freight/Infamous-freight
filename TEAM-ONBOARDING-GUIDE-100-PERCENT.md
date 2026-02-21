# Team Onboarding Guide

**Status**: ✅ ONBOARDING PROCEDURES DOCUMENTED  
**Date**: February 19, 2026  
**Purpose**: Accelerate new team member onboarding

---

## 1. Pre-Boarding (Before First Day)

### Checklist for Hiring Manager

- [ ] Accounts created (GitHub, Slack, Email)
- [ ] Hardware ordered (laptop, peripherals)
- [ ] Sent onboarding email with links
- [ ] Scheduled 1:1 intro meetings
- [ ] Added to Slack channels
- [ ] Created project board with onboarding tasks

### New Hire Gets

- [ ] Onboarding email with schedule
- [ ] GitHub access to repositories
- [ ] Slack workspace access
- [ ] Calendar invites for first-week meetings
- [ ] Development environment guide

---

## 2. Day 1: Welcome & Setup

### Morning (9-11 AM)

**Welcome Call** (30 min):
- Welcome from manager
- Team introduction
- Logistics overview
- Slack walkthrough

**Development Environment Setup** (90 min):
```bash
# 1. Install Git
git config --global user.name "Your Name"
git config --global user.email "you@company.com"

# 2. Clone repository
git clone https://github.com/MrMiless44/Infamous-freight.git
cd Infamous-freight-enterprises

# 3. Install Node.js
# Via nvm or direct: Node 20.x, npm/pnpm

# 4. Install pnpm
npm install -g pnpm@9.15.0

# 5. Install dependencies
pnpm install

# 6. Basic verification
pnpm lint
pnpm check:types
pnpm test --testPathPattern="health-check"
```

**Expected**: All basic tests passing ✅

### Afternoon (2-5 PM)

**Repository Tour** (60 min):
- Clone walk-through
- Code structure overview
- Key directories explained
- Deployment pipeline review

**Documentation Review** (90 min):
- README.md - Project overview
- CONTRIBUTING.md - Development guidelines
- DOCUMENTATION_STANDARDS-RECOMMENDED.md - Conventions

---

## 3. Week 1: Learning Path

### Monday

```
9-10 AM   → Architecture deep-dive
          - Monorepo structure
          - Multiple apps (API, Web, Mobile)
          - Shared packages

10-11 AM  → Database overview
          - Prisma setup
          - Schema walkthrough
          - Key tables

1-2 PM    → Development environment
          - pnpm commands
          - Local server startup
          - Testing workflow

2-5 PM    → Hands-on: Run services locally
          → pnpm dev
          → Verify all working
```

### Tuesday

```
9-10 AM   → Testing strategy
          - Jest setup
          - Writing tests
          - Coverage targets

10-11 AM  → CI/CD pipeline
          - GitHub Actions
          - Automated checks
          - Deployment workflow

1-2 PM    → Security guidelines
          - Secret management
          - Code review best practices
          - Security scanning

2-5 PM    → Hands-on: Write first test
          → Review existing tests
          → Submit small test PR
```

### Wednesday

```
9-10 AM   → Monitoring & observability
          - Sentry setup
          - Datadog integration
          - Health checks

10-11 AM  → Incident response
          - SLAs overview
          - Who to contact
          - How to respond

1-2 PM    → Documentation deep-dive
          - Keep it current
          - Standards to follow
          - Tools we use

2-5 PM    → Hands-on: Small bug fix
          → Fix GitHub issue marked "good-first-issue"
          → Submit PR for review
```

### Thursday

```
9-10 AM   → Deployment procedures
          - Local testing
          - Staging environment
          - Production checks

10-11 AM  → Performance optimization
          - Profiling tools
          - Load testing
          - Scaling strategies

1-2 PM    → Operational procedures
          - On-call rotations
          - Backup procedures
          - Disaster recovery

2-5 PM    → Hands-on: Review code
          → Read 3-5 recent PRs
          → Understand patterns
          → Ask questions
```

### Friday

```
9-10 AM   → Week review
          - What have you learned?
          - What questions remain?
          - Feedback for onboarding

10-11 AM  → Team standup
          - Meet extended team
          - Hear status updates
          - Ask questions

1-2 PM    → Next week planning
          - What will you work on?
          - First real task assignment
          - Support plan

2-5 PM    → Celebrate & relax
          → Meet team for lunch
          → Get to know colleagues
```

---

## 4. Week 2-4: Ramping Up

### Suggested Task Progression

**Week 2**:
- [ ] Fix 1-2 "good-first-issue" bugs
- [ ] Update 1 piece of documentation
- [ ] Run through incident response procedures
- [ ] Attend code review training

**Week 3**:
- [ ] Complete small feature (with guidance)
- [ ] Lead one code review
- [ ] Shadow on-call rotation
- [ ] Contribute security improvements

**Week 4**:
- [ ] Work on medium feature
- [ ] Participate in design review
- [ ] Join on-call rotation
- [ ] Deliver first independent PR

---

## 5. Key Resources to Share

### Documentation

```markdown
START HERE:
- README.md
- CONTRIBUTING.md

DEVELOPMENT:
- DOCUMENTATION_STANDARDS-RECOMMENDED.md
- AUTO-OPERATIONS-GUIDE-RECOMMENDED.md

OPERATIONS:
- OPERATIONS-RUNBOOK-RECOMMENDED.md
- INCIDENT-RESPONSE-RUNBOOK-RECOMMENDED.md
- DISASTER-RECOVERY-PLAN-RECOMMENDED.md

DEPLOYMENT:
- MERGE-AND-DEPLOY-GUIDE-RECOMMENDED.md
- TROUBLESHOOTING-GUIDE-RECOMMENDED.md
```

### Tools & Access

```
- GitHub: Username/SSH key setup
- Slack: Main channels & teams
- Fly.io: Account access (if needed)
- Vercel: Project visibility
- Sentry: Error tracking access
- Datadog: Monitoring dashboard
```

### Communication

```
Slack channels to join:
#engineering           - Daily standups
#deployments          - Deployment notifications
#incidents            - Incident discussions
#random               - Off-topic socializing

Key people to follow:
@team-lead            - Project leadership
@devops               - Infrastructure
@security             - Security guidance
@on-call              - Current incident responder
```

---

## 6. Onboarding Assessment

### Day 3 Checkpoint

- [ ] Development environment working
- [ ] Can run local services
- [ ] Tests passing
- [ ] Read key documentation
- [ ] Understand architecture basic

### Week 2 Checkpoint

- [ ] Submitted first PR
- [ ] Code review concepts clear
- [ ] Can run through incident procedure
- [ ] Familiar with key tools

### Week 4 Checkpoint

- [ ] Completed small feature independently
- [ ] Participated in incident response
- [ ] Documented learnings
- [ ] Ready for regular work

---

## 7. Mentoring & Support

### Assigned Mentor

- Experienced engineer (not a manager)
- Available for questions
- Reviews early PRs closely
- Helps navigate team dynamics
- Check-ins: Daily week 1, 3x/week week 2-4

### Support System

- Manager check-ins: Mondays 10 AM
- Team standup: Daily 9:30 AM
- Slack #help-wanted channel
- Weekly 1:1s with team lead

### Feedback Loop

- Week 1: How's it going? Anything blocking?
- Week 2: Feeling more comfortable?
- Week 4: Ready for independent work?
- Month 1: Formal feedback & goals check-in

---

## 8. Common Challenges & Solutions

### "I can't run the local environment"

**Solution**:
1. Check Node.js version: `node --version` (should be 20.x)
2. Check pnpm: `pnpm --version` (should be 9.15.0)
3. Verify git hooks: `git config core.hooksPath`
4. Run: `pnpm install --force`
5. Check: `pnpm test`

### "Tests are failing"

**Solution**:
1. Check branch: `git status` (should be main)
2. Pull latest: `git pull origin main`
3. Clear cache: `pnpm install --force`
4. Run: `pnpm test -- --updateSnapshot`
5. Ask mentor if still failing

### "Code review feedback is confusing"

**Solution**:
1. Post a comment: "Can you clarify?"
2. Schedule sync with reviewer
3. Discuss in standup
4. Never commit feedback you don't understand

### "I don't understand the architecture"

**Solution**:
1. Draw it out on whiteboard
2. Have mentor explain with visuals
3. Read architecture diagrams in docs
4. Ask in #engineering channel

---

## 9. 30-Day Check-In

### Meeting with Manager

**Topics**:
- How's on-boarding going?
- Any blockers?
- Team fit - feeling part of team?
- Performance - meeting expectations?
- Support - enough help?
- Next steps - what's next month?

**Deliverables by Day 30**:
- [ ] 3+ PRs merged to main
- [ ] Understand codebase basics
- [ ] Participated in incidents (or simulation)
- [ ] Completed assigned issues
- [ ] Contributed to documentation
- [ ] Attended all key meetings

---

## 10. 90-Day Offboarded Support

### Graduated Checklist

- [ ] Day 1-30: Heavy mentoring
- [ ] Day 31-60: Reduced mentoring (2x/week)
- [ ] Day 61-90: Minimal mentoring (1x/week)
- [ ] Day 91+: Independence, occasional check-ins

### Graduation Criteria

- [ ] Independently completes features
- [ ] Reviews others' code well
- [ ] Takes on-call rotation confidently
- [ ] Contributes to team discussions
- [ ] Knows who to ask for help
- [ ] Maintains code quality standards
- [ ] Participates in incidents effectively

---

## 11. Onboarding Feedback

After first 30 days, new hire completes survey:

```
1. Was onboarding material useful?
   [ ] Yes [ ] No [ ] Partially
   
2. What was missing?
   ___________________________

3. How was mentor support?
   [ ] Excellent [ ] Good [ ] Fair [ ] Poor
   
4. Estimate productivity level?
   [ ] 20% [ ] 40% [ ] 60% [ ] 80%
   
5. What would improve experience?
   ___________________________

6. Recommend to others?
   [ ] Yes [ ] No [ ] Maybe
```

### Use feedback to improve future onboardings.

---

## 12. Quick Start Checklist Template

**Print and send to new hire**:

```
WELCOME TO THE TEAM! 🎉

BEFORE YOUR FIRST DAY:
- [ ] Install Node.js 20.x
- [ ] Install Git
- [ ] Create GitHub account
- [ ] Join Slack workspace
- [ ] Check email for schedule

DAY 1:
- [ ] Meet manager
- [ ] Setup development environment
- [ ] Run: pnpm install
- [ ] Run: pnpm test
- [ ] Read: README.md

DAY 2-3:
- [ ] Read: CONTRIBUTING.md
- [ ] Read: DOCUMENTATION_STANDARDS
- [ ] Run: pnpm dev (start local services)
- [ ] Review: 3 recent PRs

WEEK 1:
- [ ] Complete architecture tour
- [ ] Attend daily standups
- [ ] Submit first PR
- [ ] Ask questions freely

WEEK 2-4:
- [ ] Fix 2-3 issues
- [ ] Complete small feature
- [ ] Participate in code review
- [ ] Join on-call rotation

MONTH 1:
- [ ] Merge 5+ PRs
- [ ] Lead code review
- [ ] Help next new hire
- [ ] Feedback to manager

Questions? Ask @mentor or #engineering channel!
```

---

**This guide should be updated after each new hire's feedback.**

**Last Updated**: February 19, 2026  
**Next Update**: After next new hire (feedback-driven)

For team info, see: [TEAM-INFORMATION.md](TEAM-INFORMATION.md) (if available)
