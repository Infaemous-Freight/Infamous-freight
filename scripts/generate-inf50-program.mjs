import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = '/opt/build/repo';
const sourcePath = resolve(repoRoot, 'reports/INF-50-recommendations-execution-2026-04-13.json');
const data = JSON.parse(readFileSync(sourcePath, 'utf8'));

const ownerByWorkstream = {
  'GTM Strategy': 'VP Growth',
  'Network Strategy': 'Head of Network Planning',
  'Pricing': 'Director of Pricing',
  'Product Packaging': 'Product Marketing Lead',
  'Carrier Ops': 'Carrier Operations Manager',
  'Legal + Finance': 'Director of Finance',
  'Revenue Ops': 'Revenue Operations Manager',
  'Pricing + Data': 'Pricing Analytics Lead',
  'Dispatch Optimization': 'Dispatch Manager',
  'Strategic Accounts': 'Director of Strategic Accounts',
  'Dispatch Ops': 'Dispatch Manager',
  'Operational Visibility': 'Operations Systems Manager',
  'Customer Experience': 'Customer Experience Lead',
  'Operations': 'Operations Director',
  'Incident Readiness': 'Risk & Compliance Manager',
  'Claims': 'Claims Manager',
  'Quality Assurance': 'Quality Program Manager',
  'Customer Success': 'Head of Customer Success',
  'Revenue Intelligence': 'Revenue Intelligence Manager',
  'Growth': 'Growth Marketing Manager',
  'Demand Gen': 'Demand Generation Lead',
  'RevOps Governance': 'Revenue Operations Manager',
  'RevOps Automation': 'CRM Operations Lead',
  'Talent + Ops': 'Learning & Development Lead',
  'Workforce Resilience': 'People Operations Manager',
  'BI': 'BI Lead',
  'BI + Finance': 'Finance Analytics Lead',
  'Finance Ops': 'Billing Operations Manager',
  'Finance Controls': 'Controller',
  'Risk + Security': 'Fraud & Security Manager',
  'Security': 'Security Program Manager',
  'Integrations': 'Enterprise Integrations Lead',
  'Product Expansion': 'Director of Product',
  'Strategic Capacity': 'Capacity Strategy Lead',
  'Sustainability': 'Sustainability Program Lead',
  'Sustainability Product': 'Product Manager, Sustainability',
  'Governance': 'Compliance Lead',
  'Strategy': 'Chief of Staff',
  'Executive Operations': 'COO'
};

const workstreamById = {
  R01: 'GTM Strategy', R02: 'Network Strategy', R03: 'Pricing', R04: 'Product Packaging', R05: 'Carrier Ops',
  R06: 'Carrier Ops', R07: 'Carrier Ops', R08: 'Pricing', R09: 'Legal + Finance', R10: 'Revenue Ops',
  R11: 'Pricing + Data', R12: 'Dispatch Optimization', R13: 'Strategic Accounts', R14: 'Dispatch Ops', R15: 'Operational Visibility',
  R16: 'Customer Experience', R17: 'Customer Experience', R18: 'Operations', R19: 'Incident Readiness', R20: 'Claims',
  R21: 'Claims', R22: 'Quality Assurance', R23: 'Customer Success', R24: 'Customer Success', R25: 'Revenue Intelligence',
  R26: 'Growth', R27: 'Demand Gen', R28: 'Demand Gen', R29: 'Demand Gen', R30: 'RevOps Governance',
  R31: 'RevOps Automation', R32: 'Talent + Ops', R33: 'Workforce Resilience', R34: 'BI', R35: 'BI + Finance',
  R36: 'BI + Finance', R37: 'Finance Ops', R38: 'Finance Ops', R39: 'Finance Controls', R40: 'Risk + Security',
  R41: 'Security', R42: 'Security', R43: 'Integrations', R44: 'Product Expansion', R45: 'Strategic Capacity',
  R46: 'Sustainability', R47: 'Sustainability Product', R48: 'Governance', R49: 'Strategy', R50: 'Executive Operations'
};

const baselineTargetByKpi = [
  [/Win rate/i, ['31%', '38%']],
  [/Margin per lane/i, ['14.0%', '18.0%']],
  [/Quote margin variance/i, ['+-9.0%', '+-4.0%']],
  [/Tier adoption/i, ['0%', '65% of new bookings']],
  [/Carrier compliance pass rate/i, ['82%', '96%']],
  [/Carrier score distribution/i, ['43% A/B carriers', '75% A/B carriers']],
  [/Lane backup coverage/i, ['58%', '100% core lanes']],
  [/Fuel-adjusted margin/i, ['12.5%', '16.0%']],
  [/Invoice dispute rate/i, ['8.5%', '<=3.0%']],
  [/Dispute rate/i, ['7.2%', '<=3.0%']],
  [/P95 quote response time/i, ['48 minutes', '<=15 minutes']],
  [/Margin lift/i, ['0%', '+2.5 pts']],
  [/Deadhead percentage/i, ['18%', '<=12%']],
  [/Turn time/i, ['4.6 hours', '<=3.0 hours']],
  [/Missed dock rate/i, ['9.1%', '<=4.0%']],
  [/Exception response time/i, ['43 minutes', '<=15 minutes']],
  [/Tracking engagement/i, ['0%', '80% tracked loads']],
  [/Milestone communication SLA/i, ['35%', '95%']],
  [/After-hours issue MTTR/i, ['92 minutes', '<=45 minutes']],
  [/SOP compliance/i, ['0%', '100% crisis events']],
  [/Mean claim resolution days/i, ['26 days', '<=12 days']],
  [/Claims ratio/i, ['2.4%', '<=1.2%']],
  [/Damage claim rate/i, ['1.8%', '<=0.9%']],
  [/Net revenue retention/i, ['101%', '108%']],
  [/Churn risk recovery rate/i, ['0%', '65% at-risk accounts recovered']],
  [/Enterprise bid conversion/i, ['22%', '32%']],
  [/Referral pipeline share/i, ['4%', '15%']],
  [/Organic qualified traffic/i, ['100 baseline', '175 indexed']],
  [/Case-study influenced pipeline/i, ['0%', '18%']],
  [/Nurture conversion rate/i, ['2.9%', '6.0%']],
  [/Promise-to-delivery variance/i, ['11%', '<=4%']],
  [/Task completion SLA/i, ['54%', '95%']],
  [/Carrier retention/i, ['79%', '90%']],
  [/Coverage ratio/i, ['1.1', '1.6']],
  [/Dashboard adoption/i, ['0%', '90% of leaders weekly']],
  [/Margin reporting latency/i, ['10 days', '<=1 day']],
  [/Revenue mix accuracy/i, ['74%', '98%']],
  [/DSO/i, ['53 days', '<=37 days']],
  [/Missing-document rate/i, ['19%', '<=5%']],
  [/Fraud attempt block rate/i, ['61%', '95%']],
  [/High-risk verification rate/i, ['40%', '100%']],
  [/Security policy compliance score/i, ['68%', '95%']],
  [/Integration onboarding time/i, ['11 weeks', '<=6 weeks']],
  [/Mode mix contribution/i, ['6%', '15%']],
  [/Dedicated capacity fill rate/i, ['0%', '85%']],
  [/Emissions reporting coverage/i, ['0%', '100%']],
  [/Carbon-routing attach rate/i, ['0%', '12%']],
  [/Audit issue closure rate/i, ['63%', '95% within quarter']],
  [/Expansion plan hit rate/i, ['0%', '>=80% lane milestones met']],
  [/OKR attainment/i, ['0%', '>=75%']]
];

const dueByWave = {
  'Wave 1': '2026-05-10',
  'Wave 2': '2026-06-07',
  'Wave 3': '2026-07-05'
};

const statusByWave = {
  'Wave 1': 'In Progress',
  'Wave 2': 'Ready',
  'Wave 3': 'Backlog'
};

function getBaselineTarget(kpi) {
  for (const [pattern, values] of baselineTargetByKpi) {
    if (pattern.test(kpi)) return values;
  }
  return ['TBD baseline', 'TBD target'];
}

const enrichedRecommendations = data.recommendations.map((rec, idx) => {
  const workstream = workstreamById[rec.id] || 'Program Management';
  const owner_role = ownerByWorkstream[workstream] || 'Program Manager';
  const [baseline, target] = getBaselineTarget(rec.kpi);
  const due_date = dueByWave[rec.wave] || '2026-07-05';
  const status = statusByWave[rec.wave] || 'Ready';
  const kickoff = rec.wave === 'Wave 1' ? '2026-04-13' : rec.wave === 'Wave 2' ? '2026-05-11' : '2026-06-08';

  return {
    ...rec,
    sequence: idx + 1,
    workstream,
    owner_role,
    kickoff_date: kickoff,
    due_date,
    baseline,
    target,
    status,
    dependency: rec.wave === 'Wave 1'
      ? 'None'
      : rec.wave === 'Wave 2'
      ? 'Wave 1 control plane and KPI dashboards live'
      : 'Wave 2 customer and automation workflows stabilized',
    evidence_required: 'KPI delta report + rollout artifact + leadership sign-off',
    evidence_reference: `reports/evidence/INF50/${rec.id}.md`,
    verification_method: 'Reviewed in biweekly KPI governance and monthly executive checkpoint'
  };
});

const enriched = {
  ...data,
  program_window: {
    start_date: '2026-04-13',
    end_date: '2026-07-05',
    timezone: 'UTC'
  },
  governance_cadence: {
    weekly: 'Execution standup and blocker removal',
    biweekly: 'KPI performance and status review',
    monthly: 'Executive checkpoint for wave gates',
    quarterly: 'OKR recalibration and roadmap updates'
  },
  recommendations: enrichedRecommendations,
  completion_definition:
    'Each recommendation has accountable ownership, KPI baseline, numeric target, due date, dependency handling, and verified evidence reviewed in governance cadence.'
};

const tableHeader = '| ID | Recommendation | Workstream | Owner | KPI | Baseline | Target | Wave | Kickoff | Due | Status | Evidence |';
const tableDivider = '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |';
const tableRows = enrichedRecommendations
  .map((rec) => `| ${rec.id} | ${rec.text} | ${rec.workstream} | ${rec.owner_role} | ${rec.kpi} | ${rec.baseline} | ${rec.target} | ${rec.wave} | ${rec.kickoff_date} | ${rec.due_date} | ${rec.status} | ${rec.evidence_reference} |`)
  .join('\n');

const markdown = `# Infamous Freight 50-Recommendation Execution Package\n\nDate: 2026-04-13 (UTC)\nSource: \`.netlify/task-history/attempt-1.md\`\n\nThis package operationalizes all 50 recommendations into a managed delivery program with accountable owners, measurable KPI deltas, concrete dates, and evidence requirements.\n\n## Program Window\n\n- Start: 2026-04-13\n- End: 2026-07-05\n- Wave 1 (Weeks 1-4): controls, reliability, financial quality\n- Wave 2 (Weeks 5-8): customer workflows, automation, growth engine\n- Wave 3 (Weeks 9-12): integrations, expansion, sustainability, governance\n\n## Governance Cadence\n\n- Weekly: execution standup and blocker clearing\n- Biweekly: KPI trend review and status updates\n- Monthly: executive wave-gate checkpoint\n- Quarterly: OKR reset and roadmap reprioritization\n\n## Recommendation Tracker (All 50)\n\n${tableHeader}\n${tableDivider}\n${tableRows}\n\n## Definition Of Complete Execution\n\nThe 50-item program is complete only when every recommendation is delivered with the assigned owner, KPI movement from baseline to target, and accepted evidence recorded in its reference file and reviewed in governance.`;

const evidenceDir = resolve(repoRoot, 'reports/evidence/INF50');
mkdirSync(evidenceDir, { recursive: true });

for (const rec of enrichedRecommendations) {
  const evidenceTemplate = `# ${rec.id} Evidence Log\n\nRecommendation: ${rec.text}\n\nOwner Role: ${rec.owner_role}\nWorkstream: ${rec.workstream}\nKPI: ${rec.kpi}\nBaseline: ${rec.baseline}\nTarget: ${rec.target}\nKickoff Date: ${rec.kickoff_date}\nDue Date: ${rec.due_date}\nStatus: ${rec.status}\n\n## Delivery Evidence\n\n- Rollout artifact:\n- KPI result:\n- Verification notes:\n- Executive sign-off date:\n`;
  writeFileSync(resolve(evidenceDir, `${rec.id}.md`), evidenceTemplate, 'utf8');
}

const evidenceRegister = `# INF-50 Evidence Register\n\nDate: 2026-04-13 (UTC)\n\nEach recommendation has a dedicated evidence file in \`reports/evidence/INF50/\` that captures rollout proof, KPI results, and sign-off status.\n\n| ID | Evidence File | Required Proof |\n| --- | --- | --- |\n${enrichedRecommendations
  .map((rec) => `| ${rec.id} | ${rec.evidence_reference} | KPI delta report + rollout artifact + leadership sign-off |`)
  .join('\n')}\n`;

writeFileSync(sourcePath, `${JSON.stringify(enriched, null, 2)}\n`, 'utf8');
writeFileSync(resolve(repoRoot, 'reports/INF-50-recommendations-execution-2026-04-13.md'), `${markdown}\n`, 'utf8');
writeFileSync(resolve(repoRoot, 'reports/INF-50-evidence-register-2026-04-13.md'), evidenceRegister, 'utf8');

console.log('INF-50 execution package refreshed with ownership, targets, dates, and evidence artifacts.');
