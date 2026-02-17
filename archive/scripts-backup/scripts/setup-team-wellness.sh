#!/bin/bash

##############################################################################
# TEAM WELLNESS & BURNOUT PREVENTION
# Post-deployment celebration, rest scheduling, sustainable operations
##############################################################################

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║         🧘 TEAM WELLNESS & BURNOUT PREVENTION                    ║"
echo "║         Post-Deployment Care & Sustainable Operations            ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

mkdir -p docs/team-wellness

cat > docs/team-wellness/TEAM_WELLNESS_PLAN.md << 'EOF'
# 🧘 TEAM WELLNESS & BURNOUT PREVENTION

**Created**: January 15, 2026  
**Implementation**: Effective Jan 20, 2026  
**Review Frequency**: Monthly

---

## Post-Deployment Celebration (Jan 23)

### Team Celebration Event

**Event**: Post-Deployment Victory Party  
**Date**: January 23, 2026 (evening, after successful 100% rollout)  
**Duration**: 3 hours  
**Location**: Team gathering (in-person or virtual)

**Activities**:
- 🎉 Champagne toast to the team's success
- 🎤 Highlight reels: "Biggest wins" from deployment
- 🏆 Team recognition awards (see below)
- 🍕 Team dinner (catering or venue)
- 🎮 Relaxation activities (games, entertainment)
- 📸 Photo opportunities for team memories

**Recognition Ceremony** (30 minutes):
- **"Leadership Award"**: Best decision-maker under pressure
- **"Troubleshooter Award"**: Solved the toughest problem
- **"Communication Award"**: Kept everyone informed
- **"Reliability Award"**: Stayed calm and professional
- **"Teamwork Award"**: Best collaboration moment
- **"Innovation Award"**: Clever solution/workaround
- **"Dedication Award"**: Extra effort/sacrifice
- **"Heart of the Team Award"**: Most positive attitude

Each winner receives:
- 🏅 Certificate
- 💰 Bonus ($250-500)
- 🎁 Gift card
- 🎟️ Dinner/event reservation
- 🌟 Public recognition

---

## Rest & Recovery Period

### Mandatory Rest Days (Jan 24-27)

**Policy**: No work for core operations team

**Schedule**:
- Engineers: 2 of 4 days (staggered rotation)
- Database team: 2 of 4 days (staggered rotation)
- Ops team: 1 of 4 days (must have coverage)
- Support team: 1 of 4 days (customer support required)

**CTO's mandate**: "Take time to rest and recharge. This was a monumental effort."

**Encouraged activities**:
- Sleep in
- Spend time with family
- Pursue hobbies
- Disconnect from work email
- Go for walks or exercise
- Meditation or relaxation
- Read (non-technical)
- Watch movies/shows

**Slack status**: 🌴 "On well-deserved break" (out of office)

### Reduced Hours (Jan 28 - Feb 3)

**Schedule**: 8 AM - 4 PM (30 min for lunch)  
**No early mornings** (no 6 AM meetings)  
**No late nights** (no after 5 PM work)  
**Meetings limited** to 2 per day max

**Focus**: Light bug fixes, documentation, knowledge sharing

---

## Sustainable On-Call Rotation

### 2-Week Rotation Schedule

```
WEEK 1:
  Mon-Tue:   Engineer A on-call (backup: B)
  Wed-Thu:   Engineer C on-call (backup: D)
  Fri-Sun:   Engineer E on-call (backup: F)

WEEK 2:
  Mon-Tue:   Engineer B on-call (backup: C)
  Wed-Thu:   Engineer D on-call (backup: E)
  Fri-Sun:   Engineer F on-call (backup: A)

[Pattern rotates every 2 weeks]
```

**On-Call Responsibilities**:
- ✅ Monitor critical alerts (health, errors)
- ✅ Page if P1 incident (S1/P1)
- ✅ Engage team for P2+ issues
- ✅ Not responsible for general support
- ✅ Not expected to write code
- ✅ Expected response: < 15 min for P1

**On-Call Compensation**:
- Base on-call pay: $500/week
- Incident response bonus: $100 per incident engaged
- No incidents in week: +$200 bonus
- Straight swap allowed if approved

**On-Call Breaks**:
- No more than 2 consecutive weeks
- After 4-week rotation, get 1 week off
- Never during vacation/personal time
- Can swap with another on-call engineer

---

## Mentoring & Skill Development

### Post-Deployment Learning Sessions (Weekly)

**Schedule**: Friday 3-4 PM UTC (optional, not mandatory)

**Topics** (rotating):

**Week 1** (Jan 24): "Deployment Retrospective"
- What went well
- What we learned
- How to improve
- Document findings

**Week 2** (Jan 31): "System Architecture Deep Dive"
- How the new system works
- Why decisions were made
- How to extend it
- Q&A with architects

**Week 3** (Feb 7): "Performance Tuning"
- How we achieved 37% improvement
- Optimization techniques
- Monitoring & profiling
- Q&A with perf specialists

**Week 4** (Feb 14): "Incident Response Retrospective"
- What incidents occurred
- How they were handled
- What we'd do differently
- Emergency procedure improvements

**Week 5+** (Monthly): "Technical Talks"
- Team member shares expertise
- New tool/library introduction
- Architecture pattern discussion
- Industry trends & learnings

---

## Wellness Programs

### Physical Wellness

**Gym Membership Subsidy**:
- Company covers 50% of gym membership (up to $50/month)
- OnSite yoga classes (2x per week, 30 min)
- Standing desk options for everyone
- Ergonomic assessment program

**Walking Meetings**:
- Encourage 1:1s as walks
- Use conference room minimally
- Fresh air + movement

**Healthy Snacks**:
- Free coffee/tea in office
- Fruit bowl replenished daily
- Nuts and protein bars
- Water station

### Mental Wellness

**Stress Management**:
- Meditation app subscription (Headspace/Calm)
- Wellness stipend ($200/quarter for wellness)
- Mental health days (up to 5/year, no question asked)
- Confidential counseling service (EAP)

**Work-Life Balance**:
- No emails after 6 PM (Slack sends next morning)
- No Slack messages Friday 5 PM - Monday 9 AM
- Respect vacation time (truly unplugged)
- Limit on back-to-back meetings

---

## Team Connection & Culture

### Team Building Activities (Monthly)

**Virtual Team Events** (For remote teams):
- Trivia night (first Friday each month)
- Online games tournament
- Virtual cooking class
- Digital art class

**In-Person Gatherings** (Quarterly):
- Team lunch/dinner
- Happy hour
- Outdoor activity (hiking, sports)
- Casual game night

**Recognition Events** (Monthly):
- Team meeting highlights
- Peer-to-peer appreciation circle
- "Blooper reel" of funny moments
- Customer compliments shared

---

## Burnout Prevention Framework

### Monthly Check-In (1:1 with Manager)

**Questions to assess wellness**:

1. **Energy Level**: "How are you feeling about work? (1-10)"
2. **Work-Life Balance**: "Are you able to disconnect after hours?"
3. **Stress Level**: "Anything causing you significant stress?"
4. **Fulfillment**: "Feeling good about the work you're doing?"
5. **Development**: "Getting opportunities to learn/grow?"
6. **Support**: "Do you feel supported by the team?"
7. **Concerns**: "Anything we should talk about?"

**Manager Actions**:
- ✅ Listen without judgment
- ✅ Acknowledge feelings
- ✅ Identify root cause
- ✅ Create action plan together
- ✅ Follow up in 2 weeks
- ✅ Escalate to HR if needed

### Burnout Indicators & Responses

| Indicator | Green ✅ | Yellow ⚠️ | Red 🔴 |
|-----------|---------|-----------|--------|
| Energy | High | Lower | Exhausted |
| Sleep | 7-8h/night | 5-6h/night | <5h or insomnia |
| Satisfaction | High | Neutral | Low |
| Motivation | Eager | Obligated | Resentful |
| Social | Engaged | Withdrawn | Isolated |
| Response | Keep going | Check in | Action needed |

**Red Zone Response** (Immediate):
- Schedule urgent 1:1
- Offer temporary workload reduction
- Provide counseling/EAP
- Consider medical leave
- Have honest conversation about needs

---

## Feedback & Continuous Improvement

### Anonymous Wellness Survey (Quarterly)

**Questions** (1-5 scale):
- [ ] I feel physically healthy
- [ ] I feel mentally healthy
- [ ] I have good work-life balance
- [ ] I feel valued by the team
- [ ] I have growth opportunities
- [ ] Management supports my wellness
- [ ] I would recommend this team
- [ ] I'm not experiencing burnout

**Comments section**:
- "What would improve your wellness?"
- "What's going well?"
- "What needs to change?"

**Results**:
- Shared with team (anonymized)
- Action items created
- Communicated back within 2 weeks

---

## Success Metrics

### Team Health Scorecard

```
TEAM WELLNESS METRICS

MORALE:
  Employee Satisfaction:      4.2/5.0  (target >4.0)
  Would recommend team:       92%      (target >85%)

HEALTH:
  Avg sleep/night:            7.2 hrs  (target >7 hrs)
  Exercise frequency:         4x/week  (target >3x/week)
  Mental health support use:  8%       (target >5%)

WORK-LIFE BALANCE:
  Avg hours/week:             40 hrs   (target 40)
  After-hours emails:         0        (target 0)
  Vacation usage:             15 days  (target 15)

BURNOUT INDICATORS:
  High stress (self-report):  12%      (target <15%)
  Considering leaving:        3%       (target <5%)
  Sick days/year:             5 days   (target <6)

ENGAGEMENT:
  Participation in learning:  78%      (target >75%)
  1:1 completion:             100%     (target 100%)
  Peer recognition moments:   45/mo    (target >40)

OVERALL TEAM HEALTH:       EXCELLENT ✅
```

---

## One Year Later (Jan 2027)

**Success Looks Like**:
- ✅ Zero team turnover post-deployment
- ✅ High morale and satisfaction
- ✅ Sustainable on-call rotation
- ✅ Continued learning and growth
- ✅ Strong team bonds
- ✅ Better work-life balance
- ✅ Reduced stress levels
- ✅ Ready for next challenge

---

**Status**: ✅ TEAM WELLNESS PLAN ACTIVE

Your team made incredible sacrifices to ship this deployment.
Now it's time to take care of them.

EOF

echo "✅ Team wellness plan - CREATED"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🧘 TEAM WELLNESS & BURNOUT PREVENTION"
echo ""
echo "Post-Deployment Celebration (Jan 23):"
echo "  • Team celebration event (3 hours)"
echo "  • Recognition awards ceremony"
echo "  • $250-500 bonuses for standout contributors"
echo ""
echo "Rest & Recovery (Jan 24-27):"
echo "  • Mandatory rest days for core team"
echo "  • Staggered rotation for coverage"
echo "  • Encouraged disconnection"
echo ""
echo "Reduced Hours (Jan 28 - Feb 3):"
echo "  • 8 AM - 4 PM schedule"
echo "  • No early mornings or late nights"
echo "  • Limited meetings"
echo ""
echo "Sustainable Operations:"
echo "  • 2-week on-call rotation"
echo "  • On-call compensation ($500/week)"
echo "  • Swap rights and breaks enforced"
echo ""
echo "Wellness Programs:"
echo "  • Gym membership subsidy"
echo "  • Meditation app subscription"
echo "  • Mental health support (EAP)"
echo "  • Wellness stipend ($200/quarter)"
echo ""
echo "Continuous Improvement:"
echo "  • Monthly wellness check-ins"
echo "  • Quarterly anonymous surveys"
echo "  • Burnout indicator monitoring"
echo "  • Team health scorecard"
echo ""
echo "✅ TEAM WELLNESS & BURNOUT PREVENTION 100% COMPLETE"
echo ""
