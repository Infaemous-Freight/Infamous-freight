#!/bin/bash

##############################################################################
# SALES OPERATIONS & PLAYBOOK SYSTEM
# Lead qualification, sales process, CRM workflows, revenue targets
##############################################################################

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║         💼 SALES OPERATIONS & PLAYBOOK                           ║"
echo "║         Sales Process, CRM Workflows & Revenue Engine            ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

mkdir -p docs/sales-operations

cat > docs/sales-operations/SALES_OPERATIONS_PLAYBOOK.md << 'EOF'
# 💼 SALES OPERATIONS & PLAYBOOK SYSTEM

**Purpose**: Build scalable, repeatable sales process to convert leads → customers  
**Current State**: Founder-led sales, informal process  
**Goal**: Scale to dedicated sales team with predictable pipeline  
**Timeline**: Q1-Q4 2026

---

## Current Sales State (Jan 2026)

### Baseline Metrics

```
╔════════════════════════════════════════════════════════════╗
║  CURRENT SALES METRICS (Jan 2026)                       ║
╚════════════════════════════════════════════════════════════╝

SALES TEAM: Founder + 1 Sales Rep
  • CEO: Handles enterprise deals, strategic accounts
  • Sales Rep: SMB deals, inbound leads
  • Support: Customer Success does upsells

PIPELINE:
  • Leads: 800/month (mostly self-serve trial signups)
  • Sales-qualified leads (SQL): 100/month (12.5%)
  • Demos/calls: 40/month (40% of SQL)
  • Closed-won: 12/month (30% of demos)
  • Average deal size: $1,800 ARR ($150/month)
  • Sales cycle: 14 days (trial → decision)

REVENUE:
  • Monthly Recurring Revenue (MRR): $150K
  • Annual Recurring Revenue (ARR): $1.8M
  • New MRR: $21.6K/month (12 customers × $1,800)
  • Churn: 3%/month ($4.5K)
  • Net New MRR: $17.1K/month (growth)

PROBLEMS:
  • No formal sales process (inconsistent)
  • No lead qualification framework
  • CRM data messy (incomplete records)
  • No sales enablement materials
  • Founder bottleneck for enterprise deals
  • Low demo conversion (30% vs industry 40%+)
```

---

## Sales Strategy (2026)

### Revenue Goals

```
╔════════════════════════════════════════════════════════════╗
║  2026 REVENUE TARGETS                                    ║
╚════════════════════════════════════════════════════════════╝

CURRENT (Jan 2026):
  • ARR: $1.8M
  • Customers: 1,000
  • Average ACV: $1,800

TARGET (Dec 2026):
  • ARR: $5.4M (3x growth)
  • New ARR: $3.6M
  • Customers: 3,000 (net 2,000 new after churn)
  • Average ACV: $1,800 (maintain)

REQUIRED:
  • Close 2,400 new customers in 12 months (200/month)
  • Increase demos: 40/month → 200/month (5x)
  • Maintain or improve conversion rates
  • Reduce sales cycle from 14 → 10 days
```

### Sales Team Expansion

```
CURRENT TEAM (Q1 2026): 2 people
  • CEO (enterprise)
  • 1 Sales Rep (SMB)

Q2 2026: +1 Sales Rep
  • Total: 3 people (1 enterprise, 2 SMB)
  • Capacity: 150 deals/month

Q3 2026: +1 Sales Rep + 1 SDR
  • Total: 5 people
  • Capacity: 250 deals/month
  • SDR: Lead qualification, outbound prospecting

Q4 2026: +1 Sales Rep
  • Total: 6 people (1 enterprise, 4 SMB, 1 SDR)
  • Capacity: 300 deals/month

QUOTA PER REP:
  • SMB Rep: 40 deals/month ($72K MRR)
  • Enterprise Rep: 5 deals/month ($150K MRR)
  • SDR: 200 qualified leads/month

COMPENSATION:
  • SMB Rep: $60K base + $40K commission (OTE $100K)
  • Enterprise Rep: $80K base + $70K commission (OTE $150K)
  • SDR: $45K base + $20K commission (OTE $65K)
```

---

## Lead Qualification Framework

### BANT Methodology (Basic Qualification)

```
╔════════════════════════════════════════════════════════════╗
║  BANT QUALIFICATION CRITERIA                             ║
╚════════════════════════════════════════════════════════════╝

B = BUDGET
  Question: "What's your budget for logistics software?"
  Qualification:
    • $150+/month: Qualified ✅
    • $100-150/month: Maybe (if good fit)
    • <$100/month: Disqualified (point to self-serve trial)

A = AUTHORITY
  Question: "Who makes the buying decision?"
  Qualification:
    • Decision maker (C-level, VP, Manager): Qualified ✅
    • Influencer (will recommend): Maybe (loop in decision maker)
    • User (no authority): Disqualified (or schedule call with decision maker)

N = NEED
  Question: "What problem are you trying to solve?"
  Qualification:
    • Clear pain point: Qualified ✅
    • Vague interest: Maybe (nurture, educate)
    • No clear need: Disqualified (nurture campaign)

T = TIMELINE
  Question: "When do you need a solution in place?"
  Qualification:
    • 0-30 days: Hot (fast-track) 🔥
    • 30-90 days: Warm (normal cadence) ⏰
    • 90+ days: Cold (nurture, follow up later) ❄️

SCORING:
  • 4/4 BANT: Sales-qualified lead (SQL) → Book demo
  • 3/4 BANT: Nurture → Qualify before demo
  • 2/4 BANT: Marketing-qualified lead (MQL) → Nurture campaign
  • 0-1/4 BANT: Unqualified → Exclude from sales outreach
```

### MEDDIC Methodology (Enterprise Deals)

```
╔════════════════════════════════════════════════════════════╗
║  MEDDIC QUALIFICATION (Enterprise Only)                  ║
╚════════════════════════════════════════════════════════════╝

M = METRICS
  • What's the quantifiable value? (ROI, cost savings, time savings)
  • Example: "We'll save you 40% on freight costs = $50K/year"

E = ECONOMIC BUYER
  • Who controls the budget? (CFO, CEO, VP)
  • Have we connected with them?

D = DECISION CRITERIA
  • What factors will they use to decide? (price, features, support)
  • How do we rank on those criteria?

D = DECISION PROCESS
  • What's the approval process? (demo → trial → committee → legal)
  • Timeline? Stakeholders involved?

I = IDENTIFY PAIN
  • What's the core business problem? (manual processes, errors, slow)
  • How painful is it? (urgent vs nice-to-have)

C = CHAMPION
  • Who's advocating for us internally?
  • Do they have influence? Will they sell for us?

SCORING:
  • 6/6 MEDDIC: High-probability deal → Fast-track
  • 4-5/6 MEDDIC: Work to improve (fill gaps)
  • <4/6 MEDDIC: Risky deal → Qualify further or disqualify
```

---

## Sales Process (5-Stage Pipeline)

### Stage 1: Lead (Unqualified)

```
DEFINITION: New lead from marketing (trial signup, content download, inbound)

ACTIONS:
  • SDR reviews lead (within 1 hour)
  • SDR reaches out (email or call)
  • SDR qualifies using BANT

OUTCOME:
  • Qualified → Move to Stage 2 (SQL)
  • Not qualified → Nurture campaign or disqualify

EXIT CRITERIA:
  • BANT score ≥3/4
  • Lead agrees to demo call

AVERAGE TIME: 1-2 days
```

### Stage 2: Qualified (SQL - Sales-Qualified Lead)

```
DEFINITION: Lead passed BANT qualification, demo scheduled

ACTIONS:
  • Sales rep reviews lead info (CRM notes, trial activity)
  • Sales rep sends pre-demo email (calendar invite, agenda, prep questions)
  • Sales rep prepares demo (custom demo based on use case)

OUTCOME:
  • Demo completed → Move to Stage 3

EXIT CRITERIA:
  • Demo scheduled and confirmed
  • Prospect shows up for demo

AVERAGE TIME: 2-3 days
```

### Stage 3: Demo (Discovery & Presentation)

```
DEFINITION: Demo call completed, assessing fit

DEMO STRUCTURE (30-45 minutes):
  1. Intro & Agenda (5 min)
     • Build rapport
     • Set expectations

  2. Discovery Questions (10 min)
     • "What's your current process?"
     • "What's not working?"
     • "What's the impact on your business?"
     • Identify pain points

  3. Demo (20 min)
     • Show 3-5 key features (based on their needs)
     • Focus on solving their pain points
     • Live demo (not slides)
     • Encourage questions

  4. Next Steps (5 min)
     • Recap value
     • Discuss pricing
     • Propose trial or close
     • Book follow-up

ACTIONS AFTER DEMO:
  • Send follow-up email (same day)
  • Share demo recording (optional)
  • Answer objections
  • Send proposal/quote (if ready)

OUTCOME:
  • Interested → Move to Stage 4 (Proposal)
  • Not interested → Disqualify (note reason)
  • Need more time → Follow up (schedule next call)

EXIT CRITERIA:
  • Prospect requests proposal/quote
  • Or prospect says "not interested" (closed-lost)

AVERAGE TIME: 3-5 days (from demo to decision)
```

### Stage 4: Proposal (Negotiation)

```
DEFINITION: Proposal sent, negotiating terms

ACTIONS:
  • Send proposal (pricing, contract terms)
  • Follow up (2 days after proposal)
  • Address objections (price, features, timeline)
  • Negotiate if needed (discounts, contract length)
  • Loop in decision makers (if not already involved)

OBJECTION HANDLING:
  • "Too expensive" → ROI calculator, payment plans, discount
  • "Missing feature X" → Roadmap, workarounds, custom development
  • "Need approval from [boss]" → Offer to join call, send exec summary
  • "Still evaluating competitors" → Comparison page, unique value props

OUTCOME:
  • Agreement reached → Move to Stage 5 (Closed-Won)
  • Can't agree → Closed-Lost or nurture

EXIT CRITERIA:
  • Contract signed
  • Or "no" decision (closed-lost)

AVERAGE TIME: 3-5 days
```

### Stage 5: Closed-Won (Customer)

```
DEFINITION: Contract signed, payment received

ACTIONS:
  • Celebrate! (Slack #wins channel, internal recognition)
  • Hand off to Customer Success (CS)
  • Onboarding kickoff (within 24 hours)
  • Update CRM (closed-won, ARR, close date)
  • Request testimonial/case study (after 30 days)

AVERAGE SALES CYCLE: 10-14 days (lead → customer)

SUCCESS METRICS:
  • Win rate: 30-40% (of demos)
  • Sales cycle: <14 days
  • Average deal size: $1,800 ARR
```

---

## Sales Playbook (Scripts & Templates)

### Cold Outreach Email (SDR)

```
Subject: Quick question about logistics at [Company]

Hi [First Name],

I noticed [Company] is in [industry] and likely ships [product].
Most companies in your space struggle with [common pain point].

We help [similar companies] reduce freight costs by 40% with
automated shipment tracking and AI-powered route optimization.

Would a 15-minute call next week make sense to explore if we
could help [Company] as well?

Best,
[SDR Name]
P.S. Here's a quick case study: [link]
```

### Discovery Questions (Demo Call)

```
CURRENT STATE:
  • "Walk me through your current shipping process."
  • "How many shipments do you handle per month?"
  • "What tools are you using today?"
  • "What's working well? What's not?"

PAIN POINTS:
  • "What's your biggest challenge with logistics?"
  • "How much time does your team spend on manual tasks?"
  • "Have you lost shipments or had delivery issues?"
  • "How does this impact your business? (cost, customer satisfaction)"

DECISION PROCESS:
  • "Who else is involved in this decision?"
  • "What's your timeline for making a decision?"
  • "What's your budget for logistics software?"
  • "What criteria will you use to decide?"

COMPETITION:
  • "Are you evaluating other solutions?"
  • "What do you like about [competitor]?"
  • "What concerns do you have?"
```

### Post-Demo Follow-Up Email

```
Subject: Thanks for the demo, [First Name]!

Hi [First Name],

Great chatting with you today! Here's a quick recap:

YOUR GOALS:
  • [Pain point 1]: Reduce manual data entry
  • [Pain point 2]: Improve shipment visibility
  • [Pain point 3]: Cut freight costs by 20%

HOW WE CAN HELP:
  • Real-time tracking (no more "where's my shipment?" calls)
  • AI route optimization (save 30-40% on freight costs)
  • Automated workflows (save 10 hours/week)

NEXT STEPS:
  • I've attached a proposal with pricing
  • Let's schedule a follow-up call on [date]
  • Questions? Reply here or call me: [phone]

Looking forward to working together!

Best,
[Sales Rep Name]

P.S. Here's the demo recording: [link]
```

### Proposal Template

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROPOSAL FOR [COMPANY NAME]
Infamous Freight Enterprises
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OVERVIEW:
  Based on our conversation, [Company] ships ~[X] packages/month
  and struggles with [pain points]. Our platform will help you:
    ✅ [Benefit 1]
    ✅ [Benefit 2]
    ✅ [Benefit 3]

PRICING:
  • Plan: Professional ($250/month per user)
  • Users: [X]
  • Monthly: $[X]
  • Annual (15% discount): $[X]

WHAT'S INCLUDED:
  • Unlimited shipments
  • Real-time tracking
  • AI route optimization
  • Multi-carrier support
  • 24/7 support
  • Dedicated Customer Success Manager

IMPLEMENTATION TIMELINE:
  • Week 1: Onboarding & setup
  • Week 2: Training & go-live
  • Week 3: Full production

ROI ESTIMATE:
  • Time saved: 10 hours/week = $520/month ($50/hour rate)
  • Freight savings: 30% = $[X]/month
  • Total savings: $[X]/month
  • Software cost: $[X]/month
  • Net benefit: $[X]/month (ROI: [X]x) ✅

NEXT STEPS:
  1. Review this proposal
  2. Questions? Let's schedule a call
  3. Sign contract: [DocuSign link]

Questions? Reply to this email or call me at [phone].

Looking forward to partnering with [Company]!

[Sales Rep Name]
[Title]
Infamous Freight Enterprises
```

---

## CRM Workflows (HubSpot)

### Deal Stages & Automation

```
╔════════════════════════════════════════════════════════════╗
║  CRM DEAL PIPELINE                                       ║
╚════════════════════════════════════════════════════════════╝

STAGE 1: LEAD (Unqualified)
  • Auto-created when lead enters CRM
  • SDR task: "Qualify lead (call within 1 hour)"
  • Automation: Send intro email template

STAGE 2: QUALIFIED (SQL)
  • Manual move (after BANT qualification)
  • Sales rep task: "Prepare for demo"
  • Automation: Send calendar booking link

STAGE 3: DEMO
  • Auto-moved after demo is scheduled
  • Sales rep task: "Complete demo"
  • Automation: Send demo reminder (1 day before)

STAGE 4: PROPOSAL
  • Manual move (after demo)
  • Sales rep task: "Send proposal"
  • Automation: Send proposal template
  • Reminder: Follow up in 2 days

STAGE 5: NEGOTIATION
  • Manual move (after proposal sent)
  • Sales rep task: "Follow up, address objections"
  • Automation: None (manual process)

STAGE 6: CLOSED-WON
  • Manual move (after contract signed)
  • Automation:
    - Create customer record
    - Notify CS team (Slack alert)
    - Send welcome email
    - Create onboarding tasks

STAGE 7: CLOSED-LOST
  • Manual move (if deal lost)
  • Required: Loss reason (price, features, timing, competitor)
  • Automation: Add to nurture campaign (follow up in 90 days)
```

### Lead Routing

```
INBOUND LEAD ROUTING (Round-Robin):
  • New lead enters CRM (trial signup, form fill)
  • SDR assigned automatically (rotate fairly)
  • Notification sent (email + Slack alert)
  • Task created: "Qualify lead within 1 hour"

DEMO ROUTING (Based on Deal Size):
  • Small (<$5K ARR): SMB Sales Rep
  • Medium ($5-20K ARR): SMB Sales Rep
  • Large (>$20K ARR): Enterprise Sales Rep (CEO)

TERRITORY ROUTING (If multi-region):
  • North America: Rep A
  • Europe: Rep B
  • Asia-Pacific: Rep C
```

---

## Sales Metrics Dashboard

```
╔════════════════════════════════════════════════════════════╗
║  SALES METRICS DASHBOARD - [MONTH] 2026                 ║
╚════════════════════════════════════════════════════════════╝

TOP-LINE METRICS:
  • ARR: $[X] (target: $5.4M by EOY)
  • MRR: $[X] (target: $450K by EOY)
  • New customers: [X]/month (target: 200)
  • Churn: [X]% (target: <3%)

PIPELINE METRICS:
  • Leads: [X] (target: 2,500/month by EOY)
  • SQLs: [X] (target: 500/month by EOY)
  • Demos: [X] (target: 200/month by EOY)
  • Proposals: [X]
  • Closed-won: [X] (target: 200/month by EOY)

CONVERSION RATES:
  • Lead → SQL: [X]% (target: 20%)
  • SQL → Demo: [X]% (target: 40%)
  • Demo → Proposal: [X]% (target: 70%)
  • Proposal → Closed-won: [X]% (target: 50%)
  • Overall (lead → customer): [X]% (target: 3%)

SALES CYCLE:
  • Average days: [X] (target: <14 days)
  • By stage:
    - Lead → SQL: [X] days (target: <2)
    - SQL → Demo: [X] days (target: <3)
    - Demo → Proposal: [X] days (target: <3)
    - Proposal → Closed: [X] days (target: <5)

DEAL METRICS:
  • Average deal size: $[X] ARR (target: $1,800)
  • Win rate: [X]% (target: 30-40%)
  • Loss reasons:
    - Price: [X]%
    - Features: [X]%
    - Timing: [X]%
    - Competitor: [X]%

TEAM PERFORMANCE:
  • Rep A: [X] deals, $[X] ARR
  • Rep B: [X] deals, $[X] ARR
  • Quota attainment: [X]% (target: 100%)

FORECASTING:
  • Pipeline value: $[X]
  • Weighted pipeline (by stage %): $[X]
  • Projected MRR (next month): $[X]
  • Projected ARR (EOY): $[X]
```

---

## Sales Enablement

### Sales Training (Week 1 for New Reps)

```
DAY 1: PRODUCT DEEP DIVE
  • Platform tour (hands-on)
  • Key features & benefits
  • Competitive advantages
  • Common use cases

DAY 2: SALES PROCESS
  • Pipeline stages
  • BANT/MEDDIC qualification
  • CRM workflows
  • Shadow a demo call

DAY 3: OBJECTION HANDLING
  • Common objections
  • Response scripts
  • Role-play practice
  • Competitive battlecards

DAY 4: DEMO PRACTICE
  • Demo structure
  • Discovery questions
  • Live demo practice (record & review)
  • Feedback session

DAY 5: ADMIN & TOOLS
  • CRM setup (HubSpot)
  • Email templates
  • Slack channels
  • First demo (with manager shadowing)
```

### Sales Collateral Library

```
CORE MATERIALS:
  • Sales deck (10 slides: problem, solution, features, ROI, pricing)
  • One-pager (PDF: key features, pricing, testimonials)
  • Demo video (5 min: quick product overview)
  • ROI calculator (Excel/Google Sheets)

COMPETITIVE MATERIALS:
  • Battlecards (vs FreightPro, LogisticsMaster, CargoCloud)
  • Comparison matrix (feature-by-feature)
  • Win/loss analysis (why we win/lose)

CASE STUDIES:
  • 3-5 customer stories (different industries)
  • Format: Challenge → Solution → Results
  • Video testimonials (if available)

INDUSTRY-SPECIFIC:
  • E-commerce logistics one-pager
  • Manufacturing supply chain one-pager
  • 3PL provider one-pager

TEMPLATES:
  • Email templates (cold outreach, follow-up, proposal)
  • Proposal template (Word/Google Docs)
  • Contract template (DocuSign)
```

---

## Quarterly OKRs (Q1 2026)

### Objective: Scale Sales from Founder-Led to Team-Driven

**Key Results**:
```
KR1: Hire and onboard 1 additional sales rep
  • Current: 2 people (CEO + 1 rep)
  • Target: 3 people by end of Q1
  • Status: ⏳ In Progress

KR2: Close 150 new customers in Q1
  • Current: 12/month × 3 = 36 customers
  • Target: 50/month × 3 = 150 customers
  • Status: ⏳ In Progress

KR3: Improve demo → closed-won conversion from 30% → 35%
  • Current: 30%
  • Target: 35%
  • Status: ⏳ In Progress (better sales process, objection handling)

KR4: Reduce sales cycle from 14 → 10 days
  • Current: 14 days
  • Target: 10 days
  • Status: ⏳ In Progress (faster follow-ups, streamlined process)
```

---

## Success Metrics

**Sales Operations Targets (EOY 2026)**:
- ✅ ARR: $5.4M (3x from $1.8M)
- ✅ New customers: 200/month (vs 12 baseline)
- ✅ Sales team: 6 people (vs 2)
- ✅ Win rate: 35-40% (vs 30%)
- ✅ Sales cycle: <10 days (vs 14)
- ✅ Average deal size: $1,800 ARR (maintain)
- ✅ Quota attainment: 100%+

**Long-Term Vision (2027+)**:
- ✅ Predictable, repeatable sales process
- ✅ Scalable team (10+ reps)
- ✅ Enterprise deals ($20K+ ARR)
- ✅ Multi-channel (inbound, outbound, partnerships)

---

**Status**: ✅ SALES OPERATIONS & PLAYBOOK SYSTEM READY

Comprehensive sales process with BANT/MEDDIC qualification, 5-stage pipeline,
CRM workflows, and sales enablement to scale ARR from $1.8M to $5.4M in 2026.

EOF

echo "✅ Sales Operations & Playbook System - CREATED"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💼 SALES OPERATIONS & PLAYBOOK SYSTEM COMPLETE"
echo ""
echo "Current State: \$1.8M ARR, 2 people, 12 customers/month"
echo "Target: \$5.4M ARR (3x), 6 people, 200 customers/month"
echo ""
echo "Lead Qualification:"
echo "  • BANT for SMB deals (Budget, Authority, Need, Timeline)"
echo "  • MEDDIC for Enterprise ($20K+ ARR)"
echo "  • Lead scoring: 3-4/4 BANT = SQL"
echo ""
echo "Sales Process (5 Stages):"
echo "  1. Lead (Unqualified) - SDR qualifies within 1 hour"
echo "  2. Qualified (SQL) - Demo scheduled"
echo "  3. Demo (Discovery + Presentation) - 30-45 min call"
echo "  4. Proposal (Negotiation) - Pricing, objection handling"
echo "  5. Closed-Won (Customer) - Hand off to CS"
echo ""
echo "Sales Cycle: 10-14 days (target: <10 days)"
echo ""
echo "Team Expansion:"
echo "  • Q2: +1 Sales Rep (total: 3)"
echo "  • Q3: +1 Sales Rep + 1 SDR (total: 5)"
echo "  • Q4: +1 Sales Rep (total: 6)"
echo ""
echo "Sales Playbook:"
echo "  • Discovery questions (current state, pain points, decision)"
echo "  • Demo structure (intro, discovery, demo, next steps)"
echo "  • Objection handling (price, features, timing, competitors)"
echo "  • Email templates (cold outreach, follow-up, proposal)"
echo ""
echo "CRM Workflows:"
echo "  • 7-stage pipeline (Lead → Closed-Won/Lost)"
echo "  • Automated task creation & reminders"
echo "  • Round-robin lead routing (fair distribution)"
echo "  • Deal forecasting & pipeline reporting"
echo ""
echo "Success Metrics:"
echo "  • Win rate: 35-40% (vs 30%)"
echo "  • Sales cycle: <10 days (vs 14)"
echo "  • Average deal: \$1,800 ARR"
echo "  • Quota attainment: 100%+"
echo ""
echo "✅ RECOMMENDATION 2: SALES OPERATIONS & PLAYBOOK 100% COMPLETE"
echo ""
