#!/bin/bash

##############################################################################
# CUSTOMER ONBOARDING & ACTIVATION SYSTEM
# First-time user experience, time-to-value, activation metrics
##############################################################################

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║         👥 CUSTOMER ONBOARDING & ACTIVATION                     ║"
echo "║         First-Time User Experience, Time-to-Value               ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

mkdir -p docs/customer-onboarding

cat > docs/customer-onboarding/ONBOARDING_SYSTEM.md << 'EOF'
# 👥 CUSTOMER ONBOARDING & ACTIVATION SYSTEM

**Purpose**: Achieve time-to-value in <7 days to improve retention  
**Goal**: 80%+ of new customers complete first successful workflow in 7 days  
**Timeline**: Q1-Q4 2026

---

## Onboarding Philosophy

**Problem**: 40% of free trials never activate (no action in first 7 days)
**Root Cause**: Confusing setup, unclear value proposition
**Solution**: Guided onboarding to first "aha moment" in <7 days

### Time-to-Value Timeline

```
DAY 1: Activation (First shipment tracked)
  ⏰ Goal: Get customer to create & track first shipment
  ⏱️ Expected: 2-3 hours from signup

DAY 2-3: Competency (Comfortable with core features)
  ⏰ Goal: Customer uses tracking, reporting features
  ⏱️ Expected: Hands-on experience with 3-4 features

DAY 4-7: Value Realization (See ROI/benefits)
  ⏰ Goal: Customer quantifies value (cost savings, time saved)
  ⏱️ Expected: 5-10 hours platform usage

SUCCESS: Activated customer converts 25%+ to paid
FAILURE: Inactive customer (no aha moment) churns at 70%
```

---

## Onboarding Flow (7-Day Journey)

### Day 1: Welcome & Setup

```
TOUCHPOINT 1: Welcome Email (Within 1 hour of signup)
  • Subject: "Welcome to Infamous Freight! 👋"
  • Content:
    - Celebrate signup
    - What to expect (5-day onboarding journey)
    - Quick start guide link
    - Success manager intro & contact info
  • CTA: "Log in and create your first shipment"

TOUCHPOINT 2: In-App Welcome Modal (On first login)
  • Headline: "Welcome! Let's get your first shipment tracked"
  • Subheading: "It takes 2 minutes. Here's how:"
  • CTA: "Create first shipment" or "Skip, show me around"
  • Video: 60-second product overview

ONBOARDING TASK: Create First Shipment
  • Guided workflow:
    Step 1: Enter shipment details (origin, destination, weight)
    Step 2: Select carrier (FedEx, UPS, etc.)
    Step 3: Track shipment real-time
    Step 4: View shipment map
  • Estimated time: 5 minutes
  • Success: "🎉 Shipment created! You're tracking your first delivery"
  • Incentive: "Now let's invite your team" (next step)
```

### Day 2-3: Competency Building

```
TOUCHPOINT 3: In-App Tutorials (Onboarding experience)
  • Lesson 1: "Dashboard Overview" (3 min video)
    - What each widget does
    - Key metrics
  
  • Lesson 2: "Creating Shipments" (interactive)
    - Step-by-step walkthrough
    - Copy-paste from spreadsheet demo
    - API integration primer
  
  • Lesson 3: "Reports & Analytics" (guided tour)
    - Cost analysis report
    - On-time delivery report
    - Custom report builder
  
  • Lesson 4: "Team Management" (quick setup)
    - Invite team members
    - Set permissions
    - Assign roles

TOUCHPOINT 4: Email Check-In (Day 2 - Tuesday)
  • Subject: "How's it going? Here are your next steps →"
  • Content:
    - Recap of Day 1 achievements
    - Feature highlight: "Reports & Analytics"
    - Video tutorial link
    - Quick question: "Do you track 10+ shipments/day?"
      (segment for small vs large companies)
  • CTA: "Explore Reports"

TOUCHPOINT 5: Slack/In-App Message (Day 3 - Wednesday)
  • Headline: "📊 Pro Tip: 40% of customers use Cost Analysis"
  • Content:
    - Cost analysis helps identify savings opportunities
    - Quick setup (2 minutes)
  • CTA: "Try Cost Analysis"
```

### Day 4-7: Value Realization

```
TOUCHPOINT 6: ROI Calculator Email (Day 4 - Thursday)
  • Subject: "How much could you save with Infamous Freight? 💰"
  • Content:
    - Embedded ROI calculator
    - Questions:
      "How many shipments/month?" (ask for metric)
      "What's your current cost/shipment?" (ask for metric)
    - Auto-calculated savings
      Example: "You could save $12,000/year on freight costs"
  • CTA: "See your personalized ROI"

TOUCHPOINT 7: Success Manager Check-In Call (Day 5 - Friday)
  • Goal: 15-min exploratory call
  • Agenda:
    1. How's onboarding going? (5 min)
    2. What's your biggest challenge? (5 min)
    3. Quick product tip based on their need (5 min)
  • Outcome:
    - Build relationship
    - Identify product need → upsell
    - Remove blockers
  • Note: Only if customer has been active (logged in 3+ days)

TOUCHPOINT 8: Expansion Offer Email (Day 7 - Monday, if active)
  • Subject: "You're using Infamous Freight great! Here's what's next"
  • Content:
    - Highlight 2-3 unused features
    - "Customers using [Feature] save 25% more"
    - Case study: Similar company using feature
  • CTA: "Schedule 30-min walkthrough"
  • Alternative: "Continue free trial" (if on trial)
```

---

## Activation Milestones & Metrics

### Critical Activation Events

```
MILESTONE 1: Day 1 - "First Shipment"
  • Metric: 80% of new signups create a shipment within 24 hours
  • Impact: High correlation with conversion (80% → paid vs 15% no shipment)
  • How to measure: Event tracking in GA4 / product analytics

MILESTONE 2: Day 3 - "Team Invite"
  • Metric: 60% invite at least 1 team member within 3 days
  • Impact: Higher retention (4.2x stickier with team adoption)
  • How to measure: "Invited team members" event

MILESTONE 3: Day 5 - "Report Generated"
  • Metric: 50% generate a custom report within 5 days
  • Impact: Shows they see value beyond basic tracking
  • How to measure: "Report generated" event

MILESTONE 4: Day 7 - "Cost Savings Calculated"
  • Metric: 40% use ROI calculator / view cost analysis within 7 days
  • Impact: Quantified value → higher conversion
  • How to measure: "ROI calculator used" event

ACTIVATION SUCCESS:
  • 4/4 milestones completed → 80% convert to paid
  • 3/4 milestones → 50% convert
  • 2/4 milestones → 25% convert
  • 0-1/4 milestones → 5% convert (high churn)
```

### Activation Dashboard

```
╔════════════════════════════════════════════════════════════╗
║  ACTIVATION METRICS DASHBOARD                            ║
╚════════════════════════════════════════════════════════════╝

OVERALL:
  • Trial signups (this week): [X]
  • Activated (4/4 milestones): [X]% (target: 60%+)
  • On-track to convert: [X]%

MILESTONE COMPLETION:
  • Day 1 shipment creation: [X]% (target: 80%)
  • Day 3 team invite: [X]% (target: 60%)
  • Day 5 report generation: [X]% (target: 50%)
  • Day 7 ROI calculation: [X]% (target: 40%)

COHORT ACTIVATION:
  • Week 1 signups: [X] customers, [X]% activated
  • Week 2 signups: [X] customers, [X]% activated
  • Trend: [↑ improving] or [↓ declining]

AT-RISK CUSTOMERS:
  • Haven't completed first shipment (24h): [X]
  • Haven't logged in (3 days): [X]
  • Action: Send re-engagement email, offer support call

CONVERSION METRICS:
  • Trial → Paid (activated): [X]% (target: 25%)
  • Trial → Paid (not activated): [X]% (target: <5%)
```

---

## Segmented Onboarding Paths

### Path A: Self-Service Users (90% of signups)

```
TARGET: Individual users evaluating product independently

TIMELINE:
  • Day 1: Automated welcome email, in-app walkthrough
  • Day 2: Auto-generated report suggestion
  • Day 3: Email check-in (no human touch)
  • Day 5: Self-serve resources (help center, webinar)
  • Day 7: Upgrade offer or churn

TOUCH STRATEGY:
  • Email: 3 high-value emails (welcome, feature highlight, upgrade offer)
  • In-app: Guided tutorials, tooltips, success badges
  • Minimal human touch (save reps for paying customers)

CONVERSION RATE:
  • Target: 15-20% of self-service trials → paid
```

### Path B: Team Users (8% of signups)

```
TARGET: Users bringing team members early (signals higher intent)

TIMELINE:
  • Day 1: Same as Path A
  • Day 2: Personalized email from Success Manager
  • Day 4: 15-min video call (team discussion)
  • Day 6: Custom implementation plan email
  • Day 10: Convert or extended trial

TOUCH STRATEGY:
  • Email: 4 emails (welcome, feature, success manager intro, proposal)
  • In-app: Advanced tutorials (API, team management)
  • 1 human call (success manager)

CONVERSION RATE:
  • Target: 35-40% of team trials → paid (higher intent)
```

### Path C: Enterprise Leads (2% of signups)

```
TARGET: Large companies (500+ employees) or high intent

TIMELINE:
  • Day 0: Direct call from sales rep (before trial signup if possible)
  • Day 1: Custom onboarding (map to their workflows)
  • Day 2-3: Custom implementation plan
  • Day 4: Executive demo
  • Day 7-14: Contract negotiation

TOUCH STRATEGY:
  • Personalized: Dedicated success manager
  • Executive alignment: CEO/CFO conversations
  • Custom integration: Data migration, API setup

CONVERSION RATE:
  • Target: 50-60% of enterprise trials → paid
```

---

## Onboarding Success Metrics (EOY 2026)

✅ Activation rate: 60%+ (4/4 milestones completed)
✅ Time-to-value: <7 days (median)
✅ Trial-to-paid conversion: 20-25% (overall)
✅ Customer NPS: 8.5+ (by 90 days)
✅ 30-day retention: 85%+ (activated customers)

---

**Status**: ✅ CUSTOMER ONBOARDING SYSTEM READY

Guided 7-day activation journey with milestones, segmented paths, and
metrics to achieve 60%+ activation rate and 20%+ trial-to-paid conversion.

EOF

echo "✅ Customer Onboarding System - CREATED"
echo ""
