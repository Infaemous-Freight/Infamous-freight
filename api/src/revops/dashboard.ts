/*
 * Copyright © 2026 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Revenue Operations Dashboard - AI-Powered Business Intelligence
 */

import { PrismaClient } from '@prisma/client';
import { aiSyntheticClient } from '../services/aiSyntheticClient';

const prisma = new PrismaClient();

/**
 * RevOps Dashboard - Real-time revenue metrics and AI-powered recommendations
 * for pricing, marketing spend, churn prevention, and growth optimization
 */

interface RevOpsDashboard {
  // Sales metrics
  sales: {
    pipelineValue: number;
    dealsInProgress: number;
    avgDealSize: number;
    conversionRate: number;
    avgSalesCycle: number; // days
    topDeals: any[];
  };
  
  // Revenue metrics
  revenue: {
    mrr: number;
    arr: number;
    gmv: number;
    platformTake: number;
    revenueGrowth: number; // % MoM
  };
  
  // Customer metrics
  customers: {
    totalOrgs: number;
    activeOrgs: number;
    newThisMonth: number;
    churnedThisMonth: number;
    churnRate: number;
    ltv: number;
    cac: number;
    ltvCacRatio: number;
  };
  
  // Pricing metrics
  pricing: {
    avgJobPrice: number;
    surgeFrequency: number; // % of jobs
    avgSurgeMultiplier: number;
    revenueFromSurge: number;
  };
  
  // Operational metrics
  operations: {
    activeDrivers: number;
    activeShippers: number;
    jobsToday: number;
    jobsThisWeek: number;
    jobsThisMonth: number;
    avgJobsPerDriver: number;
  };
  
  // AI recommendations
  recommendations: any[];
}

/**
 * Calculate pipeline value
 */
async function calculatePipelineValue() {
  const opportunities = await prisma.salesOpportunity.findMany({
    where: {
      stage: {
        in: ['QUALIFIED', 'DEMO_SCHEDULED', 'DEMO_COMPLETED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CONTRACT_SENT'],
      },
    },
    select: {
      expectedMrr: true,
      probability: true,
      stage: true,
    },
  });
  
  // Weighted pipeline value
  const pipelineValue = opportunities.reduce((sum, opp) => {
    const weighted = (opp.expectedMrr?.toNumber() || 0) * (opp.probability / 100);
    return sum + weighted;
  }, 0);
  
  return {
    totalValue: pipelineValue,
    dealCount: opportunities.length,
  };
}

/**
 * Calculate conversion rate
 */
async function calculateConversionRate(days: number = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const totalLeads = await prisma.lead.count({
    where: { createdAt: { gte: since } },
  });
  
  const convertedLeads = await prisma.lead.count({
    where: {
      createdAt: { gte: since },
      status: 'won',
    },
  });
  
  return totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
}

/**
 * Calculate average sales cycle
 */
async function calculateAvgSalesCycle() {
  const wonDeals = await prisma.salesOpportunity.findMany({
    where: {
      stage: 'WON',
      wonAt: { not: null },
    },
    select: {
      createdAt: true,
      wonAt: true,
    },
    take: 100, // Last 100 won deals
  });
  
  if (wonDeals.length === 0) return 0;
  
  const totalDays = wonDeals.reduce((sum, deal) => {
    const days = (deal.wonAt!.getTime() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);
  
  return Math.round(totalDays / wonDeals.length);
}

/**
 * Calculate MRR
 */
async function calculateMRR() {
  const billing = await prisma.orgBilling.findMany({
    where: {
      stripeSubscriptionStatus: 'active',
    },
    select: {
      plan: true,
    },
  });
  
  const planPricing = {
    STARTER: 99,
    GROWTH: 499,
    ENTERPRISE: 2500,
    CUSTOM: 5000, // Average custom deal
  };
  
  return billing.reduce((sum, b) => {
    return sum + (planPricing[b.plan] || 0);
  }, 0);
}

/**
 * Calculate churn rate
 */
async function calculateChurnRate() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  
  // Orgs active 30-60 days ago
  const activeLastMonth = await prisma.organization.count({
    where: {
      createdAt: { lt: thirtyDaysAgo },
      isActive: true,
    },
  });
  
  // Orgs that churned in last 30 days
  const churned = await prisma.organization.count({
    where: {
      createdAt: { lt: thirtyDaysAgo },
      isActive: false,
      updatedAt: { gte: thirtyDaysAgo }, // Became inactive recently
    },
  });
  
  return activeLastMonth > 0 ? (churned / activeLastMonth) * 100 : 0;
}

/**
 * Calculate LTV (Lifetime Value)
 */
async function calculateLTV(avgMrrPerOrg: number, churnRate: number) {
  if (churnRate === 0) return avgMrrPerOrg * 36; // Assume 3-year lifetime
  
  // LTV = ARPA / Monthly Churn Rate
  const monthlyChurnRate = churnRate / 100;
  return monthlyChurnRate > 0 ? avgMrrPerOrg / monthlyChurnRate : avgMrrPerOrg * 36;
}

/**
 * Calculate CAC (Customer Acquisition Cost)
 */
async function calculateCAC() {
  // In real implementation, track marketing spend from external systems
  // For now, estimate based on campaigns and sales ops
  const campaigns = await prisma.outboundCampaign.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });
  
  const newOrgs = await prisma.organization.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });
  
  // Estimate: $500/campaign + $1000/month fixed sales costs
  const estimatedSpend = (campaigns * 500) + 1000;
  
  return newOrgs > 0 ? estimatedSpend / newOrgs : 0;
}

/**
 * Get surge pricing metrics
 */
async function getSurgePricingMetrics() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const allPricing = await prisma.dynamicPricing.findMany({
    where: {
      appliedAt: { gte: thirtyDaysAgo },
    },
    select: {
      strategy: true,
      finalPrice: true,
      basePrice: true,
      demandMultiplier: true,
    },
  });
  
  const surgeJobs = allPricing.filter(p => p.strategy === 'SURGE');
  
  const surgeRevenue = surgeJobs.reduce((sum, p) => {
    const surgeAmount = p.finalPrice.toNumber() - p.basePrice.toNumber();
    return sum + surgeAmount;
  }, 0);
  
  return {
    totalJobs: allPricing.length,
    surgeJobs: surgeJobs.length,
    surgeFrequency: allPricing.length > 0 ? (surgeJobs.length / allPricing.length) * 100 : 0,
    avgSurgeMultiplier: surgeJobs.length > 0
      ? surgeJobs.reduce((sum, p) => sum + p.demandMultiplier.toNumber(), 0) / surgeJobs.length
      : 1.0,
    revenueFromSurge: surgeRevenue,
  };
}

/**
 * Generate AI-powered recommendations
 */
async function generateRecommendations(metrics: any): Promise<any[]> {
  const recommendations: any[] = [];
  
  // 1. High churn rate
  if (metrics.customers.churnRate > 5) {
    recommendations.push({
      priority: 'HIGH',
      category: 'churn',
      title: 'High churn rate detected',
      description: `Monthly churn is ${metrics.customers.churnRate.toFixed(1)}%, above healthy threshold of 5%.`,
      impact: `Reducing churn to 3% would increase ARR by $${Math.round((metrics.revenue.arr * 0.02) / 1000)}k`,
      actions: [
        'Implement customer health scoring',
        'Proactive outreach to at-risk accounts',
        'Improve onboarding experience',
      ],
    });
  }
  
  // 2. Low LTV:CAC ratio
  if (metrics.customers.ltvCacRatio < 3) {
    recommendations.push({
      priority: 'HIGH',
      category: 'unit_economics',
      title: 'Low LTV:CAC ratio',
      description: `Ratio is ${metrics.customers.ltvCacRatio.toFixed(1)}x, target is 3x+`,
      impact: 'Unsustainable growth - need to reduce CAC or increase LTV',
      actions: [
        'Optimize ad spend (reduce CAC)',
        'Increase prices 10-15%',
        'Focus on high-value segments',
      ],
    });
  }
  
  // 3. High surge frequency
  if (metrics.pricing.surgeFrequency > 50) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'pricing',
      title: 'Frequent surge pricing',
      description: `${metrics.pricing.surgeFrequency.toFixed(0)}% of jobs are surge-priced`,
      impact: `Customers may churn. Consider increasing base prices by ${(metrics.pricing.avgSurgeMultiplier - 1) * 50}%.`,
      actions: [
        'Increase base prices 10-15%',
        'Recruit more drivers to reduce surge need',
        'Communicate surge pricing transparently',
      ],
    });
  }
  
  // 4. Low conversion rate
  if (metrics.sales.conversionRate < 5) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'sales',
      title: 'Low lead conversion rate',
      description: `Only ${metrics.sales.conversionRate.toFixed(1)}% of leads convert`,
      impact: 'Missing revenue opportunities',
      actions: [
        'Improve lead qualification (Genesis AI)',
        'Faster demo scheduling',
        'Better nurture campaigns',
      ],
    });
  }
  
  // 5. Ask AI for additional insights
  try {
    const aiPrompt = `Analyze these business metrics and provide 1-2 additional revenue optimization recommendations:

MRR: $${Math.round(metrics.revenue.mrr)}
Churn: ${metrics.customers.churnRate.toFixed(1)}%
LTV:CAC: ${metrics.customers.ltvCacRatio.toFixed(1)}x
Conversion Rate: ${metrics.sales.conversionRate.toFixed(1)}%
Pipeline: $${Math.round(metrics.sales.pipelineValue)}

Focus on: pricing strategy, sales efficiency, or operational improvements.`;

    const response = await aiSyntheticClient.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are Genesis, a RevOps AI for Infæmous Freight. Provide data-driven revenue optimization recommendations.',
        },
        { role: 'user', content: aiPrompt },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });
    
    const aiRec = response.choices[0]?.message?.content;
    if (aiRec) {
      recommendations.push({
        priority: 'LOW',
        category: 'ai_insight',
        title: 'AI-powered insight',
        description: aiRec,
        source: 'genesis-ai',
      });
    }
  } catch (error) {
    console.error('[RevOps] AI recommendation failed:', error);
  }
  
  return recommendations;
}

/**
 * Main function: Get complete RevOps dashboard
 */
export async function getRevOpsDashboard(): Promise<RevOpsDashboard> {
  console.log('[RevOps] Generating dashboard...');
  
  // Sales metrics
  const pipeline = await calculatePipelineValue();
  const avgDealSize = pipeline.dealCount > 0 ? pipeline.totalValue / pipeline.dealCount : 0;
  const conversionRate = await calculateConversionRate();
  const avgSalesCycle = await calculateAvgSalesCycle();
  
  const topDeals = await prisma.salesOpportunity.findMany({
    where: {
      stage: { in: ['QUALIFIED', 'DEMO_COMPLETED', 'PROPOSAL_SENT', 'NEGOTIATING'] },
    },
    include: {
      lead: {
        select: {
          name: true,
          company: true,
          email: true,
        },
      },
    },
    orderBy: {
      dealScore: 'desc',
    },
    take: 5,
  });
  
  // Revenue metrics
  const mrr = await calculateMRR();
  const arr = mrr * 12;
  
  // GMV and platform take (from existing metrics service)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const jobs = await prisma.job.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      status: 'COMPLETED',
    },
    select: {
      price: true,
    },
  });
  
  const gmv = jobs.reduce((sum, j) => sum + (j.price?.toNumber() || 0), 0);
  const platformTake = gmv * 0.12; // Average 12% take rate
  
  // Customer metrics
  const totalOrgs = await prisma.organization.count();
  const activeOrgs = await prisma.organization.count({
    where: { isActive: true },
  });
  const newThisMonth = await prisma.organization.count({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
  });
  
  const churnRate = await calculateChurnRate();
  const avgMrrPerOrg = activeOrgs > 0 ? mrr / activeOrgs : 0;
  const ltv = await calculateLTV(avgMrrPerOrg, churnRate);
  const cac = await calculateCAC();
  const ltvCacRatio = cac > 0 ? ltv / cac : 0;
  
  // Pricing metrics
  const surgePricing = await getSurgePricingMetrics();
  
  // Operational metrics
  const activeDrivers = await prisma.user.count({
    where: {
      role: 'DRIVER',
      // Has jobs in last 30 days
    },
  });
  
  const jobsToday = await prisma.job.count({
    where: {
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  });
  
  const jobsThisWeek = await prisma.job.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });
  
  const jobsThisMonth = await prisma.job.count({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
  });
  
  const avgJobsPerDriver = activeDrivers > 0 ? jobsThisMonth / activeDrivers : 0;
  
  // Assemble dashboard
  const dashboard: RevOpsDashboard = {
    sales: {
      pipelineValue: pipeline.totalValue,
      dealsInProgress: pipeline.dealCount,
      avgDealSize,
      conversionRate,
      avgSalesCycle,
      topDeals,
    },
    revenue: {
      mrr,
      arr,
      gmv,
      platformTake,
      revenueGrowth: 0, // TODO: Calculate from historical data
    },
    customers: {
      totalOrgs,
      activeOrgs,
      newThisMonth,
      churnedThisMonth: Math.round((churnRate / 100) * activeOrgs),
      churnRate,
      ltv,
      cac,
      ltvCacRatio,
    },
    pricing: {
      avgJobPrice: jobs.length > 0 ? gmv / jobs.length : 0,
      surgeFrequency: surgePricing.surgeFrequency,
      avgSurgeMultiplier: surgePricing.avgSurgeMultiplier,
      revenueFromSurge: surgePricing.revenueFromSurge,
    },
    operations: {
      activeDrivers,
      activeShippers: activeOrgs,
      jobsToday,
      jobsThisWeek,
      jobsThisMonth,
      avgJobsPerDriver,
    },
    recommendations: [],
  };
  
  // Generate AI recommendations
  dashboard.recommendations = await generateRecommendations(dashboard);
  
  console.log('[RevOps] Dashboard generated successfully');
  
  return dashboard;
}

/**
 * Store recommendation for tracking
 */
export async function storeRecommendation(recommendation: any) {
  return prisma.revenueOptimization.create({
    data: {
      targetEntity: recommendation.category,
      recommendation: recommendation.description,
      impact: recommendation.impact,
      confidence: 80, // Default
      actionType: recommendation.actions?.[0] || 'manual_review',
      actionData: JSON.stringify(recommendation),
      status: 'pending',
      createdBy: 'genesis-ai',
    },
  });
}

/**
 * Mark recommendation as implemented
 */
export async function markRecommendationImplemented(
  recommendationId: string,
  approvedBy: string,
  actualImpact?: string
) {
  return prisma.revenueOptimization.update({
    where: { id: recommendationId },
    data: {
      status: 'implemented',
      approvedBy,
      implementedAt: new Date(),
      actualImpact,
    },
  });
}

export default {
  getRevOpsDashboard,
  storeRecommendation,
  markRecommendationImplemented,
};
