/*
 * Copyright © 2026 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Automated Outbound Campaign Engine - AI-Generated Cold Outreach
 */

import { PrismaClient } from '@prisma/client';
import { aiSyntheticClient } from '../services/aiSyntheticClient';

const prisma = new PrismaClient();

/**
 * Outbound Campaign Engine - Generates and sends AI-personalized outreach
 * at scale for cold leads, nurture campaigns, and reactivation
 */

interface CampaignConfig {
  name: string;
  type: 'email' | 'sms' | 'linkedin';
  targetIndustry?: string;
  targetRegion?: string;
  targetCompanySize?: 'small' | 'medium' | 'enterprise';
  callToAction: string;
  scheduledFor?: Date;
}

interface Recipient {
  email: string;
  name?: string;
  company?: string;
  industry?: string;
  estimatedVolume?: number;
}

/**
 * Generate personalized outbound copy using AI
 */
async function generateOutboundCopy(
  recipient: Recipient,
  campaignGoal: string,
  tone: 'professional' | 'casual' | 'executive' = 'professional'
): Promise<{ subject: string; body: string }> {
  const prompt = `Write a cold outreach email for Infæmous Freight, a freight logistics platform.

Recipient: ${recipient.name || 'Logistics Manager'} at ${recipient.company || 'their company'}
Industry: ${recipient.industry || 'Logistics'}
Goal: ${campaignGoal}
Tone: ${tone}

Key value props:
- Save 30-40% on freight costs
- Real-time tracking
- Automated dispatch
- Pay-per-use pricing

Keep it:
- Under 150 words
- Personal and specific
- Clear CTA (book demo or calculate ROI)
- Not salesy

Format as:
Subject: [subject line]
Body: [email body]`;

  try {
    const response = await aiSyntheticClient.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are Genesis, an AI sales copywriter for Infæmous Freight. Write compelling, personal cold emails that get replies.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.8,
    });
    
    const content = response.choices[0]?.message?.content || '';
    
    // Parse subject and body
    const subjectMatch = content.match(/Subject:\s*(.+)/i);
    const bodyMatch = content.match(/Body:\s*([\s\S]+)/i);
    
    const subject = subjectMatch?.[1]?.trim() || `Transform your freight operations, ${recipient.name || 'there'}`;
    const body = bodyMatch?.[1]?.trim() || `Hi ${recipient.name || 'there'},\n\nI noticed ${recipient.company || 'your company'} handles logistics. Companies like yours typically save 30-40% by switching to Infæmous Freight.\n\nWould you be open to a 15-minute demo?\n\nBest,\nGenesis\nInfæmous Freight`;
    
    return { subject, body };
  } catch (error) {
    console.error('[Outbound] AI generation failed, using template:', error);
    
    // Fallback template
    return {
      subject: `${recipient.name ? recipient.name + ', ' : ''}Save 30% on freight with Infæmous`,
      body: `Hi ${recipient.name || 'there'},\n\nI'm reaching out because ${recipient.company || 'your company'} could benefit from our freight platform.\n\nWe help logistics companies:\n- Reduce costs by 30-40%\n- Track shipments in real-time\n- Automate dispatch operations\n\nInterested in a quick demo?\n\nBook here: https://infamous-freight.com/demo\n\nBest,\nGenesis AI\nInfæmous Freight`,
    };
  }
}

/**
 * Create outbound campaign
 */
export async function createCampaign(config: CampaignConfig, createdBy: string = 'genesis-ai') {
  return prisma.outboundCampaign.create({
    data: {
      name: config.name,
      type: config.type,
      targetIndustry: config.targetIndustry,
      targetRegion: config.targetRegion,
      targetCompanySize: config.targetCompanySize,
      callToAction: config.callToAction,
      body: '', // Will be personalized per recipient
      status: 'DRAFT',
      scheduledFor: config.scheduledFor,
      createdBy,
    },
  });
}

/**
 * Add recipients to campaign
 */
export async function addRecipientsToCampaign(
  campaignId: string,
  recipients: Recipient[]
) {
  const campaign = await prisma.outboundCampaign.findUnique({
    where: { id: campaignId },
  });
  
  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }
  
  const messages: any[] = [];
  
  // Generate personalized copy for each recipient
  for (const recipient of recipients) {
    const { subject, body } = await generateOutboundCopy(
      recipient,
      campaign.callToAction
    );
    
    messages.push({
      campaignId,
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      recipientCompany: recipient.company,
      subject,
      body,
      status: 'SCHEDULED',
      metadata: JSON.stringify({
        industry: recipient.industry,
        estimatedVolume: recipient.estimatedVolume,
      }),
    });
    
    // Add small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Bulk create messages
  await prisma.outboundMessage.createMany({
    data: messages,
  });
  
  return messages.length;
}

/**
 * Send campaign messages (batch processing)
 */
export async function sendCampaignMessages(campaignId: string, batchSize: number = 50) {
  const messages = await prisma.outboundMessage.findMany({
    where: {
      campaignId,
      status: 'SCHEDULED',
    },
    take: batchSize,
  });
  
  let sent = 0;
  let failed = 0;
  
  for (const message of messages) {
    try {
      // Send email (integrate with SendGrid, AWS SES, etc.)
      await sendEmail(message.recipientEmail, message.subject || '', message.body);
      
      // Mark as sent
      await prisma.outboundMessage.update({
        where: { id: message.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });
      
      sent++;
    } catch (error) {
      console.error(`[Outbound] Failed to send to ${message.recipientEmail}:`, error);
      
      await prisma.outboundMessage.update({
        where: { id: message.id },
        data: {
          status: 'BOUNCED',
        },
      });
      
      failed++;
    }
  }
  
  // Update campaign stats
  await prisma.outboundCampaign.update({
    where: { id: campaignId },
    data: {
      totalSent: {
        increment: sent,
      },
      totalBounced: {
        increment: failed,
      },
      status: messages.length < batchSize ? 'SENT' : 'SCHEDULED',
      sentAt: new Date(),
    },
  });
  
  return { sent, failed };
}

/**
 * Track email opens (via tracking pixel)
 */
export async function trackEmailOpen(messageId: string) {
  const message = await prisma.outboundMessage.update({
    where: { id: messageId },
    data: {
      status: 'OPENED',
      openedAt: new Date(),
    },
  });
  
  // Update campaign stats
  await prisma.outboundCampaign.update({
    where: { id: message.campaignId },
    data: {
      totalOpened: {
        increment: 1,
      },
    },
  });
  
  return message;
}

/**
 * Track email clicks (via tracked links)
 */
export async function trackEmailClick(messageId: string, url: string) {
  const message = await prisma.outboundMessage.update({
    where: { id: messageId },
    data: {
      status: 'CLICKED',
      clickedAt: new Date(),
    },
  });
  
  // Update campaign stats
  await prisma.outboundCampaign.update({
    where: { id: message.campaignId },
    data: {
      totalClicked: {
        increment: 1,
      },
    },
  });
  
  return message;
}

/**
 * Track email replies (webhook from email provider)
 */
export async function trackEmailReply(messageId: string) {
  const message = await prisma.outboundMessage.update({
    where: { id: messageId },
    data: {
      status: 'REPLIED',
      repliedAt: new Date(),
    },
  });
  
  // Update campaign stats
  await prisma.outboundCampaign.update({
    where: { id: message.campaignId },
    data: {
      totalReplied: {
        increment: 1,
      },
    },
  });
  
  // Auto-create lead from reply
  const existingLead = await prisma.lead.findUnique({
    where: { email: message.recipientEmail },
  });
  
  if (!existingLead) {
    const lead = await prisma.lead.create({
      data: {
        name: message.recipientName || 'Unknown',
        email: message.recipientEmail,
        company: message.recipientCompany,
        type: 'ENTERPRISE',
        source: 'PAID_AD', // Outbound = paid channel
        status: 'contacted',
        notes: `Replied to outbound campaign: ${message.campaignId}`,
      },
    });
    
    await prisma.outboundMessage.update({
      where: { id: messageId },
      data: { leadId: lead.id },
    });
    
    console.log(`[Outbound] Reply converted to lead: ${lead.email}`);
    
    return { message, lead };
  }
  
  return { message, lead: existingLead };
}

/**
 * Get campaign performance
 */
export async function getCampaignPerformance(campaignId: string) {
  const campaign = await prisma.outboundCampaign.findUnique({
    where: { id: campaignId },
    include: {
      messages: {
        select: {
          status: true,
          sentAt: true,
          openedAt: true,
          clickedAt: true,
          repliedAt: true,
        },
      },
    },
  });
  
  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }
  
  const total = campaign.messages.length;
  const sent = campaign.totalSent;
  const opened = campaign.totalOpened;
  const clicked = campaign.totalClicked;
  const replied = campaign.totalReplied;
  
  return {
    name: campaign.name,
    type: campaign.type,
    status: campaign.status,
    total,
    sent,
    opened,
    clicked,
    replied,
    openRate: sent > 0 ? (opened / sent) * 100 : 0,
    clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
    replyRate: sent > 0 ? (replied / sent) * 100 : 0,
    conversionRate: sent > 0 ? (replied / sent) * 100 : 0, // Replies = conversions
  };
}

/**
 * Auto-generate nurture campaign for low-score leads
 */
export async function createNurtureCampaign() {
  // Find leads that should be nurtured
  const nurtureLeads = await prisma.lead.findMany({
    where: {
      status: { in: ['new', 'contacted'] },
      createdAt: {
        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Older than 7 days
      },
    },
    include: {
      opportunities: {
        where: {
          dealScore: { lt: 50 }, // Low score = nurture
        },
      },
    },
  });
  
  const campaign = await createCampaign({
    name: `Nurture Campaign - ${new Date().toISOString().split('T')[0]}`,
    type: 'email',
    callToAction: 'Re-engage and offer ROI calculator',
    scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
  });
  
  // Add leads as recipients
  const recipients = nurtureLeads.map(lead => ({
    email: lead.email,
    name: lead.name,
    company: lead.company || undefined,
    industry: 'Logistics',
  }));
  
  await addRecipientsToCampaign(campaign.id, recipients);
  
  console.log(`[Outbound] Created nurture campaign with ${recipients.length} recipients`);
  
  return campaign;
}

/**
 * Mock email sending (replace with real SendGrid/SES integration)
 */
async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  // TODO: Integrate with SendGrid, AWS SES, or other email provider
  console.log(`[Outbound] Sending email to ${to}: ${subject}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // In production, this would be:
  // await sendgrid.send({ to, subject, text: body, html: body });
}

export default {
  createCampaign,
  addRecipientsToCampaign,
  sendCampaignMessages,
  trackEmailOpen,
  trackEmailClick,
  trackEmailReply,
  getCampaignPerformance,
  createNurtureCampaign,
};
