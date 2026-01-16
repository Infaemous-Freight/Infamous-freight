/*
 * Copyright © 2026 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Genesis Sales AI Agent - Autonomous Sales Operations
 */

import { PrismaClient } from '@prisma/client';
import { aiSyntheticClient } from '../services/aiSyntheticClient';

const prisma = new PrismaClient();

/**
 * Genesis Sales AI - The autonomous sales agent that:
 * - Qualifies leads automatically
 * - Scores deal potential (0-100)
 * - Recommends next actions
 * - Schedules demos
 * - Generates personalized outreach
 * - Closes enterprise deals
 */

interface LeadQualificationResult {
  dealScore: number;
  confidence: number;
  recommendedPlan: 'STARTER' | 'GROWTH' | 'ENTERPRISE' | null;
  expectedMrr: number;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  nextAction: 'email' | 'call' | 'demo' | 'proposal' | 'nurture' | 'ignore';
  aiSummary: string;
  probability: number;
}

interface CompanyIntel {
  name: string;
  domain: string;
  estimatedSize: 'small' | 'medium' | 'large' | 'enterprise';
  industry: string;
  likelyFleetSize: number;
  estimatedMonthlyLoads: number;
  trustScore: number; // 0-100
}

/**
 * Analyze company domain and estimate potential
 */
async function analyzeCompany(domain: string, company: string): Promise<CompanyIntel> {
  // Extract clean domain
  const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  
  // Check for common logistics/freight indicators
  const isLogisticsCompany = /freight|logistics|transport|trucking|shipping|courier|delivery/.test(
    company.toLowerCase() + ' ' + cleanDomain
  );
  
  // Estimate company size based on domain TLD and patterns
  let estimatedSize: CompanyIntel['estimatedSize'] = 'small';
  let trustScore = 50;
  
  if (cleanDomain.includes('gmail.com') || cleanDomain.includes('yahoo.com')) {
    estimatedSize = 'small';
    trustScore = 30;
  } else if (cleanDomain.includes('hotmail.com') || cleanDomain.includes('outlook.com')) {
    estimatedSize = 'small';
    trustScore = 40;
  } else {
    // Custom domain = higher trust
    estimatedSize = 'medium';
    trustScore = 70;
    
    // Check for enterprise indicators
    if (company.toLowerCase().includes('inc') || 
        company.toLowerCase().includes('corp') ||
        company.toLowerCase().includes('llc')) {
      estimatedSize = 'large';
      trustScore = 80;
    }
  }
  
  // Estimate fleet size and monthly loads
  let likelyFleetSize = 0;
  let estimatedMonthlyLoads = 0;
  
  switch (estimatedSize) {
    case 'small':
      likelyFleetSize = 3;
      estimatedMonthlyLoads = 20;
      break;
    case 'medium':
      likelyFleetSize = 15;
      estimatedMonthlyLoads = 100;
      break;
    case 'large':
      likelyFleetSize = 50;
      estimatedMonthlyLoads = 500;
      break;
    case 'enterprise':
      likelyFleetSize = 200;
      estimatedMonthlyLoads = 2000;
      break;
  }
  
  if (isLogisticsCompany) {
    likelyFleetSize *= 2;
    estimatedMonthlyLoads *= 2;
    trustScore += 10;
  }
  
  return {
    name: company,
    domain: cleanDomain,
    estimatedSize,
    industry: isLogisticsCompany ? 'Logistics' : 'General',
    likelyFleetSize,
    estimatedMonthlyLoads,
    trustScore: Math.min(trustScore, 100),
  };
}

/**
 * Calculate deal score using AI + heuristics
 */
function calculateDealScore(intel: CompanyIntel, leadData: any): number {
  let score = 0;
  
  // Company size (40 points)
  switch (intel.estimatedSize) {
    case 'enterprise':
      score += 40;
      break;
    case 'large':
      score += 30;
      break;
    case 'medium':
      score += 20;
      break;
    case 'small':
      score += 10;
      break;
  }
  
  // Trust score (20 points)
  score += intel.trustScore * 0.2;
  
  // Estimated volume (20 points)
  if (intel.estimatedMonthlyLoads > 1000) score += 20;
  else if (intel.estimatedMonthlyLoads > 500) score += 15;
  else if (intel.estimatedMonthlyLoads > 100) score += 10;
  else if (intel.estimatedMonthlyLoads > 50) score += 5;
  
  // Lead source quality (10 points)
  if (leadData.source === 'REFERRAL') score += 10;
  else if (leadData.source?.startsWith('LANDING_PAGE')) score += 8;
  else if (leadData.source === 'ORGANIC_SEARCH') score += 6;
  else if (leadData.source === 'PAID_AD') score += 4;
  
  // Lead type (10 points)
  if (leadData.type === 'ENTERPRISE') score += 10;
  else if (leadData.type === 'SHIPPER') score += 7;
  else if (leadData.type === 'DRIVER') score += 3;
  
  return Math.min(Math.round(score), 100);
}

/**
 * Determine recommended plan based on intel
 */
function recommendPlan(intel: CompanyIntel): 'STARTER' | 'GROWTH' | 'ENTERPRISE' {
  if (intel.estimatedMonthlyLoads > 1000 || intel.estimatedSize === 'enterprise') {
    return 'ENTERPRISE';
  } else if (intel.estimatedMonthlyLoads > 100 || intel.estimatedSize === 'large') {
    return 'GROWTH';
  }
  return 'STARTER';
}

/**
 * Calculate expected MRR based on plan and volume
 */
function calculateExpectedMrr(plan: string, monthlyLoads: number): number {
  const planPricing = {
    STARTER: { base: 99, quota: 100, overage: 1.50 },
    GROWTH: { base: 499, quota: 1000, overage: 1.25 },
    ENTERPRISE: { base: 2500, quota: Infinity, overage: 0 },
  };
  
  const pricing = planPricing[plan as keyof typeof planPricing] || planPricing.STARTER;
  let mrr = pricing.base;
  
  if (monthlyLoads > pricing.quota) {
    const overage = monthlyLoads - pricing.quota;
    mrr += overage * pricing.overage;
  }
  
  return Math.round(mrr);
}

/**
 * Determine next best action
 */
function determineNextAction(
  score: number,
  intel: CompanyIntel
): LeadQualificationResult['nextAction'] {
  if (score >= 70) {
    // High-value lead: immediate demo
    return 'demo';
  } else if (score >= 50) {
    // Medium value: send proposal
    return 'proposal';
  } else if (score >= 30) {
    // Low-medium: nurture campaign
    return 'nurture';
  } else if (score >= 20) {
    // Low value: basic email
    return 'email';
  }
  // Very low value: ignore
  return 'ignore';
}

/**
 * Determine urgency level
 */
function determineUrgency(score: number, intel: CompanyIntel): LeadQualificationResult['urgency'] {
  if (score >= 80 && intel.estimatedSize === 'enterprise') return 'urgent';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Generate AI summary using LLM
 */
async function generateAISummary(
  leadData: any,
  intel: CompanyIntel,
  score: number,
  nextAction: string
): Promise<string> {
  const prompt = `Analyze this sales lead and provide a brief summary:

Company: ${intel.name}
Domain: ${intel.domain}
Size: ${intel.estimatedSize}
Industry: ${intel.industry}
Estimated Fleet: ${intel.likelyFleetSize} vehicles
Monthly Volume: ${intel.estimatedMonthlyLoads} loads
Lead Source: ${leadData.source}
Lead Type: ${leadData.type}
Deal Score: ${score}/100

Provide a 2-3 sentence executive summary for the sales team highlighting:
1. Key opportunity size
2. Why this lead is/isn't a good fit
3. Recommended approach

Be concise and actionable.`;

  try {
    const response = await aiSyntheticClient.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are Genesis, an AI sales assistant for Infæmous Freight. Provide concise, actionable sales insights.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });
    
    return response.choices[0]?.message?.content || 
      `${intel.estimatedSize} ${intel.industry} company with ~${intel.estimatedMonthlyLoads} monthly loads. ${nextAction === 'demo' ? 'High priority - schedule demo immediately.' : nextAction === 'proposal' ? 'Good fit - send ROI proposal.' : 'Add to nurture campaign.'}`;
  } catch (error) {
    // Fallback if AI fails
    return `${intel.estimatedSize} ${intel.industry} company with ~${intel.estimatedMonthlyLoads} monthly loads. ${nextAction === 'demo' ? 'High priority - schedule demo immediately.' : nextAction === 'proposal' ? 'Good fit - send ROI proposal.' : 'Add to nurture campaign.'}`;
  }
}

/**
 * Main function: Qualify a lead and create sales opportunity
 */
export async function qualifyLead(leadId: string): Promise<LeadQualificationResult> {
  // Fetch lead
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });
  
  if (!lead) {
    throw new Error(`Lead ${leadId} not found`);
  }
  
  // Analyze company
  const domain = lead.email.split('@')[1] || '';
  const intel = await analyzeCompany(domain, lead.company || 'Unknown');
  
  // Calculate deal score
  const dealScore = calculateDealScore(intel, lead);
  
  // Make recommendations
  const recommendedPlan = recommendPlan(intel);
  const expectedMrr = calculateExpectedMrr(recommendedPlan, intel.estimatedMonthlyLoads);
  const nextAction = determineNextAction(dealScore, intel);
  const urgency = determineUrgency(dealScore, intel);
  
  // Generate AI summary
  const aiSummary = await generateAISummary(lead, intel, dealScore, nextAction);
  
  // Calculate close probability
  let probability = 10;
  if (dealScore >= 80) probability = 70;
  else if (dealScore >= 70) probability = 50;
  else if (dealScore >= 50) probability = 30;
  else if (dealScore >= 30) probability = 15;
  
  // Determine stage based on score
  let stage: any = 'NEW';
  if (dealScore >= 70) stage = 'QUALIFIED';
  else if (dealScore >= 40) stage = 'QUALIFYING';
  else stage = 'NURTURE';
  
  // Create or update sales opportunity
  const opportunity = await prisma.salesOpportunity.upsert({
    where: {
      // Use a compound unique if exists, otherwise create new
      id: `opportunity-${leadId}`,
    },
    update: {
      dealScore,
      confidence: intel.trustScore,
      stage,
      recommendedPlan,
      expectedMrr,
      aiSummary,
      nextAction,
      urgency,
      probability,
      metadata: JSON.stringify({ intel, analysis: 'genesis-ai' }),
    },
    create: {
      id: `opportunity-${leadId}`,
      leadId,
      dealScore,
      confidence: intel.trustScore,
      stage,
      recommendedPlan,
      expectedMrr,
      aiSummary,
      nextAction,
      urgency,
      probability,
      metadata: JSON.stringify({ intel, analysis: 'genesis-ai' }),
    },
  });
  
  console.log(`[Genesis AI] Qualified lead ${lead.email}: Score ${dealScore}, Next: ${nextAction}`);
  
  return {
    dealScore,
    confidence: intel.trustScore,
    recommendedPlan,
    expectedMrr,
    urgency,
    nextAction,
    aiSummary,
    probability,
  };
}

/**
 * Auto-qualify all new leads
 */
export async function autoQualifyNewLeads(): Promise<number> {
  const newLeads = await prisma.lead.findMany({
    where: {
      status: 'new',
      opportunities: {
        none: {}, // No opportunity created yet
      },
    },
    take: 50, // Process in batches
  });
  
  let qualified = 0;
  
  for (const lead of newLeads) {
    try {
      await qualifyLead(lead.id);
      qualified++;
    } catch (error) {
      console.error(`[Genesis AI] Failed to qualify lead ${lead.id}:`, error);
    }
  }
  
  return qualified;
}

/**
 * Get top opportunities for sales team
 */
export async function getTopOpportunities(limit: number = 10) {
  return prisma.salesOpportunity.findMany({
    where: {
      stage: {
        in: ['QUALIFIED', 'DEMO_SCHEDULED', 'DEMO_COMPLETED', 'PROPOSAL_SENT'],
      },
    },
    include: {
      lead: {
        select: {
          name: true,
          email: true,
          company: true,
          phone: true,
        },
      },
    },
    orderBy: [
      { urgency: 'desc' },
      { dealScore: 'desc' },
    ],
    take: limit,
  });
}

/**
 * Update opportunity stage
 */
export async function updateOpportunityStage(
  opportunityId: string,
  stage: string,
  notes?: string
) {
  return prisma.salesOpportunity.update({
    where: { id: opportunityId },
    data: {
      stage: stage as any,
      updatedAt: new Date(),
      metadata: notes
        ? JSON.stringify({ ...JSON.parse((await prisma.salesOpportunity.findUnique({ where: { id: opportunityId } }))?.metadata || '{}'), notes })
        : undefined,
    },
  });
}

/**
 * Mark opportunity as won
 */
export async function markOpportunityWon(opportunityId: string, orgId: string) {
  const opportunity = await prisma.salesOpportunity.update({
    where: { id: opportunityId },
    data: {
      stage: 'WON',
      wonAt: new Date(),
      probability: 100,
    },
    include: {
      lead: true,
    },
  });
  
  // Update lead to show conversion
  await prisma.lead.update({
    where: { id: opportunity.leadId },
    data: {
      status: 'won',
      convertedOrgId: orgId,
      convertedAt: new Date(),
    },
  });
  
  console.log(`[Genesis AI] Deal won! Lead ${opportunity.lead.email} → Org ${orgId}`);
  
  return opportunity;
}

/**
 * Mark opportunity as lost
 */
export async function markOpportunityLost(opportunityId: string, reason: string) {
  return prisma.salesOpportunity.update({
    where: { id: opportunityId },
    data: {
      stage: 'LOST',
      lostAt: new Date(),
      lostReason: reason,
      probability: 0,
    },
  });
}

export default {
  qualifyLead,
  autoQualifyNewLeads,
  getTopOpportunities,
  updateOpportunityStage,
  markOpportunityWon,
  markOpportunityLost,
};
